'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  Menu,
  PauseCircle,
  PlayCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import { HanumPayBrand } from '@/components/HanumPayBrand';
import VerifiableReceiptModal from '@/components/VerifiableReceiptModal';
import { useHanumPay } from '@/lib/hanumpay-store';
import { QDAY_EXPLORER_URL, QDAY_FAUCET_URL, shortenAddress } from '@/lib/qday-constants';

const NAV_GROUPS = [
  {
    label: 'My Shop',
    items: [
      { href: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
      { href: '/kasir', label: 'Mobile Cashier', icon: Smartphone },
      { href: '/app/penjualan', label: 'Accept Payment', icon: QrCode },
      { href: '/app/pinjaman', label: 'Working Capital', icon: FileCheck2 },
    ],
  },
  {
    label: 'Suppliers & Pool',
    items: [
      { href: '/app/identitas', label: 'Pay & Verify', icon: ShieldCheck },
      { href: '/app/pool', label: 'Community Pool', icon: Landmark },
    ],
  },
  {
    label: 'Tools & Guides',
    items: [
      { href: '/stage', label: 'Live 2-Phone Demo', icon: Smartphone },
      { href: '/app/docs', label: 'Guides & Tech', icon: BookOpen },
    ],
  },
];

const MOBILE_TABS = [
  { href: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/kasir', label: 'Cashier', icon: Smartphone },
  { href: '/app/pinjaman', label: 'Credit', icon: FileCheck2 },
  { href: '/app/identitas', label: 'Pay', icon: ShieldCheck },
];

export default function AppShell({
  title,
  group = 'My Shop',
  headlineLead,
  headlineAccent,
  subtitle,
  children,
}: {
  title: string;
  group?: string;
  headlineLead?: string;
  headlineAccent?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    activeShopName,
    isRegisteredShop,
    proposedLoan,
    wallet,
    connectQDayWallet,
    disconnectWallet,
    shopAvailableTusd8,
    agentPaused,
    toggleAgentPaused,
    isSyncing,
    lastSyncedBlock,
    syncOnChain,
  } = useHanumPay();

  async function handlePauseToggle() {
    setActionError(null);
    setTogglingPause(true);
    const res = await toggleAgentPaused();
    setTogglingPause(false);
    if (!res.ok && res.error) {
      setActionError(res.error);
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#151619] text-white px-4 py-5">
      <div className="min-h-0 overflow-y-auto pr-0.5">
        <div className="flex items-center justify-between px-2 pb-5 border-b border-white/10">
          <HanumPayBrand href="/" variant="dark" size={30} alwaysShowText />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 text-white/65 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 space-y-6" aria-label="Workspace navigation">
          {NAV_GROUPS.map((navGroup) => (
            <div key={navGroup.label}>
              <p className="px-3 text-[11px] font-medium text-white/45 mb-2">
                {navGroup.label}
              </p>
              <ul className="space-y-1">
                {navGroup.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors min-h-[42px] ${
                          active
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              active ? 'text-[#9FE8C3]' : 'text-white/50'
                            }`}
                          />
                          <span className="truncate whitespace-nowrap">{item.label}</span>
                        </span>
                        {item.href === '/app/pinjaman' && proposedLoan && (
                          <span className="text-[11px] font-semibold text-[#9FE8C3] whitespace-nowrap shrink-0">
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

      <div className="space-y-3 pt-4 pb-6 lg:pb-1 border-t border-white/10">
        {wallet.connected && wallet.address ? (
          <div className="p-3.5 rounded-2xl bg-[#1E2025] border border-white/10 space-y-2.5">
            <div>
              <p className="text-[11px] text-white/55">
                {isRegisteredShop ? 'Registered Shop' : 'Account Connected'}
              </p>
              <p className="text-[13.5px] font-semibold text-white truncate mt-0.5">
                {activeShopName}
              </p>
              <p className="text-sm font-mono tabular-nums font-semibold text-[#9FE8C3] mt-1">
                ${shopAvailableTusd8.toFixed(2)} USD
              </p>
            </div>
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={togglingPause}
              className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 ${
                agentPaused
                  ? 'bg-amber-500/15 border-amber-400/30 text-amber-200 hover:bg-amber-500/20'
                  : 'bg-white/[0.06] border-white/10 text-white/85 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {agentPaused ? (
                  <PlayCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : (
                  <PauseCircle className="w-3.5 h-3.5 text-[#9FE8C3] shrink-0" />
                )}
                <span>
                  {togglingPause
                    ? 'Saving...'
                    : agentPaused
                      ? 'Credit Offers Paused'
                      : 'Credit Offers Active'}
                </span>
              </span>
            </button>
          </div>
        ) : null}

        {wallet.connected && wallet.address ? (
          <button
            type="button"
            onClick={disconnectWallet}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-[#151619] bg-white hover:bg-[#E8FAF0] transition-colors whitespace-nowrap min-h-[42px] cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-[#15803D]" />
            <span>{shortenAddress(wallet.address)} · Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={connectQDayWallet}
            disabled={wallet.isConnecting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-[#151619] bg-white hover:bg-[#E8FAF0] transition-colors whitespace-nowrap min-h-[42px] disabled:opacity-60 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-[#15803D]" />
            <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Account'}</span>
          </button>
        )}

        <div className="flex items-center justify-center gap-3 px-2 text-[11px] text-white/50">
          <a
            href={QDAY_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Get Test Funds
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={QDAY_EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Activity Explorer
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-landing min-h-screen flex bg-white text-[#151619] antialiased selection:bg-[#9FE8C3] selection:text-[#151619]">
      <aside className="hidden lg:block w-[256px] shrink-0 bg-[#151619]">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#151619]/45 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col bg-[#F7F8F9]">
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E7E4] px-4 sm:px-8 flex items-center">
          <div className="w-full max-w-[1160px] mx-auto flex items-center justify-between gap-8">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-[#5C6260] hover:text-[#151619] hover:bg-[#F7F8F9] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="lg:hidden shrink-0">
                <HanumPayBrand href="/" variant="light" size={26} />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#636966] min-w-0">
                <span className="hidden sm:inline whitespace-nowrap">{group}</span>
                <span className="hidden sm:inline" aria-hidden="true">/</span>
                <span className="truncate font-semibold text-[#151619]">{title}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => void syncOnChain()}
                disabled={isSyncing}
                title={
                  lastSyncedBlock
                    ? `Synced to network block #${lastSyncedBlock}`
                    : 'Refresh account data'
                }
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6260] hover:text-[#151619] px-3 py-1.5 rounded-full border border-[#E2E7E4] bg-white whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3 h-3 text-[#15803D] ${isSyncing ? 'animate-spin' : ''}`}
                />
                <span>{isSyncing ? 'Refreshing...' : 'Live Sync'}</span>
              </button>

              {wallet.connected && wallet.address ? (
                <button
                  type="button"
                  onClick={disconnectWallet}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#151619] border border-[#E2E7E4] bg-white rounded-full hover:bg-[#F7F8F9] transition-colors whitespace-nowrap shrink-0 min-h-[36px] cursor-pointer"
                >
                  {shortenAddress(wallet.address)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectQDayWallet}
                  disabled={wallet.isConnecting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-full transition-colors whitespace-nowrap shrink-0 min-h-[36px] disabled:opacity-60 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
                  <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Account'}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {(wallet.error || actionError) && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5">
            <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 text-xs text-amber-900">
              <span className="truncate">{actionError ?? wallet.error}</span>
              <Link href="/stage" className="font-semibold underline shrink-0 whitespace-nowrap">
                Try Interactive Demo
              </Link>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-10 pb-24 lg:pb-12">
          <div className="max-w-[1160px] mx-auto space-y-7">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-[28px] sm:text-[38px] leading-[1.08] font-bold tracking-[-0.03em] text-[#151619] text-balance">
                {headlineLead ? (
                  <>
                    {headlineLead}{' '}
                    {headlineAccent && (
                      <span className="text-[#15803D]">{headlineAccent}</span>
                    )}
                  </>
                ) : (
                  title
                )}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-[15px] text-[#5C6260] leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </main>
      </div>

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
                active ? 'text-[#15803D] font-semibold' : 'text-[#636966] hover:text-[#151619]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium tracking-tight mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <VerifiableReceiptModal />
    </div>
  );
}
