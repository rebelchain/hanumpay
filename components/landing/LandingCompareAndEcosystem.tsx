'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useHanumPay } from '@/lib/hanumpay-store';
import { CONTRACT_LIMITS } from '@/lib/hanumpay-engine';
import { CONTAINER, Eyebrow, RULE, SECTION_Y, SectionHead } from './section';
import { Reveal } from './Reveal';

const COMPARE_AMOUNTS = [125, 250, 500] as const;

export function CompareCardInteractive() {
  const [loanAmount, setLoanAmount] = useState<number>(125);

  const hanumFee = loanAmount * (CONTRACT_LIMITS.FLAT_FEE_BPS / 10000);
  const hanumTotal = loanAmount + hanumFee;
  const predatoryTotal = loanAmount * 1.35;
  const bankTotal = loanAmount * 1.0075;

  const rows = [
    {
      name: 'HanumPay (LoanPool)',
      feeRate: '5.0% flat',
      repay: `$${hanumTotal.toFixed(2)}`,
      collateral: '10% of 30d QR sales',
      dot: 'bg-[#15803D]',
      highlight: true,
    },
    {
      name: 'Predatory Loan Apps',
      feeRate: '35%+ / mo',
      repay: `$${predatoryTotal.toFixed(2)}+`,
      collateral: 'Compounding daily fines',
      dot: 'bg-[#D97706]',
      highlight: false,
    },
    {
      name: 'Traditional Micro-Bank',
      feeRate: '~0.75% / mo',
      repay: `$${bankTotal.toFixed(2)}`,
      collateral: 'Physical collateral required',
      dot: 'bg-[#9CA3AF]',
      highlight: false,
    },
  ];

  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 sm:p-6 ring-1 ring-black/6 shadow-[0_16px_48px_rgb(21_22_25/0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E7E4] pb-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#636966]">
            30-Day Working Capital Comparison
          </p>
          <p className="mt-1 text-[14px] text-[#5C6260] tabular-nums">
            Total repayment on a <span className="font-semibold text-[#151619]">${loanAmount} tUSD8</span> facility
          </p>
        </div>

        <div className="inline-flex rounded-full border border-[#E2E7E4] bg-[#F5F7F5] p-1">
          {COMPARE_AMOUNTS.map((amt) => {
            const active = loanAmount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => setLoanAmount(amt)}
                className={`rounded-full px-3 py-1 font-mono text-[12px] tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                  active ? 'bg-[#151619] text-white' : 'text-[#5C6260] hover:text-[#151619]'
                }`}
              >
                ${amt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile stacked comparison list (< 640px): zero horizontal clipping */}
      <div className="mt-4 space-y-3 sm:hidden">
        {rows.map((row) => (
          <div
            key={row.name}
            className={`rounded-xl border p-3.5 ${
              row.highlight
                ? 'border-[#9FE8C3] bg-[#E8FAF0]/75'
                : 'border-[#E2E7E4] bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#151619]">
                <span className={`h-2 w-2 shrink-0 rounded-full ${row.dot}`} aria-hidden="true" />
                <span>{row.name}</span>
              </span>
              <span className="font-mono text-[14px] font-semibold text-[#151619] tabular-nums">
                {row.repay}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[12px]">
              <span
                className={`font-mono ${
                  row.highlight ? 'font-semibold text-[#0F6B3A]' : 'text-[#5C6260]'
                }`}
              >
                {row.feeRate}
              </span>
              <span className="text-[#5C6260] text-right">{row.collateral}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet & Desktop structured table (>= 640px) */}
      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E2E7E4] font-mono text-[11px] uppercase tracking-[0.1em] text-[#636966]">
              <th className="py-2.5 pr-3 font-medium">Lending Model</th>
              <th className="py-2.5 px-3 font-medium">Fee / APR</th>
              <th className="py-2.5 px-3 font-medium">Total Repay</th>
              <th className="py-2.5 pl-3 font-medium">Requirement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E7E4] text-[14px]">
            {rows.map((row) => (
              <tr
                key={row.name}
                className={row.highlight ? 'bg-[#E8FAF0]/75' : 'bg-white'}
              >
                <td className="py-3.5 pr-3 font-medium text-[#151619] whitespace-nowrap">
                  <span className="inline-flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} aria-hidden="true" />
                    <span>{row.name}</span>
                  </span>
                </td>
                <td
                  className={`py-3.5 px-3 font-mono text-[13px] tabular-nums whitespace-nowrap ${
                    row.highlight ? 'font-semibold text-[#0F6B3A]' : 'text-[#5C6260]'
                  }`}
                >
                  {row.feeRate}
                </td>
                <td className="py-3.5 px-3 font-mono font-semibold text-[#151619] tabular-nums whitespace-nowrap">
                  {row.repay}
                </td>
                <td className="py-3.5 pl-3 text-[13px] text-[#5C6260]">
                  {row.collateral}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LiveEcosystemSplit() {
  const { poolDepositedUSD8, poolAvailableUSD8, poolUtilizationBps } = useHanumPay();
  const utilPct = (poolUtilizationBps / 100).toFixed(1);

  return (
    <section className="bg-white">
      <div className={`${CONTAINER} ${SECTION_Y}`}>
        <Reveal>
          <SectionHead
            eyebrow="WHO IT IS FOR"
            title="Fair credit for micro-merchants. Transparent yield for LPs."
            note="Community liquidity providers fund the tUSD8 reserve. Shop owners borrow strictly against proven on-chain QR revenue."
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-[#E2E7E4]">
          {/* Left: MSME Merchants */}
          <Reveal delay={0.06} className="min-w-0 lg:pr-14">
            <Eyebrow>MSME MERCHANTS</Eyebrow>
            <h3 className="mt-4 text-[24px] sm:text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-[#151619] max-w-[26ch]">
              Stay focused on serving customers. Working capital unlocks when inventory runs low.
            </h3>

            <div className="mt-7 text-[40px] sm:text-[56px] leading-none font-medium tracking-[-0.05em] text-[#15803D] tabular-nums">
              5.0% flat
            </div>
            <p className="mt-2 text-[14px] text-[#5C6260]">
              Fee cap locked in LoanPool.sol — never compounds and carries zero late penalties
            </p>

            <div className={`mt-8 border-t ${RULE}`}>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Credit limit formula</span>
                <span className="font-medium text-[#151619] tabular-nums">10% of 30d QR sales (max $500)</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Auto-repayment</span>
                <span className="font-medium text-[#151619] tabular-nums">10% per verified QR sale</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Supplier safety</span>
                <span className="font-medium text-[#151619]">ERC-8004 Confirmation of Payee</span>
              </div>
            </div>

            <Link
              href="/app/penjualan"
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D]"
            >
              <span>Open merchant QR POS</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>

          {/* Right: Liquidity Providers & AI Guarantor */}
          <Reveal delay={0.14} className="min-w-0 lg:pl-14">
            <Eyebrow>LENDERS &amp; AI GUARANTOR</Eyebrow>
            <h3 className="mt-4 text-[24px] sm:text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-[#151619] max-w-[26ch]">
              Deposit tUSD8 into the community pool. Smart contracts enforce every risk invariant.
            </h3>

            <div className="mt-7 text-[40px] sm:text-[56px] leading-none font-medium tracking-[-0.05em] text-[#151619] tabular-nums">
              ${poolDepositedUSD8.toLocaleString('en-US')}
            </div>
            <p className="mt-2 text-[14px] text-[#5C6260] tabular-nums">
              Active pool TVL · ${poolAvailableUSD8.toLocaleString('en-US')} tUSD8 ready to disburse
            </p>

            <div className={`mt-8 border-t ${RULE}`}>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Pool utilization</span>
                <span className="font-medium text-[#151619] tabular-nums">{utilPct}% / 80.0% max cap</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">AI Guarantor rate limit</span>
                <span className="font-medium text-[#151619] tabular-nums">Max 10 proposals / day</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Merchant sovereignty</span>
                <span className="font-medium text-[#151619]">Instant AI Pause kill switch</span>
              </div>
            </div>

            <Link
              href="/app/pool"
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#151619] underline decoration-[#151619]/35 underline-offset-4 hover:decoration-[#151619]"
            >
              <span>Inspect liquidity pool</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
