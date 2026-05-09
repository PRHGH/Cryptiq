import { fetcher } from "@/lib/coingecko.actions";
import CandlestickChart from "@/components/CandlestickChart";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import CoinHeader from "@/components/CoinHeader";
import { Separator } from "@/components/ui/separator";
import Converter from "@/components/Converter";
import DataTable from "@/components/DataTable";
import CoinCommunitySentimentCard from "@/components/CoinCommunitySentimentCard";

const Page = async ({ params }: NextPageProps) => {
  const { id } = await params;

  const [coinData, coinOHLCData, exchangeListings] = await Promise.all([
    fetcher<CoinDetailsData>(`/coins/${id}`, {
      dex_pair_format: "contract_address",
    }),

    fetcher<OHLCData[]>(`/coins/${id}/ohlc`, {
      vs_currency: "usd",
      days: 1,
      interval: "hourly",
      precision: "full",
    }),

    fetcher<TickersResponse>(`/coins/${id}/tickers`, {
      order: "volume_desc",
      depth: true,
      include_exchange_logo: true,
    }),
  ]);

  const coinDetails = [
    {
      label: "Market Cap",
      value: formatCurrency(coinData.market_data.market_cap.usd),
    },

    {
      label: "Market Cap Rank",
      value:
        typeof coinData.market_cap_rank === "number"
          ? `# ${coinData.market_cap_rank}`
          : "N/A",
    },

    {
      label: "Total Volume",
      value: formatCurrency(coinData.market_data.total_volume.usd),
    },

    {
      label: "Website",
      value: "-",
      link: coinData.links.homepage[0],
      linkText: "Homepage",
    },

    {
      label: "Explorer",
      value: "-",
      link: coinData.links.blockchain_site[0],
      linkText: "Explorer",
    },

    {
      label: "Community",
      value: "-",
      link: coinData.links.subreddit_url,
      linkText: "Community",
    },
  ];

  const exchangeListingColumns: DataTableColumn<Ticker>[] = [
    {
      header: "Exchange",
      cellClassName: "exchange-cell",
      cell: (ticker) => (
        ticker.trade_url ? (
          <Link
            href={ticker.trade_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${ticker.market.name} trade`}
          >
            {ticker.market.name}
          </Link>
        ) : (
          <span aria-disabled="true">{ticker.market.name}</span>
        )
      ),
    },
    {
      header: "Pair",
      cellClassName: "pair-cell",
      cell: (ticker) => (
        <p>
          {ticker.base} / {ticker.target}
        </p>
      ),
    },
    {
      header: "Latest Price",
      cellClassName: "price-cell",
      cell: (ticker) => formatCurrency(ticker.last),
    },
    {
      header: "Spread",
      cellClassName: "spread-cell",
      cell: (ticker) => `${ticker.bid_ask_spread_percentage.toFixed(3)}%`,
    },
    {
      header: "Updated",
      headClassName: "updated-header-cell",
      cellClassName: "updated-cell",
      cell: (ticker) => new Date(ticker.timestamp).toLocaleDateString("en-US"),
    },
  ];

  return (
    <main id="coin-details-page">
      <section className="primary">
        <section id="live-data-wrapper">
          <CoinHeader
            name={coinData.name}
            image={coinData.image.large}
            price={coinData.market_data.current_price.usd}
            priceChangePercentage24h={
              coinData.market_data.price_change_percentage_24h_in_currency.usd
            }
            priceChangePercentage30d={
              coinData.market_data.price_change_percentage_30d_in_currency.usd
            }
            priceChange24h={coinData.market_data.price_change_24h_in_currency.usd}
          />
          <Separator className="divider" />

          <div className="trend">
            <CandlestickChart coinId={coinData.id} data={coinOHLCData}>
              <h4>Trend Overview</h4>
            </CandlestickChart>
          </div>

          <Separator className="divider" />

          <div className="exchange-section">
            <h4>Exchange Listings</h4>

            <DataTable
              tableClassName="exchange-listings-table"
              columns={exchangeListingColumns}
              data={exchangeListings.tickers.slice(0, 8)}
              rowKey={(ticker, index) =>
                `${ticker.market.name}-${ticker.base}-${ticker.target}-${index}`
              }
            />
          </div>
        </section>
      </section>

      <section className="secondary">
        <Converter
          symbol={coinData.symbol}
          icon={coinData.image.small}
          priceList={coinData.market_data.current_price}
        />

        <div className="details">
          <h4>Coin Details</h4>

          <ul className="details-grid">
            {coinDetails.map(({ label, value, link, linkText }, index) => (
              <li key={index}>
                <p className="label">{label}</p>
                {link ? (
                  <div className="link">
                    <Link href={link} target="_blank" rel="noopener noreferrer">
                      {linkText}
                    </Link>
                    <ArrowUpRight size={16} />
                  </div>
                ) : (
                  <p className="text-base font-medium">{value}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <CoinCommunitySentimentCard
          sentimentVotesUpPercentage={coinData.sentiment_votes_up_percentage}
          sentimentVotesDownPercentage={coinData.sentiment_votes_down_percentage}
          communityData={coinData.community_data}
        />        
      </section>
    </main>
  );
};

export default Page;
