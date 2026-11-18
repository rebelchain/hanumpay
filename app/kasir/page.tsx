'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Delete,
  LayoutDashboard,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { HanumPayBrand } from '@/components/HanumPayBrand';
import ShopOnboardingChecklist from '@/components/ShopOnboardingChecklist';
import TechnicalDetailsToggle from '@/components/TechnicalDetailsToggle';
import VerifiableReceiptModal from '@/components/VerifiableReceiptModal';
import { useHanumPay } from '@/lib/hanumpay-store';
import type { QrisSettlementInfo, VerifiableReceipt } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL, shortenAddress } from '@/lib/qday-constants';

const IDR_PER_USD = 15800;

const IDR_PRESETS = [
  { label: 'Rp 15.000', value: '15000' },
  { label: 'Rp 25.000', value: '25000' },
  { label: 'Rp 50.000', value: '50000' },
  { label: 'Rp 100.000', value: '100000' },
];

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'BACK'] as const;

function buildQrMatrix(seedText: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function drawFinder(top: number, left: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[top + r][left + c] = isBorder || isCenter;
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = ((hash >>> 16) & 1) === 1;
    }
  }

  return grid;
}

function formatRupiah(num: number): string {
  return Math.round(num).toLocaleString('id-ID');
}

export default function MobileCashierPage() {
  const {
    wallet,
    connectQDayWallet,
    isRegisteredShop,
    activeShopName,
    activeShopAddress,
    shopAvailableTusd8,
    activeLoan,
    recordSale,
    openReceipt,
  } = useHanumPay();

  const [idrInput, setIdrInput] = useState('50000');
  const [customerInput, setCustomerInput] = useState('0812-4499');
  const [checkoutStep, setCheckoutStep] = useState<'input' | 'qr' | 'settled'>('input');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [settledOutcome, setSettledOutcome] = useState<{
    amountUSD8: number;
    amountIdr: number;
    repaidAmount: number;
    netAmount: number;
    receipt?: VerifiableReceipt;
    qrisSettlement?: QrisSettlementInfo;
  } | null>(null);

  const idrNumeric = Number(idrInput || '0');
  const usdNumeric = Math.round((idrNumeric / IDR_PER_USD) * 100) / 100;
  const isAmountValid = usdNumeric >= 0.1 && usdNumeric <= 500;

  const autoRepayUsd = activeLoan
    ? Math.round(usdNumeric * (activeLoan.repayPctBps / 10000) * 100) / 100
    : 0;
  const netToShopUsd = Math.max(0, Math.round((usdNumeric - autoRepayUsd) * 100) / 100);
  const autoRepayIdr = Math.round(autoRepayUsd * IDR_PER_USD);
  const netToShopIdr = Math.max(0, Math.round(idrNumeric - autoRepayIdr));
  const shopBalanceIdr = Math.round(shopAvailableTusd8 * IDR_PER_USD);

  const qrMatrix = useMemo(() => {
    const seed = `${activeShopAddress ?? 'hanumpay'}-${activeShopName}-${idrInput}-${customerInput}`;
    return buildQrMatrix(seed);
  }, [activeShopAddress, activeShopName, customerInput, idrInput]);

  function handleKeypadPress(key: (typeof KEYPAD_KEYS)[number]) {
    setErrorMsg(null);
    if (checkoutStep !== 'input') {
      setCheckoutStep('input');
    }

    if (key === 'BACK') {
      setIdrInput((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
      return;
    }

    setIdrInput((prev) => {
      const base = prev === '0' ? '' : prev;
      const next = base + key;
      if (Number(next) > 7_900_000) return prev;
      return next || '0';
    });
  }

  function handleSelectPreset(value: string) {
    setErrorMsg(null);
    setIdrInput(value);
    if (checkoutStep === 'settled') {
      setCheckoutStep('input');
    }
  }

  function handleNextCustomerSuffix() {
    setCustomerInput(
      `08${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}`
    );
  }

  function handleShowQr() {
    setErrorMsg(null);
    if (!isAmountValid) {
      setErrorMsg('Enter an amount between Rp 1.600 ($0.10) and Rp 7.900.000 ($500.00).');
      return;
    }
    setCheckoutStep('qr');
  }

  async function handleConfirmPaid() {
    if (!isAmountValid) return;
    setErrorMsg(null);
    setSubmitting(true);
    const res = await recordSale(usdNumeric, customerInput);
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error ?? 'Could not complete QRIS settlement. Please try again.');
      return;
    }

    const net = Math.max(0, Math.round((usdNumeric - res.repaidAmount) * 100) / 100);
    setSettledOutcome({
      amountUSD8: usdNumeric,
      amountIdr: idrNumeric,
      repaidAmount: res.repaidAmount,
      netAmount: net,
      receipt: res.receipt,
      qrisSettlement: res.qrisSettlement,
    });
    setCheckoutStep('settled');
    handleNextCustomerSuffix();
  }

  function handleNewSale() {
    setSettledOutcome(null);
    setErrorMsg(null);
    setIdrInput('50000');
    setCheckoutStep('input');
  }

  return (
    <div className="font-landing min-h-screen bg-[#F7F8F9] text-[#151619] antialiased selection:bg-[#9FE8C3] selection:text-[#151619]">
      {/* Minimal Sticky POS Top Bar (<= 15% height) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E7E4] px-4 sm:px-6 flex items-center">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <HanumPayBrand href="/" variant="light" size={28} />
            <span className="text-xs text-[#636966] hidden sm:inline">·</span>
            <span className="text-xs font-medium text-[#15803D] truncate">Mobile Cashier</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {wallet.connected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F8F9] border border-[#E2E7E4] text-xs font-mono tabular-nums text-[#151619]">
                Rp {formatRupiah(shopBalanceIdr)}
              </span>
            ) : (
              <button
                type="button"
                onClick={connectQDayWallet}
                disabled={wallet.isConnecting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-full transition-colors min-h-[38px] cursor-pointer whitespace-nowrap"
              >
                <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
                <span>{wallet.isConnecting ? 'Connecting...' : 'Connect'}</span>
              </button>
            )}

            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#151619] bg-white hover:bg-[#E8FAF0] border border-[#E2E7E4] rounded-full transition-colors min-h-[38px] whitespace-nowrap"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-5">
        {/* Step-by-Step Shop Onboarding Checklist (auto-collapses once ready) */}
        <ShopOnboardingChecklist compact />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Rupiah Amount & Tactile Keypad */}
          <section className="lg:col-span-7 bg-white border border-[#E2E7E4] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[#636966]">
                  {isRegisteredShop ? activeShopName : 'Shop Counter'}
                </p>
                <h1 className="text-lg sm:text-xl font-bold tracking-[-0.02em] text-[#151619]">
                  Enter sale amount in Rupiah
                </h1>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIdrInput('0');
                  setErrorMsg(null);
                  setCheckoutStep('input');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#5C6260] hover:text-[#151619] bg-[#F7F8F9] border border-[#E2E7E4] rounded-xl min-h-[40px] cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Big Rupiah Display */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F8F9] border border-[#E2E7E4] flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#636966]">Total Customer Pays</p>
                <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums tracking-[-0.03em] text-[#151619] mt-1">
                  Rp {formatRupiah(idrNumeric)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[#636966]">USD Value</p>
                <p className="text-base sm:text-lg font-semibold font-mono tabular-nums text-[#15803D] mt-0.5">
                  ${usdNumeric.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Quick Rupiah Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {IDR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value)}
                  className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold font-mono tabular-nums transition-colors min-h-[48px] cursor-pointer ${
                    idrInput === preset.value
                      ? 'bg-[#9FE8C3] border-[#151619] text-[#151619]'
                      : 'bg-[#F7F8F9] border-[#E2E7E4] hover:bg-[#E8FAF0]/70 text-[#151619]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Thumb-Friendly Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  aria-label={key === 'BACK' ? 'Backspace' : `Digit ${key}`}
                  className="min-h-[54px] rounded-xl bg-white hover:bg-[#F7F8F9] active:bg-[#E8FAF0] border border-[#E2E7E4] text-lg font-semibold font-mono tabular-nums text-[#151619] flex items-center justify-center transition-colors cursor-pointer select-none"
                >
                  {key === 'BACK' ? <Delete className="w-5 h-5 text-[#5C6260]" /> : key}
                </button>
              ))}
            </div>

            {/* Compact Customer Phone Suffix */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="flex-1">
                <label
                  htmlFor="kasir-customer-id"
                  className="block text-xs font-medium text-[#636966] mb-1"
                >
                  Customer phone (last 4+ digits, kept private)
                </label>
                <div className="flex gap-2">
                  <input
                    id="kasir-customer-id"
                    type="text"
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                    placeholder="e.g. 0812-4499"
                    className="flex-1 px-3.5 py-2.5 bg-[#F7F8F9] border border-[#E2E7E4] rounded-xl text-sm font-mono text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={handleNextCustomerSuffix}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#151619] bg-[#F7F8F9] hover:bg-[#E8FAF0] border border-[#E2E7E4] rounded-xl min-h-[44px] cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>New ID</span>
                  </button>
                </div>
              </div>
            </div>

            {!isAmountValid && idrNumeric > 0 && (
              <p className="text-xs text-[#B45309] font-medium">
                Amount must be between Rp 1.600 ($0.10) and Rp 7.900.000 ($500.00) per QR receipt.
              </p>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                {errorMsg}
              </div>
            )}

            {/* Mobile Sticky Primary Thumb CTA when on input step */}
            {checkoutStep === 'input' && (
              <button
                type="button"
                onClick={handleShowQr}
                disabled={!isAmountValid}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[52px] disabled:opacity-40 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#9FE8C3]" />
                <span>Show Customer QR · Rp {formatRupiah(idrNumeric)}</span>
              </button>
            )}
          </section>

          {/* Right Column: Dark Checkout Ticket / Live Customer QR / Settlement Confirmation */}
          <section className="lg:col-span-5 bg-[#151619] text-white rounded-2xl p-5 sm:p-6 space-y-5">
            <AnimatePresence mode="wait">
              {checkoutStep === 'input' && (
                <motion.div
                  key="ticket-preview"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-white/60">
                      Settlement Preview
                    </span>
                    <span className="text-xs font-semibold text-[#9FE8C3]">Zero Shop Fee</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10">
                      <p className="text-xs text-white/60">Customer Pays via QRIS (Rupiah)</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                        Rp {formatRupiah(idrNumeric)}
                      </p>
                      <p className="text-xs font-mono tabular-nums text-white/55 mt-0.5">
                        = ${usdNumeric.toFixed(2)} USD settled
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10">
                      <p className="text-xs text-white/60">
                        {activeLoan
                          ? `Auto-Repay (10% · Loan #${activeLoan.id})`
                          : 'Loan Auto-Repay'}
                      </p>
                      <p className="text-lg font-semibold font-mono tabular-nums text-white mt-1">
                        {autoRepayIdr > 0
                          ? `-Rp ${formatRupiah(autoRepayIdr)}`
                          : 'Rp 0 (No active loan)'}
                      </p>
                      {autoRepayUsd > 0 && (
                        <p className="text-xs font-mono tabular-nums text-white/55 mt-0.5">
                          -${autoRepayUsd.toFixed(2)} USD toward balance
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.08] border border-[#9FE8C3]/35">
                      <p className="text-xs font-medium text-[#9FE8C3]">Net Added to Your Wallet</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-[#9FE8C3] mt-1">
                        +Rp {formatRupiah(netToShopIdr)}
                      </p>
                      <p className="text-xs font-mono tabular-nums text-white/75 mt-0.5">
                        +${netToShopUsd.toFixed(2)} USD net gain
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-white/65 leading-relaxed">
                    Your customer scans with any Indonesian e-wallet or bank app using Rupiah. No
                    crypto app required for buyers.
                  </p>
                </motion.div>
              )}

              {checkoutStep === 'qr' && (
                <motion.div
                  key="ticket-qr"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#9FE8C3]">
                      Scan to Pay with QRIS
                    </span>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('input')}
                      className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Crisp White QRIS Card */}
                  <div className="bg-white text-[#151619] rounded-2xl p-5 flex flex-col items-center text-center space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#15803D]">
                        QRIS · Rp {formatRupiah(idrNumeric)}
                      </p>
                      <p className="text-sm font-bold text-[#151619] mt-0.5">{activeShopName}</p>
                    </div>

                    <div
                      className="p-3 bg-white border border-[#E2E7E4] rounded-xl"
                      aria-label={`QRIS payment code for Rp ${formatRupiah(idrNumeric)}`}
                    >
                      <div
                        className="grid gap-[2px]"
                        style={{ gridTemplateColumns: 'repeat(21, minmax(0, 1fr))' }}
                      >
                        {qrMatrix.flatMap((row, rIdx) =>
                          row.map((filled, cIdx) => (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`w-[8px] h-[8px] sm:w-[9px] sm:h-[9px] rounded-[1px] ${
                                filled ? 'bg-[#151619]' : 'bg-white'
                              }`}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#5C6260] font-mono tabular-nums">
                      = ${usdNumeric.toFixed(2)} USD · Zero customer fee
                    </p>
                  </div>

                  {/* Settlement Action */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleConfirmPaid}
                      disabled={submitting || !wallet.connected || !isRegisteredShop}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#151619] bg-[#9FE8C3] hover:bg-[#86E0B2] rounded-xl transition-colors min-h-[52px] disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                      <span>
                        {submitting
                          ? 'Settling QRIS & Recording...'
                          : 'Confirm QRIS Paid & Record'}
                      </span>
                    </button>

                    {(!wallet.connected || !isRegisteredShop) && (
                      <p className="text-xs text-amber-300 text-center">
                        Finish steps 1 &amp; 2 in the New Shop Setup checklist first.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {checkoutStep === 'settled' && settledOutcome && (
                <motion.div
                  key="ticket-settled"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-[#9FE8C3]">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-[0.06em]">
                      Payment Recorded
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.08] border border-[#9FE8C3]/35 space-y-1.5">
                    <p className="text-xs text-white/70">Customer Paid</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-white">
                      Rp {formatRupiah(settledOutcome.amountIdr)}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-[#9FE8C3]">
                      {settledOutcome.qrisSettlement?.simulated
                        ? settledOutcome.repaidAmount > 0
                          ? `QRIS settled +$${settledOutcome.amountUSD8.toFixed(
                              2
                            )} tUSD8 (-$${settledOutcome.repaidAmount.toFixed(
                              2
                            )} repaid -> +$${settledOutcome.netAmount.toFixed(2)} net kept)`
                          : `QRIS settled +$${settledOutcome.amountUSD8.toFixed(
                              2
                            )} tUSD8 (100% kept in your wallet)`
                        : 'Saved on QDay ledger (relayer test reserve empty; skipped test tUSD8 top-up)'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {settledOutcome.receipt && (
                      <button
                        type="button"
                        onClick={() => openReceipt(settledOutcome.receipt!)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-[#151619] bg-white hover:bg-[#E8FAF0] rounded-xl min-h-[48px] cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 text-[#15803D]" />
                        <span>View Receipt</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleNewSale}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-[#151619] bg-[#9FE8C3] hover:bg-[#86E0B2] rounded-xl min-h-[48px] cursor-pointer ${
                        settledOutcome.receipt ? '' : 'col-span-2'
                      }`}
                    >
                      <span>New Sale</span>
                    </button>
                  </div>

                  <TechnicalDetailsToggle
                    dark
                    label="Settlement & Transaction Details"
                    items={[
                      {
                        label: 'QRIS Gateway Simulation',
                        value: settledOutcome.qrisSettlement?.simulated
                          ? 'tUSD8 Settled'
                          : 'Fallback (Reserve Empty)',
                        href: settledOutcome.qrisSettlement?.settledTxHash
                          ? `${QDAY_EXPLORER_URL}/tx/${settledOutcome.qrisSettlement.settledTxHash}`
                          : undefined,
                      },
                      ...(settledOutcome.receipt?.txHash
                        ? [
                            {
                              label: 'SalesLedger Tx',
                              value: shortenAddress(settledOutcome.receipt.txHash),
                              href: `${QDAY_EXPLORER_URL}/tx/${settledOutcome.receipt.txHash}`,
                            },
                          ]
                        : []),
                    ]}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <VerifiableReceiptModal />
    </div>
  );
}
