"use server";

import qs from "query-string";

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY ?? process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

if (!BASE_URL) throw new Error("Could not get base url");
if (!API_KEY) throw new Error("Could not get api key ");

const API_KEY_HEADER = BASE_URL.includes("pro-api.coingecko.com")
  ? "x-cg-pro-api-key"
  : "x-cg-demo-api-key";
const IS_PRO_API = BASE_URL.includes("pro-api.coingecko.com");

export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  const normalizedParams =
    normalizedEndpoint.endsWith("/ohlc") && !IS_PRO_API && params
      ? normalizeDemoOHLCParams(params)
      : params;
  const url = qs.stringifyUrl(
    {
      url: `${BASE_URL}/${normalizedEndpoint}`,
      query: normalizedParams,
    },
    { skipEmptyString: true, skipNull: true },
  );

  const response = await fetch(url, {
    headers: {
      [API_KEY_HEADER]: API_KEY,
      "Content-Type": "application/json",
    } as Record<string, string>,
    next: { revalidate },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    const message = errorBody?.error || errorBody?.message || response.statusText;

    throw new Error(`API Error: ${response.status}: ${message}`);
  }

  return response.json();
}

function normalizeDemoOHLCParams(params: QueryParams): QueryParams {
  const normalizedParams = { ...params };
  delete normalizedParams.interval;

  return {
    ...normalizedParams,
    days: normalizedParams.days === "max" ? 365 : normalizedParams.days,
  };
}

export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null,
): Promise<PoolData> {
  const fallback: PoolData = {
    id: "",
    address: "",
    name: "",
    network: "",
  };

  if (network && contractAddress) {
    const poolData = await fetcher<{ data: PoolData[] }>(
      `/onchain/networks/${network}/tokens/${contractAddress}/pools`,
    );

    return poolData.data?.[0] ?? fallback;
  }

  try {
    const poolData = await fetcher<{ data: PoolData[] }>("/onchain/search/pools", { query: id });

    return poolData.data?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function searchCoins(query: string): Promise<SearchCoin[]> {
  const data = await fetcher<{ coins: SearchCoin[] }>("/search", {
    query,
  });

  return data.coins ?? [];
}

export async function getTrendingCoins(limit = 5): Promise<TrendingCoin["item"][]> {
  const data = await fetcher<{ coins: TrendingCoin[] }>("/search/trending", undefined, 300);

  return data.coins.slice(0, limit).map((coin) => coin.item);
}
