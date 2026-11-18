'use client';

import React from 'react';
import { useHanumPay } from '@/lib/hanumpay-store';
import { CONTRACT_LIMITS } from '@/lib/hanumpay-engine';

export function LiveTicker() {
  const {
    poolDepositedUSD8,
    poolAvailableUSD8,
    poolActiveLoanCount,
    identities,
    proposalsToday,
    lastSyncedBlock,
  } = useHanumPay();

  const verifiedCount = identities.filter((i) => i.active).length;

  const items = [
    {
      pair: 'QDAY LOANPOOL TVL',
      value: `${poolDepositedUSD8.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tUSD8`,
      edge: `${poolAvailableUSD8.toFixed(2)} available`,
    },
    {
      pair: 'MAX WORKING CAPITAL',
      value: `$${CONTRACT_LIMITS.MAX_LOAN_USD8.toFixed(0)} tUSD8`,
      edge: `${CONTRACT_LIMITS.LOAN_RATIO_PCT}% of 30d sales · ${poolActiveLoanCount} active`,
    },
    {
      pair: 'IMMUTABLE FLAT FEE',
      value: '5.00% flat',
      edge: '0% compounding · 10% repay cut',
    },
    {
      pair: 'AI DAILY PROPOSALS',
      value: `${proposalsToday} / ${CONTRACT_LIMITS.MAX_DAILY_PROPOSALS} today`,
      edge: 'Block 3310882 invariants',
    },
    {
      pair: 'ERC-8004 REGISTRY',
      value: `${verifiedCount} on-chain IDs`,
      edge: lastSyncedBlock ? `Synced #${lastSyncedBlock}` : 'QDay Chain 44005',
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
      <div className="relative z-10 flex h-full shrink-0 items-center gap-2 border-r border-white/15 bg-[#151619] px-3.5 sm:px-7">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9FE8C3] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9FE8C3]" />
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.12em] uppercase text-white/85 whitespace-nowrap">
          Live · QDay 44005
        </span>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="hairline-ticker">
          {renderSequence('a')}
          {renderSequence('b')}
        </div>
      </div>
    </div>
  );
}
