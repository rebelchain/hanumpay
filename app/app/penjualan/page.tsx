'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Receipt,
  Smartphone,
  Store,
  Wallet,
  Zap,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import TechnicalDetailsToggle from '@/components/TechnicalDetailsToggle';
import { useHanumPay } from '@/lib/hanumpay-store';
import { VerifiableReceipt } from '@/lib/hanumpay-types';
import { hashCustomerId, QDAY_EXPLORER_URL } from '@/lib/qday';

const QUICK_IDR_PRESETS = [
  { idr: 'Rp 25k', tusd8: '1.58' },
  { idr: 'Rp 50k', tusd8: '3.16' },
  { idr: 'Rp 100k', tusd8: '6.33' },
  { idr: 'Rp 250k', tusd8: '15.82' },
];

export default function RecordSalePage() {
  const {
    sales,
    activeLoan,
    recordSale,
    shopStats,
    wallet,
    connectQDayWallet,
    isRegisteredShop,
    registerShopOnChain,
    lastRelayMode,
    openReceipt,
    activeShopName,
  } = useHanumPay();

  const [amountInput, setAmountInput] = useState('15.82');
  const [customerInput, setCustomerInput] = useState('0812-4499');
  const [shopNameInput, setShopNameInput] = useState('');
  const [registering, setRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
    receipt?: VerifiableReceipt;
  } | null>(null);

  const previewHash = useMemo(() => {
    if (customerInput.trim().length < 4) return 'Enter at least 4 characters';
    return hashCustomerId(customerInput);
  }, [customerInput]);

  const parsedAmount = Number(amountInput);
  const validAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const autoRepayPreview = activeLoan
    ? Math.round(validAmount * (activeLoan.repayPctBps / 10000) * 100) / 100
    : 0;
  const netToShopPreview = Math.max(0, validAmount - autoRepayPreview);
  const approxIdr = Math.round(validAmount * 15800).toLocaleString('en-US');

  async function handleQuickRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    setFeedback(null);
    const res = await registerShopOnChain(shopNameInput, true);
    setRegistering(false);
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error ?? 'Could not save shop name.' });
    } else {
      setFeedback({ type: 'ok', text: 'Shop registered! You can now record QR sales.' });
      setShopNameInput('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await recordSale(parsedAmount, customerInput);
    setSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error ?? 'Could not record payment.' });
      return;
    }

    const settledTag = res.qrisSettlement?.simulated
      ? 'QRIS settled funds to your shop wallet'
      : 'Recorded on QDay ledger (relayer test reserve empty)';

    setFeedback({
      type: 'ok',
      text:
        res.repaidAmount > 0
          ? `${settledTag}! $${res.repaidAmount.toFixed(2)} went toward Loan #${
              activeLoan?.id
            }, and $${(parsedAmount - res.repaidAmount).toFixed(2)} net stays with you.`
          : `${settledTag} — $${parsedAmount.toFixed(2)} saved with zero shop fees.`,
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
        label: `Sale ${idx + 1}`,
        amount: s.amountUSD8,
      }));
  }, [sales]);

  const maxBar = Math.max(20, ...chartBars.map((b) => b.amount));

  return (
    <AppShell
      group="My Shop"
      title="Accept Payment"
      headlineLead="Record a sale,"
      headlineAccent="build credit."
      subtitle="Enter the customer payment below. Zero transaction fees for your shop, and every sale counts toward your credit limit."
    >
      <div className="bg-[#E8FAF0] border border-[#9FE8C3] rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-[#15803D] shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-[#151619]">
            Prefer a clean phone keypad for busy shop counters?
          </p>
        </div>
        <Link
          href="/kasir"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <span>Open Mobile Cashier</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#9FE8C3]" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Everyday Cashier Form */}
        <div className="lg:col-span-7 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.015em] text-[#151619]">
                New QR Payment
              </h2>
              <p className="text-xs text-[#5C6260] mt-0.5">
                Accept between $0.10 and $500.00 per receipt
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] whitespace-nowrap shrink-0">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero Fee</span>
            </span>
          </div>

          {!wallet.connected && (
            <div className="p-4 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[#5C6260]">
                Connect your account first to approve and save real customer sales.
              </p>
              <button
                type="button"
                onClick={connectQDayWallet}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#151619] rounded-xl shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
                <span>Connect Account</span>
              </button>
            </div>
          )}

          {wallet.connected && !isRegisteredShop && (
            <form
              onSubmit={handleQuickRegister}
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309]">
                <Store className="w-4 h-4 shrink-0" />
                <span>Add your shop name once before recording sales</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shopNameInput}
                  onChange={(e) => setShopNameInput(e.target.value)}
                  placeholder="Shop name (e.g. Toko Berkah)"
                  required
                  className="flex-1 px-3 py-2 text-xs bg-white border border-amber-200 rounded-lg text-[#151619]"
                />
                <button
                  type="submit"
                  disabled={registering}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#151619] rounded-lg whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  {registering ? 'Saving...' : 'Save Shop'}
                </button>
              </div>
            </form>
          )}

          <div>
            <p className="text-xs font-medium text-[#636966] mb-2">Quick Rupiah Presets</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_IDR_PRESETS.map((preset) => (
                <button
                  key={preset.idr}
                  type="button"
                  onClick={() => setAmountInput(preset.tusd8)}
                  className={`py-2.5 px-3 rounded-xl border text-left transition-colors min-h-[48px] cursor-pointer ${
                    amountInput === preset.tusd8
                      ? 'border-[#151619] bg-[#9FE8C3] text-[#151619]'
                      : 'border-[#E2E7E4] bg-[#F7F8F9] hover:bg-[#E8FAF0]/60 text-[#151619]'
                  }`}
                >
                  <span className="block text-xs font-semibold">{preset.idr}</span>
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
                Payment Amount (USD)
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
                  className="w-full px-3.5 py-3 pr-20 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl font-mono tabular-nums text-base sm:text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[48px]"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#636966]">
                  USD
                </span>
              </div>
              {validAmount > 0 && (
                <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
                  ≈ Rp {approxIdr} IDR
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="customer-id"
                className="block text-xs font-medium text-[#151619] mb-1.5"
              >
                Customer Phone (last 4+ digits)
              </label>
              <input
                id="customer-id"
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="e.g. 0812-7720"
                className="w-full px-3.5 py-3 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl text-base sm:text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[48px]"
                required
              />
              <p className="text-xs text-[#636966] mt-1.5">
                Kept private on your device—only used to count repeat vs. unique customers.
              </p>
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs border flex items-start justify-between gap-3 ${
                  feedback.type === 'ok'
                    ? 'bg-[#E8FAF0] border-[#9FE8C3] text-[#151619]'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      feedback.type === 'ok' ? 'text-[#15803D]' : 'text-[#DC2626]'
                    }`}
                  />
                  <p>{feedback.text}</p>
                </div>
                {feedback.receipt && (
                  <button
                    type="button"
                    onClick={() => openReceipt(feedback.receipt!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E7E4] text-[#151619] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>Receipt</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !wallet.connected || !isRegisteredShop}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[48px] disabled:opacity-50 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#9FE8C3]" />
              <span>{submitting ? 'Confirming Sale...' : 'Confirm & Record Sale'}</span>
            </button>
          </form>

          <TechnicalDetailsToggle
            label="Technical Details (Signature & Privacy Hash)"
            items={[
              { label: 'Approval Method', value: 'Gasless EIP-712 Signature' },
              { label: 'Customer Privacy Hash', value: previewHash },
              { label: 'Settlement Token', value: 'tUSD8 (QDay Aevum)' },
              ...(lastRelayMode ? [{ label: 'Relay Mode', value: lastRelayMode }] : []),
            ]}
          />
        </div>

        {/* Right: Mosaec-Style Dark Ticket + 3 Simple Steps */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#151619] text-white rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-white/60">
                Payment Ticket
              </span>
              <span className="inline-flex items-center rounded-full bg-[#9FE8C3] px-2.5 py-1 text-[11px] font-semibold text-[#151619]">
                Zero shop fee
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10">
                <p className="text-[11px] uppercase tracking-[0.06em] text-white/55">
                  Customer Pays
                </p>
                <p className="text-2xl font-semibold font-mono tabular-nums text-white mt-1">
                  ${validAmount.toFixed(2)}
                </p>
                <p className="text-xs font-mono tabular-nums text-white/60 mt-0.5">
                  ≈ Rp {approxIdr} IDR
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10">
                <p className="text-[11px] uppercase tracking-[0.06em] text-white/55">
                  {activeLoan ? `Loan Auto-Repay (10% · #${activeLoan.id})` : 'Loan Auto-Repay'}
                </p>
                <p className="text-xl font-semibold font-mono tabular-nums text-white mt-1">
                  {autoRepayPreview > 0 ? `-$${autoRepayPreview.toFixed(2)}` : '$0.00'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.08] border border-[#9FE8C3]/35">
                <p className="text-[11px] uppercase tracking-[0.06em] text-[#9FE8C3]">
                  Net to Your Shop
                </p>
                <p className="text-2xl font-semibold font-mono tabular-nums text-[#9FE8C3] mt-1">
                  ${netToShopPreview.toFixed(2)}
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-white/75 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9FE8C3] shrink-0" />
                <span>Every sale counts immediately toward your credit limit.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9FE8C3] shrink-0" />
                <span>Your shop pays $0.00 in network processing fees.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#151619]">Three quick steps</h3>
              <span className="text-xs text-[#636966]">Takes ~5 seconds</span>
            </div>
            <div className="divide-y divide-[#E2E7E4] text-xs">
              <div className="py-2.5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F7F8F9] border border-[#E2E7E4] font-mono font-semibold text-[#151619] flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="text-[#5C6260]">Choose a preset or enter the payment amount</span>
              </div>
              <div className="py-2.5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F7F8F9] border border-[#E2E7E4] font-mono font-semibold text-[#151619] flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-[#5C6260]">Approve the free signature prompt in your wallet</span>
              </div>
              <div className="pt-2.5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F7F8F9] border border-[#E2E7E4] font-mono font-semibold text-[#151619] flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="text-[#5C6260]">Receipt is saved and your credit limit updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Volume & Saved Receipts Row */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E2E7E4]">
            <div>
              <p className="text-xs text-[#636966]">30-Day Revenue</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[#151619] mt-1">
                ${shopStats.totalSales30dUSD8.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#636966]">Unique Customers</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[#151619] mt-1">
                {shopStats.uniqueCustomers30d} / 5 needed
              </p>
            </div>
          </div>

          {chartBars.length === 0 ? (
            <div className="h-40 flex items-center justify-center rounded-xl border border-dashed border-[#E2E7E4] bg-[#F7F8F9] text-xs text-[#5C6260]">
              {wallet.connected
                ? 'Your recent sale amounts will appear here once recorded.'
                : 'Connect your account to view your recent sales chart.'}
            </div>
          ) : (
            <>
              <div className="h-40 flex items-end gap-3 pt-4 border-b border-[#E2E7E4] pb-2">
                {chartBars.map((bar) => {
                  const heightPct = Math.max(12, Math.round((bar.amount / maxBar) * 100));
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
              <div className="flex justify-between text-[11px] text-[#636966]">
                <span>Earlier</span>
                <span>Latest</span>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#151619]">Saved Receipts</h3>
            <span className="text-xs text-[#636966]">{sales.length} total</span>
          </div>
          {sales.length === 0 ? (
            <p className="text-xs text-[#5C6260] py-8 text-center border border-dashed border-[#E2E7E4] rounded-xl bg-[#F7F8F9]">
              No sales recorded yet for this account.
            </p>
          ) : (
            <div className="divide-y divide-[#E2E7E4]">
              {sales.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="w-full py-3 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openReceipt({
                        id: `rcpt-${s.id}`,
                        kind: 'sale',
                        title: `QR Sale · ${s.customerLabel}`,
                        amountUSD8: s.amountUSD8,
                        repaidDeductedUSD8: s.repaidDeductedUSD8,
                        netAmountUSD8: s.netToShopUSD8,
                        counterpartyName: activeShopName,
                        counterpartyWallet: s.shop,
                        erc8004Verified: true,
                        proofHash: s.customerIdHash,
                        txHash: s.txHash,
                        relayMode: 'qday-onchain-relay',
                        timestamp: s.timestamp,
                      })
                    }
                    className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer hover:opacity-80"
                  >
                    <Receipt className="w-4 h-4 text-[#15803D] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#151619] truncate">
                        {s.customerLabel}
                      </p>
                      <p className="text-[11px] font-mono tabular-nums text-[#636966]">
                        ${s.amountUSD8.toFixed(2)} USD
                      </p>
                    </div>
                  </button>
                  <a
                    href={`${QDAY_EXPLORER_URL}/tx/${s.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D] hover:underline shrink-0"
                  >
                    <span>Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
