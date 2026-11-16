'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileCheck2,
  PauseCircle,
  PlayCircle,
  QrCode,
  Receipt,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import CreditScoreGauge from '@/components/CreditScoreGauge';
import { useHanumPay } from '@/lib/hanumpay-store';
import { shortenAddress } from '@/lib/qday';

export default function DashboardPage() {
  const {
    sales,
    shopStats,
    eligibility,
    proposedLoan,
    activeLoan,
    creditPassports,
    isERC8004Verified,
    activeShopName,
    activeShopAddress,
    shopAvailableTusd8,
    agentPaused,
    toggleAgentPaused,
    receipts,
    openReceipt,
  } = useHanumPay();

  const salesTodayUSD8 = sales.slice(0, 3).reduce((acc, s) => acc + s.amountUSD8, 0);

  const activeTotalDue = activeLoan ? activeLoan.principalUSD8 + activeLoan.flatFeeUSD8 : 0;
  const activeProgress =
    activeLoan && activeTotalDue > 0
      ? Math.min(100, Math.round((activeLoan.totalRepaidUSD8 / activeTotalDue) * 100))
      : 0;

  return (
    <AppShell
      title="Dasbor Pemilik Usaha"
      subtitle="Saldo kasir QR terverifikasi, Paspor Kredit ERC-8004, dan kontrol jeda agen AI."
    >
      {/* Kinsign-Inspired Obsidian-Emerald Balance Hero + 4 Quick Action Tiles */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        <div
          className="lg:col-span-6 rounded-2xl p-6 text-white flex flex-col justify-between space-y-6"
          style={{
            background:
              'radial-gradient(circle at 92% 15%, rgba(22, 163, 74, 0.34), transparent 52%), radial-gradient(circle at 12% 90%, rgba(37, 99, 235, 0.28), transparent 52%), #070D14',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-300">Saldo Toko &amp; Limit Modal Tersedia</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums tracking-tight mt-1">
                {shopAvailableTusd8.toFixed(2)} tUSD8
              </p>
              <p className="text-xs font-mono tabular-nums text-slate-400 mt-1">
                ≈ Rp {(shopAvailableTusd8 * 15800).toLocaleString('id-ID')}
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">
              {isERC8004Verified(activeShopName) ? 'Terverifikasi ERC-8004' : 'Belum Terdaftar'}
            </span>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span>{activeShopName}</span>
            <span className="font-mono text-slate-400">{shortenAddress(activeShopAddress)}</span>
          </div>
        </div>

        {/* 4 Tactile Quick Action Tiles (Mobile + Desktop Unified Ergonomics) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Aksi Kasir Cepat</h2>
            <Link
              href="/stage"
              className="text-xs font-medium text-[#2563EB] hover:underline whitespace-nowrap"
            >
              Buka Simulasi 2 Ponsel →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/app/penjualan"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 hover:border-[#16A34A] transition-colors min-h-[76px]"
            >
              <QrCode className="w-5 h-5 text-[#16A34A]" />
              <span className="text-xs font-semibold text-slate-800 mt-2 whitespace-nowrap">
                Catat QR
              </span>
            </Link>

            <Link
              href="/app/identitas"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 hover:border-[#2563EB] transition-colors min-h-[76px]"
            >
              <Truck className="w-5 h-5 text-[#2563EB]" />
              <span className="text-xs font-semibold text-slate-800 mt-2 whitespace-nowrap">
                Bayar Pemasok
              </span>
            </Link>

            <Link
              href="/app/pinjaman"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 hover:border-slate-900 transition-colors min-h-[76px]"
            >
              <FileCheck2 className="w-5 h-5 text-slate-800" />
              <span className="text-xs font-semibold text-slate-800 mt-2 whitespace-nowrap">
                Modal &amp; AI
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleAgentPaused}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors min-h-[76px] ${
                agentPaused
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-400 text-slate-800'
              }`}
            >
              {agentPaused ? (
                <PlayCircle className="w-5 h-5 text-[#D97706]" />
              ) : (
                <PauseCircle className="w-5 h-5 text-slate-700" />
              )}
              <span className="text-xs font-semibold mt-2 whitespace-nowrap">
                {agentPaused ? 'Lanjut AI' : 'Jeda AI'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Merchant AI Pause Banner */}
      {agentPaused && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <PauseCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Akses Penjaga AI Dijeda oleh Pemilik
              </p>
              <p className="text-xs text-amber-900 mt-0.5">
                AIGuarantor.shopPausedAgent sedang aktif. Tawaran pinjaman baru diblokir on-chain,
                sementara transaksi jualan QR dan bayar pemasok tetap berjalan normal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleAgentPaused}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#D97706] hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
          >
            Aktifkan Kembali Akses AI
          </button>
        </div>
      )}

      {/* Pending Proposal Banner */}
      {proposedLoan && !agentPaused && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>
                Tawaran #{proposedLoan.id} · {proposedLoan.agentName} (Terverifikasi ERC-8004)
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-900">
              Tawaran modal kerja siap diambil:{' '}
              <span className="font-mono tabular-nums">
                {proposedLoan.principalUSD8.toFixed(2)} tUSD8
              </span>{' '}
              dengan biaya tetap{' '}
              <span className="font-mono tabular-nums">
                {proposedLoan.flatFeeUSD8.toFixed(2)} tUSD8
              </span>
            </p>
          </div>
          <Link
            href="/app/pinjaman"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
          >
            <span>Tinjau &amp; Setujui (Bebas Gas)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4-Stat KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Penjualan Terbaru</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {salesTodayUSD8.toFixed(2)} tUSD8
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ~Rp {(salesTodayUSD8 * 15800).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Omzet 30 Hari</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {shopStats.totalSales30dUSD8.toFixed(2)} tUSD8
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {shopStats.uniqueCustomers30d} pembeli unik teracak
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Skor Kredit</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {eligibility.creditScore} / 100
          </p>
          <p className="text-xs text-[#16A34A] font-medium mt-1">
            {isERC8004Verified(activeShopName) ? 'Toko Terverifikasi ERC-8004' : 'Toko Belum Terdaftar'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Pinjaman Aktif</p>
          {activeLoan ? (
            <>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
                {(activeTotalDue - activeLoan.totalRepaidUSD8).toFixed(2)} tUSD8
              </p>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#16A34A]" style={{ width: `${activeProgress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                {activeProgress}% terbayar · 10% per laku
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
                0.00 tUSD8
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {proposedLoan ? '1 tawaran menunggu persetujuan' : 'Tidak ada tanggungan aktif'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Gauge + Credit Passport Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <CreditScoreGauge
            score={eligibility.creditScore}
            maxLoanUSD8={eligibility.maxLoanUSD8}
            eligible={eligibility.eligible}
            reason={eligibility.reason}
          />
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Paspor Kredit On-Chain
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bukti pelunasan permanen yang bisa dicek di jaringan QDay Aevum
              </p>
            </div>
            <Award className="w-5 h-5 text-[#D97706] shrink-0" />
          </div>

          {creditPassports.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600">
                Lunasi pinjaman pertama Anda untuk mencetak catatan Paspor Kredit permanen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {creditPassports.map((cp) => (
                <div
                  key={cp.loanId}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Pinjaman #{cp.loanId} · {cp.principalUSD8.toFixed(2)} tUSD8 Lunas
                    </p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      Lunas dalam {cp.daysToRepay} hari · 0 denda · Limit baru:{' '}
                      {cp.newCreditLimitUSD8.toFixed(2)} tUSD8
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#16A34A] shrink-0">
                    {cp.txHash.slice(0, 12)}...
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/app/identitas"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Bayar Pemasok Terverifikasi ERC-8004 →
            </Link>
            <Link
              href="/app/pinjaman"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Jalankan Uji Serangan AI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Sales Table with Verifiable QDay Receipt Action */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Riwayat Penjualan QR Terbaru</h2>
            <p className="text-xs text-slate-500">
              ID pembeli diacak lokal dengan keccak256 sebelum tanda tangan bebas gas EIP-712
            </p>
          </div>
          <Link
            href="/app/penjualan"
            className="text-xs font-semibold text-[#16A34A] hover:underline whitespace-nowrap"
          >
            Catat Penjualan Baru →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-3 px-6">Pembeli (Hash)</th>
                <th className="py-3 px-6 text-right">Nominal Kotor</th>
                <th className="py-3 px-6 text-right">Potong Cicilan (10%)</th>
                <th className="py-3 px-6 text-right">Bersih ke Toko</th>
                <th className="py-3 px-6 text-right">Struk Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sales.slice(0, 6).map((sale) => {
                const matchedReceipt = receipts.find((r) => r.txHash === sale.txHash);
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6">
                      <p className="font-medium text-slate-900">{sale.customerLabel}</p>
                      <p className="text-xs font-mono text-slate-500">
                        {sale.customerIdHash.slice(0, 14)}...
                      </p>
                    </td>
                    <td className="py-3 px-6 text-right font-mono tabular-nums font-medium text-slate-900">
                      {sale.amountUSD8.toFixed(2)} tUSD8
                    </td>
                    <td className="py-3 px-6 text-right font-mono tabular-nums text-amber-700">
                      {sale.repaidDeductedUSD8 > 0
                        ? `-${sale.repaidDeductedUSD8.toFixed(2)} tUSD8`
                        : '0.00 tUSD8'}
                    </td>
                    <td className="py-3 px-6 text-right font-mono tabular-nums font-semibold text-[#16A34A]">
                      {sale.netToShopUSD8.toFixed(2)} tUSD8
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          openReceipt(
                            matchedReceipt ?? {
                              id: `rcpt-${sale.id}`,
                              kind: 'sale',
                              title: `Penjualan QR · ${sale.customerLabel}`,
                              amountUSD8: sale.amountUSD8,
                              repaidDeductedUSD8: sale.repaidDeductedUSD8,
                              netAmountUSD8: sale.netToShopUSD8,
                              counterpartyName: activeShopName,
                              counterpartyWallet: sale.shop,
                              erc8004Verified: true,
                              proofHash: sale.customerIdHash,
                              txHash: sale.txHash,
                              relayMode: 'verified-demo-relay',
                              timestamp: sale.timestamp,
                            }
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Lihat Struk</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
