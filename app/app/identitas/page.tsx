'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Receipt,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import ConfirmationOfPayeeModal from '@/components/ConfirmationOfPayeeModal';
import { useHanumPay } from '@/lib/hanumpay-store';
import { EntityCategory, ERC8004Identity, VerifiableReceipt } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL } from '@/lib/qday-constants';

export default function IdentityAndSupplierPayPage() {
  const {
    wallet,
    activeShopName,
    identities,
    resolveERC8004OnChain,
    registerIdentity,
    revokeIdentity,
    shopAvailableTusd8,
    supplierPayments,
    payVerifiedSupplier,
    openReceipt,
  } = useHanumPay();

  // Live on-chain resolver search
  const [lookupQuery, setLookupQuery] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolvedResult, setResolvedResult] = useState<{
    queried: string;
    found: boolean;
    wallet: `0x${string}` | null;
    identity?: ERC8004Identity;
  } | null>(null);

  // Registration form
  const [regName, setRegName] = useState('');
  const [regCategory, setRegCategory] = useState<EntityCategory>('supplier');
  const [regCity, setRegCity] = useState('Surabaya, East Java');
  const [regType, setRegType] = useState('Wholesale Food & Supply Distributor');
  const [registering, setRegistering] = useState(false);
  const [revokingName, setRevokingName] = useState<string | null>(null);
  const [regFeedback, setRegFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Supplier payment state
  const suppliers = identities.filter((i) => i.category === 'supplier' && i.active);
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');
  const activePayeeName = selectedSupplierName || suppliers[0]?.name || '';
  const [payAmount, setPayAmount] = useState('1.00');
  const [itemNote, setItemNote] = useState('Wholesale inventory restock');
  const [copSupplier, setCopSupplier] = useState<ERC8004Identity | null>(null);
  const [paying, setPaying] = useState(false);
  const [payFeedback, setPayFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
    receipt?: VerifiableReceipt;
  } | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const q = lookupQuery.trim();
    if (!q) return;
    setResolving(true);
    try {
      const res = await resolveERC8004OnChain(q);
      setResolvedResult({
        queried: q,
        found: res.found,
        wallet: res.wallet,
        identity: res.identity,
      });
    } finally {
      setResolving(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    setRegFeedback(null);
    const res = await registerIdentity(regName, regCategory, regCity, regType);
    setRegistering(false);
    if (!res.ok) {
      setRegFeedback({ type: 'err', text: res.error ?? 'Failed to register identity.' });
    } else {
      const created = regName.trim();
      setRegFeedback({
        type: 'ok',
        text: `"${created}" (${regCategory}) registered live on ERC8004Registry.`,
      });
      setLookupQuery(created);
      if (regCategory === 'supplier') {
        setSelectedSupplierName(created);
      }
      setRegName('');
    }
  }

  async function handleRevoke(name: string) {
    setRevokingName(name);
    setRegFeedback(null);
    const res = await revokeIdentity(name);
    setRevokingName(null);
    if (!res.ok) {
      setRegFeedback({ type: 'err', text: res.error ?? 'Revoke failed.' });
    } else {
      setRegFeedback({
        type: 'ok',
        text: `"${name}" was revoked on-chain (Confirmation of Payee will now block transfers).`,
      });
    }
  }

  function openSupplierConfirmation(e: React.FormEvent) {
    e.preventDefault();
    setPayFeedback(null);
    const sup =
      suppliers.find((s) => s.name === activePayeeName) ??
      (resolvedResult?.identity?.name === activePayeeName ? resolvedResult.identity : null);
    if (!sup) {
      setPayFeedback({
        type: 'err',
        text: 'Select or resolve an active ERC-8004 supplier first.',
      });
      return;
    }
    setCopSupplier(sup);
  }

  async function confirmSupplierPayment() {
    if (!copSupplier) return;
    const amt = Number(payAmount);
    setPaying(true);
    const res = await payVerifiedSupplier(copSupplier.name, amt, itemNote);
    setPaying(false);
    setCopSupplier(null);
    if (!res.ok) {
      setPayFeedback({ type: 'err', text: res.error ?? 'Supplier payment failed.' });
    } else {
      setPayFeedback({
        type: 'ok',
        text: `Paid ${amt.toFixed(2)} tUSD8 on QDay to ${copSupplier.name} with ERC-8004 Confirmation of Payee.`,
        receipt: res.receipt,
      });
    }
  }

  return (
    <AppShell
      title="ERC-8004 Identity & Pay Supplier"
      subtitle="Live on-chain Confirmation of Payee on QDay ERC8004Registry and real tUSD8 transfers to verified wholesalers."
    >
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#151619]">
                Pay Verified Supplier (ERC-8004 + tUSD8)
              </h2>
              <p className="text-xs text-[#5C6260] mt-0.5">
                Verifies recipient via <code className="font-mono">ERC8004Registry.resolve</code>{' '}
                before sending real tUSD8
              </p>
            </div>
            <Truck className="w-5 h-5 text-[#15803D] shrink-0" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#E8FAF0] border border-[#9FE8C3] flex items-center justify-between text-sm">
            <span className="text-[#151619] font-medium">Wallet tUSD8 Balance</span>
            <span className="font-mono tabular-nums font-semibold text-[#15803D]">
              {wallet.connected ? `${shopAvailableTusd8.toFixed(2)} tUSD8` : 'Wallet disconnected'}
            </span>
          </div>

          <form onSubmit={openSupplierConfirmation} className="space-y-4">
            <div>
              <label
                htmlFor="supplier-select"
                className="block text-xs font-medium text-[#151619] mb-1.5"
              >
                Select Registered ERC-8004 Supplier
              </label>
              {suppliers.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#F5F7F5] border border-dashed border-[#E2E7E4] text-xs text-[#5C6260]">
                  No active suppliers found in recent directory blocks yet. Register one below or
                  resolve a supplier name on the right.
                </div>
              ) : (
                <select
                  id="supplier-select"
                  value={activePayeeName}
                  onChange={(e) => setSelectedSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E7E4] rounded-xl text-sm bg-[#F5F7F5]/60 text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.name} value={sup.name}>
                      {sup.name} ({sup.wallet.slice(0, 6)}...{sup.wallet.slice(-4)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="supplier-amount"
                  className="block text-xs font-medium text-[#151619] mb-1.5"
                >
                  Amount (tUSD8)
                </label>
                <input
                  id="supplier-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl font-mono tabular-nums text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="supplier-note"
                  className="block text-xs font-medium text-[#151619] mb-1.5"
                >
                  Invoice / Stock Note
                </label>
                <input
                  id="supplier-note"
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
                />
              </div>
            </div>

            {payFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  payFeedback.type === 'ok'
                    ? 'bg-[#E8FAF0] border-[#9FE8C3] text-[#151619]'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      payFeedback.type === 'ok' ? 'text-[#15803D]' : 'text-[#DC2626]'
                    }`}
                  />
                  <span>{payFeedback.text}</span>
                </div>
                {payFeedback.receipt && (
                  <button
                    type="button"
                    onClick={() => openReceipt(payFeedback.receipt!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E2E7E4] font-semibold text-[#151619] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>View Receipt</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!wallet.connected || (!activePayeeName && suppliers.length === 0)}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
            >
              Verify Payee &amp; Pay Supplier
            </button>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#15803D]" />
              <h2 className="text-base font-semibold text-[#151619]">
                Live On-Chain ERC-8004 Resolver
              </h2>
            </div>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Enter exact registered name on ERC8004Registry"
                className="flex-1 px-3.5 py-2.5 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
              />
              <button
                type="submit"
                disabled={resolving || !lookupQuery.trim()}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {resolving ? 'Querying...' : 'Resolve'}
              </button>
            </form>

            {resolvedResult && (
              <div className="p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#636966]">resolve(&quot;{resolvedResult.queried}&quot;)</span>
                  <span
                    className={`font-semibold ${
                      resolvedResult.found ? 'text-[#15803D]' : 'text-[#B45309]'
                    }`}
                  >
                    {resolvedResult.found ? 'ERC-8004 Verified' : 'Not Found / Revoked'}
                  </span>
                </div>
                <p className="font-mono text-[#151619] break-all">
                  {resolvedResult.wallet ?? '0x0000000000000000000000000000000000000000'}
                </p>
                {resolvedResult.found && resolvedResult.identity?.category === 'supplier' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSupplierName(resolvedResult.identity!.name)}
                    className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                  >
                    Use as Payee →
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[#151619]">
              Session Supplier Settlements
            </h3>
            {supplierPayments.length === 0 ? (
              <p className="text-xs text-[#5C6260] py-4">
                No supplier tUSD8 transfers executed in this browser session yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E7E4]">
                {supplierPayments.map((sp) => (
                  <div
                    key={sp.id}
                    className="w-full py-2.5 flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <p className="font-semibold text-[#151619]">{sp.supplierName}</p>
                      <p className="text-[#5C6260]">{sp.itemNote}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono tabular-nums font-semibold text-[#15803D]">
                        {sp.amountUSD8.toFixed(2)} tUSD8
                      </p>
                      <a
                        href={`${QDAY_EXPLORER_URL}/tx/${sp.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-[#5C6260] hover:text-[#15803D]"
                      >
                        <span>{sp.txHash.slice(0, 10)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register New ERC-8004 Identity + Registry Directory */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#15803D]" />
            <h2 className="text-base font-semibold text-[#151619]">
              Register ERC-8004 Identity On-Chain
            </h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-[#151619] mb-1">
                Business / Entity Name (max 64 chars)
              </label>
              <input
                id="reg-name"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Pak Joko Distributor"
                maxLength={64}
                className="w-full px-3.5 py-2 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-cat"
                  className="block text-xs font-medium text-[#151619] mb-1"
                >
                  Category
                </label>
                <select
                  id="reg-cat"
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value as EntityCategory)}
                  className="w-full px-3 py-2 border border-[#E2E7E4] rounded-xl text-sm bg-[#F5F7F5]/60 text-[#151619]"
                >
                  <option value="supplier">Supplier / Wholesaler</option>
                  <option value="shop">Shop / Merchant</option>
                  <option value="lender">Liquidity Provider (LP)</option>
                  <option value="agent">AI Agent</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="reg-city"
                  className="block text-xs font-medium text-[#151619] mb-1"
                >
                  City / Location
                </label>
                <input
                  id="reg-city"
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl text-sm text-[#151619]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-type" className="block text-xs font-medium text-[#151619] mb-1">
                Business Type
              </label>
              <input
                id="reg-type"
                type="text"
                value={regType}
                onChange={(e) => setRegType(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E7E4] bg-[#F5F7F5]/60 rounded-xl text-sm text-[#151619]"
              />
            </div>

            {regFeedback && (
              <p
                className={`text-xs ${
                  regFeedback.type === 'ok' ? 'text-[#15803D] font-medium' : 'text-[#DC2626]'
                }`}
              >
                {regFeedback.text}
              </p>
            )}

            <button
              type="submit"
              disabled={!wallet.connected || registering}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
            >
              {registering ? 'Signing ERC8004Registry.register...' : 'Register On-Chain'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E2E7E4] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E7E4] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#151619]">
              On-Chain ERC-8004 Directory
            </h2>
            <span className="text-xs font-mono text-[#636966]">
              {identities.filter((i) => i.active).length} active entities
            </span>
          </div>

          {identities.length === 0 ? (
            <div className="py-12 px-6 text-center text-sm text-[#5C6260]">
              No ERC-8004 entities discovered in recent QDay blocks yet. Register a supplier or shop
              on the left to add the first record!
            </div>
          ) : (
            <div className="divide-y divide-[#E2E7E4]">
              {identities.map((id) => {
                const isOwner =
                  wallet.connected &&
                  wallet.address &&
                  id.wallet.toLowerCase() === wallet.address.toLowerCase();
                return (
                  <div
                    key={id.name}
                    className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F5F7F5]/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className={`w-4 h-4 shrink-0 ${
                            id.active ? 'text-[#15803D]' : 'text-[#636966]'
                          }`}
                        />
                        <p className="text-sm font-semibold text-[#151619]">{id.name}</p>
                        {!id.active && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                            Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5C6260] mt-0.5">
                        {id.category} · {id.metadata.businessType}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={`${QDAY_EXPLORER_URL}/address/${id.wallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D]"
                      >
                        {id.wallet.slice(0, 8)}...{id.wallet.slice(-6)}
                      </a>
                      {isOwner && id.active && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(id.name)}
                          disabled={revokingName === id.name}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{revokingName === id.name ? 'Revoking...' : 'Revoke'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmationOfPayeeModal
        open={Boolean(copSupplier)}
        title="Supplier Confirmation of Payee"
        actionLabel="Confirm & Send tUSD8"
        entity={copSupplier}
        amountUSD8={Number(payAmount) || 0}
        isSubmitting={paying}
        summaryRows={[
          { label: 'Payer Shop', value: activeShopName },
          { label: 'Invoice Note', value: itemNote || 'Shop inventory restock' },
          { label: 'Settlement Token', value: 'tUSD8 (6 decimals)' },
        ]}
        onConfirm={confirmSupplierPayment}
        onClose={() => setCopSupplier(null)}
      />
    </AppShell>
  );
}
