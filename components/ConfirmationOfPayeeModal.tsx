'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { ERC8004Identity } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL } from '@/lib/qday-constants';

export default function ConfirmationOfPayeeModal({
  open,
  title,
  actionLabel,
  entity,
  amountUSD8,
  summaryRows,
  isSubmitting,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  actionLabel: string;
  entity: ERC8004Identity | null;
  amountUSD8: number;
  summaryRows: { label: string; value: string }[];
  isSubmitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open || !entity) return null;

  const categoryLabel =
    entity.category === 'shop'
      ? 'Merchant / Shop'
      : entity.category === 'supplier'
        ? 'Verified Supplier'
        : entity.category === 'lender'
          ? 'Liquidity Provider'
          : 'AI Agent';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#151619]/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cop-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white border border-[#E2E7E4] rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-[0_24px_64px_rgb(21_22_25/0.16)]">
        {/* Mobile Bottom-Sheet Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-[#E2E7E4] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E7E4]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#15803D]" />
            <h3 id="cop-modal-title" className="text-base font-semibold tracking-[-0.015em] text-[#151619]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#636966] hover:text-[#151619] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close verification modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="p-4 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4] space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#636966]">
                ERC-8004 Confirmation of Payee
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified On-Chain</span>
              </span>
            </div>

            <div>
              <p className="text-base font-semibold text-[#151619]">{entity.name}</p>
              <p className="text-xs font-mono text-[#5C6260] break-all mt-0.5">{entity.wallet}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C6260] pt-1">
              <span>Role: {categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Reputation: {entity.metadata.reputationScore}/100
              </span>
              <span aria-hidden="true">·</span>
              <a
                href={`${QDAY_EXPLORER_URL}/address/${entity.wallet}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D]"
              >
                View on QDay Explorer
              </a>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-2 border-b border-[#E2E7E4]">
              <span className="text-sm text-[#5C6260]">Transaction Amount</span>
              <span className="text-lg font-semibold font-mono tabular-nums text-[#151619]">
                {amountUSD8.toFixed(2)} tUSD8
              </span>
            </div>

            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm py-1">
                <span className="text-[#5C6260]">{row.label}</span>
                <span className="font-mono tabular-nums font-medium text-[#151619]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#636966]">
            Terms are fetched directly from the smart contract and cannot be altered after approval.
            EIP-712 signatures require zero tQDAY gas from the merchant.
          </p>
        </div>

        <div className="px-6 py-4 bg-[#F5F7F5] border-t border-[#E2E7E4] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 text-sm font-medium text-[#151619] hover:bg-white rounded-xl border border-[#E2E7E4] bg-white min-h-[48px] sm:min-h-[44px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[48px] sm:min-h-[44px] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? 'Submitting EIP-712...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
