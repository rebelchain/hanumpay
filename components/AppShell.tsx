"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  Menu,
  PauseCircle,
  PlayCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import VerifiableReceiptModal from "@/components/VerifiableReceiptModal";
import { useHanumPay } from "@/lib/hanumpay-store";
import { QDAY_EXPLORER_URL, QDAY_FAUCET_URL, shortenAddress } from "@/lib/qday";

const NAV_GROUPS = [
  {
    label: "Shop Operations",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/penjualan", label: "Record QR Sale", icon: QrCode },
      {
        href: "/app/pinjaman",
        label: "Working Capital & AI",
        icon: FileCheck2,
      },
    ],
  },
  {
    label: "Ecosystem & Trust",
    items: [
      { href: "/app/pool", label: "Liquidity Pool", icon: Landmark },
      {
        href: "/app/identitas",
        label: "ERC-8004 & Suppliers",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "QDay Infrastructure",
    items: [
      { href: "/stage", label: "2-Phone Simulator", icon: Smartphone },
      { href: "/app/docs", label: "GitBook Docs & Contracts", icon: BookOpen },
    ],
  },
];

// Thumb-friendly bottom navigation bar for merchant mobile devices
const MOBILE_TABS = [
  { href: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/app/penjualan", label: "QR POS", icon: QrCode },
  { href: "/app/pinjaman", label: "Credit", icon: FileCheck2 },
  { href: "/app/identitas", label: "Pay", icon: ShieldCheck },
];

export default function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    activeShopName,
    proposedLoan,
    wallet,
    connectQDayWallet,
    disconnectWallet,
    shopAvailableTusd8,
    agentPaused,
    toggleAgentPaused,
  } = useHanumPay();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white text-[#151619] px-4 py-5">
      <div className="min-h-0 overflow-y-auto pr-0.5">
        <div className="flex items-center justify-between px-2 pb-5 border-b border-[#E2E7E4]">
          <Link
            href="/"
            className="text-[19px] font-semibold tracking-[-0.04em] text-[#151619] whitespace-nowrap shrink-0"
          >
            hanumpay
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 text-[#5C6260] hover:text-[#151619] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 space-y-6" aria-label="Workspace navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#636966] mb-2">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors min-h-[42px] ${
                          active
                            ? "bg-[#E8FAF0] text-[#151619] font-semibold ring-1 ring-[#9FE8C3]"
                            : "text-[#5C6260] hover:text-[#151619] hover:bg-[#F5F7F5]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              active ? "text-[#15803D]" : "text-[#636966]"
                            }`}
                          />
                          <span className="truncate whitespace-nowrap">
                            {item.label}
                          </span>
                        </span>
                        {item.href === "/app/pinjaman" && proposedLoan && (
                          <span className="inline-flex items-center rounded-full bg-[#9FE8C3] px-2 py-0.5 text-[11px] font-mono tabular-nums font-semibold text-[#151619] whitespace-nowrap shrink-0">
                            1 offer
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="space-y-3 pt-4 pb-8 lg:pb-2 border-t border-[#E2E7E4]">
        <div className="p-3.5 rounded-2xl bg-[#F5F7F5] border border-[#E2E7E4] space-y-2.5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#636966]">
              Active Merchant
            </p>
            <p className="text-[13.5px] font-semibold text-[#151619] truncate mt-0.5">
              {activeShopName}
            </p>
            <p className="text-xs font-mono tabular-nums font-semibold text-[#15803D] mt-1">
              {shopAvailableTusd8.toFixed(2)} tUSD8 available
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAgentPaused}
            className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              agentPaused
                ? "bg-amber-50 border-amber-200 text-[#B45309] hover:bg-amber-100/70"
                : "bg-white border-[#E2E7E4] text-[#151619] hover:border-[#9FE8C3] hover:bg-[#E8FAF0]/60"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {agentPaused ? (
                <PlayCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
              ) : (
                <PauseCircle className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
              )}
              <span>
                {agentPaused ? "AI Paused · Resume" : "AI Guarantor Active"}
              </span>
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between px-2 text-xs text-[#636966]">
          <a
            href={QDAY_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#151619] transition-colors whitespace-nowrap"
          >
            QDay Faucet
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={QDAY_EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#151619] transition-colors whitespace-nowrap"
          >
            Explorer
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-landing min-h-screen flex bg-white text-[#151619] antialiased selection:bg-[#9FE8C3] selection:text-[#151619]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[272px] shrink-0 border-r border-[#E2E7E4] bg-white">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer for Secondary Pages */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#151619]/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full border-r border-[#E2E7E4]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#F5F7F5]/55">
        {/* Compact Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E7E4] px-4 sm:px-8 flex items-center">
          <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-[#5C6260] hover:text-[#151619] hover:bg-[#F5F7F5] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open full navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#636966]">
                  <Link
                    href="/"
                    className="font-semibold text-[#151619] lg:font-medium lg:text-[#636966] hover:text-[#151619] transition-colors whitespace-nowrap"
                  >
                    hanumpay
                  </Link>
                  <span aria-hidden="true">/</span>
                  <span className="truncate font-medium text-[#151619]">
                    {title}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-block font-mono text-[11px] text-[#636966] whitespace-nowrap">
                QDay Aevum · Chain 44005
              </span>

              {wallet.connected && wallet.address ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums text-[#151619] px-3 py-1.5 rounded-full border border-[#E2E7E4] bg-[#F5F7F5]">
                    <span className="text-[#15803D] font-semibold">
                      {wallet.tusd8Balance} tUSD8
                    </span>
                    <span aria-hidden="true" className="text-[#E2E7E4]">
                      |
                    </span>
                    <span>{shortenAddress(wallet.address)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#151619] border border-[#E2E7E4] bg-white rounded-full hover:bg-[#F5F7F5] transition-colors whitespace-nowrap min-h-[36px] cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectQDayWallet}
                  disabled={wallet.isConnecting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-full transition-colors whitespace-nowrap shrink-0 min-h-[36px] disabled:opacity-60 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
                  <span className="hidden sm:inline">
                    {wallet.isConnecting
                      ? "Connecting..."
                      : "Connect QDay Wallet"}
                  </span>
                  <span className="sm:hidden">
                    {wallet.isConnecting ? "..." : "Wallet"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {wallet.error && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2">
            <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 text-xs text-amber-900">
              <span className="truncate">{wallet.error}</span>
              <span className="font-medium shrink-0">Demo mode active</span>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-10">
          <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E2E7E4]">
              <div>
                <h1 className="text-2xl sm:text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-[#151619]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-[#5C6260] mt-1.5 max-w-[68ch]">
                    {subtitle}
                  </p>
                )}
              </div>
              <Link
                href="/app/penjualan"
                className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-[#151619] hover:bg-[#E8FAF0] border border-[#E2E7E4] bg-white px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Record QR Sale</span>
              </Link>
            </div>

            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#E2E7E4] grid grid-cols-4 items-center lg:hidden"
      >
        {MOBILE_TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                active
                  ? "text-[#15803D] font-semibold"
                  : "text-[#636966] hover:text-[#151619]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <VerifiableReceiptModal />
    </div>
  );
}
