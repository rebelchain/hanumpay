"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Wallet,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  DocHeading,
  extractMarkdownHeadings,
  GitBookCodeBlock,
  GitBookMarkdownRenderer,
} from "@/components/docs/GitBookView";
import {
  HANUMPAY_BLUEPRINTS,
  HACKATHON_ROADMAP,
} from "@/lib/hanumpay-blueprints";
import { useHanumPay } from "@/lib/hanumpay-store";
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
} from "@/lib/qday";

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

type DocPageId =
  | "readiness"
  | "deployments"
  | "roadmap"
  | (typeof HANUMPAY_BLUEPRINTS)[number]["id"];

interface GitBookNavEntry {
  id: DocPageId;
  group: "Getting Started" | "Protocol Blueprints" | "Smart Contracts";
  label: string;
  subtitle: string;
  kind: "interactive" | "markdown" | "code";
}

const GUIDE_PAGES: GitBookNavEntry[] = [
  {
    id: "readiness",
    group: "Getting Started",
    label: "Aevum Readiness & Setup",
    subtitle: "Wallet, network, tQDAY/tUSD8 checks & QDay gotchas",
    kind: "interactive",
  },
  {
    id: "deployments",
    group: "Getting Started",
    label: "QDay Contracts & CLI",
    subtitle: "Block 3310882 addresses & Foundry quickstart",
    kind: "interactive",
  },
  {
    id: "roadmap",
    group: "Getting Started",
    label: "25-Day Execution Plan",
    subtitle: "Milestones from Stage 1 to DoraHacks submission",
    kind: "interactive",
  },
  ...HANUMPAY_BLUEPRINTS.map((bp) => ({
    id: bp.id as DocPageId,
    group: (bp.category === "docs"
      ? "Protocol Blueprints"
      : "Smart Contracts") as "Protocol Blueprints" | "Smart Contracts",
    label: bp.filename.split("/").pop() || bp.title,
    subtitle: bp.description,
    kind: (bp.category === "docs" ? "markdown" : "code") as "markdown" | "code",
  })),
];

const DEPLOYED_TABLE = [
  {
    name: "ERC8004Registry.sol",
    role: "Confirmation of Payee & Credit Passport Registry",
    address:
      DEPLOYED_CONTRACTS.erc8004 ||
      "0x5533628fE8bFa8A6227C69cca8F7E96e578709c9",
  },
  {
    name: "SalesLedger.sol",
    role: "Gasless EIP-712 QR Sales & 30d Sybil Filter",
    address:
      DEPLOYED_CONTRACTS.salesLedger ||
      "0xbFCe0404F4abbe73Bf4eDB2e0E7F7a0e69d33BE5",
  },
  {
    name: "LoanPool.sol",
    role: "tUSD8 Community Pool, 80% Cap & 10% Auto-Repay",
    address:
      DEPLOYED_CONTRACTS.loanPool ||
      "0x5FcF8175bc41B584322Af65979013AbB6FecA6DB",
  },
  {
    name: "AIGuarantor.sol",
    role: "Contract-Bounded AI Proposal Agent ($500 / 10-day Cap)",
    address:
      DEPLOYED_CONTRACTS.aiGuarantor ||
      "0x35E37e86b7676FEA5fb4704b5ce6C015492c1d64",
  },
];

