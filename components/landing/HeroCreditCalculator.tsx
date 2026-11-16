'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ShieldCheck } from 'lucide-react';
import { CONTRACT_LIMITS } from '@/lib/hanumpay-engine';
import { useHanumPay } from '@/lib/hanumpay-store';

const PRESET_SALES = [500, 1250, 2500, 5000] as const;

export function HeroCreditCalculator() {
  const { shopStats, activeShopName } = useHanumPay();
  const liveSales = Math.round(shopStats.totalSales30dUSD8);
  const [salesInput, setSalesInput] = useState<string>(String(liveSales));

  const parsedSales = useMemo(() => {
    const num = Number(salesInput);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.min(num, 50000);
  }, [salesInput]);

  const rawCredit = (parsedSales * CONTRACT_LIMITS.LOAN_RATIO_PCT) / 100;
  const principal = Math.min(rawCredit, CONTRACT_LIMITS.MAX_LOAN_USD8);
  const isCapped = rawCredit >= CONTRACT_LIMITS.MAX_LOAN_USD8;
  const flatFee = principal * (CONTRACT_LIMITS.FLAT_FEE_BPS / 10000);
  const totalRepay = principal + flatFee;
  const pinjolCost = principal * 0.35;
  const savingsVsPinjol = Math.max(0, pinjolCost - flatFee);

  const cyclePreset = () => {
    const currentIdx = PRESET_SALES.findIndex((p) => p === Math.round(parsedSales));
    const next = PRESET_SALES[(currentIdx + 1) % PRESET_SALES.length];
    setSalesInput(String(next));
  };

  return (
    <div className="relative rounded-[20px] bg-white p-2 shadow-[0_30px_80px_rgb(15_90_54/0.16)] ring-1 ring-[#151619]/6">
      {/* Well 1: Omzet QR Toko 30 Hari */}
      <div className="rounded-[14px] bg-[#F5F7F5] px-5 pt-4 pb-5">
        <div className="flex items-center justify-between gap-2 text-[13px] text-[#5C6260]">
          <span>Omzet QR toko (30 hari)</span>
          <button
            type="button"
            onClick={() => setSalesInput(String(liveSales))}
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#15803D] hover:underline cursor-pointer whitespace-nowrap"
          >
            Aktif: ${liveSales.toLocaleString('id-ID')}
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <input
            type="number"
            min={0}
            max={50000}
            step={50}
            aria-label="Omzet penjualan QR toko 30 hari dalam tUSD8"
            value={salesInput}
            onChange={(e) => setSalesInput(e.target.value)}
            className="w-full min-w-0 bg-transparent text-[36px] sm:text-[42px] leading-none font-semibold tracking-[-0.04em] text-[#151619] tabular-nums focus:outline-none"
          />
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[14px] font-semibold text-[#151619] ring-1 ring-[#E2E7E4] whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-[#15803D]" aria-hidden="true" />
            tUSD8
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {PRESET_SALES.map((tier) => {
            const active = Math.round(parsedSales) === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSalesInput(String(tier))}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#151619] text-white'
                    : 'bg-white text-[#5C6260] ring-1 ring-[#E2E7E4] hover:text-[#151619]'
                }`}
              >
                ${tier.toLocaleString('id-ID')}
              </button>
            );
          })}
          <span className="ml-auto text-[12px] text-[#636966] truncate">
            {activeShopName.split(' - ')[0]}
          </span>
        </div>
      </div>

      {/* Tombol ganti contoh omzet */}
      <div className="relative z-10 -my-3.5 flex justify-center">
        <button
          type="button"
          onClick={cyclePreset}
          title="Ganti contoh omzet toko"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E7E4] bg-white text-[#151619] shadow-xs transition-transform duration-200 hover:scale-105 cursor-pointer"
          aria-label="Ganti pilihan contoh omzet 30 hari"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Well 2: Limit Modal Kerja dari Smart Contract */}
      <div className="rounded-[14px] bg-[#F5F7F5] px-5 pt-4 pb-5">
        <div className="flex items-center justify-between gap-2 text-[13px] text-[#5C6260]">
          <span>Limit modal kerja cair</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#636966] whitespace-nowrap">
            {isCapped ? 'Batas maks $500' : '10% dari omzet QR'}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="text-[36px] sm:text-[42px] leading-none font-semibold tracking-[-0.04em] text-[#151619] tabular-nums">
            {principal.toFixed(2)}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-[#15803D] ring-1 ring-[#E2E7E4] whitespace-nowrap">
            <ShieldCheck className="h-3.5 w-3.5" />
            tUSD8
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#636966] tabular-nums">
          <span>Total pengembalian: ${totalRepay.toFixed(2)} tUSD8</span>
          <span>Potong 10% tiap laku</span>
        </div>
      </div>

      {/* Ringkasan Biaya */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3.5 text-[13px]">
        <span className="text-[#5C6260]">Biaya tetap kontrak</span>
        <div className="tabular-nums text-right">
          <span className="font-mono font-semibold text-[#151619]">5.00% (${flatFee.toFixed(2)})</span>
          <span className="mx-1.5 text-[#9AA19E]">·</span>
          <span className="font-semibold text-[#15803D]">
            hemat ${savingsVsPinjol.toFixed(2)} vs pinjol
          </span>
        </div>
      </div>

      {/* Tombol Utama */}
      <Link
        href="/stage"
        className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#151619] px-5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#24282D] whitespace-nowrap"
      >
        <span>Uji di Simulasi Langsung</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
