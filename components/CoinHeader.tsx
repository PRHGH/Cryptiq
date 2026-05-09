import { cn, formatCurrency, formatPercentage, getTrendDirection } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";

const CoinHeader = ({
  priceChangePercentage24h,
  priceChangePercentage30d,
  name,
  image,
  price,
  priceChange24h,
}: CoinHeaderProps) => {
  const todayDirection = getTrendDirection(priceChangePercentage24h);
  const thirtyDayDirection = getTrendDirection(priceChangePercentage30d);
  const priceChangeDirection = getTrendDirection(priceChange24h);

  const stats = [
    {
      label: "Today",
      value: priceChangePercentage24h,
      direction: todayDirection,
      formatter: formatCurrency,
      showIcon: true,
    },
    {
      label: "30 Days",
      value: priceChangePercentage30d,
      direction: thirtyDayDirection,
      formatter: formatCurrency,
      showIcon: true,
    },
    {
      label: "Price Change (24h)",
      value: priceChange24h,
      direction: priceChangeDirection,
      formatter: formatCurrency,
      showIcon: false,
    },
  ];

  return (
    <div id="coin-header">
      <h3>{name}</h3>

      <div className="info">
        <Image src={image} alt={name} width={77} height={77} />

        <div className="price-row">
          <h1>{formatCurrency(price)}</h1>
          <Badge
            className={cn("badge", {
              "badge-up": todayDirection === "up",
              "badge-down": todayDirection === "down",
              "badge-neutral": todayDirection === "neutral",
            })}
          >
            {formatPercentage(priceChangePercentage24h)}
            {todayDirection === "up" ? (
              <TrendingUp />
            ) : todayDirection === "down" ? (
              <TrendingDown />
            ) : null}
            (24h)
          </Badge>
        </div>
      </div>

      <ul className="stats">
        {stats.map((stat) => (
          <li key={stat.label}>
            <p className="label">{stat.label}</p>

            <div
              className={cn("value", {
                "text-positive": stat.direction === "up",
                "text-negative": stat.direction === "down",
                "text-text-secondary": stat.direction === "neutral",
              })}
            >
              <p>{stat.formatter(stat.value)}</p>
              {stat.showIcon &&
                (stat.direction === "up" ? (
                  <TrendingUp width={16} height={16} />
                ) : stat.direction === "down" ? (
                  <TrendingDown width={16} height={16} />
                ) : null)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CoinHeader;
