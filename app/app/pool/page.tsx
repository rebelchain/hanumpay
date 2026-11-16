'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Landmark } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useHanumPay } from '@/lib/hanumpay-store';

export default function LenderPoolPage() {
  const {
    poolDepositedUSD8,
    poolLoanedUSD8,
    poolAvailableUSD8,
    poolUtilizationBps,
    poolFeesEarnedUSD8,
    userLenderShares,
    poolEvents,
    activeLoan,
    depositToPool,
    withdrawFromPool,
  } = useHanumPay();

  const [depositInput, setDepositInput] = useState('250.00');
  const [withdrawInput, setWithdrawInput] = useState('100.00');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const utilizationPct = (poolUtilizationBps / 100).toFixed(1);
  const estApy = (6.8 + (poolUtilizationBps / 10000) * 5.2).toFixed(2);
  const activeLoanCount = 12 + (activeLoan ? 1 : 0);

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(depositInput);
    const res = depositToPool(amt);
    if (!res.ok) {
      setMessage({ type: 'err', text: res.error ?? 'Setoran gagal.' });
    } else {
      setMessage({
        type: 'ok',
        text: `Berhasil menyetor ${amt.toFixed(2)} tUSD8 ke LoanPool. Porsi dana Anda telah diperbarui.`,
      });
    }
  }

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(withdrawInput);
    const res = withdrawFromPool(amt);
    if (!res.ok) {
      setMessage({ type: 'err', text: res.error ?? 'Penarikan gagal.' });
    } else {
      setMessage({
        type: 'ok',
        text: `Berhasil menarik ${amt.toFixed(2)} tUSD8 dari LoanPool ke dompet Anda.`,
      });
    }
  }

  const EVENT_LABELS: Record<string, string> = {
    Deposit: 'Setor Dana',
    Withdraw: 'Tarik Dana',
    LoanDisbursed: 'Modal Cair',
    RepaymentReceived: 'Cicilan Masuk',
    SupplierPaid: 'Bayar Pemasok',
  };

  return (
    <AppShell
      title="Pool Likuiditas (Penyedia Dana)"
      subtitle="Setor tUSD8 untuk mendanai modal kerja UMKM terverifikasi dan dapatkan imbal hasil dari biaya tetap 5%."
    >
      {/* PoolStatsRow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Dana Pool</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {poolDepositedUSD8.toFixed(2)} tUSD8
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            Tersedia: {poolAvailableUSD8.toFixed(2)} tUSD8
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Pemakaian Pool</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {utilizationPct}%
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            Batas aman kontrak: maks 80.0%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Estimasi Imbal Hasil (APY)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#16A34A] mt-1.5">
            {estApy}%
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            Biaya terkumpul: {poolFeesEarnedUSD8.toFixed(2)} tUSD8
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Pinjaman UMKM Aktif</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {activeLoanCount}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            Disalurkan: {poolLoanedUSD8.toFixed(2)} tUSD8
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Deposit & Withdraw Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Setor tUSD8</h2>
              <p className="text-xs text-slate-500">Cetak porsi penyedia dana di LoanPool.sol</p>
            </div>
            <ArrowDownLeft className="w-5 h-5 text-[#16A34A]" />
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label
                htmlFor="deposit-tusd8"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Nominal Setoran (tUSD8)
              </label>
              <input
                id="deposit-tusd8"
                type="number"
                step="0.01"
                min="1"
                value={depositInput}
                onChange={(e) => setDepositInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg transition-colors min-h-[44px]"
            >
              Setor ke LoanPool
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Tarik Dana</h2>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                Porsi Anda Saat Ini: {userLenderShares.toFixed(2)} tUSD8
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-700" />
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label
                htmlFor="withdraw-tusd8"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Nominal Penarikan (tUSD8)
              </label>
              <input
                id="withdraw-tusd8"
                type="number"
                step="0.01"
                min="1"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors min-h-[44px]"
            >
              Tarik Likuiditas
            </button>
          </form>
        </div>
      </div>

      {/* LenderHistoryTable */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Riwayat Aktivitas Pool</h2>
          </div>
          <span className="text-xs font-mono text-slate-500">Event LoanPool.sol</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-3 px-6">Aktivitas</th>
                <th className="py-3 px-6">Pihak Terkait</th>
                <th className="py-3 px-6 text-right">Nominal</th>
                <th className="py-3 px-6">Referensi Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {poolEvents.slice(0, 10).map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-6 font-medium text-slate-900">
                    {EVENT_LABELS[ev.type] ?? ev.type}
                  </td>
                  <td className="py-3 px-6 text-slate-700">{ev.actor}</td>
                  <td className="py-3 px-6 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {ev.amountUSD8.toFixed(2)} tUSD8
                  </td>
                  <td className="py-3 px-6 font-mono text-xs text-slate-500">
                    {ev.txHash.slice(0, 16)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
