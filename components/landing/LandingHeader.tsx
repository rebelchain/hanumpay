'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useHanumPay } from '@/lib/hanumpay-store';
import { shortenAddress } from '@/lib/qday';
import { CONTAINER } from './section';

const APP_LINKS = [
  { href: '/stage', label: 'Simulasi 2 Layar', desc: 'Kasir QR Toko vs Penjaga AI' },
  { href: '/app/dashboard', label: 'Ringkasan & Kontrak', desc: 'Status kredit & saldo warung' },
  { href: '/app/penjualan', label: 'Kasir Penjualan QR', desc: 'Catat omzet bebas biaya gas' },
  { href: '/app/pinjaman', label: 'Modal Kerja & Pemasok', desc: 'Tawaran AI & cek penerima resmi' },
  { href: '/app/pool', label: 'Pool Likuiditas', desc: 'Simpanan dana komunitas & TVL' },
  { href: '/app/docs', label: 'Arsitektur & Audit', desc: 'Aturan QDay & uji serangan AI' },
];

export function LandingHeader() {
  const { wallet, connectQDayWallet, disconnectWallet } = useHanumPay();
  const [scrolled, setScrolled] = useState(false);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAppMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleWalletClick = async () => {
    if (wallet.connected) {
      disconnectWallet();
    } else {
      await connectQDayWallet();
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div
        className={`pointer-events-auto transition-all duration-300 ease-out ${
          scrolled
            ? 'mx-auto mt-3 max-w-[960px] px-3 sm:px-5'
            : `${CONTAINER} pt-1`
        }`}
      >
        <div
          className={`flex h-14 items-center justify-between transition-all duration-300 ease-out ${
            scrolled
              ? 'rounded-full bg-white/92 px-5 shadow-[0_8px_30px_rgb(21_22_25/0.09)] ring-1 ring-[#151619]/10 backdrop-blur-md'
              : 'bg-transparent'
          }`}
        >
          {/* Wordmark */}
          <Link
            href="/"
            className="text-[19px] font-semibold tracking-[-0.04em] text-[#151619] whitespace-nowrap"
          >
            hanumpay
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#how"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors hover:text-[#151619] whitespace-nowrap"
            >
              Cara kerja
            </a>
            <a
              href="#compare"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors hover:text-[#151619] whitespace-nowrap"
            >
              Bandingkan
            </a>
            <a
              href="#contracts"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors hover:text-[#151619] whitespace-nowrap"
            >
              Kontrak
            </a>
            <a
              href="#faq"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors hover:text-[#151619] whitespace-nowrap"
            >
              Tanya Jawab
            </a>

            {/* App quick dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setAppMenuOpen((o) => !o)}
                className="inline-flex items-center gap-1 text-[14px] font-medium text-[#151619]/80 transition-colors hover:text-[#151619] whitespace-nowrap cursor-pointer"
                aria-expanded={appMenuOpen}
              >
                <span>Aplikasi</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    appMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {appMenuOpen ? (
                <div className="absolute left-1/2 top-full mt-3 w-[290px] -translate-x-1/2 rounded-2xl border border-[#E2E7E4] bg-white p-2 shadow-[0_18px_45px_rgb(21_22_25/0.12)]">
                  {APP_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAppMenuOpen(false)}
                      className="block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-[#F5F7F5]"
                    >
                      <div className="text-[14px] font-medium text-[#151619]">{item.label}</div>
                      <div className="text-[12px] text-[#636966]">{item.desc}</div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/stage"
              className="hidden sm:inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#151619]/80 hover:text-[#151619] whitespace-nowrap"
            >
              Coba Simulasi
            </Link>

            <button
              type="button"
              onClick={handleWalletClick}
              disabled={wallet.isConnecting}
              className={`rounded-full px-3.5 sm:px-4 py-1.5 text-[12px] sm:text-[13px] font-semibold tracking-[-0.01em] whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                scrolled
                  ? 'bg-[#151619] text-white hover:bg-[#24282D]'
                  : 'bg-white text-[#151619] shadow-xs hover:bg-[#F5F7F5]'
              }`}
            >
              {wallet.isConnecting
                ? 'Menghubungkan...'
                : wallet.connected && wallet.address
                  ? shortenAddress(wallet.address)
                  : 'Hubungkan Dompet'}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#151619] md:hidden cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="mt-2 rounded-2xl border border-[#E2E7E4] bg-white p-4 shadow-lg md:hidden">
            <div className="grid gap-1 border-b border-[#E2E7E4] pb-3">
              <a
                href="#how"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5]"
              >
                Cara kerja
              </a>
              <a
                href="#compare"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5]"
              >
                Bandingkan
              </a>
              <a
                href="#contracts"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5]"
              >
                Kontrak
              </a>
              <a
                href="#faq"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5]"
              >
                Tanya Jawab
              </a>
            </div>
            <div className="mt-3 grid gap-1">
              {APP_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-[14px] font-medium text-[#15803D] hover:bg-[#E8FAF0]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
