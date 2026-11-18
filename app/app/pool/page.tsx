'use client';

import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Receipt,
  Wallet,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import TechnicalDetailsToggle from '@/components/TechnicalDetailsToggle';
import { useHanumPay } from '@/lib/hanumpay-store';
import { VerifiableReceipt } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL } from '@/lib/qday-constants';

export default function LenderPoolPage() {
  const {
    wallet,
    connectQDayWallet,
    poolDepositedUSD8,
    poolLoanedUSD8,
    poolAvailableUSD8,
    poolUtilizationBps,
    poolFeesEarnedUSD8,
    poolActiveLoanCount,
    userLenderShares,
    userLenderValueUSD8,
    tusd8AllowancePool,
    poolEvents,
    depositToPool,
    withdrawFromPool,
    openReceipt,
  } = useHanumPay();

  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositInput, setDepositInput] = useState('1.00');
  const [withdrawInput, setWithdrawInput] = useState('1.00');
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<{
    type: 'ok' | 'err';
    text: string;
    receipt?: VerifiableReceipt;
  } | null>(null);

  const utilizationPct = (poolUtilizationBps / 100).toFixed(1);
  const estApy =
    poolDepositedUSD8 > 0
      ? (6.8 + (poolUtilizationBps / 10000) * 5.2).toFixed(2)
      : '0.00';

  const depositAmt = Number(depositInput);
  const needsApproval =
    !Number.isNaN(depositAmt) && depositAmt > 0 && tusd8AllowancePool < depositAmt;

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setDepositing(true);
    setMessage(null);
    const res = await depositToPool(depositAmt);
    setDepositing(false);
    if (!res.ok) {
      setMessage({ type: 'err', text: res.error ?? 'Could not complete deposit.' });
    } else {
      setMessage({
        type: 'ok',
        text: `Deposited $${depositAmt.toFixed(2)} into the Community Pool.`,
        receipt: res.receipt,
      });
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(withdrawInput);
    setWithdrawing(true);
    setMessage(null);
    const res = await withdrawFromPool(amt);
    setWithdrawing(false);
    if (!res.ok) {
      setMessage({ type: 'err', text: res.error ?? 'Could not complete withdrawal.' });
    } else {
      setMessage({
        type: 'ok',
        text: `Withdrew $${amt.toFixed(2)} back to your account.`,
        receipt: res.receipt,
      });
    }
  }

  const EVENT_LABELS: Record<string, string> = {
    Deposit: 'Lender Deposit',
    Withdraw: 'Lender Withdrawal',
    LoanDisbursed: 'Loan Funded',
    RepaymentReceived: 'Shop Repayment',
    SupplierPaid: 'Supplier Paid',
  };

  const activeAmount = mode === 'deposit' ? Number(depositInput) || 0 : Number(withdrawInput) || 0;
  const approxIdr = Math.round(activeAmount * 15800).toLocaleString('en-US');

  return (
    <AppShell
      group="Suppliers & Pool"
      title="Community Pool"
      headlineLead="Fund local shops,"
      headlineAccent="earn 5%."
      subtitle="Support verified small businesses with working capital and earn a share of their fixed loan fees."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Total Pool Funds</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            ${poolDepositedUSD8.toFixed(2)}
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            Ready to lend: ${poolAvailableUSD8.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Funds In Use</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {utilizationPct}%
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            Safety cap: 80.0% max lent
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Estimated Annual Return</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#15803D] mt-1.5">
            {estApy}%
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            Fees collected: ${poolFeesEarnedUSD8.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Active Shop Loans</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {poolActiveLoanCount}
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            Lent out: ${poolLoanedUSD8.toFixed(2)}
          </p>
        </div>
      </div>

      {!wallet.connected && (
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[#5C6260]">
            Connect your account to deposit funds into the pool or withdraw your earnings.
          </p>
          <button
            type="button"
            onClick={connectQDayWallet}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#151619] rounded-xl shrink-0 cursor-pointer whitespace-nowrap"
          >
            <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
            <span>Connect Account</span>
          </button>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 ${
            message.type === 'ok'
              ? 'bg-[#E8FAF0] border-[#9FE8C3] text-[#151619]'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                message.type === 'ok' ? 'text-[#15803D]' : 'text-[#DC2626]'
              }`}
            />
            <span>{message.text}</span>
          </div>
          {message.receipt && (
            <button
              type="button"
              onClick={() => openReceipt(message.receipt!)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E7E4] text-xs font-semibold text-[#151619] shrink-0 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Receipt</span>
            </button>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-[#F7F8F9] border border-[#E2E7E4] rounded-xl">
              <button
                type="button"
                onClick={() => setMode('deposit')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'deposit'
                    ? 'bg-[#151619] text-white'
                    : 'text-[#5C6260] hover:text-[#151619]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('withdraw')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'withdraw'
                    ? 'bg-[#151619] text-white'
                    : 'text-[#5C6260] hover:text-[#151619]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Withdraw</span>
              </button>
            </div>

            <span className="text-xs font-mono tabular-nums text-[#5C6260]">
              {wallet.connected ? `Wallet: $${wallet.tusd8Balance}` : 'Account disconnected'}
            </span>
          </div>

          {mode === 'deposit' ? (
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label
                  htmlFor="deposit-tusd8"
                  className="block text-xs font-medium text-[#151619] mb-1.5"
                >
                  Amount to Deposit (USD)
                </label>
                <input
                  id="deposit-tusd8"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositInput}
                  onChange={(e) => setDepositInput(e.target.value)}
                  className="w-full px-3.5 py-3 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl font-mono tabular-nums text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[48px]"
                />
                {activeAmount > 0 && (
                  <p className="text-xs font-mono tabular-nums text-[#636966] mt-1">
                    ≈ Rp {approxIdr} IDR
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!wallet.connected || depositing}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[48px] disabled:opacity-50 cursor-pointer"
              >
                {depositing
                  ? 'Confirming...'
                  : needsApproval
                    ? 'Approve & Deposit Funds'
                    : 'Deposit to Community Pool'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label
                  htmlFor="withdraw-tusd8"
                  className="block text-xs font-medium text-[#151619] mb-1.5"
                >
                  Amount to Withdraw (USD)
                </label>
                <input
                  id="withdraw-tusd8"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={withdrawInput}
                  onChange={(e) => setWithdrawInput(e.target.value)}
                  className="w-full px-3.5 py-3 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl font-mono tabular-nums text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[48px]"
                />
                {activeAmount > 0 && (
                  <p className="text-xs font-mono tabular-nums text-[#636966] mt-1">
                    ≈ Rp {approxIdr} IDR
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!wallet.connected || withdrawing || userLenderShares <= 0}
                className="w-full py-3 px-4 text-sm font-semibold text-[#151619] bg-[#9FE8C3] hover:bg-[#8CDFB5] rounded-xl transition-colors min-h-[48px] disabled:opacity-50 cursor-pointer"
              >
                {withdrawing ? 'Confirming Withdrawal...' : 'Withdraw to Wallet'}
              </button>
            </form>
          )}

          <TechnicalDetailsToggle
            label="Technical Pool Details"
            items={[
              { label: 'Smart Contract', value: 'LoanPool.sol (QDay Aevum)' },
              { label: 'Token Allowance', value: `${tusd8AllowancePool.toFixed(2)} tUSD8` },
              { label: 'Your Pool Shares', value: `${userLenderShares.toFixed(2)} shares` },
            ]}
          />
        </div>

        <div className="lg:col-span-5 bg-[#151619] text-white rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-white/60">
              Pool Summary
            </span>
            <span className="inline-flex items-center rounded-full bg-[#9FE8C3] px-2.5 py-1 text-[11px] font-semibold text-[#151619]">
              20% kept liquid
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10">
              <p className="text-[11px] uppercase tracking-[0.06em] text-white/55">
                Your Current Pool Share
              </p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#9FE8C3] mt-1">
                ${userLenderValueUSD8.toFixed(2)}
              </p>
              <p className="text-xs font-mono tabular-nums text-white/60 mt-0.5">
                ≈ Rp {Math.round(userLenderValueUSD8 * 15800).toLocaleString('en-US')} IDR
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/70">Available to Withdraw Anytime</span>
              <span className="font-mono font-semibold text-white">
                ${poolAvailableUSD8.toFixed(2)}
              </span>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-white/75 pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#9FE8C3] shrink-0" />
              <span>Your deposit earns a share of the 5% fee paid by shops.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#9FE8C3] shrink-0" />
              <span>At least 20% stays unlent as a cash reserve for withdrawals.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-[#E2E7E4] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#15803D]" />
            <h2 className="text-base font-semibold text-[#151619]">Recent Pool Activity</h2>
          </div>
          <span className="text-xs text-[#636966]">Live Ledger</span>
        </div>

        {poolEvents.length === 0 ? (
          <div className="py-12 px-6 text-center text-sm text-[#5C6260]">
            No recent deposits, loans, or repayments found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7E4] bg-[#F7F8F9] text-xs font-medium text-[#636966]">
                  <th className="py-3 px-6">Activity</th>
                  <th className="py-3 px-6">Account</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E4] text-sm">
                {poolEvents.slice(0, 12).map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F7F8F9]/75 transition-colors">
                    <td className="py-3 px-6 font-medium text-[#151619]">
                      {EVENT_LABELS[ev.type] ?? ev.type}
                    </td>
                    <td className="py-3 px-6 font-mono text-xs text-[#5C6260]">{ev.actor}</td>
                    <td className="py-3 px-6 text-right font-mono tabular-nums font-semibold text-[#151619]">
                      {ev.amountUSD8 > 0 ? `$${ev.amountUSD8.toFixed(2)}` : 'Disbursed'}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-xs">
                      <a
                        href={`${QDAY_EXPLORER_URL}/tx/${ev.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#15803D] hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
