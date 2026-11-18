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
  XCircle,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import ConfirmationOfPayeeModal from '@/components/ConfirmationOfPayeeModal';
import TechnicalDetailsToggle from '@/components/TechnicalDetailsToggle';
import { useHanumPay } from '@/lib/hanumpay-store';
import { EntityCategory, ERC8004Identity, VerifiableReceipt } from '@/lib/hanumpay-types';
import { QDAY_EXPLORER_URL, shortenAddress } from '@/lib/qday-constants';

const ROLE_LABELS: Record<EntityCategory, string> = {
  supplier: 'Verified Supplier',
  shop: 'Shop / Merchant',
  lender: 'Community Lender',
  agent: 'Credit Helper',
};

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

  // Live business verification lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolvedResult, setResolvedResult] = useState<{
    queried: string;
    found: boolean;
    wallet: `0x${string}` | null;
    identity?: ERC8004Identity;
  } | null>(null);

  // Business registration form
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
  const sampleNames = identities.filter((i) => i.active).slice(0, 3);
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');
  const activePayeeName = selectedSupplierName || suppliers[0]?.name || '';
  const [payAmount, setPayAmount] = useState('1.00');
  const [itemNote, setItemNote] = useState('Weekly stock restock');
  const [copSupplier, setCopSupplier] = useState<ERC8004Identity | null>(null);
  const [paying, setPaying] = useState(false);
  const [payFeedback, setPayFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
    receipt?: VerifiableReceipt;
  } | null>(null);

  async function runVerify(queryText: string) {
    const q = queryText.trim();
    if (!q) return;
    setLookupQuery(q);
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

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    await runVerify(lookupQuery);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    setRegFeedback(null);
    const res = await registerIdentity(regName, regCategory, regCity, regType);
    setRegistering(false);
    if (!res.ok) {
      setRegFeedback({ type: 'err', text: res.error ?? 'Could not register business.' });
    } else {
      const created = regName.trim();
      setRegFeedback({
        type: 'ok',
        text: `"${created}" is now listed in the verified directory.`,
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
      setRegFeedback({ type: 'err', text: res.error ?? 'Could not remove listing.' });
    } else {
      setRegFeedback({
        type: 'ok',
        text: `"${name}" has been marked inactive. Transfers to it are now blocked.`,
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
        text: 'Choose or verify an active supplier first.',
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
      setPayFeedback({ type: 'err', text: res.error ?? 'Payment could not be completed.' });
    } else {
      setPayFeedback({
        type: 'ok',
        text: `Paid $${amt.toFixed(2)} to verified supplier ${copSupplier.name}.`,
        receipt: res.receipt,
      });
    }
  }

  const parsedPayAmount = Number(payAmount) || 0;

  const verificationSteps = [
    {
      num: '1',
      title: 'Listed in official business directory',
      tech: 'ERC8004Registry · resolve(name)',
      passed: resolvedResult ? resolvedResult.found : null,
    },
    {
      num: '2',
      title: 'Active and not suspended',
      tech: 'active == true · revocation check',
      passed: resolvedResult ? Boolean(resolvedResult.found && resolvedResult.identity?.active !== false) : null,
    },
    {
      num: '3',
      title: 'Matches verified destination account',
      tech: resolvedResult?.wallet ? shortenAddress(resolvedResult.wallet) : '0x address verification',
      passed: resolvedResult ? Boolean(resolvedResult.found && resolvedResult.wallet) : null,
    },
    {
      num: '4',
      title: 'Protected against name impersonation',
      tech: 'Confirmation of Payee · safe transfer guard',
      passed: resolvedResult ? resolvedResult.found : null,
    },
  ];

  return (
    <AppShell
      group="Suppliers & Pool"
      title="Pay & Verify"
      headlineLead="Check the business,"
      headlineAccent="pay safely."
      subtitle="Verify any supplier name before sending money so your payment never goes to the wrong account."
    >
      {/* Mosaec-Style Top Verification Bar + 1-2-3-4 Checklist */}
      <div className="space-y-4">
        <div className="bg-white border border-[#E2E7E4] rounded-2xl p-4 sm:p-5 space-y-3">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#636966] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Type any registered supplier or shop name..."
                className="w-full pl-11 pr-4 py-3 bg-[#F7F8F9] border border-[#E2E7E4] rounded-full text-sm text-[#151619] placeholder:text-[#636966] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[46px]"
              />
            </div>
            <button
              type="submit"
              disabled={resolving || !lookupQuery.trim()}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-full whitespace-nowrap min-h-[46px] cursor-pointer disabled:opacity-50"
            >
              {resolving ? 'Checking...' : 'Verify'}
            </button>
          </form>

          {sampleNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-[#636966]">
              <span>Try:</span>
              {sampleNames.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => void runVerify(item.name)}
                  className="px-3 py-1 rounded-full border border-[#E2E7E4] bg-[#F7F8F9] hover:bg-[#E8FAF0] text-[#151619] font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E7E4] flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-[#151619]">What This Check Verifies</h2>
            {resolvedResult ? (
              <span
                className={`text-xs font-semibold ${
                  resolvedResult.found ? 'text-[#15803D]' : 'text-[#DC2626]'
                }`}
              >
                {resolvedResult.found
                  ? `Verified · ${resolvedResult.queried}`
                  : `Not Found · ${resolvedResult.queried}`}
              </span>
            ) : (
              <span className="text-xs text-[#636966]">Live Directory Check</span>
            )}
          </div>

          <div className="divide-y divide-[#E2E7E4]">
            {verificationSteps.map((step) => (
              <div
                key={step.num}
                className="px-6 py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-[#F7F8F9] border border-[#E2E7E4] text-xs font-mono font-semibold text-[#151619] flex items-center justify-center shrink-0">
                    {step.num}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#151619]">{step.title}</p>
                    <p className="text-[11px] font-mono text-[#636966] truncate">{step.tech}</p>
                  </div>
                </div>
                {step.passed === true && (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                )}
                {step.passed === false && (
                  <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                )}
              </div>
            ))}
          </div>

          {resolvedResult?.found && resolvedResult.identity?.category === 'supplier' && (
            <div className="px-6 py-3.5 bg-[#E8FAF0]/70 border-t border-[#9FE8C3] flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-[#151619]">
                <strong>{resolvedResult.identity.name}</strong> is verified and ready to receive
                payments.
              </span>
              <button
                type="button"
                onClick={() => setSelectedSupplierName(resolvedResult.identity!.name)}
                className="text-xs font-semibold text-[#15803D] hover:underline whitespace-nowrap cursor-pointer"
              >
                Select for Payment ↓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pay Verified Supplier + Recent Payments */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#151619]">Pay a Supplier</h2>
              <p className="text-xs text-[#5C6260] mt-0.5">
                Every payment shows a confirmation screen before money leaves your shop
              </p>
            </div>
            <Truck className="w-5 h-5 text-[#15803D] shrink-0" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#151619] text-white flex items-center justify-between text-sm">
            <span className="text-white/75">Available Balance</span>
            <span className="font-mono tabular-nums font-semibold text-[#9FE8C3]">
              {wallet.connected ? `$${shopAvailableTusd8.toFixed(2)}` : 'Connect account'}
            </span>
          </div>

          <form onSubmit={openSupplierConfirmation} className="space-y-4">
            <div>
              <label
                htmlFor="supplier-select"
                className="block text-xs font-medium text-[#151619] mb-1.5"
              >
                Choose Verified Supplier
              </label>
              {suppliers.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#F7F8F9] border border-dashed border-[#E2E7E4] text-xs text-[#5C6260]">
                  No active suppliers listed yet. Add one below or search by name above.
                </div>
              ) : (
                <select
                  id="supplier-select"
                  value={activePayeeName}
                  onChange={(e) => setSelectedSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E7E4] rounded-xl text-sm bg-[#F7F8F9] text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[44px]"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.name} value={sup.name}>
                      {sup.name} ({sup.metadata.city || 'Verified'})
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
                  Amount (USD)
                </label>
                <input
                  id="supplier-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl font-mono tabular-nums text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[44px]"
                  required
                />
                {parsedPayAmount > 0 && (
                  <p className="text-[11px] font-mono tabular-nums text-[#636966] mt-1">
                    ≈ Rp {Math.round(parsedPayAmount * 15800).toLocaleString('en-US')}
                  </p>
                )}
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
                  className="w-full px-3.5 py-2.5 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619] min-h-[44px]"
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
                    <span>Receipt</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!wallet.connected || (!activePayeeName && suppliers.length === 0)}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#151619] hover:bg-[#24282D] rounded-xl transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
            >
              Review &amp; Pay Supplier
            </button>
          </form>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#151619]">Recent Supplier Payments</h3>
          {supplierPayments.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-[#E2E7E4] rounded-xl bg-[#F7F8F9]">
              <p className="text-xs text-[#5C6260]">
                No supplier payments sent during this session yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E7E4]">
              {supplierPayments.map((sp) => (
                <div
                  key={sp.id}
                  className="w-full py-3 flex items-center justify-between text-xs gap-3"
                >
                  <div>
                    <p className="font-semibold text-[#151619] text-sm">{sp.supplierName}</p>
                    <p className="text-[#5C6260]">{sp.itemNote}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono tabular-nums font-semibold text-[#15803D] text-sm">
                      ${sp.amountUSD8.toFixed(2)}
                    </p>
                    <a
                      href={`${QDAY_EXPLORER_URL}/tx/${sp.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#5C6260] hover:text-[#15803D]"
                    >
                      <span>Proof</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Business + Verified Directory */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E2E7E4] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#15803D]" />
            <h2 className="text-base font-semibold text-[#151619]">Add a Verified Business</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-[#151619] mb-1">
                Business Name (max 64 characters)
              </label>
              <input
                id="reg-name"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Pak Joko Distributor"
                maxLength={64}
                className="w-full px-3.5 py-2 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl text-sm text-[#151619] focus:outline-none focus:ring-2 focus:ring-[#151619]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-cat"
                  className="block text-xs font-medium text-[#151619] mb-1"
                >
                  Role
                </label>
                <select
                  id="reg-cat"
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value as EntityCategory)}
                  className="w-full px-3 py-2 border border-[#E2E7E4] rounded-xl text-sm bg-[#F7F8F9] text-[#151619]"
                >
                  <option value="supplier">Supplier / Wholesaler</option>
                  <option value="shop">Shop / Merchant</option>
                  <option value="lender">Community Lender</option>
                  <option value="agent">Credit Helper</option>
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
                  className="w-full px-3 py-2 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl text-sm text-[#151619]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-type" className="block text-xs font-medium text-[#151619] mb-1">
                What They Sell / Do
              </label>
              <input
                id="reg-type"
                type="text"
                value={regType}
                onChange={(e) => setRegType(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E7E4] bg-[#F7F8F9] rounded-xl text-sm text-[#151619]"
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
              {registering ? 'Saving Listing...' : 'Add to Directory'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E2E7E4] rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-[#E2E7E4] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#151619]">Verified Directory</h2>
              <span className="text-xs text-[#636966]">
                {identities.filter((i) => i.active).length} active listings
              </span>
            </div>

            {identities.length === 0 ? (
              <div className="py-12 px-6 text-center text-sm text-[#5C6260]">
                No businesses found yet. Add a supplier or shop on the left to list the first one.
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
                      className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F7F8F9]/60 transition-colors"
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
                            <span className="text-[11px] font-semibold text-[#DC2626]">
                              · Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5C6260] mt-0.5">
                          {ROLE_LABELS[id.category]} · {id.metadata.businessType}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <a
                          href={`${QDAY_EXPLORER_URL}/address/${id.wallet}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-[#15803D] hover:underline"
                        >
                          {shortenAddress(id.wallet)}
                        </a>
                        {isOwner && id.active && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(id.name)}
                            disabled={revokingName === id.name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{revokingName === id.name ? 'Removing...' : 'Deactivate'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#E2E7E4]">
            <TechnicalDetailsToggle
              label="Technical Directory Standard"
              items={[
                { label: 'Identity Standard', value: 'ERC-8004 Confirmation of Payee' },
                { label: 'Verification Source', value: 'ERC8004Registry (QDay)' },
              ]}
            />
          </div>
        </div>
      </div>

      <ConfirmationOfPayeeModal
        open={Boolean(copSupplier)}
        title="Verify Supplier Before Paying"
        actionLabel="Confirm & Send Payment"
        entity={copSupplier}
        amountUSD8={parsedPayAmount}
        isSubmitting={paying}
        summaryRows={[
          { label: 'From Shop', value: activeShopName },
          { label: 'Note', value: itemNote || 'Inventory restock' },
        ]}
        onConfirm={confirmSupplierPayment}
        onClose={() => setCopSupplier(null)}
      />
    </AppShell>
  );
}
