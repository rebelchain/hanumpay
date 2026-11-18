'use client';

import React from 'react';

export default function CreditScoreGauge({
  score,
  maxLoanUSD8,
  eligible,
  reason,
  loanStatus,
}: {
  score: number;
  maxLoanUSD8: number;
  eligible: boolean;
  reason?: string;
  loanStatus?: 'offer_ready' | 'active_loan' | null;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const isPositiveState = eligible || loanStatus === 'offer_ready' || loanStatus === 'active_loan';

  const strokeColor =
    clamped >= 70 ? '#15803D' : clamped >= 40 ? '#B45309' : '#DC2626';
  const statusText =
    clamped >= 70 ? 'Ready for Credit' : clamped >= 40 ? 'Growing Sales' : 'Just Starting';

  const stateText =
    loanStatus === 'offer_ready'
      ? 'Offer Ready'
      : loanStatus === 'active_loan'
        ? 'Active Plan'
        : eligible
          ? 'Eligible'
          : 'Building History';

  // Semicircle path math (radius 76, arc length = pi * 76 ≈ 238.76)
  const radius = 76;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.015em] text-[#151619]">
            Credit Readiness
          </h2>
          <p className="text-xs text-[#5C6260] mt-0.5">
            Grows automatically from your last 30 days of QR sales
          </p>
        </div>
        <span
          className={`text-xs font-semibold whitespace-nowrap shrink-0 ${
            isPositiveState ? 'text-[#15803D]' : 'text-[#B45309]'
          }`}
        >
          {stateText}
        </span>
      </div>

      <div className="my-5 flex flex-col items-center">
        <svg
          viewBox="0 0 200 115"
          className="w-56 h-32 overflow-visible"
          role="img"
          aria-label={`Credit readiness score ${clamped} out of 100`}
        >
          <path
            d="M 24 100 A 76 76 0 0 1 176 100"
            fill="none"
            stroke="#E2E7E4"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 24 100 A 76 76 0 0 1 176 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300"
          />
          <text
            x="100"
            y="84"
            textAnchor="middle"
            className="fill-[#151619] text-3xl font-semibold font-mono tabular-nums"
          >
            {clamped}
          </text>
          <text
            x="100"
            y="104"
            textAnchor="middle"
            className="fill-[#636966] text-[11px] font-medium"
          >
            {statusText}
          </text>
        </svg>
      </div>

      <div>
        <div className="pt-4 border-t border-[#E2E7E4] flex items-center justify-between gap-4 text-sm">
          <span className="text-[#5C6260]">Available Limit (10% of monthly sales)</span>
          <span className="font-mono tabular-nums font-semibold text-[#151619] whitespace-nowrap">
            ${maxLoanUSD8.toFixed(2)}
          </span>
        </div>
        {!isPositiveState && reason && (
          <p className="text-xs text-[#B45309] mt-2">{reason}</p>
        )}
      </div>
    </div>
  );
}
