'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, Wallet, X } from 'lucide-react';
import { useHanumPay } from '@/lib/hanumpay-store';
import { shortenAddress } from '@/lib/qday-constants';
import { HanumPayBrand } from '@/components/HanumPayBrand';
import { CONTAINER } from './section';

const MOBILE_APP_LINKS = [
  { href: '/app', label: 'Open App' },
  { href: '/stage', label: '2-Phone Simulator' },
];

export function LandingHeader() {
  const { wallet, connectQDayWallet, disconnectWallet } = useHanumPay();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleWalletClick = async () => {
    if (wallet.connected) {
      disconnectWallet();
    } else {
      await connectQDayWallet();
    }
    setMobileOpen(false);
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
          className={`flex h-14 items-center justify-between gap-4 transition-all duration-300 ease-out ${
            scrolled
              ? 'rounded-full bg-white/92 pl-3.5 pr-2.5 sm:px-5 shadow-[0_8px_30px_rgb(21_22_25/0.09)] ring-1 ring-[#151619]/10 backdrop-blur-md'
              : 'bg-transparent'
          }`}
        >
          {/* Landing brand lockup: always show logo + "hanumpay" on mobile & desktop */}
          <HanumPayBrand
            href="/"
            variant={scrolled ? 'light' : 'mint'}
            size={28}
            alwaysShowText
            label="hanumpay"
          />

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#how"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors duration-200 hover:text-[#151619] whitespace-nowrap"
            >
              How it works
            </a>
            <a
              href="#compare"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors duration-200 hover:text-[#151619] whitespace-nowrap"
            >
              Compare
            </a>
            <a
              href="#contracts"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors duration-200 hover:text-[#151619] whitespace-nowrap"
            >
              Contracts
            </a>
            <a
              href="#faq"
              className="text-[14px] font-medium text-[#151619]/80 transition-colors duration-200 hover:text-[#151619] whitespace-nowrap"
            >
              FAQ
            </a>
          </nav>

          {/* Right actions: single focal Open App pill CTA (white -> smooth black on hover) + mobile menu trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/app"
              className={`group inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-[#151619] px-3.5 sm:px-4.5 py-2 text-[12.5px] sm:text-[13.5px] font-semibold tracking-[-0.01em] whitespace-nowrap min-h-[38px] sm:min-h-[40px] border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#151619] hover:text-white hover:border-[#151619] hover:shadow-[0_8px_22px_rgb(21_22_25/0.18)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151619] focus-visible:ring-offset-2 ${
                scrolled
                  ? 'border-[#151619]/15 shadow-[0_2px_8px_rgb(21_22_25/0.06)]'
                  : 'border-[#151619]/10 shadow-[0_3px_12px_rgb(21_22_25/0.08)]'
              }`}
            >
              <span>Open App</span>
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#151619] transition-colors duration-200 md:hidden cursor-pointer ${
                scrolled
                  ? 'bg-[#F5F7F5] hover:bg-[#E8ECE9]'
                  : 'bg-white/85 hover:bg-white shadow-xs'
              }`}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="mt-2 rounded-2xl border border-[#E2E7E4] bg-white p-4 shadow-[0_18px_40px_rgb(21_22_25/0.12)] md:hidden">
            <div className="grid gap-1 border-b border-[#E2E7E4] pb-3">
              <a
                href="#how"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5] transition-colors"
              >
                How it works
              </a>
              <a
                href="#compare"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5] transition-colors"
              >
                Compare
              </a>
              <a
                href="#contracts"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5] transition-colors"
              >
                Contracts
              </a>
              <a
                href="#faq"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#151619] hover:bg-[#F5F7F5] transition-colors"
              >
                FAQ
              </a>
            </div>

            <div className="mt-3 grid gap-1 border-b border-[#E2E7E4] pb-3">
              {MOBILE_APP_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#15803D] hover:bg-[#E8FAF0] transition-colors"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleWalletClick}
                disabled={wallet.isConnecting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#151619]/15 bg-[#F7F8F9] px-4 py-2.5 text-[13px] font-semibold text-[#151619] transition-colors duration-200 hover:bg-[#151619] hover:text-white min-h-[44px] disabled:opacity-60 cursor-pointer"
              >
                <Wallet className="h-4 w-4 shrink-0" />
                <span>
                  {wallet.isConnecting
                    ? 'Connecting...'
                    : wallet.connected && wallet.address
                      ? `${shortenAddress(wallet.address)} · Disconnect`
                      : 'Connect Wallet'}
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
