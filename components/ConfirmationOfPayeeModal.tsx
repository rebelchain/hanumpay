'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { ERC8004Identity } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL } from '@/lib/qday';

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cop-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white border border-slate-200 rounded-t-3xl sm:rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Mobile Bottom-Sheet Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 sm:py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <h3 id="cop-modal-title" className="text-base font-semibold text-slate-900">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup jendela verifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">
                Konfirmasi Penerima ERC-8004
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terverifikasi On-Chain</span>
              </span>
            </div>

            <div>
              <p className="text-base font-semibold text-slate-900">{entity.name}</p>
              <p className="text-xs font-mono text-slate-600 break-all mt-0.5">{entity.wallet}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-1">
              <span>Kategori: {entity.category === 'shop' ? 'Toko / Warung' : entity.category === 'supplier' ? 'Pemasok' : entity.category === 'lender' ? 'Penyedia Dana' : 'Agen AI'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Reputasi: {entity.metadata.reputationScore}/100
              </span>
              <span aria-hidden="true">·</span>
              <a
                href={`${QDAY_EXPLORER_URL}/address/${entity.wallet}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#2563EB] hover:underline"
              >
                Cek di QDay Explorer
              </a>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Nominal Transaksi</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {amountUSD8.toFixed(2)} tUSD8
              </span>
            </div>

            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Ketentuan diambil langsung dari smart contract dan tidak bisa diubah setelah Anda setujui.
            Tanda tangan EIP-712 bebas biaya gas tQDAY bagi pemilik warung.
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-xl sm:rounded-lg border border-slate-200 bg-white min-h-[48px] sm:min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-xl sm:rounded-lg transition-colors min-h-[48px] sm:min-h-[44px] disabled:opacity-60"
          >
            {isSubmitting ? 'Mengirim EIP-712...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
