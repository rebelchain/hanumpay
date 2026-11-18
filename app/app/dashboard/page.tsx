'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  PauseCircle,
  PlayCircle,
  QrCode,
  Receipt,
  Store,
  Truck,
  Wallet,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import CreditScoreGauge from '@/components/CreditScoreGauge';
import TechnicalDetailsToggle from '@/components/TechnicalDetailsToggle';
import { useHanumPay } from '@/lib/hanumpay-store';
import { QDAY_EXPLORER_URL, shortenAddress } from '@/lib/qday-constants';

export default function DashboardPage() {
  const {
    wallet,
    connectQDayWallet,
    isRegisteredShop,
    registerShopOnChain,
    sales,
    shopStats,
    eligibility,
    onChainEligibility,
    proposedLoan,
    activeLoan,
    creditPassports,
    isERC8004Verified,
    activeShopName,
    activeShopAddress,
    shopAvailableTusd8,
    agentPaused,
    toggleAgentPaused,
    poolDepositedUSD8,
    poolAvailableUSD8,
    poolActiveLoanCount,
    receipts,
    openReceipt,
  } = useHanumPay();

  const [shopNameInput, setShopNameInput] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [togglingPause, setTogglingPause] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);

  const salesTodayUSD8 = sales.slice(0, 3).reduce((acc, s) => acc + s.amountUSD8, 0);
  const activeTotalDue = activeLoan ? activeLoan.principalUSD8 + activeLoan.flatFeeUSD8 : 0;
  const activeProgress =
    activeLoan && activeTotalDue > 0
      ? Math.min(100, Math.round((activeLoan.totalRepaidUSD8 / activeTotalDue) * 100))
      : 0;
  const balanceIdr = Math.round(shopAvailableTusd8 * 15800).toLocaleString('en-US');

  async function handleRegisterShop(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    setRegisterError(null);
    const res = await registerShopOnChain(shopNameInput, true);
    setRegistering(false);
    if (!res.ok) {
      setRegisterError(res.error ?? 'Could not save your shop name. Please try again.');
    } else {
      setShopNameInput('');
    }
  }

  async function handleTogglePause() {
    setTogglingPause(true);
    setPauseError(null);
    const res = await toggleAgentPaused();
    setTogglingPause(false);
    if (!res.ok && res.error) {
      setPauseError(res.error);
    }
  }

  return (
    <AppShell
      group="My Shop"
      title="Home"
      headlineLead="Track sales,"
      headlineAccent="unlock credit."
      subtitle="See your shop balance, record QR payments, and check your working capital limit at a glance."
    >
      {/* Disconnected State */}
      {!wallet.connected && (
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-semibold text-[#15803D]">Ready to start</p>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#151619]">
              Connect your account to view your live shop balance and credit limit
            </h2>
            <p className="text-sm text-[#5C6260] leading-relaxed">
              Your numbers update directly from your live shop account with no pre-filled sample
              data. Sign in with your browser wallet to register your shop or record real QR sales.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={connectQDayWallet}
                disabled={wallet.isConnecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] cursor-pointer whitespace-nowrap"
              >
                <Wallet className="w-4 h-4 text-[#9FE8C3]" />
                <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Account'}</span>
              </button>
              <Link
                href="/stage"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#151619] bg-[#F7F8F9] hover:bg-[#E8FAF0] border border-[#E2E7E4] rounded-xl transition-colors min-h-[44px] whitespace-nowrap"
              >
                <span>Try 2-Phone Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[300px] grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4]">
              <p className="text-xs text-[#636966]">Community Pool</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-[#151619] mt-1">
                ${poolDepositedUSD8.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4]">
              <p className="text-xs text-[#636966]">Available to Borrow</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-[#15803D] mt-1">
                ${poolAvailableUSD8.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4] col-span-2 flex items-center justify-between">
              <span className="text-xs text-[#636966]">Active Shop Loans</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-[#151619]">
                {poolActiveLoanCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Connected Wallet but Unregistered Shop */}
      {wallet.connected && !isRegisteredShop && (
        <div className="bg-white border border-[#9FE8C3] rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-[#151619]">
                Name your shop to start accepting QR payments
              </h2>
              <p className="text-xs text-[#5C6260] mt-1">
                Register your shop name once so customers can verify who they are paying and your
                sales count toward your credit limit.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterShop} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={shopNameInput}
              onChange={(e) => setShopNameInput(e.target.value)}
              placeholder="Enter your shop name (e.g. Toko Berkah)"
              maxLength={64}
              required
              className="flex-1 px-3.5 py-2.5 bg-[#F7F8F9] border border-[#E2E7E4] rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[44px]"
            />
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors whitespace-nowrap min-h-[44px] disabled:opacity-60 cursor-pointer"
            >
              {registering ? 'Saving Shop...' : 'Save Shop Name'}
            </button>
          </form>

          {registerError && <p className="text-xs text-[#DC2626] font-medium">{registerError}</p>}
        </div>
      )}

      {/* Dark Balance Summary Ticket + Quick Cashier Actions */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 rounded-2xl bg-[#151619] text-white p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-white/65">Available Shop Balance</p>
              <p className="text-3xl sm:text-4xl font-semibold font-mono tabular-nums tracking-[-0.03em] text-white mt-1.5">
                ${shopAvailableTusd8.toFixed(2)}
              </p>
              <p className="text-xs font-mono tabular-nums text-[#9FE8C3] mt-1">
                ≈ Rp {balanceIdr} IDR
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9FE8C3] whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {wallet.connected && isERC8004Verified(activeShopName)
                  ? 'Verified Shop'
                  : isRegisteredShop
                    ? 'Registered Shop'
                    : 'Not Registered'}
              </span>
            </span>
          </div>

          <div className="space-y-3">
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-medium text-white">{activeShopName}</span>
              <span className="text-white/65">
                {activeShopAddress ? shortenAddress(activeShopAddress) : 'Account not connected'}
              </span>
            </div>

            <TechnicalDetailsToggle
              dark
              label="Account & Network Details"
              items={[
                { label: 'Token Balance', value: `${shopAvailableTusd8.toFixed(2)} tUSD8` },
                {
                  label: 'Network Fee Balance',
                  value: wallet.connected ? `${wallet.tqdayBalance} tQDAY` : '0.0000 tQDAY',
                },
                ...(activeShopAddress
                  ? [
                      {
                        label: 'Wallet Address',
                        value: shortenAddress(activeShopAddress),
                        href: `${QDAY_EXPLORER_URL}/address/${activeShopAddress}`,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#151619]">Quick Actions</h2>
              <p className="text-xs text-[#5C6260] mt-0.5">
                Daily tools for taking payments and paying suppliers
              </p>
            </div>
            <Link
              href="/stage"
              className="text-xs font-semibold text-[#15803D] hover:underline whitespace-nowrap"
            >
              2-Phone Demo →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/app/penjualan"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4] hover:border-[#15803D]/40 hover:bg-[#E8FAF0]/70 transition-colors min-h-[88px]"
            >
              <QrCode className="w-5 h-5 text-[#15803D]" />
              <span className="text-xs font-semibold text-[#151619] mt-2 whitespace-nowrap">
                Accept Payment
              </span>
            </Link>

            <Link
              href="/app/identitas"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4] hover:border-[#15803D]/40 hover:bg-[#E8FAF0]/70 transition-colors min-h-[88px]"
            >
              <Truck className="w-5 h-5 text-[#151619]" />
              <span className="text-xs font-semibold text-[#151619] mt-2 whitespace-nowrap">
                Pay Supplier
              </span>
            </Link>

            <Link
              href="/app/pinjaman"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4] hover:border-[#15803D]/40 hover:bg-[#E8FAF0]/70 transition-colors min-h-[88px]"
            >
              <FileCheck2 className="w-5 h-5 text-[#151619]" />
              <span className="text-xs font-semibold text-[#151619] mt-2 whitespace-nowrap">
                Working Capital
              </span>
            </Link>

            <button
              type="button"
              onClick={handleTogglePause}
              disabled={!wallet.connected || togglingPause}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors min-h-[88px] cursor-pointer disabled:opacity-50 ${
                agentPaused
                  ? 'bg-amber-50 border-amber-200 text-[#B45309]'
                  : 'bg-[#F7F8F9] border-[#E2E7E4] hover:border-[#151619]/30 text-[#151619]'
              }`}
            >
              {agentPaused ? (
                <PlayCircle className="w-5 h-5 text-[#B45309]" />
              ) : (
                <PauseCircle className="w-5 h-5 text-[#5C6260]" />
              )}
              <span className="text-xs font-semibold mt-2 whitespace-nowrap">
                {togglingPause ? 'Saving...' : agentPaused ? 'Resume Offers' : 'Pause Offers'}
              </span>
            </button>
          </div>
          {pauseError && <p className="text-xs text-[#DC2626]">{pauseError}</p>}
        </div>
      </div>

      {/* Offer Paused Banner */}
      {agentPaused && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <PauseCircle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#151619]">
                Automatic Credit Offers Are Paused
              </p>
              <p className="text-xs text-[#92400E] mt-0.5">
                New working capital offers will not be sent to your shop while paused. QR sales
                still work normally.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={togglingPause}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#B45309] hover:bg-amber-800 rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer disabled:opacity-60"
          >
            {togglingPause ? 'Saving...' : 'Resume Credit Offers'}
          </button>
        </div>
      )}

      {/* Pending Credit Offer Banner */}
      {proposedLoan && !agentPaused && (
        <div className="bg-[#E8FAF0] border border-[#9FE8C3] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Working Capital Offer Ready · #{proposedLoan.id}</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#151619]">
              Borrow{' '}
              <span className="font-mono tabular-nums">
                ${proposedLoan.principalUSD8.toFixed(2)}
              </span>{' '}
              with a simple flat fee of{' '}
              <span className="font-mono tabular-nums">
                ${proposedLoan.flatFeeUSD8.toFixed(2)}
              </span>{' '}
              (repaid 10% per sale)
            </p>
          </div>
          <Link
            href="/app/pinjaman"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
          >
            <span>Review Offer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4-Metric KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Recent Sales</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            ${salesTodayUSD8.toFixed(2)}
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            {sales.length} recorded receipts
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">30-Day Revenue</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            ${shopStats.totalSales30dUSD8.toFixed(2)}
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            {shopStats.uniqueCustomers30d} unique customers
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Credit Readiness</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {eligibility.creditScore} / 100
          </p>
          <p className="text-xs text-[#15803D] font-semibold mt-1">
            {wallet.connected
              ? isRegisteredShop
                ? `${shopStats.salesHistoryDays} days active`
                : 'Shop name needed'
              : 'Connect account to check'}
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Remaining Credit Balance</p>
          {activeLoan ? (
            <>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
                ${(activeTotalDue - activeLoan.totalRepaidUSD8).toFixed(2)}
              </p>
              <div className="mt-2 h-1.5 w-full bg-[#F7F8F9] rounded-full overflow-hidden">
                <div className="h-full bg-[#15803D]" style={{ width: `${activeProgress}%` }} />
              </div>
              <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
                {activeProgress}% paid off · 10% per sale
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
                $0.00
              </p>
              <p className="text-xs text-[#5C6260] mt-1">
                {proposedLoan ? '1 offer ready to review' : 'No active loan'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Readiness Gauge + Completed Loan Trust Record */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5">
          <CreditScoreGauge
            score={eligibility.creditScore}
            maxLoanUSD8={eligibility.maxLoanUSD8}
            eligible={eligibility.eligible}
            reason={
              onChainEligibility?.checked && !onChainEligibility.eligible
                ? onChainEligibility.reason
                : eligibility.reason
            }
            loanStatus={proposedLoan ? 'offer_ready' : activeLoan ? 'active_loan' : null}
          />
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E2E7E4] rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.015em] text-[#151619]">
                Repayment Track Record
              </h2>
              <p className="text-xs text-[#5C6260] mt-0.5">
                Every settled loan raises your future borrowing limit automatically
              </p>
            </div>
            <Award className="w-5 h-5 text-[#15803D] shrink-0" />
          </div>

          {creditPassports.length === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-[#E2E7E4] rounded-xl bg-[#F7F8F9]">
              <p className="text-sm text-[#5C6260]">
                {wallet.connected
                  ? 'No completed loans yet. Once you borrow and finish repaying through QR sales, your trust badge appears here.'
                  : 'Connect your account to view your repayment history.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E7E4]">
              {creditPassports.map((cp) => (
                <div
                  key={cp.loanId}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#151619]">
                      Plan #{cp.loanId} · ${cp.principalUSD8.toFixed(2)} Paid in Full
                    </p>
                    <p className="text-xs text-[#5C6260] font-mono tabular-nums mt-0.5">
                      Settled in {cp.daysToRepay} days · Zero late penalties
                    </p>
                  </div>
                  <a
                    href={`${QDAY_EXPLORER_URL}/tx/${cp.txHash}`}
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

          <div className="pt-3 border-t border-[#E2E7E4] flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/app/identitas"
              className="text-xs font-semibold text-[#15803D] hover:underline"
            >
              Verify &amp; Pay a Supplier →
            </Link>
            <Link
              href="/app/pinjaman"
              className="text-xs font-medium text-[#5C6260] hover:text-[#151619]"
            >
              View Credit Details →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white border border-[#E2E7E4] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7E4] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.015em] text-[#151619]">
              Recent QR Sales
            </h2>
            <p className="text-xs text-[#5C6260]">
              All customer phone digits are kept private before saving
            </p>
          </div>
          <Link
            href="/app/penjualan"
            className="text-xs font-semibold text-[#15803D] hover:underline whitespace-nowrap"
          >
            Record New Sale →
          </Link>
        </div>

        {sales.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <p className="text-sm text-[#5C6260]">
              {wallet.connected
                ? 'No QR sales recorded yet. Record your first sale to start building credit.'
                : 'Connect your account to view your shop sales.'}
            </p>
            {wallet.connected && (
              <Link
                href="/app/penjualan"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-[#9FE8C3]" />
                <span>Record First Sale</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7E4] bg-[#F7F8F9] text-xs font-medium text-[#636966]">
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6 text-right">Sale Total</th>
                  <th className="py-3 px-6 text-right">Loan Repay (10%)</th>
                  <th className="py-3 px-6 text-right">You Keep</th>
                  <th className="py-3 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E4] text-sm">
                {sales.slice(0, 8).map((sale) => {
                  const matchedReceipt = receipts.find((r) => r.txHash === sale.txHash);
                  return (
                    <tr key={sale.id} className="hover:bg-[#F7F8F9]/75 transition-colors">
                      <td className="py-3 px-6">
                        <p className="font-medium text-[#151619]">{sale.customerLabel}</p>
                        <p className="text-xs text-[#636966]">
                          {new Date(sale.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums font-medium text-[#151619]">
                        ${sale.amountUSD8.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums text-[#B45309]">
                        {sale.repaidDeductedUSD8 > 0
                          ? `-$${sale.repaidDeductedUSD8.toFixed(2)}`
                          : '$0.00'}
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums font-semibold text-[#15803D]">
                        ${sale.netToShopUSD8.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openReceipt(
                              matchedReceipt ?? {
                                id: `rcpt-${sale.id}`,
                                kind: 'sale',
                                title: `QR Sale · ${sale.customerLabel}`,
                                amountUSD8: sale.amountUSD8,
                                repaidDeductedUSD8: sale.repaidDeductedUSD8,
                                netAmountUSD8: sale.netToShopUSD8,
                                counterpartyName: activeShopName,
                                counterpartyWallet: sale.shop,
                                erc8004Verified: isERC8004Verified(activeShopName),
                                proofHash: sale.customerIdHash,
                                txHash: sale.txHash,
                                relayMode: 'qday-onchain-relay',
                                timestamp: sale.timestamp,
                              }
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#151619] hover:bg-[#E8FAF0] border border-[#E2E7E4] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#15803D]" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
