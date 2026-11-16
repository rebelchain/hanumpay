'use client';

import React, { useState } from 'react';
import { CheckCircle2, Receipt, Search, ShieldCheck, Store, Truck } from 'lucide-react';
import AppShell from '@/components/AppShell';
import ConfirmationOfPayeeModal from '@/components/ConfirmationOfPayeeModal';
import { useHanumPay } from '@/lib/hanumpay-store';
import { EntityCategory, ERC8004Identity, VerifiableReceipt } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL } from '@/lib/qday';

export default function IdentityAndSupplierPayPage() {
  const {
    identities,
    resolveERC8004,
    registerIdentity,
    shopAvailableTusd8,
    supplierPayments,
    payVerifiedSupplier,
    receipts,
    openReceipt,
  } = useHanumPay();

  // Resolver search
  const [lookupQuery, setLookupQuery] = useState('HanumPay-AI-Guarantor-v1');
  const resolvedAddress = resolveERC8004(lookupQuery);

  // Registration form
  const [regName, setRegName] = useState('');
  const [regCategory, setRegCategory] = useState<EntityCategory>('shop');
  const [regCity, setRegCity] = useState('Surabaya, Jawa Timur');
  const [regType, setRegType] = useState('Toko Ritel UMKM');
  const [regFeedback, setRegFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Supplier payment state
  const suppliers = identities.filter((i) => i.category === 'supplier' && i.active);
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>(
    suppliers[0]?.name ?? 'Pak Joko Distributor'
  );
  const [payAmount, setPayAmount] = useState('35.00');
  const [itemNote, setItemNote] = useState('Minyak goreng 20L + beras 25kg');
  const [copSupplier, setCopSupplier] = useState<ERC8004Identity | null>(null);
  const [payFeedback, setPayFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
    receipt?: VerifiableReceipt;
  } | null>(null);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const res = registerIdentity(regName, regCategory, regCity, regType);
    if (!res.ok) {
      setRegFeedback({ type: 'err', text: res.error ?? 'Gagal mendaftarkan identitas.' });
    } else {
      setRegFeedback({
        type: 'ok',
        text: `"${regName.trim()}" (${regCategory}) berhasil didaftarkan ke ERC8004Registry.`,
      });
      setLookupQuery(regName.trim());
      setRegName('');
    }
  }

  function openSupplierConfirmation(e: React.FormEvent) {
    e.preventDefault();
    setPayFeedback(null);
    const sup = suppliers.find((s) => s.name === selectedSupplierName) ?? null;
    if (!sup) {
      setPayFeedback({
        type: 'err',
        text: 'Pemasok yang dipilih tidak ditemukan di ERC8004Registry.',
      });
      return;
    }
    setCopSupplier(sup);
  }

  function confirmSupplierPayment() {
    if (!copSupplier) return;
    const amt = Number(payAmount);
    const res = payVerifiedSupplier(copSupplier.name, amt, itemNote);
    setCopSupplier(null);
    if (!res.ok) {
      setPayFeedback({ type: 'err', text: res.error ?? 'Pembayaran pemasok gagal.' });
    } else {
      setPayFeedback({
        type: 'ok',
        text: `Berhasil membayar ${amt.toFixed(2)} tUSD8 ke ${copSupplier.name} dengan Verifikasi Penerima ERC-8004.`,
        receipt: res.receipt,
      });
    }
  }

  return (
    <AppShell
      title="Identitas ERC-8004 &amp; Bayar Pemasok"
      subtitle="Konfirmasi Penerima On-Chain untuk warung, agen AI, dan pemasok grosir B2B terverifikasi."
    >
      {/* Supplier Payment via ERC-8004 (Confirmation of Payee Feature) */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Bayar Pemasok Resmi (ERC-8004)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Belanjakan saldo kredit tUSD8 Anda langsung ke agen grosir terverifikasi
              </p>
            </div>
            <Truck className="w-5 h-5 text-[#16A34A] shrink-0" />
          </div>

          <div className="p-3.5 rounded-lg bg-[#F9FAFB] border border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-600">Saldo Kredit Toko Tersedia</span>
            <span className="font-mono tabular-nums font-bold text-[#16A34A]">
              {shopAvailableTusd8.toFixed(2)} tUSD8
            </span>
          </div>

          <form onSubmit={openSupplierConfirmation} className="space-y-4">
            <div>
              <label
                htmlFor="supplier-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Pilih Pemasok Terverifikasi ERC-8004
              </label>
              <select
                id="supplier-select"
                value={selectedSupplierName}
                onChange={(e) => setSelectedSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                {suppliers.map((sup) => (
                  <option key={sup.name} value={sup.name}>
                    {sup.name} ({sup.metadata.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="supplier-amount"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Nominal (tUSD8)
                </label>
                <input
                  id="supplier-amount"
                  type="number"
                  step="0.01"
                  min="0.10"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg font-mono tabular-nums text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="supplier-note"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Catatan Faktur / Stok
                </label>
                <input
                  id="supplier-note"
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {payFeedback && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  payFeedback.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{payFeedback.text}</span>
                </div>
                {payFeedback.receipt && (
                  <button
                    type="button"
                    onClick={() => openReceipt(payFeedback.receipt!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-300 font-semibold text-emerald-900 whitespace-nowrap shrink-0"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Lihat Struk</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors min-h-[44px]"
            >
              Verifikasi Penerima &amp; Bayar Pemasok
            </button>
          </form>
        </div>

        {/* Supplier Settlement Ledger + Resolver */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-base font-semibold text-slate-900">
                Cek Alamat ERC-8004 On-Chain
              </h2>
            </div>
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Ketik nama mis. HanumPay-AI-Guarantor-v1"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm"
            />
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">resolve(&quot;{lookupQuery}&quot;)</span>
                <span
                  className={`font-semibold ${
                    resolvedAddress ? 'text-[#2563EB]' : 'text-amber-700'
                  }`}
                >
                  {resolvedAddress ? 'Terverifikasi ERC-8004' : 'Tidak Ditemukan'}
                </span>
              </div>
              <p className="font-mono text-slate-800 break-all">
                {resolvedAddress ?? '0x0000000000000000000000000000000000000000'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Riwayat Pembayaran Pemasok Terbaru
            </h3>
            {supplierPayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                Belum ada pembayaran pemasok pada sesi ini. Coba bayar Pak Joko Distributor di
                sebelah kiri untuk menguji Konfirmasi Penerima.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {supplierPayments.map((sp) => {
                  const matched = receipts.find((r) => r.txHash === sp.txHash);
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() =>
                        openReceipt(
                          matched ?? {
                            id: `rcpt-${sp.id}`,
                            kind: 'supplier',
                            title: `Bayar Pemasok · ${sp.supplierName}`,
                            amountUSD8: sp.amountUSD8,
                            repaidDeductedUSD8: 0,
                            netAmountUSD8: sp.amountUSD8,
                            counterpartyName: sp.supplierName,
                            counterpartyWallet: sp.supplierWallet,
                            erc8004Verified: true,
                            proofHash: sp.txHash,
                            txHash: sp.txHash,
                            relayMode: 'erc8004-cop-settlement',
                            timestamp: sp.timestamp,
                            note: sp.itemNote,
                          }
                        )
                      }
                      className="w-full py-2.5 px-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs text-left transition-colors min-h-[44px]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{sp.supplierName}</p>
                        <p className="text-slate-500">{sp.itemNote}</p>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-[#16A34A]">
                        {sp.amountUSD8.toFixed(2)} tUSD8
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register New ERC-8004 Identity + Registry Directory */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#16A34A]" />
            <h2 className="text-base font-semibold text-slate-900">
              Daftarkan Identitas ERC-8004 Baru
            </h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-slate-700 mb-1">
                Nama Usaha / Entitas (maks 64 huruf)
              </label>
              <input
                id="reg-name"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="mis. Toko Berkah - Malang"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-cat"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Kategori
                </label>
                <select
                  id="reg-cat"
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value as EntityCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="shop">Toko / Warung</option>
                  <option value="supplier">Pemasok / Grosir</option>
                  <option value="lender">Penyedia Dana (LP)</option>
                  <option value="agent">Agen AI</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="reg-city"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Lokasi / Kota
                </label>
                <input
                  id="reg-city"
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-type" className="block text-xs font-medium text-slate-700 mb-1">
                Jenis Usaha
              </label>
              <input
                id="reg-type"
                type="text"
                value={regType}
                onChange={(e) => setRegType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {regFeedback && (
              <p
                className={`text-xs ${
                  regFeedback.type === 'ok' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {regFeedback.text}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg transition-colors min-h-[44px]"
            >
              Daftarkan Identitas
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Daftar Identitas Aktif ERC-8004
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {identities.length} entitas terverifikasi
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {identities.map((id) => (
              <div
                key={id.name}
                className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <p className="text-sm font-semibold text-slate-900">{id.name}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {id.category} · {id.metadata.businessType} · Skor{' '}
                    <span className="font-mono tabular-nums">{id.metadata.reputationScore}</span>
                  </p>
                </div>
                <a
                  href={`${QDAY_EXPLORER_URL}/address/${id.wallet}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#2563EB] hover:underline shrink-0"
                >
                  {id.wallet.slice(0, 8)}...{id.wallet.slice(-6)}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmationOfPayeeModal
        open={Boolean(copSupplier)}
        title="Konfirmasi Penerima Pemasok"
        actionLabel="Konfirmasi &amp; Bayar Pemasok"
        entity={copSupplier}
        amountUSD8={Number(payAmount) || 0}
        summaryRows={[
          { label: 'Toko Pembayar', value: 'Warung Bu Sri - Surabaya' },
          { label: 'Catatan Faktur', value: itemNote || 'Belanja stok warung' },
          { label: 'Token', value: 'tUSD8 (6 desimal)' },
        ]}
        onConfirm={confirmSupplierPayment}
        onClose={() => setCopSupplier(null)}
      />
    </AppShell>
  );
}
