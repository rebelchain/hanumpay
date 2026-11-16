'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, QrCode, Receipt, Zap } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useHanumPay } from '@/lib/hanumpay-store';
import { VerifiableReceipt } from '@/lib/hanumpay-types';
import { hashCustomerId } from '@/lib/qday';

const QUICK_IDR_PRESETS = [
  { idr: 'Rp 25rb', tusd8: '1.58' },
  { idr: 'Rp 50rb', tusd8: '3.16' },
  { idr: 'Rp 100rb', tusd8: '6.33' },
  { idr: 'Rp 250rb', tusd8: '15.82' },
];

export default function RecordSalePage() {
  const { sales, activeLoan, recordSale, shopStats, wallet, lastRelayMode, receipts, openReceipt } =
    useHanumPay();
  const [amountInput, setAmountInput] = useState('15.82');
  const [customerInput, setCustomerInput] = useState('0812-4499');
  const [useWalletSign, setUseWalletSign] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
    receipt?: VerifiableReceipt;
  } | null>(null);

  const previewHash = useMemo(() => {
    if (customerInput.trim().length < 4) return 'Masukkan minimal 4 karakter';
    return hashCustomerId(customerInput);
  }, [customerInput]);

  const parsedAmount = Number(amountInput);
  const autoRepayPreview =
    activeLoan && !Number.isNaN(parsedAmount) && parsedAmount > 0
      ? Math.round(parsedAmount * (activeLoan.repayPctBps / 10000) * 100) / 100
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await recordSale(parsedAmount, customerInput, useWalletSign);
    setSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error ?? 'Gagal mencatat penjualan.' });
      return;
    }

    setFeedback({
      type: 'ok',
      text:
        res.repaidAmount > 0
          ? `Tercatat bebas gas! ${res.repaidAmount.toFixed(2)} tUSD8 otomatis dipotong untuk cicilan Pinjaman #${activeLoan?.id}.`
          : `Penjualan ${parsedAmount.toFixed(2)} tUSD8 berhasil diverifikasi Relayer tanpa biaya gas.`,
      receipt: res.receipt,
    });
    setCustomerInput(
      `08${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}`
    );
  }

  const chartBars = useMemo(() => {
    return sales
      .slice(0, 8)
      .reverse()
      .map((s, idx) => ({
        label: `Tx ${idx + 1}`,
        amount: s.amountUSD8,
      }));
  }, [sales]);

  const maxBar = Math.max(100, ...chartBars.map((b) => b.amount));

  return (
    <AppShell
      title="Catat Penjualan QR"
      subtitle="Kasir QR praktis di HP. Tanda tangan EIP-712 bebas biaya gas lewat Relayer; pinjaman aktif otomatis potong 10%."
    >
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Kasir QR Cepat</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Batas transaksi: 0.10 tUSD8 sampai 500.00 tUSD8 per struk
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A] whitespace-nowrap">
              <Zap className="w-3.5 h-3.5" />
              <span>Tanpa biaya gas</span>
            </span>
          </div>

          {/* 1-Tap Mobile Cashier Presets */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Nominal Cepat (Rp → tUSD8)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_IDR_PRESETS.map((preset) => (
                <button
                  key={preset.idr}
                  type="button"
                  onClick={() => setAmountInput(preset.tusd8)}
                  className={`py-2.5 px-3 rounded-xl border text-left transition-colors min-h-[48px] ${
                    amountInput === preset.tusd8
                      ? 'border-[#16A34A] bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-[#F9FAFB] hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="block text-xs font-semibold">{preset.idr}</span>
                  <span className="block text-[11px] font-mono tabular-nums text-slate-500">
                    ${preset.tusd8}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="sale-amount"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Nominal Penjualan (tUSD8 · 6 desimal)
              </label>
              <div className="relative">
                <input
                  id="sale-amount"
                  type="number"
                  step="0.01"
                  min="0.10"
                  max="500"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full px-3.5 py-3 pr-20 border border-slate-300 rounded-xl sm:rounded-lg font-mono tabular-nums text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] min-h-[48px]"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  tUSD8
                </span>
              </div>
              {!Number.isNaN(parsedAmount) && parsedAmount > 0 && (
                <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  ≈ Rp {(parsedAmount * 15800).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="customer-id"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                4+ Digit Terakhir HP Pembeli (diacak lokal)
              </label>
              <input
                id="customer-id"
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="mis. 0812-7720"
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl sm:rounded-lg text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] min-h-[48px]"
                required
              />
              <p className="text-[11px] font-mono text-slate-500 mt-1.5 break-all">
                keccak256: {previewHash}
              </p>
            </div>

            {activeLoan && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">
                  Cicilan Otomatis Pinjaman #{activeLoan.id} Aktif (10%)
                </p>
                <p className="font-mono tabular-nums">
                  Potong ke pool: {autoRepayPreview.toFixed(2)} tUSD8 · Bersih ke warung:{' '}
                  {Math.max(0, (parsedAmount || 0) - autoRepayPreview).toFixed(2)} tUSD8
                </p>
              </div>
            )}

            {wallet.connected && (
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1 min-h-[40px]">
                <input
                  type="checkbox"
                  checked={useWalletSign}
                  onChange={(e) => setUseWalletSign(e.target.checked)}
                  className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                />
                <span>Gunakan MetaMask untuk tanda tangan EIP-712 asli (tetap bebas gas)</span>
              </label>
            )}

            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs border flex items-start justify-between gap-3 ${
                  feedback.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{feedback.text}</p>
                    {lastRelayMode && (
                      <p className="font-mono text-[11px] opacity-80 mt-1">
                        Mode relayer: {lastRelayMode}
                      </p>
                    )}
                  </div>
                </div>
                {feedback.receipt && (
                  <button
                    type="button"
                    onClick={() => openReceipt(feedback.receipt!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold whitespace-nowrap shrink-0"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Lihat Struk</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-xl sm:rounded-lg transition-colors min-h-[48px] disabled:opacity-60"
            >
              <QrCode className="w-4 h-4" />
              <span>{submitting ? 'Mengirim EIP-712...' : 'Catat Penjualan (Bebas Gas)'}</span>
            </button>
          </form>
        </div>

        {/* Summary & Trend Chart */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-5">
              <p className="text-xs text-slate-500">Total Omzet 30 Hari</p>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {shopStats.totalSales30dUSD8.toFixed(2)} tUSD8
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                {sales.length} struk tercatat permanen
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-5">
              <p className="text-xs text-slate-500">Pembeli Unik (Anti-Fiktif)</p>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {shopStats.uniqueCustomers30d} / min 5
              </p>
              <p className="text-xs text-[#16A34A] mt-1 font-medium">
                {shopStats.uniqueCustomers30d >= 5
                  ? 'Syarat keragaman pembeli terpenuhi'
                  : 'Butuh lebih banyak pembeli unik'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Volume Penjualan Terverifikasi Terbaru
                </h3>
                <p className="text-xs text-slate-500">Struk terbaru tercatat dalam tUSD8</p>
              </div>
              <span className="text-xs font-mono text-slate-500">SalesLedger.sol</span>
            </div>

            <div className="h-44 flex items-end gap-3 pt-4 border-b border-slate-200 pb-2">
              {chartBars.map((bar) => {
                const heightPct = Math.max(12, Math.round((bar.amount / maxBar) * 100));
                return (
                  <div
                    key={bar.label}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <span className="text-[10px] font-mono tabular-nums text-slate-500">
                      ${bar.amount.toFixed(0)}
                    </span>
                    <div
                      className="w-full max-w-[36px] bg-[#16A34A]/85 rounded-t-md transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Transaksi lama</span>
              <span>Terbaru</span>
            </div>
          </div>

          {/* Verifiable QDay Receipts History */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Struk QDay Terverifikasi</h3>
              <span className="text-xs text-slate-500">Ketuk untuk salin atau bagikan bukti</span>
            </div>
            <div className="divide-y divide-slate-100">
              {receipts
                .filter((r) => r.kind === 'sale')
                .slice(0, 3)
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => openReceipt(r)}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 px-2 rounded-lg transition-colors min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Receipt className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{r.title}</p>
                        <p className="text-[11px] font-mono text-slate-500 truncate">
                          {r.txHash.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#16A34A] shrink-0">
                      {r.amountUSD8.toFixed(2)} tUSD8
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
