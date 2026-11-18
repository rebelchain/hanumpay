'use client';

import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, Receipt, ShieldCheck, X } from 'lucide-react';
import TechnicalDetailsToggle from '@/components/TechnicalDetailsToggle';
import { useHanumPay } from '@/lib/hanumpay-store';
import { VerifiableReceipt } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL, shortenAddress } from '@/lib/qday-constants';

export default function VerifiableReceiptModal({
  receiptOverride,
  onCloseOverride,
}: {
  receiptOverride?: VerifiableReceipt | null;
  onCloseOverride?: () => void;
}) {
  const { activeReceipt: storeReceipt, closeReceipt: closeStoreReceipt } = useHanumPay();
  const [copied, setCopied] = useState(false);

  const activeReceipt = receiptOverride !== undefined ? receiptOverride : storeReceipt;
  const closeReceipt = onCloseOverride ?? closeStoreReceipt;

  if (!activeReceipt) return null;

  const isLiveOnChain =
    activeReceipt.relayMode === 'qday-onchain-relay' ||
    activeReceipt.relayMode === 'qday-onchain-direct';

  function handleCopyProof() {
    if (!activeReceipt) return;
    const payload = JSON.stringify(
      {
        protocol: 'HanumPay',
        network: 'QDay Aevum Testnet (Chain 44005)',
        receiptId: activeReceipt.id,
        kind: activeReceipt.kind,
        amountTUSD8: activeReceipt.amountUSD8.toFixed(2),
        autoRepaidTUSD8: activeReceipt.repaidDeductedUSD8.toFixed(2),
        netAmountTUSD8: activeReceipt.netAmountUSD8.toFixed(2),
        counterparty: activeReceipt.counterpartyName,
        wallet: activeReceipt.counterpartyWallet,
        erc8004Verified: activeReceipt.erc8004Verified,
        proofHash: activeReceipt.proofHash,
        txHash: activeReceipt.txHash,
        timestamp: new Date(activeReceipt.timestamp).toISOString(),
      },
      null,
      2
    );
    navigator.clipboard?.writeText(payload).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#151619]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="w-full sm:max-w-md bg-white border border-[#E2E7E4] rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col shadow-[0_24px_64px_rgb(21_22_25/0.18)]">
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-[#E2E7E4] rounded-full" />
        </div>

        <div className="bg-[#151619] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#9FE8C3] font-semibold">
              <Receipt className="w-4 h-4" />
              <span>{isLiveOnChain ? 'Payment Receipt' : 'Demo Simulator Receipt'}</span>
            </div>
            <h3 id="receipt-modal-title" className="text-lg font-semibold tracking-[-0.02em] text-white">
              {activeReceipt.title}
            </h3>
            <p className="text-xs text-white/65 font-mono tabular-nums">
              {new Date(activeReceipt.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {isLiveOnChain ? 'Confirmed' : 'Interactive Demo'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeReceipt}
            className="p-2 text-white/70 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-1 cursor-pointer"
            aria-label="Close transaction receipt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="p-4 rounded-xl bg-[#F7F8F9] border border-[#E2E7E4] flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#636966]">Total Amount</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#151619] mt-0.5">
                ${activeReceipt.amountUSD8.toFixed(2)}
              </p>
              <p className="text-xs font-mono tabular-nums text-[#636966]">
                ≈ Rp {Math.round(activeReceipt.amountUSD8 * 15800).toLocaleString('en-US')} IDR
              </p>
            </div>
            {activeReceipt.erc8004Verified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Business</span>
              </span>
            )}
          </div>

          <div className="divide-y divide-[#E2E7E4] text-sm">
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C6260]">Business / Counterparty</span>
              <span className="font-medium text-[#151619] text-right">
                {activeReceipt.counterpartyName}
              </span>
            </div>
            {activeReceipt.repaidDeductedUSD8 > 0 && (
              <div className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-[#5C6260]">Loan Auto-Repay (10%)</span>
                <span className="font-mono tabular-nums font-medium text-[#B45309]">
                  -${activeReceipt.repaidDeductedUSD8.toFixed(2)}
                </span>
              </div>
            )}
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C6260]">Net Amount</span>
              <span className="font-mono tabular-nums font-semibold text-[#15803D]">
                ${activeReceipt.netAmountUSD8.toFixed(2)}
              </span>
            </div>
          </div>

          {activeReceipt.note && (
            <div className="p-3 rounded-xl bg-[#E8FAF0]/70 border border-[#9FE8C3] text-xs text-[#151619] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
              <span>{activeReceipt.note}</span>
            </div>
          )}

          <TechnicalDetailsToggle
            label="Technical & Chain Proof"
            items={[
              { label: 'Token Unit', value: `${activeReceipt.amountUSD8.toFixed(2)} tUSD8` },
              {
                label: 'Account Address',
                value: shortenAddress(activeReceipt.counterpartyWallet),
              },
              { label: 'Privacy Hash', value: activeReceipt.proofHash },
              ...(isLiveOnChain
                ? [
                    {
                      label: 'QDay Transaction',
                      value: shortenAddress(activeReceipt.txHash),
                      href: `${QDAY_EXPLORER_URL}/tx/${activeReceipt.txHash}`,
                    },
                  ]
                : [
                    {
                      label: 'Demo Reference',
                      value: shortenAddress(activeReceipt.txHash),
                    },
                  ]),
            ]}
          >
            <button
              type="button"
              onClick={handleCopyProof}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#151619] bg-white border border-[#E2E7E4] hover:bg-[#E8FAF0] rounded-lg transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>JSON Proof Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON Proof</span>
                </>
              )}
            </button>
          </TechnicalDetailsToggle>
        </div>

        <div className="px-6 py-4 bg-[#F7F8F9] border-t border-[#E2E7E4] flex items-center justify-end">
          <button
            type="button"
            onClick={closeReceipt}
            className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
