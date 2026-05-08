import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-robotic",
  subsets: ["latin"],
});

// const bitcountSingle = Bitcount_Single({
//   variable: "--font-robotic",
//   weight: "variable",
//   subsets: ["latin"],
// });

// Previous root font setup:
// const silkscreen = Silkscreen({
//   variable: "--font-robotic",
//   weight: ["400", "700"],
//   subsets: ["latin"],
// });
// const vt323 = VT323({
//   variable: "--font-robotic",
//   weight: "400",
//   subsets: ["latin"],
// });
// const orbitron = Orbitron({
//   variable: "--font-robotic",
//   subsets: ["latin"],
// });
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "SilkSignal",
  description: "Crypto Screener App with a built-in High-Frequency Terminal & Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", jetbrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
