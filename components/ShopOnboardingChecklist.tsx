'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react';
import { useHanumPay } from '@/lib/hanumpay-store';
import { QDAY_CHAIN_ID, QDAY_FAUCET_URL } from '@/lib/qday-constants';

export default function ShopOnboardingChecklist({
  compact = false,
}: {
  compact?: boolean;
}) {
  const {
    wallet,
    connectQDayWallet,
    switchToQDayNetwork,
    isRegisteredShop,
    activeShopName,
    registerShopOnChain,
    tusd8AllowancePool,
    approveLoanPoolAutoRepay,
    activeLoan,
    proposedLoan,
  } = useHanumPay();

  const [shopNameInput, setShopNameInput] = useState('');
  const [savingShop, setSavingShop] = useState(false);
  const [switchingNet, setSwitchingNet] = useState(false);
  const [approvingRepay, setApprovingRepay] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [collapsedOptional, setCollapsedOptional] = useState(false);

  const onRightNetwork =
    wallet.connected && (wallet.chainId === null || wallet.chainId === QDAY_CHAIN_ID);
  const step1Done = wallet.connected && onRightNetwork;
  const step2Done = step1Done && isRegisteredShop;
  const step3Done = step2Done && tusd8AllowancePool >= 50;

  const completedCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const needsZeroGas = wallet.connected && Number(wallet.tqdayBalance) <= 0;
  const onlyOptionalStepLeft = step1Done && step2Done && !step3Done && !activeLoan && !proposedLoan;

  if (completedCount === 3) {
    return null;
  }

  async function handleSwitchNetwork() {
    setErrorMsg(null);
    setSwitchingNet(true);
    const res = await switchToQDayNetwork();
    setSwitchingNet(false);
    if (!res.ok && res.error) {
      setErrorMsg(res.error);
    }
  }

  async function handleSaveShop(e: React.FormEvent) {
    e.preventDefault();
    if (!shopNameInput.trim()) return;
    setErrorMsg(null);
    setSavingShop(true);
    const res = await registerShopOnChain(shopNameInput, true);
    setSavingShop(false);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Could not save your shop name. Please try again.');
    } else {
      setShopNameInput('');
    }
  }

  async function handleApproveAutoRepay() {
    setErrorMsg(null);
    setApprovingRepay(true);
    const res = await approveLoanPoolAutoRepay(10000);
    setApprovingRepay(false);
    if (!res.ok && res.error) {
      setErrorMsg(res.error);
    }
  }

  if (onlyOptionalStepLeft && collapsedOptional) {
    return (
      <div className="bg-white border border-[#E2E7E4] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
          <p className="text-xs font-medium text-[#151619] truncate">
            {activeShopName} ready to accept QR payments · Optional credit setup skipped
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsedOptional(false)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Setup step 3</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="New Shop Setup Checklist"
      className={`bg-white border border-[#E2E7E4] rounded-2xl ${
        compact ? 'p-4 sm:p-5 space-y-4' : 'p-6 space-y-5'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#15803D]">New Shop Setup</span>
            <span className="text-xs font-mono tabular-nums text-[#636966]">
              · {completedCount} of 3 complete
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold tracking-[-0.015em] text-[#151619]">
            Step-by-step guide to start accepting payments
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onlyOptionalStepLeft && (
            <button
              type="button"
              onClick={() => setCollapsedOptional(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#636966] hover:text-[#151619] cursor-pointer"
            >
              <span>Skip step 3 for now</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-3 gap-2" aria-hidden="true">
        <div
          className={`h-1.5 rounded-full transition-colors ${
            step1Done ? 'bg-[#15803D]' : 'bg-[#151619]'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-colors ${
            step2Done ? 'bg-[#15803D]' : step1Done ? 'bg-[#151619]' : 'bg-[#E2E7E4]'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-colors ${
            step3Done ? 'bg-[#15803D]' : step2Done ? 'bg-[#151619]' : 'bg-[#E2E7E4]'
          }`}
        />
      </div>

      {needsZeroGas && (!step2Done || !step3Done) && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-950">
            <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <p>
              Your wallet has <span className="font-mono font-semibold">0.0000 tQDAY</span> for
              one-time setup gas. Claim free test gas before saving your shop name.
            </p>
          </div>
          <a
            href={QDAY_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#151619] bg-white border border-amber-300 rounded-lg hover:bg-amber-100/60 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <span>Get Free Test Gas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className="divide-y divide-[#E2E7E4]">
        {/* Step 1: Connect Browser Wallet & Switch to QDay */}
        <div className="py-3.5 first:pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`w-7 h-7 rounded-lg font-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                step1Done
                  ? 'bg-[#E8FAF0] text-[#15803D] border border-[#9FE8C3]'
                  : 'bg-[#151619] text-white'
              }`}
            >
              {step1Done ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#151619]">
                Connect your browser wallet &amp; QDay network
              </p>
              <p className="text-xs text-[#5C6260] mt-0.5">
                {step1Done
                  ? 'Wallet connected to QDay Aevum network.'
                  : wallet.connected
                    ? 'Switch your wallet network to QDay Aevum (44005) to continue.'
                    : 'Sign in with MetaMask or Rabby so QR sales settle directly to your shop account.'}
              </p>
            </div>
          </div>

          {!step1Done && (
            <div className="pl-10 sm:pl-0 shrink-0">
              {!wallet.connected ? (
                <button
                  type="button"
                  onClick={connectQDayWallet}
                  disabled={wallet.isConnecting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
                  <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Account'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSwitchNetwork}
                  disabled={switchingNet}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-xl transition-colors min-h-[44px] cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  <span>{switchingNet ? 'Switching...' : 'Switch to QDay Network'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Register Shop Name */}
        <div className="py-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className={`w-7 h-7 rounded-lg font-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                  step2Done
                    ? 'bg-[#E8FAF0] text-[#15803D] border border-[#9FE8C3]'
                    : step1Done
                      ? 'bg-[#151619] text-white'
                      : 'bg-[#F7F8F9] text-[#636966] border border-[#E2E7E4]'
                }`}
              >
                {step2Done ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </span>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    step1Done ? 'text-[#151619]' : 'text-[#636966]'
                  }`}
                >
                  Enter &amp; save your shop name
                </p>
                <p className="text-xs text-[#5C6260] mt-0.5">
                  {step2Done
                    ? `Registered as "${activeShopName}". Ready to record customer payments.`
                    : 'Customers see your verified shop name when paying, and every sale builds your credit score.'}
                </p>
              </div>
            </div>
          </div>

          {step1Done && !step2Done && (
            <form onSubmit={handleSaveShop} className="pl-10 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Store className="w-4 h-4 text-[#636966] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={shopNameInput}
                  onChange={(e) => setShopNameInput(e.target.value)}
                  placeholder="Enter shop name (e.g. Warung Berkah)"
                  maxLength={64}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F8F9] border border-[#E2E7E4] rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={savingShop}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors whitespace-nowrap min-h-[44px] disabled:opacity-60 cursor-pointer"
              >
                {savingShop ? 'Saving Shop...' : 'Save Shop Name'}
              </button>
            </form>
          )}
        </div>

        {/* Step 3: Approve Auto-Repay Permission */}
        <div className="py-3.5 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`w-7 h-7 rounded-lg font-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                step3Done
                  ? 'bg-[#E8FAF0] text-[#15803D] border border-[#9FE8C3]'
                  : step2Done
                    ? 'bg-[#151619] text-white'
                    : 'bg-[#F7F8F9] text-[#636966] border border-[#E2E7E4]'
              }`}
            >
              {step3Done ? <CheckCircle2 className="w-4 h-4" /> : '3'}
            </span>
            <div>
              <p
                className={`text-sm font-semibold ${
                  step2Done ? 'text-[#151619]' : 'text-[#636966]'
                }`}
              >
                Enable 10% automatic loan repayment{' '}
                {activeLoan ? '(Required for active loan)' : '(Recommended)'}
              </p>
              <p className="text-xs text-[#5C6260] mt-0.5">
                {step3Done
                  ? 'Auto-repay permission is active so working capital repayments run seamlessly.'
                  : 'When a QRIS sale settles funds to your wallet, 10% goes straight to pay down any active loan and 90% stays yours.'}
              </p>
            </div>
          </div>

          {step2Done && !step3Done && (
            <div className="pl-10 sm:pl-0 shrink-0">
              <button
                type="button"
                onClick={handleApproveAutoRepay}
                disabled={approvingRepay}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#151619] bg-[#9FE8C3] hover:bg-[#86E0B2] rounded-xl transition-colors min-h-[44px] cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>{approvingRepay ? 'Enabling...' : 'Enable Auto-Repay'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
          {errorMsg}
        </div>
      )}
    </section>
  );
}