export default function DocsAndContractsPage() {
  const { wallet, connectQDayWallet, refreshWalletBalances } = useHanumPay();
  const [selectedId, setSelectedId] = useState<DocPageId>("readiness");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyContent(id: string, text: string) {
    await navigator.clipboard?.writeText(text).catch(() => null);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  const allDeployed = Boolean(
    DEPLOYED_CONTRACTS.erc8004 &&
    DEPLOYED_CONTRACTS.salesLedger &&
    DEPLOYED_CONTRACTS.loanPool &&
    DEPLOYED_CONTRACTS.aiGuarantor,
  );

  const isCorrectNetwork = wallet.connected && wallet.chainId === QDAY_CHAIN_ID;
  const hasGasBalance = wallet.connected && parseFloat(wallet.tqdayBalance) > 0;
  const hasTusd8Balance =
    wallet.connected && parseFloat(wallet.tusd8Balance.replace(/,/g, "")) > 0;

  const readinessItems = [
    {
      id: "wallet",
      title: "1. Wallet connected",
      detail:
        "Connect MetaMask, Rabby, or any browser EVM wallet using the top-right button.",
      status: wallet.connected ? ("pass" as const) : ("fail" as const),
      valueLabel:
        wallet.connected && wallet.address
          ? shortenAddress(wallet.address)
          : "not connected",
    },
    {
      id: "network",
      title: "2. Network",
      detail: `Requires QDay Aevum Testnet (Chain ID ${QDAY_CHAIN_ID} / ${QDAY_CHAIN_ID_HEX}).`,
      status: !wallet.connected
        ? ("idle" as const)
        : isCorrectNetwork
          ? ("pass" as const)
          : ("fail" as const),
      valueLabel: !wallet.connected
        ? "—"
        : isCorrectNetwork
          ? "QDay Aevum (44005)"
          : `Wrong chain (${wallet.chainId ?? "?"})`,
    },
    {
      id: "tqday",
      title: "3. Gas (tQDAY)",
      detail:
        "Pays for direct transactions. Gasless EIP-712 checkout does not require tQDAY.",
      status: !wallet.connected
        ? ("idle" as const)
        : hasGasBalance
          ? ("pass" as const)
          : ("fail" as const),
      valueLabel: wallet.connected ? `${wallet.tqdayBalance} tQDAY` : "—",
    },
    {
      id: "tusd8",
      title: "4. tUSD8 balance",
      detail:
        "Stablecoin used for QR checkout and MSME working capital (6 decimals).",
      status: !wallet.connected
        ? ("idle" as const)
        : hasTusd8Balance
          ? ("pass" as const)
          : ("fail" as const),
      valueLabel: wallet.connected ? `${wallet.tusd8Balance} tUSD8` : "—",
    },
    {
      id: "contracts",
      title: "5. HanumPay contracts",
      detail: allDeployed
        ? "All four contracts deployed at Block 3310882 and reachable on QDay Aevum Testnet."
        : "Operating in Relayer Simulation Mode until contract addresses are configured.",
      status: allDeployed ? ("pass" as const) : ("idle" as const),
      valueLabel: allDeployed
        ? shortenAddress(DEPLOYED_CONTRACTS.salesLedger)
        : "Simulation Mode",
    },
  ];

  const readyCount = readinessItems.filter(
    (item) => item.status === "pass",
  ).length;
  const remainingCount = readinessItems.length - readyCount;

  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return GUIDE_PAGES;
    return GUIDE_PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.group.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const currentIdx = GUIDE_PAGES.findIndex((p) => p.id === selectedId);
  const currentEntry = GUIDE_PAGES[currentIdx] ?? GUIDE_PAGES[0];
  const prevEntry = currentIdx > 0 ? GUIDE_PAGES[currentIdx - 1] : null;
  const nextEntry =
    currentIdx < GUIDE_PAGES.length - 1 ? GUIDE_PAGES[currentIdx + 1] : null;

  const activeBlueprint =
    HANUMPAY_BLUEPRINTS.find((b) => b.id === selectedId) ?? null;

  const outlineHeadings: DocHeading[] = useMemo(() => {
    if (selectedId === "readiness") {
      return [
        { id: "wallet-status", text: "Wallet & Relayer Status", level: 2 },
        {
          id: "readiness-check",
          text: "Aevum Readiness Check (5/5)",
          level: 2,
        },
        { id: "gotchas", text: "Known Gotchas & Wallet SDK", level: 2 },
      ];
    }
    if (selectedId === "deployments") {
      return [
        {
          id: "deployed-addresses",
          text: "Deployed Addresses (44005)",
          level: 2,
        },
        { id: "foundry-cli", text: "Foundry Quickstart CLI", level: 2 },
      ];
    }
    if (selectedId === "roadmap") {
      return [{ id: "execution-stages", text: "5 Hackathon Stages", level: 2 }];
    }
    if (activeBlueprint && activeBlueprint.category === "docs") {
      return extractMarkdownHeadings(activeBlueprint.content);
    }
    return [
      {
        id: "source-code",
        text: activeBlueprint?.filename ?? "Source Code",
        level: 2,
      },
    ];
  }, [activeBlueprint, selectedId]);

  const groups: Array<
    "Getting Started" | "Protocol Blueprints" | "Smart Contracts"
  > = ["Getting Started", "Protocol Blueprints", "Smart Contracts"];

  return (
    <AppShell
      title="GitBook Docs & Contracts"
      subtitle="Interactive QDay Aevum documentation, readiness verification, rendered protocol blueprints, and Solidity source."
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left GitBook Table of Contents Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-[#E2E7E4] rounded-2xl p-4 space-y-4 lg:sticky lg:top-20">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#636966] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              aria-label="Search GitBook documentation"
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#F5F7F5] border border-[#E2E7E4] rounded-xl text-[#151619] placeholder:text-[#636966] focus:outline-none focus:ring-2 focus:ring-[#151619]"
            />
          </div>

          <nav
            aria-label="Documentation chapters"
            className="space-y-4 max-h-[65vh] overflow-y-auto pr-0.5"
          >
            {groups.map((grp) => {
              const entries = filteredPages.filter((p) => p.group === grp);
              if (entries.length === 0) return null;
              return (
                <div key={grp} className="space-y-1">
                  <p className="px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#636966]">
                    {grp}
                  </p>
                  {entries.map((entry) => {
                    const active = entry.id === selectedId;
                    const Icon =
                      entry.kind === "code"
                        ? Code2
                        : entry.kind === "markdown"
                          ? FileText
                          : BookOpen;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          active
                            ? "bg-[#E8FAF0] text-[#151619] font-semibold ring-1 ring-[#9FE8C3]"
                            : "text-[#5C6260] hover:bg-[#F5F7F5] hover:text-[#151619]"
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? "text-[#15803D]" : "text-[#636966]"
                          }`}
                        />
                        <span className="truncate">{entry.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Center GitBook Reading Canvas */}
        <article className="flex-1 min-w-0 w-full bg-white border border-[#E2E7E4] rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Chapter Breadcrumb & Header */}
          <div className="border-b border-[#E2E7E4] pb-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#636966]">
                <span>Docs</span>
                <span>/</span>
                <span>{currentEntry.group}</span>
                <span>/</span>
                <span className="text-[#15803D] font-semibold">
                  {currentEntry.label}
                </span>
              </div>
              {activeBlueprint && (
                <button
                  type="button"
                  onClick={() =>
                    copyContent(activeBlueprint.id, activeBlueprint.content)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#151619] bg-[#F5F7F5] hover:bg-[#E8FAF0] border border-[#E2E7E4] rounded-lg cursor-pointer"
                >
                  {copiedId === activeBlueprint.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#5C6260]" />
                      <span>Copy Raw</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#151619]">
              {activeBlueprint ? activeBlueprint.title : currentEntry.label}
            </h2>
            <p className="text-sm text-[#5C6260]">{currentEntry.subtitle}</p>
          </div>

          {/* Interactive Page 1: Aevum Readiness & Setup */}
          {selectedId === "readiness" && (
            <div className="space-y-8">
              <section id="wallet-status" className="scroll-mt-20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#151619]">
                      Wallet &amp; Relayer Status
                    </h3>
                    <p className="text-xs text-[#5C6260] mt-0.5 font-mono">
                      Chain {QDAY_CHAIN_ID} ({QDAY_CHAIN_ID_HEX}) ·{" "}
                      {QDAY_RPC_URL} · EVM {QDAY_EVM_VERSION}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={QDAY_FAUCET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#151619] border border-[#E2E7E4] bg-[#F5F7F5] rounded-xl hover:bg-[#E8FAF0] min-h-[38px]"
                    >
                      <span>Claim Faucet (1 tQDAY / 5 tUSD8)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {wallet.connected ? (
                      <button
                        type="button"
                        onClick={refreshWalletBalances}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#151619] rounded-xl hover:bg-[#24282D] min-h-[38px] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Balances</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={connectQDayWallet}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#151619] rounded-xl hover:bg-[#24282D] min-h-[38px] cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5 text-[#9FE8C3]" />
                        <span>Connect QDay Testnet</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4]">
                    <p className="text-xs text-[#636966]">tUSD8 (6 decimals)</p>
                    <p className="font-mono text-xs text-[#151619] break-all mt-1">
                      {TUSD8_CONTRACT.address}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4]">
                    <p className="text-xs text-[#636966]">tQDAY Balance</p>
                    <p className="font-mono tabular-nums text-base font-semibold text-[#151619] mt-1">
                      {wallet.connected ? wallet.tqdayBalance : "Not connected"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4]">
                    <p className="text-xs text-[#636966]">tUSD8 Balance</p>
                    <p className="font-mono tabular-nums text-base font-semibold text-[#15803D] mt-1">
                      {wallet.connected ? wallet.tusd8Balance : "Not connected"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#E8FAF0] border border-[#9FE8C3]">
                    <p className="text-xs text-[#15803D] font-medium">
                      Contract Mode
                    </p>
                    <p className="font-mono text-xs font-semibold text-[#151619] mt-1">
                      {allDeployed
                        ? "Live On-Chain (Block 3310882)"
                        : "Relayer Simulation Mode"}
                    </p>
                  </div>
                </div>
              </section>

              <section id="readiness-check" className="scroll-mt-20 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-[#E2E7E4] pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#151619]">
                      5-Step Aevum Readiness Check
                    </h3>
                    <p className="text-xs text-[#5C6260]">
                      Verifies browser wallet, Chain 44005, gas/stablecoin
                      balances, and contracts.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono tabular-nums text-xl font-semibold text-[#151619]">
                      {readyCount}{" "}
                      <span className="text-sm font-normal text-[#636966]">
                        / 5
                      </span>
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${
                        remainingCount === 0
                          ? "text-[#15803D]"
                          : "text-[#B45309]"
                      }`}
                    >
                      {remainingCount === 0
                        ? "Fully ready!"
                        : `${remainingCount} items to verify`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {readinessItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4]"
                    >
                      <div className="flex items-start gap-2.5">
                        {item.status === "pass" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                        ) : item.status === "fail" ? (
                          <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#636966]/40 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-[#151619]">
                            {item.title}
                          </p>
                          <p className="text-xs text-[#5C6260] mt-0.5 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-[11px] shrink-0 text-right ${
                          item.status === "pass"
                            ? "text-[#15803D] font-semibold"
                            : item.status === "fail"
                              ? "text-[#DC2626] font-semibold"
                              : "text-[#636966]"
                        }`}
                      >
                        {item.valueLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section id="gotchas" className="scroll-mt-20 space-y-4">
                <div className="p-4 rounded-xl bg-[#E8FAF0] border border-[#9FE8C3] space-y-2">
                  <div className="flex items-center gap-2 text-[#15803D]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <h3 className="text-sm font-semibold text-[#151619]">
                      Wallet Integration: Active EOA vs Q1 2027 SDK
                    </h3>
                  </div>
                  <p className="text-xs text-[#5C6260] leading-relaxed">
                    Official{" "}
                    <code className="font-mono text-[#151619]">
                      @qday-io/sdk
                    </code>{" "}
                    and{" "}
                    <code className="font-mono text-[#151619]">
                      @qday-io/cli
                    </code>{" "}
                    packages launch in{" "}
                    <strong className="text-[#151619]">Q1 2027</strong>.
                    HanumPay uses the active path today: standard{" "}
                    <strong className="text-[#151619]">EOA wallets</strong>{" "}
                    (MetaMask/Rabby via{" "}
                    <code className="font-mono">window.ethereum</code> +
                    EIP-3085{" "}
                    <code className="font-mono">{QDAY_CHAIN_ID_HEX}</code>)
                    paired with{" "}
                    <strong className="text-[#151619]">gasless EIP-712</strong>{" "}
                    relayers.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F7F5] border border-[#E2E7E4] space-y-2.5">
                  <div className="flex items-center gap-2 text-[#B45309]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <h3 className="text-sm font-semibold text-[#151619]">
                      Known Gotchas on QDay Aevum
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#5C6260] leading-relaxed list-disc pl-4 marker:text-[#15803D]">
                    <li>
                      <strong className="text-[#151619]">
                        EVM {QDAY_EVM_VERSION}:
                      </strong>{" "}
                      <code className="font-mono">contracts/foundry.toml</code>{" "}
                      locks{" "}
                      <code className="font-mono">
                        evm_version = &quot;shanghai&quot;
                      </code>{" "}
                      to prevent <code className="font-mono">MCOPY</code>{" "}
                      opcodes.
                    </li>
                    <li>
                      <strong className="text-[#151619]">
                        HTTPS Polling Only:
                      </strong>{" "}
                      Poll <code className="font-mono">{QDAY_RPC_URL}</code>{" "}
                      over HTTPS; no <code className="font-mono">wss://</code>{" "}
                      endpoints exist on Aevum Testnet.
                    </li>
                    <li>
                      <strong className="text-[#151619]">
                        eth_getLogs 1,000-block limit:
                      </strong>{" "}
                      Always query events via{" "}
                      <code className="font-mono">getLogsChunked</code> in{" "}
                      <code className="font-mono">lib/qday.ts</code>.
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          )}

          {/* Interactive Page 2: Deployed Contracts & Foundry CLI */}
          {selectedId === "deployments" && (
            <div className="space-y-8">
              <section
                id="deployed-addresses"
                className="scroll-mt-20 space-y-3"
              >
                <h3 className="text-base font-semibold text-[#151619]">
                  Deployed Contracts on QDay Aevum (Block 3310882)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#E2E7E4]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F5F7F5] border-b border-[#E2E7E4] text-xs font-semibold text-[#151619]">
                        <th className="py-2.5 px-4">Contract</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Address (Chain 44005)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E7E4] text-xs">
                      {DEPLOYED_TABLE.map((row) => (
                        <tr key={row.name} className="hover:bg-[#F5F7F5]/60">
                          <td className="py-3 px-4 font-mono font-semibold text-[#151619] whitespace-nowrap">
                            {row.name}
                          </td>
                          <td className="py-3 px-4 text-[#5C6260]">
                            {row.role}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <a
                                href={`${QDAY_EXPLORER_URL}/address/${row.address}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#15803D] hover:underline"
                              >
                                {shortenAddress(row.address)}
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  copyContent(row.name, row.address)
                                }
                                className="p-1 rounded border border-[#E2E7E4] hover:bg-[#E8FAF0] cursor-pointer"
                                aria-label={`Copy ${row.name} address`}
                              >
                                {copiedId === row.name ? (
                                  <Check className="w-3 h-3 text-[#15803D]" />
                                ) : (
                                  <Copy className="w-3 h-3 text-[#636966]" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="foundry-cli" className="scroll-mt-20 space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#15803D]" />
                  <h3 className="text-base font-semibold text-[#151619]">
                    Foundry Quickstart (Compile, Test &amp; Deploy)
                  </h3>
                </div>
                <GitBookCodeBlock
                  code={FOUNDRY_COMMANDS}
                  language="bash"
                  filename="contracts/foundry.toml · Deploy.s.sol"
                />
              </section>
            </div>
          )}

          {/* Interactive Page 3: 25-Day Execution Roadmap */}
          {selectedId === "roadmap" && (
            <section id="execution-stages" className="scroll-mt-20 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {HACKATHON_ROADMAP.map((stage, idx) => (
                  <div
                    key={stage.phase}
                    className={`p-4 rounded-xl border space-y-2 ${
                      idx === 3
                        ? "bg-[#E8FAF0] border-[#9FE8C3]"
                        : "bg-[#F5F7F5] border-[#E2E7E4]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#15803D]">
                        {stage.phase}
                      </p>
                      <p className="text-[11px] font-mono text-[#636966]">
                        {stage.dates}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#151619]">
                      {stage.focus}
                    </p>
                    <ul className="space-y-1 pt-1">
                      {stage.tasks.map((t) => (
                        <li
                          key={t}
                          className="text-xs text-[#5C6260] leading-relaxed"
                        >
                          · {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rendered Markdown Blueprint Pages */}
          {activeBlueprint && activeBlueprint.category === "docs" && (
            <GitBookMarkdownRenderer content={activeBlueprint.content} />
          )}

          {/* Clean Light Solidity / Script Code Pages */}
          {activeBlueprint && activeBlueprint.category === "contracts" && (
            <div id="source-code" className="scroll-mt-20">
              <GitBookCodeBlock
                code={activeBlueprint.content}
                language="solidity"
                filename={activeBlueprint.filename}
              />
            </div>
          )}

          {/* GitBook Previous / Next Chapter Cards */}
          <div className="pt-6 border-t border-[#E2E7E4] grid sm:grid-cols-2 gap-3">
            {prevEntry ? (
              <button
                type="button"
                onClick={() => setSelectedId(prevEntry.id)}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#E2E7E4] bg-[#F5F7F5]/60 hover:bg-[#E8FAF0]/70 hover:border-[#9FE8C3] text-left transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#636966] shrink-0" />
                <div className="min-w-0 flex-1 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#636966]">
                    Previous
                  </p>
                  <p className="text-xs font-semibold text-[#151619] truncate mt-0.5">
                    {prevEntry.label}
                  </p>
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextEntry ? (
              <button
                type="button"
                onClick={() => setSelectedId(nextEntry.id)}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#E2E7E4] bg-[#F5F7F5]/60 hover:bg-[#E8FAF0]/70 hover:border-[#9FE8C3] text-left transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#636966]">
                    Next
                  </p>
                  <p className="text-xs font-semibold text-[#151619] truncate mt-0.5">
                    {nextEntry.label}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#15803D] shrink-0" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </article>

        {/* Right "On This Page" GitBook Outline Rail */}
        <aside className="hidden xl:block w-52 shrink-0 space-y-4 sticky top-20">
          <div className="bg-white border border-[#E2E7E4] rounded-2xl p-4 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#636966]">
              On this page
            </p>
            <ul className="space-y-2 border-l border-[#E2E7E4] pl-3">
              {outlineHeadings.map((h) => (
                <li key={h.id} className={h.level === 3 ? "pl-2.5" : ""}>
                  <a
                    href={`#${h.id}`}
                    className="block text-xs text-[#5C6260] hover:text-[#15803D] transition-colors leading-snug"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#F5F7F5] border border-[#E2E7E4] rounded-2xl p-4 space-y-2 text-xs">
            <p className="font-semibold text-[#151619]">QDay Aevum Links</p>
            <a
              href={QDAY_EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-[#15803D] hover:underline"
            >
              <span>Block Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={QDAY_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-[#15803D] hover:underline"
            >
              <span>Testnet Faucet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
