import { NextResponse } from "next/server";

import { getTrendingCoins } from "@/lib/coingecko.actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get("limit");
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : 5;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5;
  const clampedLimit = Math.min(Math.max(limit, 1), 100);
  const coins = await getTrendingCoins(clampedLimit);

  return NextResponse.json(coins);
}
