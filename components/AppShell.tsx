'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import VerifiableReceiptModal from '@/components/VerifiableReceiptModal';
import { useHanumPay } from '@/lib/hanumpay-store';
import { QDAY_EXPLORER_URL, QDAY_FAUCET_URL, shortenAddress } from '@/lib/qday';

const NAV_GROUPS = [
  {
    label: 'Operasional Toko',
    items: [
      { href: '/app/dashboard', label: 'Dasbor', icon: LayoutDashboard },
      { href: '/app/penjualan', label: 'Catat Penjualan', icon: QrCode },
      { href: '/app/pinjaman', label: 'Modal & Penjaga AI', icon: FileCheck2 },
    ],
  },
  {
    label: 'Ekosistem & Kepercayaan',
    items: [
      { href: '/app/pool', label: 'Pool Dana', icon: Landmark },
      { href: '/app/identitas', label: 'ERC-8004 & Bayar', icon: ShieldCheck },
    ],
  },
  {
    label: 'Infrastruktur QDay',
    items: [
      { href: '/stage', label: 'Simulasi 2 Layar', icon: Smartphone },
      { href: '/app/docs', label: 'Kontrak & Panduan', icon: BookOpen },
    ],
  },
];

// Bar navigasi bawah ramah ibu jari untuk HP pemilik warung
const MOBILE_TABS = [
  { href: '/app/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/app/penjualan', label: 'Catat QR', icon: QrCode },
  { href: '/app/pinjaman', label: 'Modal', icon: FileCheck2 },
  { href: '/app/identitas', label: 'Bayar', icon: ShieldCheck },
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
    <div className="flex h-full flex-col justify-between bg-[#030712] text-slate-200 px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-800/80">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            HanumPay
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 space-y-6" aria-label="Navigasi workspace">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-xs font-medium text-slate-500 mb-2">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                          active
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-3 whitespace-nowrap">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </span>
                        {item.href === '/app/pinjaman' && proposedLoan && (
                          <span className="text-xs font-mono tabular-nums text-emerald-400">
                            1 tawaran
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

      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="px-3 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <div>
            <p className="text-xs text-slate-400">Identitas Toko Aktif</p>
            <p className="text-sm font-medium text-white truncate mt-0.5">{activeShopName}</p>
            <p className="text-xs font-mono tabular-nums text-emerald-400 mt-1">
              {shopAvailableTusd8.toFixed(2)} tUSD8 tersedia
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAgentPaused}
            className={`w-full inline-flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium border transition-colors ${
              agentPaused
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {agentPaused ? (
                <PlayCircle className="w-3.5 h-3.5" />
              ) : (
                <PauseCircle className="w-3.5 h-3.5" />
              )}
              <span>{agentPaused ? 'AI Dijeda · Aktifkan' : 'Penjaga AI Aktif'}</span>
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <a
            href={QDAY_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Faucet QDay
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={QDAY_EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Explorer
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800 bg-[#030712]">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer for Secondary Pages (Lender Pool & Foundry Docs) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Compact 52-56px Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center">
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Buka menu navigasi lengkap"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Link href="/" className="font-semibold text-slate-900 lg:font-normal lg:text-slate-500 hover:text-slate-900 transition-colors">
                    HanumPay
                  </Link>
                  <span aria-hidden="true">/</span>
                  <span className="truncate">{title}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-block text-xs text-slate-500 whitespace-nowrap">
                QDay Aevum Testnet · Chain 44005
              </span>

              {wallet.connected && wallet.address ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span>{wallet.tusd8Balance} tUSD8</span>
                    <span aria-hidden="true" className="text-slate-300">
                      |
                    </span>
                    <span>{shortenAddress(wallet.address)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap min-h-[38px]"
                  >
                    Putus
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectQDayWallet}
                  disabled={wallet.isConnecting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] disabled:opacity-60"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {wallet.isConnecting ? 'Menghubungkan...' : 'Hubungkan Dompet QDay'}
                  </span>
                  <span className="sm:hidden">
                    {wallet.isConnecting ? '...' : 'Dompet'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {wallet.error && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 text-xs text-amber-900">
              <span className="truncate">{wallet.error}</span>
              <span className="font-medium shrink-0">Mode demo aktif</span>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-8 py-5 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
                {subtitle && <p className="text-xs sm:text-sm text-slate-600 mt-1">{subtitle}</p>}
              </div>
              <Link
                href="/app/penjualan"
                className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 bg-white px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Catat Penjualan QR</span>
              </Link>
            </div>

            {children}
          </div>
        </main>
      </div>

      {/* Bar navigasi bawah seluler */}
      <nav
        aria-label="Navigasi cepat seluler"
        className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center lg:hidden"
      >
        {MOBILE_TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                active ? 'text-[#16A34A]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <VerifiableReceiptModal />
    </div>
  );
}
