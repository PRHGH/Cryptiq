import { NextResponse } from "next/server";

import { searchCoins } from "@/lib/coingecko.actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const coins = await searchCoins(query);

    return NextResponse.json(coins);
  } catch (error) {
    console.error("Coin search request failed", { query, error });

    return NextResponse.json(
      { error: "Unable to search coins right now. Please try again shortly." },
      { status: 502 },
    );
  }
}
