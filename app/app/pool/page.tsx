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
      setMessage({ type: 'err', text: res.error ?? 'Deposit failed.' });
    } else {
      setMessage({
        type: 'ok',
        text: `Deposited ${depositAmt.toFixed(2)} tUSD8 into LoanPool on QDay Aevum.`,
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
      setMessage({ type: 'err', text: res.error ?? 'Withdrawal failed.' });
    } else {
      setMessage({
        type: 'ok',
        text: `Withdrew ${amt.toFixed(2)} tUSD8 from LoanPool back to your wallet.`,
        receipt: res.receipt,
      });
    }
  }

  const EVENT_LABELS: Record<string, string> = {
    Deposit: 'Deposit',
    Withdraw: 'Withdraw',
    LoanDisbursed: 'Loan Disbursed',
    RepaymentReceived: 'Repayment Received',
    SupplierPaid: 'Supplier Paid',
  };

  return (
    <AppShell
      title="Liquidity Pool (Community LPs)"
      subtitle="Deposit real tUSD8 into LoanPool.sol on QDay Aevum to fund verified MSME working capital and earn the 5% flat fee."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Total Pool TVL</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {poolDepositedUSD8.toFixed(2)} tUSD8
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            Available: {poolAvailableUSD8.toFixed(2)} tUSD8
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Pool Utilization</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {utilizationPct}%
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            Contract guardrail: 80.0% max
          </p>
        </div>

        <div className="bg-[#9FE8C3] border border-[#151619]/10 rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#151619]/80">Estimated LP APY</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {estApy}%
          </p>
          <p className="text-xs text-[#151619]/75 mt-1 font-mono tabular-nums">
            Fees earned: {poolFeesEarnedUSD8.toFixed(2)} tUSD8
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#636966]">Active MSME Loans</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-1.5">
            {poolActiveLoanCount}
          </p>
          <p className="text-xs text-[#636966] mt-1 font-mono tabular-nums">
            Disbursed: {poolLoanedUSD8.toFixed(2)} tUSD8
          </p>
        </div>
      </div>

      {!wallet.connected && (
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[#5C6260]">
            Connect your QDay MetaMask wallet to deposit <code className="font-mono">tUSD8</code>{' '}
            or withdraw your LP shares.
          </p>
          <button
            type="button"
            onClick={connectQDayWallet}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#151619] rounded-xl shrink-0 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
            <span>Connect QDay Wallet</span>
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
              <span>View Receipt</span>
            </button>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#151619]">Deposit tUSD8</h2>
              <p className="text-xs text-[#5C6260] font-mono tabular-nums">
                Wallet: {wallet.connected ? `${wallet.tusd8Balance} tUSD8` : 'Not connected'}
              </p>
            </div>
            <ArrowDownLeft className="w-5 h-5 text-[#15803D]" />
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label
                htmlFor="deposit-tusd8"
                className="block text-xs font-medium text-[#151619] mb-1.5"
              >
                Deposit Amount (tUSD8)
              </label>
              <input
                id="deposit-tusd8"
                type="number"
                step="0.01"
                min="0.01"
                value={depositInput}
                onChange={(e) => setDepositInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl font-mono tabular-nums text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
              />
              <p className="text-[11px] font-mono text-[#636966] mt-1">
                LoanPool allowance: {tusd8AllowancePool.toFixed(2)} tUSD8
              </p>
            </div>

            <button
              type="submit"
              disabled={!wallet.connected || depositing}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
            >
              {depositing
                ? 'Confirming Transaction(s)...'
                : needsApproval
                  ? 'Approve tUSD8 & Deposit to LoanPool'
                  : 'Deposit to LoanPool'}
            </button>
          </form>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#151619]">Withdraw Liquidity</h2>
              <p className="text-xs text-[#5C6260] font-mono tabular-nums">
                Your LP Value: {userLenderValueUSD8.toFixed(2)} tUSD8 ({userLenderShares.toFixed(2)}{' '}
                shares)
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#151619]" />
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label
                htmlFor="withdraw-tusd8"
                className="block text-xs font-medium text-[#151619] mb-1.5"
              >
                Withdrawal Amount (tUSD8)
              </label>
              <input
                id="withdraw-tusd8"
                type="number"
                step="0.01"
                min="0.01"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl font-mono tabular-nums text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
              />
            </div>

            <button
              type="submit"
              disabled={!wallet.connected || withdrawing || userLenderShares <= 0}
              className="w-full py-2.5 px-4 text-sm font-semibold text-[#151619] bg-[#F5F7F5] hover:bg-[#E8FAF0] border border-[#E2E7E4] rounded-xl transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
            >
              {withdrawing ? 'Confirming Withdrawal...' : 'Withdraw Liquidity'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border border-[#E2E7E4] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#15803D]" />
            <h2 className="text-base font-semibold text-[#151619]">Live Pool Activity Feed</h2>
          </div>
          <span className="text-xs font-mono text-[#636966]">LoanPool.sol Events</span>
        </div>

        {poolEvents.length === 0 ? (
          <div className="py-12 px-6 text-center text-sm text-[#5C6260]">
            No LoanPool deposit, withdrawal, or repayment events found in recent QDay blocks yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7E4] bg-[#F5F7F5] text-xs font-medium text-[#636966]">
                  <th className="py-3 px-6">Event</th>
                  <th className="py-3 px-6">Counterparty</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6">Explorer TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E4] text-sm">
                {poolEvents.slice(0, 12).map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F5F7F5]/65 transition-colors">
                    <td className="py-3 px-6 font-medium text-[#151619]">
                      {EVENT_LABELS[ev.type] ?? ev.type}
                    </td>
                    <td className="py-3 px-6 font-mono text-xs text-[#5C6260]">{ev.actor}</td>
                    <td className="py-3 px-6 text-right font-mono tabular-nums font-semibold text-[#151619]">
                      {ev.amountUSD8 > 0 ? `${ev.amountUSD8.toFixed(2)} tUSD8` : 'Disbursed'}
                    </td>
                    <td className="py-3 px-6 font-mono text-xs">
                      <a
                        href={`${QDAY_EXPLORER_URL}/tx/${ev.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#15803D] hover:underline"
                      >
                        <span>{ev.txHash.slice(0, 14)}...</span>
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
