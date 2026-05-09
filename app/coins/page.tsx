import { fetcher, searchCoins } from "@/lib/coingecko.actions";
import Image from "next/image";
import Link from "next/link";

import { cn, formatPercentage, formatCurrency, getTrendDirection } from "@/lib/utils";
import DataTable from "@/components/DataTable";
import CoinsPagination from "@/components/CoinsPagination";
import CoinsSearchInput from "@/components/CoinsSearchInput";

const Coins = async ({ searchParams }: NextPageProps) => {
  const { page, q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const isSearchMode = query.length > 0;

  const parsedPage = Number(page);
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const perPage = 10;

  const marketColumns: DataTableColumn<CoinMarketData>[] = [
    {
      header: "Rank",
      cellClassName: "rank-cell",
      cell: (coin) => (
        <>
          # {coin.market_cap_rank}
          <Link href={`/coins/${coin.id}`} aria-label="View coin" />
        </>
      ),
    },
    {
      header: "Token",
      cellClassName: "token-cell",
      cell: (coin) => (
        <div className="token-info">
          <Image src={coin.image} alt={coin.name} width={36} height={36} />
          <p>
            {coin.name} ({coin.symbol.toUpperCase()})
          </p>
        </div>
      ),
    },
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: (coin) => formatCurrency(coin.current_price),
    },
    {
      header: "24h Change",
      cellClassName: "change-cell",
      cell: (coin) => {
        const change = coin.price_change_percentage_24h;
        const direction = getTrendDirection(change);

        return (
          <span
            className={cn("change-value", {
              "text-positive": direction === "up",
              "text-negative": direction === "down",
              "text-text-secondary": direction === "neutral",
            })}
          >
            {direction === "up" && "+"}
            {formatPercentage(change)}
          </span>
        );
      },
    },
    {
      header: "Market Cap",
      cellClassName: "market-cap-cell",
      cell: (coin) => formatCurrency(coin.market_cap),
    },
  ];

  const searchColumns: DataTableColumn<SearchCoin>[] = [
    {
      header: "Rank",
      cellClassName: "rank-cell",
      cell: (coin) => (
        <>
          {typeof coin.market_cap_rank === "number" ? `# ${coin.market_cap_rank}` : "Unranked"}
          <Link href={`/coins/${coin.id}`} aria-label="View coin" />
        </>
      ),
    },
    {
      header: "Token",
      cellClassName: "token-cell",
      cell: (coin) => (
        <div className="token-info">
          <Image src={coin.thumb || coin.large} alt={coin.name} width={36} height={36} />
          <p>
            {coin.name} ({coin.symbol.toUpperCase()})
          </p>
        </div>
      ),
    },
    {
      header: "Symbol",
      cellClassName: "price-cell",
      cell: (coin) => coin.symbol.toUpperCase(),
    },
    {
      header: "Coin ID",
      cellClassName: "market-cap-cell",
      cell: (coin) => coin.id,
    },
  ];

  const marketCoins = isSearchMode
    ? []
    : await fetcher<CoinMarketData[]>("/coins/markets", {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: perPage,
        page: currentPage,
        sparkline: "false",
        price_change_percentage: "24h",
      });
  const searchResults = isSearchMode ? await searchCoins(query) : [];

  const hasMorePages = marketCoins.length === perPage;

  const estimatedTotalPages = hasMorePages
    ? currentPage >= 100
      ? Math.ceil(currentPage / 100) * 100 + 100
      : 100
    : currentPage;

  return (
    <main id="coins-page">
      <div className="content">
        <h4>{isSearchMode ? `Search Results for "${query}"` : "All Coins"}</h4>

        <div className="max-w-md">
          <CoinsSearchInput key={query} initialQuery={query} />
        </div>

        {isSearchMode ? (
          <DataTable
            tableClassName="coins-table"
            columns={searchColumns}
            data={searchResults}
            rowKey={(coin) => coin.id}
          />
        ) : (
          <DataTable
            tableClassName="coins-table"
            columns={marketColumns}
            data={marketCoins}
            rowKey={(coin) => coin.id}
          />
        )}

        {!isSearchMode ? (
          <CoinsPagination
            currentPage={currentPage}
            totalPages={estimatedTotalPages}
            hasMorePages={hasMorePages}
          />
        ) : null}
      </div>
    </main>
  );
};

export default Coins;
