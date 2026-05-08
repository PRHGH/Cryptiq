import { fetcher } from "@/lib/coingecko.actions";
import CandlestickChart from "@/components/CandlestickChart";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import CoinHeader from "@/components/CoinHeader";
import { Separator } from "@/components/ui/separator";
import Converter from "@/components/Converter";

const Page = async ({ params }: NextPageProps) => {
  const { id } = await params;

  const [coinData, coinOHLCData] = await Promise.all([

    fetcher<CoinDetailsData>(`/coins/${id}`, {
    dex_pair_format: "contract_address",
    }),

    fetcher<OHLCData[]>(`/coins/${id}/ohlc`, {
        vs_currency : 'usd',
        days: 1,
        interval : 'hourly',
        precision : 'full'
    }),   
    
  ]);

  const coinDetails = [
    {
        label : 'Market Cap',
        value : formatCurrency(coinData.market_data.market_cap.usd)
    },

    {
        label : 'Market Cap Rank',
        value : `# ${coinData.market_cap_rank.toFixed(2)}`
    },

    {
        label : 'Total Volume',
        value : formatCurrency(coinData.market_data.total_volume.usd)
    },
    
    {
        label : 'Wesite',
        value : '-',
        link : coinData.links.homepage[0],
        linkText : "Homepage"
    }, 
    
    {
        label : 'Explorer',
        value : '-',
        link : coinData.links.blockchain_site[0],
        linkText : "Explorer"
    },
    
    {
        label : 'Community',
        value : '-',
        link : coinData.links.subreddit_url,
        linkText : "Community"
    },    
  ]
  
  return (
    <main id='coin-details-page'>
        <section className="primary">
            <section id="live-data-wrapper">
            <CoinHeader
                name={coinData.name}
                image={coinData.image.large}
                price={coinData.market_data.current_price.usd}
                priceChangePercentage24h={
                coinData.market_data.price_change_percentage_24h_in_currency.usd
                }
                priceChangePercentage30d={coinData.market_data.price_change_percentage_30d_in_currency.usd}
                priceChange24h={coinData.market_data.price_change_24h_in_currency.usd}
            />
            <Separator className="divider" />

            <div className="trend">
                <CandlestickChart
                coinId={coinData.id}
                data={coinOHLCData}
                >
                <h4>Trend Overview</h4>
                </CandlestickChart>
            </div>

            <Separator className="divider" />

            </section>
        </section>

        <section className="secondary"> 
            <Converter symbol={coinData.symbol} icon={coinData.image.small} priceList={coinData.market_data.current_price}/>

            <div className="details">
                <h4>Coin Details</h4>

                <ul className="details-grid">
                {coinDetails.map(({ label, value, link, linkText }, index) => (
                    <li key={index}>
                        <p className="label">{label}</p>
                        {link ? (
                            <div className="link">
                            <Link href={link} target="_blank">
                                {label}
                            </Link>
                            <ArrowUpRight size={16} />
                            </div> 
                        ): (
                            <p className="text-base font-medium">{value}</p>
                        )}
                    </li>
                ))}
                </ul>
            </div>
            <p>Top Gainer and Losers</p>
        </section>
    </main>
  )
}

export default Page
