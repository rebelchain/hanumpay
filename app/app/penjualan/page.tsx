"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, QrCode, Receipt, Zap } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useHanumPay } from "@/lib/hanumpay-store";
import { VerifiableReceipt } from "@/lib/hanumpay-types";
import { hashCustomerId } from "@/lib/qday";

const QUICK_IDR_PRESETS = [
  { idr: "Rp 25k", tusd8: "1.58" },
  { idr: "Rp 50k", tusd8: "3.16" },
  { idr: "Rp 100k", tusd8: "6.33" },
  { idr: "Rp 250k", tusd8: "15.82" },
];

export default function RecordSalePage() {
  const {
    sales,
    activeLoan,
    recordSale,
    shopStats,
    wallet,
    lastRelayMode,
    receipts,
    openReceipt,
  } = useHanumPay();
  const [amountInput, setAmountInput] = useState("15.82");
  const [customerInput, setCustomerInput] = useState("0812-4499");
  const [useWalletSign, setUseWalletSign] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
    receipt?: VerifiableReceipt;
  } | null>(null);

  const previewHash = useMemo(() => {
    if (customerInput.trim().length < 4) return "Enter at least 4 characters";
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
      setFeedback({ type: "err", text: res.error ?? "Failed to record sale." });
      return;
    }

    setFeedback({
      type: "ok",
      text:
        res.repaidAmount > 0
          ? `Recorded gaslessly! ${res.repaidAmount.toFixed(2)} tUSD8 auto-deducted for Loan #${activeLoan?.id}.`
          : `${parsedAmount.toFixed(2)} tUSD8 sale verified by Relayer with zero gas cost.`,
      receipt: res.receipt,
    });
    setCustomerInput(
      `08${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}`,
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
      title="Record QR Sale"
      subtitle="Mobile-ready QR cashier. Gasless EIP-712 signatures via Relayer; active credit lines auto-deduct 10%."
    >
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.015em] text-[#151619]">
                Quick QR Cashier
              </h2>
              <p className="text-xs text-[#5C6260] mt-0.5">
                Transaction bounds: 0.10 tUSD8 to 500.00 tUSD8 per receipt
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E8FAF0] px-2.5 py-1 text-xs font-semibold text-[#15803D] whitespace-nowrap shrink-0">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero gas fee</span>
            </span>
          </div>

          {/* 1-Tap Mobile Cashier Presets */}
          <div>
            <p className="text-xs font-medium text-[#636966] mb-2">
              Quick Presets (IDR → tUSD8)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_IDR_PRESETS.map((preset) => (
                <button
                  key={preset.idr}
                  type="button"
                  onClick={() => setAmountInput(preset.tusd8)}
                  className={`py-2.5 px-3 rounded-xl border text-left transition-colors min-h-[48px] cursor-pointer ${
                    amountInput === preset.tusd8
                      ? "border-[#151619] bg-[#9FE8C3] text-[#151619]"
                      : "border-[#E2E7E4] bg-[#F5F7F5] hover:bg-[#E8FAF0]/60 text-[#151619]"
                  }`}
                >
                  <span className="block text-xs font-semibold">
                    {preset.idr}
                  </span>
                  <span className="block text-[11px] font-mono tabular-nums text-[#5C6260]">
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
                className="block text-xs font-medium text-[#151619] mb-1.5"
              >
                Sale Amount (tUSD8 · 6 decimals)
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
                  className="w-full px-3.5 py-3 pr-20 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl font-mono tabular-nums text-base sm:text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[48px]"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#636966]">
                  tUSD8
                </span>
              </div>
              {!Number.isNaN(parsedAmount) && parsedAmount > 0 && (
                <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
                  ≈ Rp{" "}
                  {Math.round(parsedAmount * 15800).toLocaleString("en-US")} IDR
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="customer-id"
                className="block text-xs font-medium text-[#151619] mb-1.5"
              >
                Customer Last 4+ Phone Digits (hashed locally)
              </label>
              <input
                id="customer-id"
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="e.g. 0812-7720"
                className="w-full px-3.5 py-3 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl text-base sm:text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[48px]"
                required
              />
              <p className="text-[11px] font-mono text-[#636966] mt-1.5 break-all">
                keccak256: {previewHash}
              </p>
            </div>

            {activeLoan && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#92400E] space-y-1">
                <p className="font-semibold">
                  Loan #{activeLoan.id} Auto-Repayment Active (10%)
                </p>
                <p className="font-mono tabular-nums">
                  Routed to pool: {autoRepayPreview.toFixed(2)} tUSD8 · Net to
                  shop:{" "}
                  {Math.max(0, (parsedAmount || 0) - autoRepayPreview).toFixed(
                    2,
                  )}{" "}
                  tUSD8
                </p>
              </div>
            )}

            {wallet.connected && (
              <label className="flex items-center gap-2.5 text-xs text-[#151619] cursor-pointer pt-1 min-h-[40px]">
                <input
                  type="checkbox"
                  checked={useWalletSign}
                  onChange={(e) => setUseWalletSign(e.target.checked)}
                  className="rounded border-[#E2E7E4] text-[#151619] focus:ring-[#151619]"
                />
                <span>
                  Sign EIP-712 payload via connected MetaMask wallet (still
                  gasless)
                </span>
              </label>
            )}

            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs border flex items-start justify-between gap-3 ${
                  feedback.type === "ok"
                    ? "bg-[#E8FAF0] border-[#9FE8C3] text-[#151619]"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      feedback.type === "ok"
                        ? "text-[#15803D]"
                        : "text-[#DC2626]"
                    }`}
                  />
                  <div>
                    <p>{feedback.text}</p>
                    {lastRelayMode && (
                      <p className="font-mono text-[11px] text-[#5C6260] mt-1">
                        Relayer mode: {lastRelayMode}
                      </p>
                    )}
                  </div>
                </div>
                {feedback.receipt && (
                  <button
                    type="button"
                    onClick={() => openReceipt(feedback.receipt!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E7E4] text-[#151619] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>View Receipt</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[48px] disabled:opacity-60 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#9FE8C3]" />
              <span>
                {submitting ? "Submitting EIP-712..." : "Record Sale (Gasless)"}
              </span>
            </button>
          </form>
        </div>

        {/* Summary & Trend Chart */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
              <p className="text-xs text-[#636966]">30-Day Revenue</p>
              <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1">
                {shopStats.totalSales30dUSD8.toFixed(2)} tUSD8
              </p>
              <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
                {sales.length} receipts anchored
              </p>
            </div>
            <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
              <p className="text-xs text-[#636966]">
                Unique Buyers (Sybil Gate)
              </p>
              <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1">
                {shopStats.uniqueCustomers30d} / min 5
              </p>
              <p className="text-xs text-[#15803D] mt-1 font-semibold">
                {shopStats.uniqueCustomers30d >= 5
                  ? "Buyer diversity requirement met"
                  : "Needs more unique buyers"}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#151619]">
                  Recent Verified Sales Volume
                </h3>
                <p className="text-xs text-[#5C6260]">
                  Latest receipts settled in tUSD8
                </p>
              </div>
              <span className="text-xs font-mono text-[#636966]">
                SalesLedger.sol
              </span>
            </div>

            <div className="h-44 flex items-end gap-3 pt-4 border-b border-[#E2E7E4] pb-2">
              {chartBars.map((bar) => {
                const heightPct = Math.max(
                  12,
                  Math.round((bar.amount / maxBar) * 100),
                );
                return (
                  <div
                    key={bar.label}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <span className="text-[10px] font-mono tabular-nums text-[#636966]">
                      ${bar.amount.toFixed(0)}
                    </span>
                    <div
                      className="w-full max-w-[36px] bg-[#9FE8C3] border border-[#15803D]/25 rounded-t-lg transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#636966]">
              <span>Earlier</span>
              <span>Latest</span>
            </div>
          </div>

          {/* Verifiable QDay Receipts History */}
          <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#151619]">
                Verifiable QDay Receipts
              </h3>
              <span className="text-xs text-[#636966]">
                Tap to copy or share proof
              </span>
            </div>
            <div className="divide-y divide-[#E2E7E4]">
              {receipts
                .filter((r) => r.kind === "sale")
                .slice(0, 3)
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => openReceipt(r)}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F5F7F5] px-2 rounded-xl transition-colors min-h-[44px] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Receipt className="w-4 h-4 text-[#15803D] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#151619] truncate">
                          {r.title}
                        </p>
                        <p className="text-[11px] font-mono text-[#636966] truncate">
                          {r.txHash.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#15803D] shrink-0">
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
