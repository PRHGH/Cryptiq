import { NextResponse } from "next/server";

import { searchCoins } from "@/lib/coingecko.actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  const coins = await searchCoins(query);

  return NextResponse.json(coins);
}
