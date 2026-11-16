'use client';

import React, { useState } from 'react';
import { CONTRACT_LIMITS } from '@/lib/hanumpay-engine';

interface SalesTier {
  id: string;
  label: string;
  sales30d: number;
  basePos: number;
  hanumPos: number;
  pinjolPos: number;
}

const SALES_TIERS: SalesTier[] = [
  { id: '500', label: '$500 QR', sales30d: 500, basePos: 12, hanumPos: 34, pinjolPos: 68 },
  { id: '1250', label: '$1,250 QR', sales30d: 1250, basePos: 16, hanumPos: 42, pinjolPos: 76 },
  { id: '2500', label: '$2,500 QR', sales30d: 2500, basePos: 20, hanumPos: 48, pinjolPos: 82 },
  { id: '5000', label: '$5,000+ QR', sales30d: 5000, basePos: 24, hanumPos: 54, pinjolPos: 88 },
];

export function CreditRuler() {
  const [selectedId, setSelectedId] = useState<string>('1250');
  const tier = SALES_TIERS.find((t) => t.id === selectedId) ?? SALES_TIERS[1];

  const principal = Math.min(
    (tier.sales30d * CONTRACT_LIMITS.LOAN_RATIO_PCT) / 100,
    CONTRACT_LIMITS.MAX_LOAN_USD8
  );
  const hanumFee = principal * (CONTRACT_LIMITS.FLAT_FEE_BPS / 10000);
  const hanumTotal = principal + hanumFee;
  const pinjolFee = principal * 0.35;
  const pinjolTotal = principal + pinjolFee;
  const saved = pinjolTotal - hanumTotal;

  const bandWidth = tier.hanumPos - tier.basePos;

  return (
    <div className="mt-14">
      {/* Header strip + segmented sales tier selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#636966]">
            Tingkatan Omzet 30 Hari · Perbandingan Limit &amp; Total Bayar
          </p>
          <p className="mt-1 text-[15px] text-[#5C6260] tabular-nums">
            Modal kerja terbuka:{' '}
            <span className="font-semibold text-[#151619]">${principal.toFixed(2)} tUSD8</span>
            {tier.sales30d >= 5000 ? ' (batas maksimal $500 oleh AIGuarantor.sol)' : ' (10% dari omzet QR terverifikasi)'}
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center rounded-full border border-[#E2E7E4] bg-white p-1">
          {SALES_TIERS.map((item) => {
            const active = item.id === tier.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#151619] text-white'
                    : 'text-[#5C6260] hover:text-[#151619]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop horizontal animated ruler */}
      <div className="mt-10 hidden sm:block">
        <div className="relative h-44 rounded-2xl border border-[#E2E7E4] bg-[#F5F7F5]/55 px-6">
          {/* Top callout: HanumPay */}
          <div
            className="absolute top-4 -translate-x-1/2 transition-all duration-500 ease-out text-center whitespace-nowrap"
            style={{ left: `${tier.hanumPos}%` }}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#15803D]">
              HanumPay · Biaya 5% tetap
            </div>
            <div className="text-[18px] font-semibold text-[#151619] tabular-nums">
              ${hanumTotal.toFixed(2)}
            </div>
          </div>

          {/* Track */}
          <div className="absolute inset-x-6 top-[78px] h-10">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#D3DBD7]" />

            <div
              className="absolute top-0 h-10 rounded-md border border-[#9FE8C3] bg-[#E8FAF0] transition-all duration-500 ease-out flex items-center justify-center px-2 overflow-hidden"
              style={{
                left: `${tier.basePos}%`,
                width: `${bandWidth}%`,
              }}
            >
              <span className="font-mono text-[11px] font-medium text-[#0F6B3A] whitespace-nowrap">
                Biaya 5% tetap
              </span>
            </div>

            <div
              className="absolute top-0 h-12 w-px bg-[#15803D]/55 transition-all duration-500 ease-out"
              style={{ left: `${tier.basePos}%` }}
            />

            <div
              className="absolute -top-2 h-14 w-[2px] -translate-x-1/2 bg-[#151619] transition-all duration-500 ease-out"
              style={{ left: `${tier.hanumPos}%` }}
            >
              <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#151619]" />
            </div>

            <div
              className="absolute top-0 h-12 w-[2px] -translate-x-1/2 bg-[#D97706] transition-all duration-500 ease-out"
              style={{ left: `${tier.pinjolPos}%` }}
            >
              <span className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D97706]" />
            </div>
          </div>

          {/* Bottom left callout */}
          <div
            className="absolute bottom-3 -translate-x-1/2 transition-all duration-500 ease-out text-center whitespace-nowrap"
            style={{ left: `${tier.basePos}%` }}
          >
            <div className="text-[14px] font-medium text-[#151619] tabular-nums">
              ${principal.toFixed(2)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#636966]">
              Pokok 0%
            </div>
          </div>

          {/* Bottom right callout */}
          <div
            className="absolute bottom-3 -translate-x-1/2 transition-all duration-500 ease-out text-center whitespace-nowrap"
            style={{ left: `${tier.pinjolPos}%` }}
          >
            <div className="text-[14px] font-medium text-[#B45309] tabular-nums">
              ${pinjolTotal.toFixed(2)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#636966]">
              Pinjol (+35%/bln)
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan 3 kartu */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E7E4] bg-white px-4 py-3.5">
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#636966]">
            Modal Pokok Cair
          </div>
          <div className="mt-1 text-[20px] font-medium text-[#151619] tabular-nums">
            ${principal.toFixed(2)} tUSD8
          </div>
        </div>
        <div className="rounded-xl border border-[#9FE8C3] bg-[#E8FAF0] px-4 py-3.5">
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#0F6B3A]">
            Total Bayar HanumPay (5% Tetap)
          </div>
          <div className="mt-1 text-[20px] font-semibold text-[#151619] tabular-nums">
            ${hanumTotal.toFixed(2)} · 0% denda
          </div>
        </div>
        <div className="rounded-xl border border-[#E2E7E4] bg-white px-4 py-3.5">
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#636966]">
            Pinjol Umumnya (35%+/bln)
          </div>
          <div className="mt-1 text-[20px] font-medium text-[#5C6260] tabular-nums">
            ${pinjolTotal.toFixed(2)}{' '}
            <span className="text-[14px] font-semibold text-[#15803D]">
              (hemat ${saved.toFixed(2)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
