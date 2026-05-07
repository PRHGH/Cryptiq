import DataTable from "@/components/DataTable";

const skeletonRows = Array.from({ length: 6 }, (_, index) => ({ id: index }));
const categorySkeletonRows = Array.from({ length: 10 }, (_, index) => ({ id: index }));

export const CoinOverviewFallback = () => {
  return (
    <div id="coin-overview-fallback">
      <div className="header pt-2">
        <div className="skeleton header-image" />
        <div className="info">
          <div className="skeleton header-line-sm" />
          <div className="skeleton header-line-lg" />
        </div>
      </div>

      <div className="flex gap-2 py-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton period-button-skeleton" />
        ))}
      </div>

      <div className="chart">
        <div className="skeleton chart-skeleton" />
      </div>
    </div>
  );
};

export const TrendingCoinsFallback = () => {
  const columns: DataTableColumn<(typeof skeletonRows)[number]>[] = [
    {
      header: "Name",
      cellClassName: "name-cell",
      cell: () => (
        <div className="name-link">
          <div className="skeleton name-image" />
          <div className="skeleton name-line" />
        </div>
      ),
    },
    {
      header: "24h Change",
      cellClassName: "change-cell",
      cell: () => (
        <div className="price-change">
          <div className="skeleton change-icon" />
          <div className="skeleton change-line" />
        </div>
      ),
    },
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: () => <div className="skeleton price-line" />,
    },
  ];

  return (
    <div id="trending-coins-fallback">
      <h4>Trending Coins</h4>
      <DataTable
        data={skeletonRows}
        columns={columns}
        rowKey={(row) => row.id}
        tableClassName="trending-coins-table"
        headerCellClassName="py-3!"
        bodyCellClassName="py-2!"
      />
    </div>
  );
};

export const CategoriesFallback = () => {
  const columns: DataTableColumn<(typeof categorySkeletonRows)[number]>[] = [
    {
      header: "Category",
      cellClassName: "category-cell",
      cell: () => <div className="skeleton category-skeleton" />,
    },
    {
      header: "Top Gainers",
      cellClassName: "top-gainers-cell",
      cell: () => (
        <div className="top-gainers-list">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="skeleton coin-skeleton" />
          ))}
        </div>
      ),
    },
    {
      header: "24h Change",
      headClassName: "change-header-cell",
      cellClassName: "change-cell",
      cell: () => (
        <>
          <div className="skeleton value-skeleton-sm" />
          <div className="skeleton change-icon" />
        </>
      ),
    },
    {
      header: "Market Cap",
      cellClassName: "market-cap-cell",
      cell: () => <div className="skeleton value-skeleton-lg" />,
    },
    {
      header: "24h Volume",
      cellClassName: "volume-cell",
      cell: () => <div className="skeleton value-skeleton-md" />,
    },
  ];

  return (
    <div id="categories-fallback" className="custom-scrollbar">
      <h4>Top Categories</h4>
      <DataTable
        columns={columns}
        data={categorySkeletonRows}
        rowKey={(row) => row.id}
        tableClassName="mt-3"
      />
    </div>
  );
};
