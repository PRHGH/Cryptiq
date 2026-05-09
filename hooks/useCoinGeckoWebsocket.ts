"use client";

import { useEffect, useRef, useState } from "react";

const WS_BASE = `${process.env.NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL}?x_cg_pro_api_key=${process.env.NEXT_PUBLIC_COINGECKO_API_KEY}`;

export const useCoinGeckoWebSocket = ({
  coinId,
  poolId,
  liveInterval,
}: UseCoinGeckoWebSocketProps): UseCoinGeckoWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const subscribed = useRef(<Set<string>>new Set());
  const latestContextRef = useRef({ coinId, poolId });

  latestContextRef.current = { coinId, poolId };

  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);

  const [isWsReady, setIsWsReady] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    const send = (payload: Record<string, unknown>) => ws.send(JSON.stringify(payload));

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;

      let msg: WebSocketMessage;
      try {
        msg = JSON.parse(event.data) as WebSocketMessage;
      } catch (error) {
        console.error("Failed to parse CoinGecko WebSocket message", {
          error,
          data: event.data,
        });
        return;
      }

      if (msg.type === "ping") {
        send({ type: "pong" });
        return;
      }
      if (msg.type === "confirm_subscription") {
        if (typeof msg.identifier !== "string" || msg.identifier.length === 0) {
          return;
        }

        try {
          const parsedIdentifier: unknown = JSON.parse(msg.identifier);
          const channel =
            parsedIdentifier &&
            typeof parsedIdentifier === "object" &&
            "channel" in parsedIdentifier
              ? parsedIdentifier.channel
              : null;

          if (typeof channel === "string" && channel.length > 0) {
            subscribed.current.add(channel);
          }
        } catch (error) {
          console.error("Failed to parse CoinGecko subscription confirmation", {
            identifier: msg.identifier,
            error,
          });
        }

        return;
      }
      if (msg.c === "C1") {
        setPrice({
          usd: msg.p ?? 0,
          coin: msg.i,
          price: msg.p,
          change24h: msg.pp,
          marketCap: msg.m,
          volume24h: msg.v,
          timestamp: msg.t,
        });
      }
      if (msg.c === "G2") {
        const newTrade: Trade = {
          price: msg.pu,
          value: msg.vo,
          timestamp: msg.t ?? 0,
          type: msg.ty,
          amount: msg.to,
        };

        setTrades((prev) => [newTrade, ...prev].slice(0, 7));
      }
      if (msg.ch === "G3") {
        const timestamp = msg.t ?? 0;

        const candle: OHLCData = [
          timestamp,
          Number(msg.o ?? 0),
          Number(msg.h ?? 0),
          Number(msg.l ?? 0),
          Number(msg.c ?? 0),
        ];

        setOhlcv(candle);
      }
    };

    ws.onopen = () => setIsWsReady(true);

    ws.onmessage = handleMessage;

    ws.onclose = () => setIsWsReady(false);

    ws.onerror = (event) => {
      const { coinId: currentCoinId, poolId: currentPoolId } = latestContextRef.current;

      console.error("CoinGecko WebSocket error", {
        coinId: currentCoinId,
        poolId: currentPoolId,
        event,
      });
      setIsWsReady(false);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (!isWsReady) return;
    const ws = wsRef.current;
    if (!ws) return;

    const send = (payload: Record<string, unknown>) => {
      if (ws.readyState !== WebSocket.OPEN) return false;
      try {
        ws.send(JSON.stringify(payload));
        return true;
      } catch (error) {
        console.error("CoinGecko WebSocket send failed", { error, payload });
        return false;
      }
    };

    const unsubscribeAll = () => {
      subscribed.current.forEach((channel) => {
        send({
          command: "unsubscribe",
          identifier: JSON.stringify({ channel }),
        });
      });

      subscribed.current.clear();
    };

    const subscribe = (channel: string, data?: Record<string, unknown>) => {
      if (subscribed.current.has(channel)) return;
      if (!send({ command: "subscribe", identifier: JSON.stringify({ channel }) })) return;

      if (data) {
        send({
          command: "message",
          identifier: JSON.stringify({ channel }),
          data: JSON.stringify(data),
        });
      }
    };

    const poolAddress = poolId?.replaceAll("_", ":") ?? "";

    queueMicrotask(() => {
      unsubscribeAll();

      setPrice(null);
      setTrades([]);
      setOhlcv(null);

      subscribe("CGSimplePrice", { coin_id: [coinId], action: "set_tokens" });

      if (!poolAddress) return;

      subscribe("OnchainTrade", {
        "network_id:pool_addresses": [poolAddress],
        action: "set_pools",
      });

      subscribe("OnchainOHLCV", {
        "network_id:pool_addresses": [poolAddress],
        interval: liveInterval,
        action: "set_pools",
      });
    });
  }, [coinId, poolId, isWsReady, liveInterval]);

  return {
    price,
    trades,
    ohlcv,
    isConnected: isWsReady,
  };
};
