import { NextResponse } from "next/server";

import { getTrendingCoins } from "@/lib/coingecko.actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 5);
  const safeLimit = Number.isFinite(limit) ? limit : 5;
  const coins = await getTrendingCoins(safeLimit);

  return NextResponse.json(coins);
}
