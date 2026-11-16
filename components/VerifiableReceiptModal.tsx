'use client';

import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, Receipt, ShieldCheck, X } from 'lucide-react';
import { useHanumPay } from '@/lib/hanumpay-store';
import { QDAY_EXPLORER_URL, shortenAddress } from '@/lib/qday';

export default function VerifiableReceiptModal() {
  const { activeReceipt, closeReceipt } = useHanumPay();
  const [copied, setCopied] = useState(false);

  if (!activeReceipt) return null;

  const isLiveOnChain = activeReceipt.relayMode === 'qday-onchain-relay';

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="w-full sm:max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Dark Obsidian Header */}
        <div className="bg-[#070D14] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Receipt className="w-4 h-4" />
              <span>Verifiable QDay Receipt</span>
            </div>
            <h3 id="receipt-modal-title" className="text-lg font-bold tracking-tight text-white">
              {activeReceipt.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              {new Date(activeReceipt.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {isLiveOnChain ? 'Settled Live on QDay' : 'Verified Relayer Receipt'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeReceipt}
            className="p-2 text-slate-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-1"
            aria-label="Close transaction receipt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="p-4 rounded-xl bg-[#FAFAFA] border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Transaction Total</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {activeReceipt.amountUSD8.toFixed(2)} tUSD8
              </p>
              <p className="text-xs font-mono tabular-nums text-slate-500">
                ≈ Rp {Math.round(activeReceipt.amountUSD8 * 15800).toLocaleString('en-US')} IDR
              </p>
            </div>
            {activeReceipt.erc8004Verified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>ERC-8004</span>
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600">Counterparty</span>
              <span className="font-medium text-slate-900 text-right">
                {activeReceipt.counterpartyName}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600">Verified Wallet</span>
              <span className="font-mono text-xs text-slate-800">
                {shortenAddress(activeReceipt.counterpartyWallet)}
              </span>
            </div>
            {activeReceipt.repaidDeductedUSD8 > 0 && (
              <div className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-slate-600">Auto-Repayment Cut (10%)</span>
                <span className="font-mono tabular-nums font-medium text-[#D97706]">
                  -{activeReceipt.repaidDeductedUSD8.toFixed(2)} tUSD8
                </span>
              </div>
            )}
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600">Net Amount</span>
              <span className="font-mono tabular-nums font-semibold text-[#16A34A]">
                {activeReceipt.netAmountUSD8.toFixed(2)} tUSD8
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600">Proof / Hash</span>
              <span className="font-mono text-xs text-slate-500 truncate max-w-[190px]">
                {activeReceipt.proofHash}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600">QDay Tx Hash</span>
              <a
                href={`${QDAY_EXPLORER_URL}/tx/${activeReceipt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-[#2563EB] hover:underline"
              >
                <span>{shortenAddress(activeReceipt.txHash)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {activeReceipt.note && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>{activeReceipt.note}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyProof}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span>Proof Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy JSON Proof</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={closeReceipt}
            className="px-5 py-3 text-xs font-semibold text-white bg-[#070D14] hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
