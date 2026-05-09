import { formatCompactNumber } from "@/lib/utils";

const formatSentimentPercentage = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${Number(value.toFixed(1))}%`;
};

const formatCommunityValue = (value: number | null | undefined, suffix: string) => {
  const compactValue = formatCompactNumber(value && value > 0 ? value : null);

  return compactValue === "N/A" ? compactValue : `${compactValue} ${suffix}`;
};

const CoinCommunitySentimentCard = ({
  sentimentVotesUpPercentage,
  sentimentVotesDownPercentage,
  communityData,
}: CoinCommunitySentimentCardProps) => {
  const stats = [
    {
      label: "Reddit",
      value: formatCommunityValue(communityData?.reddit_subscribers, "subscribers"),
    },
    {
      label: "Telegram",
      value: formatCommunityValue(communityData?.telegram_channel_user_count, "users"),
    },
    {
      label: "X/Twitter",
      value: formatCommunityValue(communityData?.twitter_followers, "followers"),
    },
    {
      label: "Facebook",
      value: formatCommunityValue(communityData?.facebook_likes, "likes"),
    },
  ];

  return (
    <section id="coin-community-sentiment">
      <h4>Sentiment & Community</h4>

      <div className="sentiment-panel">
        <div className="sentiment-row">
          <div className="sentiment-item">
            <p className="label">Bullish</p>
            <p className="value text-positive">
              {formatSentimentPercentage(sentimentVotesUpPercentage)}
            </p>
          </div>

          <div className="sentiment-item">
            <p className="label">Bearish</p>
            <p className="value text-negative">
              {formatSentimentPercentage(sentimentVotesDownPercentage)}
            </p>
          </div>
        </div>

        <ul className="community-grid">
          {stats.map((stat) => (
            <li key={stat.label}>
              <p className="label">{stat.label}</p>
              <p className="value">{stat.value}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default CoinCommunitySentimentCard;
