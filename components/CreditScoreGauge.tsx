'use client';

import React from 'react';

export default function CreditScoreGauge({
  score,
  maxLoanUSD8,
  eligible,
  reason,
}: {
  score: number;
  maxLoanUSD8: number;
  eligible: boolean;
  reason?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const strokeColor =
    clamped >= 70 ? '#16A34A' : clamped >= 40 ? '#D97706' : '#DC2626';
  const statusText =
    clamped >= 70 ? 'Sangat Layak' : clamped >= 40 ? 'Membangun Riwayat' : 'Data Belum Cukup';

  // Semicircle path math (radius 76, arc length = pi * 76 ≈ 238.76)
  const radius = 76;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Skor Kelayakan On-Chain</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dihitung otomatis dari catatan penjualan QR 30 hari terakhir
          </p>
        </div>
        <span
          className={`text-xs font-medium whitespace-nowrap ${
            eligible ? 'text-[#16A34A]' : 'text-[#D97706]'
          }`}
        >
          {eligible ? 'Layak' : 'Belum Memenuhi'}
        </span>
      </div>

      <div className="my-5 flex flex-col items-center">
        <svg
          viewBox="0 0 200 115"
          className="w-56 h-32 overflow-visible"
          role="img"
          aria-label={`Skor kelayakan ${clamped} dari 100`}
        >
          <path
            d="M 24 100 A 76 76 0 0 1 176 100"
            fill="none"
            stroke="#E5E7EB"
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
            className="fill-slate-900 text-3xl font-bold font-mono tabular-nums"
          >
            {clamped}
          </text>
          <text
            x="100"
            y="104"
            textAnchor="middle"
            className="fill-slate-500 text-[11px] font-medium"
          >
            {statusText}
          </text>
        </svg>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-600">Batas Limit Modal (10% omzet 30 hari)</span>
        <span className="font-mono tabular-nums font-semibold text-slate-900">
          {maxLoanUSD8.toFixed(2)} tUSD8
        </span>
      </div>
      {!eligible && reason && (
        <p className="text-xs text-amber-700 mt-2">{reason}</p>
      )}
    </div>
  );
}
