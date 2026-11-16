'use client';

import React from 'react';
import { useHanumPay } from '@/lib/hanumpay-store';
import { CONTRACT_LIMITS } from '@/lib/hanumpay-engine';

export function LiveTicker() {
  const {
    shopStats,
    eligibility,
    poolDepositedUSD8,
    poolAvailableUSD8,
    identities,
  } = useHanumPay();

  const verifiedCount = identities.filter((i) => i.active).length;
  const savingsVsPinjol = eligibility.proposedPrincipalUSD8 * 0.3; // 35% pinjol vs 5% HanumPay

  const items = [
    {
      pair: 'WARUNG BU SRI · QR 30 HARI',
      value: `$${shopStats.totalSales30dUSD8.toFixed(2)} tUSD8`,
      edge: `${shopStats.uniqueCustomers30d} pembeli unik`,
    },
    {
      pair: 'LIMIT MODAL KONTRAK',
      value: `$${eligibility.proposedPrincipalUSD8.toFixed(2)} tUSD8`,
      edge: `batas ${CONTRACT_LIMITS.LOAN_RATIO_PCT}% · maks $${CONTRACT_LIMITS.MAX_LOAN_USD8}`,
    },
    {
      pair: 'BIAYA TETAP KONTRAK',
      value: `5.00% ($${eligibility.proposedFlatFeeUSD8.toFixed(2)})`,
      edge: `hemat +$${savingsVsPinjol.toFixed(2)} vs pinjol 35%`,
    },
    {
      pair: 'DANA POOL KOMUNITAS',
      value: `$${poolDepositedUSD8.toLocaleString('id-ID')} TVL`,
      edge: `$${poolAvailableUSD8.toLocaleString('id-ID')} siap cair`,
    },
    {
      pair: 'DIREKTORI ERC-8004',
      value: `${verifiedCount} akun resmi`,
      edge: 'Cek penerima aktif',
    },
  ];

  const renderSequence = (prefix: string) => (
    <div className="flex items-center">
      {items.map((item, idx) => (
        <div
          key={`${prefix}-${idx}`}
          className="flex items-center gap-3 border-r border-white/12 px-6 py-2 text-[13px] whitespace-nowrap"
        >
          <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-white/55">
            {item.pair}
          </span>
          <span className="font-mono font-medium text-white tabular-nums">{item.value}</span>
          <span className="font-mono text-[12px] text-[#9FE8C3] tabular-nums">{item.edge}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative flex h-14 w-full items-center overflow-hidden bg-[#151619] text-white">
      {/* Label status */}
      <div className="relative z-10 flex h-full shrink-0 items-center gap-2 border-r border-white/15 bg-[#151619] px-3.5 sm:px-7">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9FE8C3] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9FE8C3]" />
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.12em] uppercase text-white/85 whitespace-nowrap">
          Aktif · QDay 44005
        </span>
      </div>

      {/* Continuous marquee track */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="hairline-ticker">
          {renderSequence('a')}
          {renderSequence('b')}
        </div>
      </div>
    </div>
  );
}
