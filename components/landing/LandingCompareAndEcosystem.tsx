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
  const pinjolTotal = loanAmount * 1.35;
  const kurTotal = loanAmount * 1.0075;

  const rows = [
    {
      name: 'HanumPay (LoanPool)',
      feeRate: '5.0% tetap',
      repay: `$${hanumTotal.toFixed(2)}`,
      collateral: 'Riwayat 10% omzet QR',
      dot: 'bg-[#15803D]',
      highlight: true,
    },
    {
      name: 'Aplikasi Pinjol Umum',
      feeRate: '35%+ / bln',
      repay: `$${pinjolTotal.toFixed(2)}+`,
      collateral: 'Denda harian berbunga',
      dot: 'bg-[#D97706]',
      highlight: false,
    },
    {
      name: 'KUR Bank Konvensional',
      feeRate: '~0.75% / bln',
      repay: `$${kurTotal.toFixed(2)}`,
      collateral: 'Butuh jaminan / sering ditolak',
      dot: 'bg-[#9CA3AF]',
      highlight: false,
    },
  ];

  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 sm:p-6 ring-1 ring-black/6 shadow-[0_16px_48px_rgb(21_22_25/0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E7E4] pb-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#636966]">
            Perbandingan Modal Kerja 30 Hari
          </p>
          <p className="mt-1 text-[14px] text-[#5C6260] tabular-nums">
            Total pengembalian untuk pinjaman <span className="font-semibold text-[#151619]">${loanAmount} tUSD8</span>
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
              <th className="py-2.5 pr-3 font-medium">Skema Pinjaman</th>
              <th className="py-2.5 px-3 font-medium">Biaya/Bunga</th>
              <th className="py-2.5 px-3 font-medium">Total Bayar</th>
              <th className="py-2.5 pl-3 font-medium">Syarat</th>
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
            eyebrow="UNTUK SIAPA"
            title="Modal adil bagi warung. Imbal hasil jelas bagi penyedia dana."
            note="Komunitas penyedia dana mengisi cadangan tUSD8. Pemilik usaha meminjam sesuai bukti penjualan QR nyata."
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-[#E2E7E4]">
          {/* Kiri: Pemilik UMKM */}
          <Reveal delay={0.06} className="min-w-0 lg:pr-14">
            <Eyebrow>PEMILIK UMKM</Eyebrow>
            <h3 className="mt-4 text-[24px] sm:text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-[#151619] max-w-[26ch]">
              Anda tetap fokus melayani pelanggan. Modal kerja terbuka saat stok menipis.
            </h3>

            <div className="mt-7 text-[40px] sm:text-[56px] leading-none font-medium tracking-[-0.05em] text-[#15803D] tabular-nums">
              5.0% tetap
            </div>
            <p className="mt-2 text-[14px] text-[#5C6260]">
              Batas biaya terkunci di LoanPool.sol — tidak pernah berbunga atau kena denda telat
            </p>

            <div className={`mt-8 border-t ${RULE}`}>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Rumus batas modal</span>
                <span className="font-medium text-[#151619] tabular-nums">10% omzet QR 30 hari (maks $500)</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Cicilan otomatis</span>
                <span className="font-medium text-[#151619] tabular-nums">10% tiap penjualan QR</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Keamanan bayar pemasok</span>
                <span className="font-medium text-[#151619]">Konfirmasi Penerima ERC-8004</span>
              </div>
            </div>

            <Link
              href="/app/penjualan"
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D]"
            >
              <span>Buka kasir QR warung</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>

          {/* Kanan: Penyedia Dana & Penjaga AI */}
          <Reveal delay={0.14} className="min-w-0 lg:pl-14">
            <Eyebrow>PENYEDIA DANA &amp; PENJAGA AI</Eyebrow>
            <h3 className="mt-4 text-[24px] sm:text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-[#151619] max-w-[26ch]">
              Anda setor tUSD8 ke pool komunitas. Smart contract menjaga setiap batas aturan.
            </h3>

            <div className="mt-7 text-[40px] sm:text-[56px] leading-none font-medium tracking-[-0.05em] text-[#151619] tabular-nums">
              ${poolDepositedUSD8.toLocaleString('id-ID')}
            </div>
            <p className="mt-2 text-[14px] text-[#5C6260] tabular-nums">
              Total dana pool aktif · ${poolAvailableUSD8.toLocaleString('id-ID')} tUSD8 siap disalurkan
            </p>

            <div className={`mt-8 border-t ${RULE}`}>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Pemakaian pool</span>
                <span className="font-medium text-[#151619] tabular-nums">{utilPct}% / batas maks 80.0%</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Batas kerja Penjaga AI</span>
                <span className="font-medium text-[#151619] tabular-nums">Maks 10 pinjaman / hari</span>
              </div>
              <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 border-b ${RULE} py-3.5 text-[14px] sm:text-[15px]`}>
                <span className="text-[#5C6260]">Kendali penuh pemilik</span>
                <span className="font-medium text-[#151619]">Tombol Jeda AI kapan saja</span>
              </div>
            </div>

            <Link
              href="/app/pool"
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#151619] underline decoration-[#151619]/35 underline-offset-4 hover:decoration-[#151619]"
            >
              <span>Lihat pool likuiditas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
