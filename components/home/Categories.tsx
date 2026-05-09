import { fetcher } from "@/lib/coingecko.actions";
import { cn, formatCurrency, formatPercentage, getTrendDirection } from "@/lib/utils";
import DataTable from "../DataTable";
import Image from "next/image";
import { TrendingDown, TrendingUp } from "lucide-react";

const Categories = async () => {
  const categories = await fetcher<Category[]>("/coins/categories");

  const columns: DataTableColumn<Category>[] = [
    {
      header: "Category",
      cellClassName: "category-cell",
      cell: (category) => category.name,
    },

    {
      header: "Top Gainers",
      cellClassName: "top-gainers-cell",
      cell: (category) => (
        <div className="top-gainers-list">
          {category.top_3_coins.map((coin) => (
            <Image src={coin} alt={coin} key={coin} width={28} height={28} />
          ))}
        </div>
      ),
    },

    {
      header: "24h Change",
      cellClassName: "change-header-cell",
      cell: (category) => {
        const change = category.market_cap_change_24h;
        const direction = getTrendDirection(change);

        return (
          <div
            className={cn("price-change", {
              "text-positive": direction === "up",
              "text-negative": direction === "down",
              "text-text-secondary": direction === "neutral",
            })}
          >
            <p className="flex items-center">
              {formatPercentage(change)}
              {direction === "up" ? (
                <TrendingUp width={16} height={16} />
              ) : direction === "down" ? (
                <TrendingDown width={16} height={16} />
              ) : null}
            </p>
          </div>
        );
      },
    },

    {
      header: "Market Cap",
      cellClassName: "market-cap-cell",
      cell: (category) => formatCurrency(category.market_cap),
    },

    {
      header: "24h Volume",
      cellClassName: "volume-cell",
      cell: (category) => formatCurrency(category.volume_24h),
    },
  ];
  return (
    <div id="categories" className="custom-scrollbar">
      <h4>Top Categories</h4>

      <DataTable
        columns={columns}
        data={categories?.slice(0, 10)}
        rowKey={(_, index) => index}
        tableClassName="mt-3"
      />
    </div>
  );
};

export default Categories;
