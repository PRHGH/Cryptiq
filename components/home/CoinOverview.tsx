import { fetcher } from "@/lib/coingecko.actions";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { CoinOverviewFallback } from "@/components/home/fallback";
import CandlestickChart from "@/components/CandlestickChart";

const CoinOverview = async () => {
  let overview: [CoinDetailsData, OHLCData[]];

  try {
    overview = await Promise.all([
      fetcher<CoinDetailsData>("/coins/bitcoin"),
      fetcher<OHLCData[]>("/coins/bitcoin/ohlc", {
        vs_currency: "usd",
        days: 1,
        interval: "hourly",
        precision: "full",
      }),
    ]);
  } catch (error) {
    console.error("Failed to fetch coin overview", error);
    return <CoinOverviewFallback />;
  }

  const [coin, coinOHLCData] = overview;

  return (
    <div id="coin-overview">
      <CandlestickChart data={coinOHLCData} coinId="bitcoin">
        <div className="header pt-2">
          <Image src={coin.image.large} alt={coin.name} width={56} height={56} />
          <div className="info">
            <p>
              {coin.name} / {coin.symbol.toUpperCase()}
            </p>
            <h1>{formatCurrency(coin.market_data.current_price.usd)}</h1>
          </div>
        </div>
      </CandlestickChart>
    </div>
  );
};

export default CoinOverview;
