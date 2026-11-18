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
  ShieldAlert,
  Store,
  Truck,
  Wallet,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import CreditScoreGauge from '@/components/CreditScoreGauge';
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

  async function handleRegisterShop(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    setRegisterError(null);
    const res = await registerShopOnChain(shopNameInput, true);
    setRegistering(false);
    if (!res.ok) {
      setRegisterError(res.error ?? 'Failed to register shop on-chain.');
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
      title="Merchant Overview"
      subtitle="Live QDay Aevum on-chain merchant balance, SalesLedger stats, Credit Passport, and AI Guarantor access."
    >
      {/* Disconnected State */}
      {!wallet.connected && (
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8FAF0] px-3 py-1 text-xs font-semibold text-[#15803D]">
              QDay Aevum Testnet · Chain 44005
            </span>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#151619]">
              Connect your QDay wallet to view live merchant &amp; loan telemetry
            </h2>
            <p className="text-sm text-[#5C6260] leading-relaxed">
              This workspace reads 100% live smart-contract data directly from QDay Block 3310882—no
              pre-filled mock balances. Connect MetaMask or Rabby to register your shop or record
              real QR sales.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={connectQDayWallet}
                disabled={wallet.isConnecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-[#9FE8C3]" />
                <span>{wallet.isConnecting ? 'Connecting...' : 'Connect QDay Wallet'}</span>
              </button>
              <Link
                href="/stage"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#151619] bg-[#F5F7F5] hover:bg-[#E8FAF0] border border-[#E2E7E4] rounded-xl transition-colors min-h-[44px]"
              >
                <span>Explore 2-Phone Sandbox</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[320px] grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4]">
              <p className="text-xs text-[#636966]">Live Pool TVL</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-[#151619] mt-1">
                {poolDepositedUSD8.toFixed(2)} tUSD8
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4]">
              <p className="text-xs text-[#636966]">Idle Liquidity</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-[#15803D] mt-1">
                {poolAvailableUSD8.toFixed(2)} tUSD8
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4] col-span-2 flex items-center justify-between">
              <span className="text-xs text-[#636966]">Active Protocol Loans</span>
              <span className="font-mono text-sm font-semibold text-[#151619]">
                {poolActiveLoanCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Connected Wallet but Unregistered in SalesLedger */}
      {wallet.connected && !isRegisteredShop && (
        <div className="bg-[#E8FAF0] border border-[#9FE8C3] rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-[#151619]">
                Register this wallet as an on-chain merchant shop
              </h2>
              <p className="text-xs text-[#5C6260] mt-1">
                Calls <code className="font-mono text-[#151619]">SalesLedger.registerShop</code>{' '}
                and registers your shop name in{' '}
                <code className="font-mono text-[#151619]">ERC8004Registry</code> so you can accept
                gasless EIP-712 QR sales.
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
              className="flex-1 px-3.5 py-2.5 bg-white border border-[#E2E7E4] rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[44px]"
            />
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors whitespace-nowrap min-h-[44px] disabled:opacity-60 cursor-pointer"
            >
              {registering ? 'Confirming on QDay...' : 'Register Shop On-Chain'}
            </button>
          </form>

          {registerError && <p className="text-xs text-red-700 font-medium">{registerError}</p>}
        </div>
      )}

      {/* Hero Balance + Quick Actions */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 rounded-2xl bg-[#9FE8C3] text-[#151619] border border-[#151619]/10 p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#1C1C1C]/75">
                Live Wallet tUSD8 Balance
              </p>
              <p className="text-3xl sm:text-4xl font-semibold font-mono tabular-nums tracking-[-0.03em] text-[#151619] mt-1.5">
                {shopAvailableTusd8.toFixed(2)} tUSD8
              </p>
              <p className="text-xs font-mono tabular-nums text-[#1C1C1C]/70 mt-1">
                Gas balance: {wallet.connected ? `${wallet.tqdayBalance} tQDAY` : '0.0000 tQDAY'}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#15803D] whitespace-nowrap shrink-0">
              {wallet.connected && isERC8004Verified(activeShopName)
                ? 'ERC-8004 Verified'
                : isRegisteredShop
                  ? 'SalesLedger Shop'
                  : 'Not Registered'}
            </span>
          </div>

          <div className="pt-4 border-t border-[#151619]/15 flex flex-wrap items-center justify-between gap-3 text-xs text-[#151619]">
            <span className="font-medium">{activeShopName}</span>
            <span className="font-mono text-[#1C1C1C]/75">
              {activeShopAddress ? shortenAddress(activeShopAddress) : 'Wallet disconnected'}
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#151619]">Quick Cashier Actions</h2>
            <Link
              href="/stage"
              className="text-xs font-semibold text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D] whitespace-nowrap"
            >
              Open 2-Phone Simulator →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/app/penjualan"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4] hover:border-[#9FE8C3] hover:bg-[#E8FAF0]/70 transition-colors min-h-[82px]"
            >
              <QrCode className="w-5 h-5 text-[#15803D]" />
              <span className="text-xs font-semibold text-[#151619] mt-2 whitespace-nowrap">
                Record QR
              </span>
            </Link>

            <Link
              href="/app/identitas"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4] hover:border-[#9FE8C3] hover:bg-[#E8FAF0]/70 transition-colors min-h-[82px]"
            >
              <Truck className="w-5 h-5 text-[#151619]" />
              <span className="text-xs font-semibold text-[#151619] mt-2 whitespace-nowrap">
                Pay Supplier
              </span>
            </Link>

            <Link
              href="/app/pinjaman"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4] hover:border-[#9FE8C3] hover:bg-[#E8FAF0]/70 transition-colors min-h-[82px]"
            >
              <FileCheck2 className="w-5 h-5 text-[#151619]" />
              <span className="text-xs font-semibold text-[#151619] mt-2 whitespace-nowrap">
                Credit &amp; AI
              </span>
            </Link>

            <button
              type="button"
              onClick={handleTogglePause}
              disabled={!wallet.connected || togglingPause}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors min-h-[82px] cursor-pointer disabled:opacity-50 ${
                agentPaused
                  ? 'bg-amber-50 border-amber-200 text-[#B45309]'
                  : 'bg-[#F5F7F5] border-[#E2E7E4] hover:border-[#151619]/30 text-[#151619]'
              }`}
            >
              {agentPaused ? (
                <PlayCircle className="w-5 h-5 text-[#B45309]" />
              ) : (
                <PauseCircle className="w-5 h-5 text-[#5C6260]" />
              )}
              <span className="text-xs font-semibold mt-2 whitespace-nowrap">
                {togglingPause ? 'Signing...' : agentPaused ? 'Resume AI' : 'Pause AI'}
              </span>
            </button>
          </div>
          {pauseError && <p className="text-xs text-red-700">{pauseError}</p>}
        </div>
      </div>

      {/* Merchant AI Pause Banner */}
      {agentPaused && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <PauseCircle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#151619]">
                AI Guarantor Access Paused On-Chain
              </p>
              <p className="text-xs text-[#92400E] mt-0.5">
                AIGuarantor.shopPausedAgent is active for your address. New credit proposals are
                blocked on-chain while QR sales continue normally.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={togglingPause}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#B45309] hover:bg-amber-800 rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer disabled:opacity-60"
          >
            {togglingPause ? 'Signing Tx...' : 'Resume AI Access'}
          </button>
        </div>
      )}

      {/* Pending Proposal Banner */}
      {proposedLoan && !agentPaused && (
        <div className="bg-[#E8FAF0] border border-[#9FE8C3] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                On-Chain Proposal #{proposedLoan.id} · {proposedLoan.agentName}
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#151619]">
              Working capital offer ready:{' '}
              <span className="font-mono tabular-nums">
                {proposedLoan.principalUSD8.toFixed(2)} tUSD8
              </span>{' '}
              with a flat fee of{' '}
              <span className="font-mono tabular-nums">
                {proposedLoan.flatFeeUSD8.toFixed(2)} tUSD8
              </span>
            </p>
          </div>
          <Link
            href="/app/pinjaman"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
          >
            <span>Review &amp; Accept (Gasless)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4-Stat KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Recent Sales</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {salesTodayUSD8.toFixed(2)} tUSD8
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            {sales.length} live receipts
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">30-Day Revenue</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {shopStats.totalSales30dUSD8.toFixed(2)} tUSD8
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            {shopStats.uniqueCustomers30d} hashed unique buyers
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Credit Score</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {eligibility.creditScore} / 100
          </p>
          <p className="text-xs text-[#15803D] font-semibold mt-1">
            {wallet.connected
              ? isRegisteredShop
                ? `${shopStats.salesHistoryDays}d on-chain history`
                : 'Shop not registered'
              : 'Connect wallet to score'}
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Active Credit Balance</p>
          {activeLoan ? (
            <>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
                {(activeTotalDue - activeLoan.totalRepaidUSD8).toFixed(2)} tUSD8
              </p>
              <div className="mt-2 h-1.5 w-full bg-[#F5F7F5] rounded-full overflow-hidden">
                <div className="h-full bg-[#15803D]" style={{ width: `${activeProgress}%` }} />
              </div>
              <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
                {activeProgress}% repaid · 10% per sale
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
                0.00 tUSD8
              </p>
              <p className="text-xs text-[#5C6260] mt-1">
                {proposedLoan ? '1 offer awaiting approval' : 'No active balance'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Gauge + Credit Passport Grid */}
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
                On-Chain Credit Passport
              </h2>
              <p className="text-xs text-[#5C6260] mt-0.5">
                Immutable repayment history emitted by LoanPool.CreditPassportMinted
              </p>
            </div>
            <Award className="w-5 h-5 text-[#15803D] shrink-0" />
          </div>

          {creditPassports.length === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-[#E2E7E4] rounded-xl bg-[#F5F7F5]/60">
              <p className="text-sm text-[#5C6260]">
                {wallet.connected
                  ? 'No settled loans yet for this wallet. Repay your first facility to mint a permanent Credit Passport event.'
                  : 'Connect your QDay wallet to load Credit Passport records.'}
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
                      Loan #{cp.loanId} · {cp.principalUSD8.toFixed(2)} tUSD8 Settled
                    </p>
                    <p className="text-xs text-[#5C6260] font-mono tabular-nums mt-0.5">
                      Repaid in {cp.daysToRepay} days · 0 penalties
                    </p>
                  </div>
                  <a
                    href={`${QDAY_EXPLORER_URL}/tx/${cp.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#15803D] hover:underline shrink-0"
                  >
                    <span>{cp.txHash.slice(0, 12)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#E2E7E4] flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/app/identitas"
              className="text-xs font-semibold text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D]"
            >
              Pay ERC-8004 Verified Supplier →
            </Link>
            <Link
              href="/app/pinjaman"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6260] hover:text-[#151619]"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Run AI Red-Team Audit</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white border border-[#E2E7E4] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7E4] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.015em] text-[#151619]">
              Recent On-Chain QR Sales Ledger
            </h2>
            <p className="text-xs text-[#5C6260]">
              Customer IDs are hashed locally with keccak256 before gasless EIP-712 signing
            </p>
          </div>
          <Link
            href="/app/penjualan"
            className="text-xs font-semibold text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D] whitespace-nowrap"
          >
            Record New Sale →
          </Link>
        </div>

        {sales.length === 0 ? (
          <div className="py-12 px-6 text-center text-sm text-[#5C6260]">
            {wallet.connected
              ? 'No QR sales recorded on QDay SalesLedger for this wallet yet.'
              : 'Connect your QDay wallet to view SalesLedger events.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7E4] bg-[#F5F7F5] text-xs font-medium text-[#636966]">
                  <th className="py-3 px-6">Buyer (Hash)</th>
                  <th className="py-3 px-6 text-right">Gross Sale</th>
                  <th className="py-3 px-6 text-right">Auto-Repay (10%)</th>
                  <th className="py-3 px-6 text-right">Net to Shop</th>
                  <th className="py-3 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E4] text-sm">
                {sales.slice(0, 8).map((sale) => {
                  const matchedReceipt = receipts.find((r) => r.txHash === sale.txHash);
                  return (
                    <tr key={sale.id} className="hover:bg-[#F5F7F5]/65 transition-colors">
                      <td className="py-3 px-6">
                        <p className="font-medium text-[#151619]">{sale.customerLabel}</p>
                        <p className="text-xs font-mono text-[#636966]">
                          {sale.customerIdHash.slice(0, 14)}...
                        </p>
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums font-medium text-[#151619]">
                        {sale.amountUSD8.toFixed(2)} tUSD8
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums text-[#B45309]">
                        {sale.repaidDeductedUSD8 > 0
                          ? `-${sale.repaidDeductedUSD8.toFixed(2)} tUSD8`
                          : '0.00 tUSD8'}
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums font-semibold text-[#15803D]">
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
                          <span>View Receipt</span>
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
