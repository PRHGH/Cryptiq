"use client";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useDebounce, useKey } from "react-use";
import { useState } from "react";
import { Button } from "./ui/button";
import useSWR from "swr";
import Image from "next/image";
import { cn, formatCurrency, formatPercentage, getTrendDirection } from "@/lib/utils";
import { useRouter } from "next/navigation";

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }

  return response.json();
};

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: coins = [], isLoading } = useSWR<SearchCoin[]>(
    debouncedQuery ? `/api/coins/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetchJson,
  );
  const { data: trendingCoins = [], isLoading: isTrendingLoading } = useSWR(
    debouncedQuery ? null : "/api/coins/trending?limit=5",
    fetchJson<TrendingCoin["item"][]>,
  );

  const router = useRouter();

  useKey(
    (event) => (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k",
    (event) => {
      event.preventDefault();
      setOpen((currentOpen) => !currentOpen);
    },
    {
      event: "keydown",
    },
  );

  useDebounce(
    () => {
      setDebouncedQuery(query.trim());
    },
    350,
    [query],
  );

  const handleSelect = (coinId: string) => {
    setOpen(false);
    router.push(`/coins/${coinId}`);
  };

  const activeCoins = debouncedQuery ? coins : trendingCoins;
  const activeHeading = debouncedQuery ? "Coins" : "Trending";
  const isIdleState = !debouncedQuery;
  const isActiveLoading = isIdleState ? isTrendingLoading : isLoading;

  return (
    <div id="search-modal">
      <Button onClick={() => setOpen(true)} variant="ghost" className="trigger">
        <span>Search</span>
        <span className="kbd">
          <span>CTRL</span>
          <span>K</span>
        </span>
      </Button>
      <CommandDialog
        open={open}
        className="search-modal-surface"
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen) {
            setQuery("");
            setDebouncedQuery("");
          }
        }}
      >
        <CommandInput
          className="cmd-input"
          placeholder="Search coins..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="list">
          {isActiveLoading ? (
            <CommandEmpty className="empty">
              {isIdleState ? "Loading trending coins..." : "Searching..."}
            </CommandEmpty>
          ) : debouncedQuery && activeCoins.length === 0 ? (
            <CommandEmpty className="empty">No results found.</CommandEmpty>
          ) : null}

          {activeCoins.length > 0 ? (
            <CommandGroup className="group" heading={activeHeading}>
              {activeCoins.map((coin) => (
                <SearchCoinRow
                  key={coin.id}
                  coin={coin}
                  onSelect={handleSelect}
                  variant={isIdleState ? "trending" : "search"}
                />
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </div>
  );
}

type SearchModalCoinRowProps = {
  coin: SearchItemCoin;
  onSelect: (coinId: string) => void;
  variant: "search" | "trending";
};

function SearchCoinRow({ coin, onSelect, variant }: SearchModalCoinRowProps) {
  const price = coin.data?.price;
  const changeValue = coin.data?.price_change_percentage_24h;
  const change = typeof changeValue === "number" ? changeValue : changeValue?.usd;
  const direction = getTrendDirection(change);
  const rankLabel =
    typeof coin.market_cap_rank === "number" ? `#${coin.market_cap_rank}` : "Unranked";

  return (
    <CommandItem
      className="search-item"
      value={`${coin.name} ${coin.symbol}`}
      onSelect={() => onSelect(coin.id)}
    >
      <div className="coin-left">
        <Image
          src={coin.thumb || coin.large}
          alt={coin.name}
          width={28}
          height={28}
          className="rounded-full"
        />

        <div className="coin-info min-w-0 flex-1">
          <p className="truncate font-medium">{coin.name}</p>
          <p className="coin-symbol">{coin.symbol}</p>
        </div>
      </div>

      <div className="coin-meta ml-auto flex flex-col items-end gap-0.5 text-right">
        {variant === "trending" ? (
          <>
            <span className="coin-price">{formatCurrency(price)}</span>
            <span
              className={cn("coin-change", {
                "text-positive": direction === "up",
                "text-negative": direction === "down",
                "text-text-secondary": direction === "neutral",
              })}
            >
              {formatPercentage(change)}
            </span>
          </>
        ) : (
          <>
            <span className="coin-price">{rankLabel}</span>
            <span className="max-w-32 truncate text-[11px] font-medium text-text-secondary/80">
              {coin.id}
            </span>
          </>
        )}
      </div>
    </CommandItem>
  );
}
