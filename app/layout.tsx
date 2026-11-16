import type { Metadata } from "next";
import "./globals.css";
import { HanumPayProvider } from "@/lib/hanumpay-store";

export const metadata: Metadata = {
  title: "HanumPay — Working Capital Credit & Verified Payee Layer for MSMEs",
  description:
    "On-chain working capital credit, ERC-8004 Confirmation of Payee, and verified QR sales ledger for small merchants on QDay Aevum Testnet.",
  openGraph: {
    title: "HanumPay — Working Capital Credit & Verified Payee Layer for MSMEs",
    description:
      "Turn daily QR sales into fair tUSD8 working capital limits guarded by smart-contract AI constraints and ERC-8004 payee verification.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HanumPay — Working Capital Credit & Verified Payee Layer for MSMEs",
    description:
      "Turn daily QR sales into fair tUSD8 working capital limits guarded by smart-contract AI constraints and ERC-8004 payee verification.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#F9FAFB] text-slate-900"
      >
        <HanumPayProvider>{children}</HanumPayProvider>
      </body>
    </html>
  );
}
