"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SearchModal } from "./SearchModal";

const Header = () => {
  const pathname = usePathname();
  return (
    <header>
      <div className="main-container inner">
        <Link href="/" className="brand" aria-label="Cryptiq home">
          <Image src="/logo.svg" alt="Cryptiq logo" width={50} height={50} className="brand-logo" />
          <span className="brand-text">Cryptiq</span>
        </Link>

        <nav>
          <span className="live-pill" aria-label="Live market data">
            <span />
            LIVE
          </span>

          <Link
            href="/"
            className={cn("nav-link", {
              "is-active": pathname == "/",
              "is-home": true,
            })}
          >
            Home
          </Link>

          <SearchModal />

          <Link
            href="/coins"
            className={cn("nav-link", {
              "is-active": pathname == "/coins",
            })}
          >
            All Coins
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
