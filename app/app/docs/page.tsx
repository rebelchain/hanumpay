'use client';

import React, { useState } from 'react';
import { Check, Copy, ExternalLink, RefreshCw, Terminal, Wallet } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { HANUMPAY_BLUEPRINTS, HACKATHON_ROADMAP } from '@/lib/hanumpay-blueprints';
import { useHanumPay } from '@/lib/hanumpay-store';
import {
  DEPLOYED_CONTRACTS,
  QDAY_CHAIN_ID,
  QDAY_EXPLORER_URL,
  QDAY_FAUCET_URL,
  QDAY_RPC_URL,
  TUSD8_CONTRACT,
} from '@/lib/qday';

const FOUNDRY_COMMANDS = `# 1. Pasang Foundry (sekali saja)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Kompilasi & jalankan tes Solidity di folder /contracts
cd contracts
forge build
forge test -vvv

# 3. Ekspor private key deployer & alamat dompet agen testnet (jangan pernah di-commit)
export DEPLOYER_PRIVATE_KEY=0xYOUR_DEPLOYER_KEY
export AGENT_WALLET_ADDRESS=0xYOUR_AGENT_PUBLIC_ADDRESS

# 4. Deploy keempat kontrak ke QDay Aevum Testnet (Chain ID 44005)
forge script script/Deploy.s.sol --rpc-url https://rpc-test.qday.info --broadcast --legacy`;

export default function DocsAndContractsPage() {
  const { wallet, connectQDayWallet, refreshWalletBalances } = useHanumPay();
  const [selectedId, setSelectedId] = useState(HANUMPAY_BLUEPRINTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeDoc =
    HANUMPAY_BLUEPRINTS.find((d) => d.id === selectedId) ?? HANUMPAY_BLUEPRINTS[0];

  async function copyContent(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  const allDeployed = Boolean(
    DEPLOYED_CONTRACTS.erc8004 &&
      DEPLOYED_CONTRACTS.salesLedger &&
      DEPLOYED_CONTRACTS.loanPool &&
      DEPLOYED_CONTRACTS.aiGuarantor
  );

  return (
    <AppShell
      title="Panduan Foundry, Dompet QDay &amp; Dokumen"
      subtitle="Alur deploy kontrak ke jaringan QDay, konfigurasi Relayer API, dan spesifikasi teknis HanumPay."
    >
      {/* QDay Aevum Testnet Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Status Dompet &amp; Relayer QDay Aevum Testnet
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chain ID {QDAY_CHAIN_ID} · RPC {QDAY_RPC_URL}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={QDAY_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[40px]"
            >
              <span>Klaim Faucet tQDAY / tUSD8</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {wallet.connected ? (
              <button
                type="button"
                onClick={refreshWalletBalances}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Saldo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={connectQDayWallet}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-lg hover:bg-emerald-700 min-h-[40px]"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Tambah &amp; Hubungkan QDay Testnet</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">Kontrak tUSD8 (6 desimal)</p>
            <p className="font-mono text-xs text-slate-900 break-all mt-1">
              {TUSD8_CONTRACT.address}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">Saldo tQDAY Langsung</p>
            <p className="font-mono tabular-nums text-lg font-bold text-slate-900 mt-1">
              {wallet.connected ? `${wallet.tqdayBalance}` : 'Belum terhubung'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">Saldo tUSD8 Langsung</p>
            <p className="font-mono tabular-nums text-lg font-bold text-[#16A34A] mt-1">
              {wallet.connected ? `${wallet.tusd8Balance}` : 'Belum terhubung'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">Mode Kontrak</p>
            <p className="font-mono text-xs font-semibold text-slate-900 mt-1">
              {allDeployed ? 'Terhubung On-Chain' : 'Mode Simulasi Relayer'}
            </p>
          </div>
        </div>
      </div>

      {/* Hardhat -> Foundry Step-by-Step Terminal Guide */}
      <div className="bg-[#030712] text-slate-100 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Panduan Cepat Foundry (Deploy ke QDay Testnet)
              </h2>
              <p className="text-xs text-slate-400">
                Keempat kontrak Solidity, Deploy.s.sol, dan HanumPay.t.sol sudah tersedia di folder /contracts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyContent('foundry-cli', FOUNDRY_COMMANDS)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg self-start sm:self-auto"
          >
            {copiedId === 'foundry-cli' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Perintah Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Perintah CLI</span>
              </>
            )}
          </button>
        </div>
        <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
          {FOUNDRY_COMMANDS}
        </pre>
      </div>

      {/* 25-Day Execution Roadmap */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Rencana Eksekusi Hackathon 25 Hari (16 Nov – 11 Des 2026)
            </h2>
            <p className="text-xs text-slate-500">
              Urutan kerja dari Kontrak Foundry → Relayer &amp; Cron → Antarmuka Web/Mobile → Pengumpulan DoraHacks
            </p>
          </div>
          <a
            href={QDAY_EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-[#2563EB] hover:underline"
          >
            Block Explorer QDay →
          </a>
        </div>

        <div className="grid md:grid-cols-5 gap-3">
          {HACKATHON_ROADMAP.map((stage) => (
            <div
              key={stage.phase}
              className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200 space-y-2"
            >
              <p className="text-xs font-semibold text-[#16A34A]">{stage.phase}</p>
              <p className="text-xs font-mono text-slate-500">{stage.dates}</p>
              <p className="text-xs text-slate-800 font-medium">{stage.focus}</p>
              <ul className="space-y-1 pt-1">
                {stage.tasks.map((t) => (
                  <li key={t} className="text-[11px] text-slate-600 leading-snug">
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Blueprint & Solidity Explorer */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-medium text-slate-500 px-1">
            Penjelajah Blueprint &amp; Kode Solidity
          </p>
          {HANUMPAY_BLUEPRINTS.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelectedId(doc.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                selectedId === doc.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <p className="text-xs font-mono opacity-75">{doc.filename}</p>
              <p className="text-sm font-semibold mt-0.5">{doc.title}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 bg-[#030712] text-slate-100 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-emerald-400">{activeDoc.filename}</p>
              <p className="text-xs text-slate-400 mt-0.5">{activeDoc.description}</p>
            </div>
            <button
              type="button"
              onClick={() => copyContent(activeDoc.id, activeDoc.content)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg shrink-0"
            >
              {copiedId === activeDoc.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin File</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs font-mono overflow-x-auto leading-relaxed text-slate-200 max-h-[540px]">
            {activeDoc.content}
          </pre>
        </div>
      </div>
    </AppShell>
  );
}
