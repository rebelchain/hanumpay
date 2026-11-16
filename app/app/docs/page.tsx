'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  RefreshCw,
  Terminal,
  Wallet,
  XCircle,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { HANUMPAY_BLUEPRINTS, HACKATHON_ROADMAP } from '@/lib/hanumpay-blueprints';
import { useHanumPay } from '@/lib/hanumpay-store';
import {
  DEPLOYED_CONTRACTS,
  QDAY_CHAIN_ID,
  QDAY_CHAIN_ID_HEX,
  QDAY_EVM_VERSION,
  QDAY_EXPLORER_URL,
  QDAY_FAUCET_URL,
  QDAY_RPC_URL,
  shortenAddress,
  TUSD8_CONTRACT,
} from '@/lib/qday';

const FOUNDRY_COMMANDS = `# 1. Install Foundry (one-time setup)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Verify foundry.toml targets evm_version = "shanghai" (pre-configured)
# Compile & run Solidity tests inside /contracts
cd contracts
forge build
forge test -vvv

# 3. Export deployer private key & testnet AI agent public address (never commit keys)
export DEPLOYER_PRIVATE_KEY=0xYOUR_DEPLOYER_KEY
export AGENT_WALLET_ADDRESS=0xYOUR_AGENT_PUBLIC_ADDRESS

# 4. Deploy all four contracts to QDay Aevum Testnet (Chain ID 44005)
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

  const isCorrectNetwork = wallet.connected && wallet.chainId === QDAY_CHAIN_ID;
  const hasGasBalance = wallet.connected && parseFloat(wallet.tqdayBalance) > 0;
  const hasTusd8Balance = wallet.connected && parseFloat(wallet.tusd8Balance.replace(/,/g, '')) > 0;

  const readinessItems = [
    {
      id: 'wallet',
      title: '1. Wallet connected',
      detail: 'Connect MetaMask, Rabby, or any browser EVM wallet using the top-right button.',
      status: wallet.connected ? ('pass' as const) : ('fail' as const),
      valueLabel: wallet.connected && wallet.address ? shortenAddress(wallet.address) : 'not connected',
    },
    {
      id: 'network',
      title: '2. Network',
      detail: `Requires QDay Aevum Testnet (Chain ID ${QDAY_CHAIN_ID} / ${QDAY_CHAIN_ID_HEX}).`,
      status: !wallet.connected
        ? ('idle' as const)
        : isCorrectNetwork
          ? ('pass' as const)
          : ('fail' as const),
      valueLabel: !wallet.connected
        ? '—'
        : isCorrectNetwork
          ? 'QDay Aevum (44005)'
          : `Wrong chain (${wallet.chainId ?? '?'})`,
    },
    {
      id: 'tqday',
      title: '3. Gas (tQDAY)',
      detail: 'Pays for direct transactions. Gasless EIP-712 checkout does not require tQDAY.',
      status: !wallet.connected
        ? ('idle' as const)
        : hasGasBalance
          ? ('pass' as const)
          : ('fail' as const),
      valueLabel: wallet.connected ? `${wallet.tqdayBalance} tQDAY` : '—',
    },
    {
      id: 'tusd8',
      title: '4. tUSD8 balance',
      detail: 'Stablecoin used for QR checkout and MSME working capital (6 decimals).',
      status: !wallet.connected
        ? ('idle' as const)
        : hasTusd8Balance
          ? ('pass' as const)
          : ('fail' as const),
      valueLabel: wallet.connected ? `${wallet.tusd8Balance} tUSD8` : '—',
    },
    {
      id: 'contracts',
      title: '5. HanumPay contracts',
      detail: allDeployed
        ? 'All four contracts deployed and reachable on QDay Aevum Testnet.'
        : 'Pending Stage 2 deploy. App operates seamlessly in Relayer Simulation Mode until deployed.',
      status: allDeployed ? ('pass' as const) : ('idle' as const),
      valueLabel: allDeployed ? shortenAddress(DEPLOYED_CONTRACTS.salesLedger) : 'Pending Stage 2',
    },
  ];

  const readyCount = readinessItems.filter((item) => item.status === 'pass').length;
  const remainingCount = readinessItems.length - readyCount;

  return (
    <AppShell
      title="Foundry Guide, QDay Wallet & Blueprints"
      subtitle="Aevum readiness checker, Solidity deployment workflow, EOA wallet integration, and protocol specs."
    >
      {/* QDay Aevum Testnet Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              QDay Aevum Testnet Wallet &amp; Relayer Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chain ID {QDAY_CHAIN_ID} ({QDAY_CHAIN_ID_HEX}) · RPC {QDAY_RPC_URL} · EVM {QDAY_EVM_VERSION}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={QDAY_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[40px]"
            >
              <span>Claim tQDAY / tUSD8 Faucet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {wallet.connected ? (
              <button
                type="button"
                onClick={refreshWalletBalances}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Balances</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={connectQDayWallet}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-lg hover:bg-emerald-700 min-h-[40px]"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Add &amp; Connect QDay Testnet</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">tUSD8 Contract (6 decimals)</p>
            <p className="font-mono text-xs text-slate-900 break-all mt-1">
              {TUSD8_CONTRACT.address}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">Live tQDAY Balance</p>
            <p className="font-mono tabular-nums text-lg font-bold text-slate-900 mt-1">
              {wallet.connected ? `${wallet.tqdayBalance}` : 'Not connected'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">Live tUSD8 Balance</p>
            <p className="font-mono tabular-nums text-lg font-bold text-[#16A34A] mt-1">
              {wallet.connected ? `${wallet.tusd8Balance}` : 'Not connected'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-slate-200">
            <p className="text-xs text-slate-500">Contract Mode</p>
            <p className="font-mono text-xs font-semibold text-slate-900 mt-1">
              {allDeployed ? 'Live On-Chain' : 'Relayer Simulation Mode'}
            </p>
          </div>
        </div>
      </div>

      {/* 5-Step Aevum Readiness Check + Known Gotchas & Wallet Integration */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#16A34A]">
                Step 0 · Before You Deploy
              </p>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                Is your setup ready for Aevum?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Checks your wallet, network, tQDAY/tUSD8 balances, and contract deployment status.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono tabular-nums text-xl font-bold text-slate-900">
                {readyCount} <span className="text-sm font-normal text-slate-400">/ 5</span>
              </p>
              <p className="text-[11px] font-medium text-amber-600">
                {remainingCount === 0 ? 'Fully ready!' : `${remainingCount} items to fix`}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {readinessItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3.5 rounded-lg bg-[#F9FAFB] border border-slate-200"
              >
                <div className="flex items-start gap-2.5">
                  {item.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  ) : item.status === 'fail' ? (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono text-[11px] shrink-0 text-right ${
                    item.status === 'pass'
                      ? 'text-[#16A34A] font-semibold'
                      : item.status === 'fail'
                        ? 'text-rose-600 font-medium'
                        : 'text-slate-400'
                  }`}
                >
                  {item.valueLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h2 className="text-base font-semibold text-slate-900">
                Known Gotchas on QDay Aevum
              </h2>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <li>
                · <strong className="text-slate-900">Compile with EVM {QDAY_EVM_VERSION}:</strong>{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                  contracts/foundry.toml
                </code>{' '}
                is locked to <code className="font-mono">evm_version = &quot;shanghai&quot;</code>.
                Default <code className="font-mono">cancun</code> builds deploy and then fail with{' '}
                <code className="font-mono">invalid opcode: MCOPY</code>.
              </li>
              <li>
                · <strong className="text-slate-900">No WebSocket RPC:</strong> Poll over HTTPS
                (<code className="font-mono">{QDAY_RPC_URL}</code>) only; never use{' '}
                <code className="font-mono">wss://</code> endpoints.
              </li>
              <li>
                · <strong className="text-slate-900">eth_getLogs 1,000-block limit:</strong> Use
                the <code className="font-mono">getLogsChunked</code> helper in{' '}
                <code className="font-mono">lib/qday.ts</code> so event queries do not exceed RPC bounds.
              </li>
              <li>
                · <strong className="text-slate-900">Explorer verification unavailable:</strong>{' '}
                Link your GitHub repository and deployed contract addresses in the hackathon submission.
              </li>
              <li>
                · <strong className="text-slate-900">Judging counts on-chain Aevum activity:</strong>{' '}
                After Stage 2 deploy, settle real test transactions on QDay Aevum (Chain ID 44005).
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Wallet Integration: Active EOA vs Q1 2027 SDK
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The official <code className="font-mono">@qday-io/sdk</code> and{' '}
              <code className="font-mono">@qday-io/cli</code> packages ship in{' '}
              <strong className="text-slate-900">Q1 2027</strong> (not yet published on npm).
              HanumPay uses the active path documented on QDay Wiki today: standard{' '}
              <strong className="text-slate-900">EOA wallets</strong> (MetaMask / Rabby via{' '}
              <code className="font-mono">window.ethereum</code> &amp; EIP-3085{' '}
              <code className="font-mono">{QDAY_CHAIN_ID_HEX}</code>) paired with{' '}
              <strong className="text-slate-900">gasless EIP-712</strong> relayer signatures.
            </p>
          </div>
        </div>
      </div>

      {/* Foundry Step-by-Step Terminal Guide */}
      <div className="bg-[#030712] text-slate-100 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Foundry Quickstart (Deploy to QDay Testnet)
              </h2>
              <p className="text-xs text-slate-400">
                All four Solidity contracts, Deploy.s.sol, and HanumPay.t.sol live inside /contracts
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
                <span>Commands Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy CLI Commands</span>
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
              25-Day Hackathon Execution Plan (Nov 16 – Dec 11, 2026)
            </h2>
            <p className="text-xs text-slate-500">
              Milestones from Foundry Contracts → Relayer &amp; Cron → Web/Mobile UI → DoraHacks Submission
            </p>
          </div>
          <a
            href={QDAY_EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-[#2563EB] hover:underline"
          >
            QDay Block Explorer →
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
            Blueprint &amp; Solidity Source Explorer
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
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
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
