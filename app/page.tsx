import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { QDAY_EXPLORER_URL, QDAY_FAUCET_URL, TUSD8_CONTRACT } from "@/lib/qday";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroCreditCalculator } from "@/components/landing/HeroCreditCalculator";
import { LiveTicker } from "@/components/landing/LiveTicker";
import { CreditRuler } from "@/components/landing/CreditRuler";
import {
  CompareCardInteractive,
  LiveEcosystemSplit,
} from "@/components/landing/LandingCompareAndEcosystem";
import { Reveal } from "@/components/landing/Reveal";
import {
  BandArcs,
  BlockPattern,
  CONTAINER,
  Eyebrow,
  H2,
  HeroBars,
  LaunchButton,
  RULE,
  SECTION_Y,
  SectionHead,
} from "@/components/landing/section";

const HOW_STEPS = [
  {
    num: "01",
    title: "Record QR sales with zero gas",
    body: "Every time a customer pays in tUSD8 at the counter, the POS hashes their identifier locally (keccak256) and relays an EIP-712 signature straight to SalesLedger.sol with zero tQDAY gas cost.",
  },
  {
    num: "02",
    title: "Sybil filter blocks wash trading",
    body: "Before any credit unlocks, SalesLedger.sol verifies at least 5 distinct customers over the trailing 30 days. Self-transfers from the same wallet or duplicate customer IDs are automatically rejected.",
  },
  {
    num: "03",
    title: "Contract-bound AI Guarantor",
    body: "AIGuarantor.sol caps working capital at 10% of 30-day QR sales (up to $500 tUSD8), locks a 5% flat fee, and checks the merchant pause kill switch before submitting a proposal.",
  },
  {
    num: "04",
    title: "Verified supplier pay & auto-repayment",
    body: "Credit funds pay whitelisted wholesale suppliers via ERC8004Registry.sol Confirmation of Payee. Every future QR sale automatically deducts 10% toward repayment until settled.",
  },
];

const SAFETY_PRINCIPLES = [
  {
    num: "01",
    title: "Immutable 5% flat fee cap",
    body: "LoanPool.sol reverts any AI proposal that attempts to raise the fee above 5% or alter the 10% auto-repayment split. Prompt-injection attacks fail deterministically at the EVM boundary.",
  },
  {
    num: "02",
    title: "Merchant-controlled AI Pause switch",
    body: "Shop owners hold sovereign control via AIGuarantor.setAgentPaused(true). When paused, new AI credit proposals are blocked on-chain while daily QR sales continue uninterrupted.",
  },
  {
    num: "03",
    title: "Auditable receipts & Credit Passport",
    body: "Every QR sale, credit disbursement, and wholesale supplier settlement issues a verifiable receipt tied directly to ERC-8004 identity records on QDay Chain ID 44005.",
  },
];

const CONTRACT_CARDS = [
  {
    tag: "REVENUE PROOF",
    name: "SalesLedger.sol",
    summary:
      "Stores gasless customer QR receipts with privacy-preserving keccak256 hashes so micro-merchants build verifiable on-chain cashflow.",
    stats: [
      { label: "Window", value: "30 days" },
      { label: "Unique buyers", value: "Min 5" },
      { label: "Ticket size", value: "$0.10–$500" },
      { label: "Gas cost", value: "Gasless (Relayer)" },
    ],
    href: "/app/penjualan",
    linkLabel: "Open QR cashier",
  },
  {
    tag: "BOUNDED AGENT",
    name: "AIGuarantor.sol",
    summary:
      "Proposes tUSD8 working capital strictly within deterministic contract ceilings while respecting the merchant pause kill switch.",
    stats: [
      { label: "Revenue ratio", value: "Max 10%" },
      { label: "Credit cap", value: "$500 tUSD8" },
      { label: "Daily quota", value: "10 / day" },
      { label: "Owner control", value: "AI Pause" },
    ],
    href: "/app/docs",
    linkLabel: "Test AI red-team",
  },
  {
    tag: "LIQUIDITY VAULT",
    name: "LoanPool.sol",
    summary:
      "Holds community LP tUSD8 liquidity, enforces an 80% utilization cap, and collects automatic 10% repayments from QR revenue.",
    stats: [
      { label: "Flat fee", value: "5.0% flat" },
      { label: "Utilization cap", value: "Max 80%" },
      { label: "Auto-repay", value: "10% / sale" },
      { label: "Late penalty", value: "0% forever" },
    ],
    href: "/app/pool",
    linkLabel: "Inspect pool",
  },
  {
    tag: "PAYEE CHECK",
    name: "ERC8004Registry.sol",
    summary:
      "Resolves verified wholesale supplier names against registered wallet addresses before funds move, preventing spoofing and mis-transfers.",
    stats: [
      { label: "Privacy", value: "keccak256" },
      { label: "Payee check", value: "Always on" },
      { label: "Identity", value: "ERC-8004" },
      { label: "Credit Passport", value: "On payoff" },
    ],
    href: "/app/identitas",
    linkLabel: "Browse directory",
  },
];

const BUILT_FOR_ITEMS = [
  { label: "Network", name: "QDay Aevum 44005" },
  { label: "Settlement", name: "tUSD8 Stablecoin" },
  { label: "Identity", name: "ERC-8004 Payee Check" },
  { label: "Gasless", name: "EIP-712 Relayer" },
  { label: "Security", name: "Foundry + Gemini Audit" },
];

const FAQS = [
  {
    q: "What is HanumPay in plain terms?",
    a: "HanumPay turns a small shop’s daily QR payment volume into an honest tUSD8 working-capital credit line with a 5% flat fee, 10% automatic repayment per sale, and ERC-8004 supplier Confirmation of Payee.",
  },
  {
    q: "How does up to $500 working capital unlock without physical collateral?",
    a: "AIGuarantor.sol reads SalesLedger.sol directly. Once a shop proves at least 5 distinct buyers over 30 days, its credit limit unlocks at 10% of trailing 30-day revenue, capped at $500 tUSD8.",
  },
  {
    q: "Can the AI raise fees or force an unauthorized loan?",
    a: "No. The 5% flat fee cap and 10% repayment split are hardcoded in LoanPool.sol. The merchant must also sign an EIP-712 approval and can pause AI access at any time.",
  },
  {
    q: "Why does supplier checkout use ERC-8004 verification?",
    a: 'Blockchain transfers cannot be reversed if sent to a spoofed address. ERC8004Registry.sol matches human-readable supplier names like "Pak Joko Distributor" to verified wallets before funds leave.',
  },
  {
    q: "What happens during a slow week with fewer customers?",
    a: "Repayment automatically pauses when no QR sales come in, because deductions only occur per transaction. There are zero fixed due dates and zero late penalties.",
  },
  {
    q: "What is live on QDay Aevum Testnet right now?",
    a: "Direct wallet connection to QDay Aevum Testnet (Chain ID 44005) reads live tQDAY and tUSD8 balances, alongside EIP-712 signature verification, Gemini red-team guardrail testing, and the 2-phone interactive simulator.",
  },
];

export default function LandingPage() {
  return (
    <div className="font-landing min-h-screen overflow-x-clip bg-white text-[#151619] antialiased selection:bg-[#9FE8C3] selection:text-[#151619]">
      <LandingHeader />

      {/* 1. HERO BAND (Mint-Emerald #9FE8C3 + Staircase HeroBars) */}
      <section className="relative overflow-hidden bg-[#9FE8C3] text-[#151619]">
        <HeroBars />

        <div
          className={`${CONTAINER} relative z-10 pt-24 pb-14 sm:pt-28 sm:pb-16 lg:pt-24 lg:pb-16`}
        >
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-12">
            {/* Left column */}
            <div className="min-w-0">
              <Reveal y={18}>
                <h1 className="text-[44px] sm:text-[72px] xl:text-[90px] leading-[0.98] font-semibold tracking-[-0.05em] text-[#151619]">
                  Fair working credit.
                  <br />
                  Earned from sales.
                </h1>
              </Reveal>

              <Reveal delay={0.08} y={18}>
                <p className="mt-6 max-w-[42ch] text-[16px] sm:text-[18px] leading-[1.55] font-medium text-[#1C1C1C]/80">
                  HanumPay records micro-merchant QR sales on QDay, unlocks
                  contract-capped tUSD8 credit through an AI Guarantor, and
                  auto-repays 10% per sale.
                </p>
              </Reveal>

              <Reveal delay={0.14} y={18}>
                <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
                  <LaunchButton
                    href="/stage"
                    label="Launch Live Simulator"
                    variant="dark"
                  />
                  <Link
                    href="/app/dashboard"
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#151619] underline decoration-[#151619]/35 underline-offset-4 transition-colors hover:decoration-[#151619] whitespace-nowrap"
                  >
                    <span>Open merchant dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>

              {/* Hairline & two protocol figures */}
              <Reveal delay={0.2} y={18}>
                <div className="mt-10 sm:mt-12 grid max-w-[460px] grid-cols-2 gap-6 sm:gap-8 border-t border-[#151619]/15 pt-7 sm:pt-8">
                  <div className="min-w-0">
                    <div className="text-[32px] sm:text-[42px] leading-none font-medium tracking-[-0.04em] text-[#151619] tabular-nums">
                      5.0%
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.45] text-[#1C1C1C]/75">
                      contract-locked flat fee vs 35%+/mo predatory loan apps
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[32px] sm:text-[42px] leading-none font-medium tracking-[-0.04em] text-[#151619] tabular-nums">
                      10%
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.45] text-[#1C1C1C]/75">
                      credit cap of 30d revenue, auto-repaid from future sales
                    </p>
                  </div>
                </div>

                <Link
                  href="/app/docs"
                  className="mt-7 sm:mt-8 inline-flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.12em] uppercase text-[#1C1C1C]/70 transition-colors hover:text-[#151619]"
                >
                  <span>Inspect QDay 44005 contracts &amp; AI red-team</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              </Reveal>
            </div>

            {/* Right column: QR Credit Calculator */}
            <div className="min-w-0 lg:-translate-y-12">
              <Reveal delay={0.12} y={24}>
                <HeroCreditCalculator />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE TICKER */}
      <LiveTicker />

      {/* 3. HOW IT WORKS */}
      <section id="how" className="scroll-mt-16 bg-white">
        <div className={`${CONTAINER} ${SECTION_Y}`}>
          <Reveal>
            <SectionHead
              eyebrow="HOW IT WORKS"
              title="Credit underwritten by real POS cashflow, not loan sharks."
              note="Every QR checkout is anchored on QDay. Once 5 distinct buyers transact within 30 days, AIGuarantor.sol unlocks bounded tUSD8 working capital."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <CreditRuler />
          </Reveal>

          {/* 01..04 Numbered rows divided by 1px hairlines */}
          <div className={`mt-14 sm:mt-16 border-t ${RULE}`}>
            {HOW_STEPS.map((step, idx) => (
              <Reveal key={step.num} delay={idx * 0.05}>
                <div
                  className={`grid grid-cols-1 gap-3 border-b ${RULE} py-6 sm:py-7 md:grid-cols-[56px_minmax(0,0.9fr)_minmax(0,1.2fr)] md:items-baseline md:gap-8`}
                >
                  <span className="font-mono text-[13px] text-[#636966] tabular-nums">
                    {step.num}
                  </span>
                  <h3 className="min-w-0 text-[19px] sm:text-[20px] font-medium tracking-[-0.015em] text-[#151619]">
                    {step.title}
                  </h3>
                  <p className="min-w-0 text-[15px] leading-[1.6] text-[#5C6260]">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STICKY COMPARISON SPLIT (#compare, max-w-[1600px]) */}
      <section id="compare" className="scroll-mt-16 bg-white">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          {/* Left Sticky Warm Off-White Display Panel */}
          <div className="min-w-0 bg-[#F5F7F5] px-5 py-14 sm:px-10 md:px-14 lg:sticky lg:top-14 lg:flex lg:h-[calc(100vh-3.5rem)] lg:flex-col lg:justify-between lg:rounded-b-[240px] lg:px-16 lg:py-24">
            <Reveal>
              <Eyebrow>COMPARISON &amp; GUARDRAILS</Eyebrow>
              <h2 className="mt-4 sm:mt-5 text-[38px] sm:text-[56px] xl:text-[68px] leading-none font-medium tracking-[-0.035em] text-[#151619]">
                Never predatory.
                <br />
                Always bounded.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 lg:mt-8 max-w-[34ch] text-[15px] sm:text-[16px] leading-[1.6] text-[#5C6260]">
                64 million Indonesian MSMEs do not lack daily revenue—they lack
                verifiable digital receipts that keep working capital fair and
                predictable.
              </p>
            </Reveal>
          </div>

          {/* Right Scrolling Compare Card + Principles */}
          <div className="min-w-0 px-5 py-14 sm:px-10 lg:px-14 lg:py-28">
            <Reveal>
              <CompareCardInteractive />
            </Reveal>

            <div className={`mt-12 sm:mt-14 border-t ${RULE}`}>
              {SAFETY_PRINCIPLES.map((item, idx) => (
                <Reveal key={item.num} delay={idx * 0.06}>
                  <div
                    className={`grid grid-cols-[36px_minmax(0,1fr)] sm:grid-cols-[44px_minmax(0,1fr)] gap-3 sm:gap-4 border-b ${RULE} py-6 sm:py-7`}
                  >
                    <span className="font-mono text-[13px] text-[#636966] tabular-nums pt-1">
                      {item.num}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[19px] sm:text-[20px] font-medium tracking-[-0.015em] text-[#151619]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-[1.6] text-[#5C6260] break-words">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. MODULAR CONTRACTS BAND (#contracts, Mint-Emerald #9FE8C3 + BandArcs) */}
      <section
        id="contracts"
        className="relative scroll-mt-16 overflow-hidden bg-[#9FE8C3] text-[#151619]"
      >
        <BandArcs />

        <div className={`${CONTAINER} ${SECTION_Y} relative z-10`}>
          <Reveal>
            <SectionHead
              tone="mint"
              eyebrow="ON-CHAIN CONTRACTS"
              title="Four audited contracts. Zero custodial middlemen."
              note="Every credit ceiling, sybil filter, and ERC-8004 supplier payee check is enforced directly in Solidity on QDay."
            />
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {CONTRACT_CARDS.map((card, idx) => (
              <Reveal
                key={card.name}
                delay={idx * 0.06}
                className="h-full min-w-0"
              >
                <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_12px_36px_rgb(15_90_54/0.08)]">
                  <Eyebrow>{card.tag}</Eyebrow>
                  <h3 className="mt-3 text-[20px] sm:text-[22px] font-medium tracking-[-0.02em] text-[#151619] break-words">
                    {card.name}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-[1.6] text-[#5C6260]">
                    {card.summary}
                  </p>

                  {/* 2x2 hairline dl stats */}
                  <dl
                    className={`mt-6 grid grid-cols-2 border-t ${RULE} pt-4 gap-x-4 gap-y-4`}
                  >
                    {card.stats.map((st) => (
                      <div key={st.label} className="min-w-0">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#636966]">
                          {st.label}
                        </dt>
                        <dd className="mt-1 text-[14px] font-medium text-[#151619] tabular-nums">
                          {st.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <Link
                    href={card.href}
                    className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D]"
                  >
                    <span>{card.linkLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ECOSYSTEM TWO-COLUMN SPLIT (White, wired to live LoanPool TVL) */}
      <LiveEcosystemSplit />

      {/* 7. BUILT FOR STRIP (Warm Off-White #F5F7F5) */}
      <section className="border-y border-[#E2E7E4] bg-[#F5F7F5] py-16 lg:py-20">
        <div className={CONTAINER}>
          <Reveal>
            <Eyebrow>BUILT ON QDAY AEVUM TESTNET WITH</Eyebrow>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-[#E2E7E4]">
              {BUILT_FOR_ITEMS.map((item) => (
                <div
                  key={item.name}
                  className="min-w-0 border-r border-b border-[#E2E7E4] bg-white/60 px-5 py-5"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#636966]">
                    {item.label}
                  </div>
                  <div className="mt-1.5 text-[16px] font-medium tracking-[-0.015em] text-[#151619]">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="scroll-mt-16 bg-white">
        <div className={`${CONTAINER} ${SECTION_Y}`}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
            <Reveal className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <Eyebrow>FAQ</Eyebrow>
              <H2 className="mt-4">Every question answered.</H2>
              <p className="mt-4 max-w-[32ch] text-[15px] sm:text-[16px] leading-[1.6] text-[#5C6260]">
                Clear answers on gasless QR ledgers, AI Guarantor guardrails,
                and QDay settlement.
              </p>
            </Reveal>

            <div className="min-w-0">
              {FAQS.map((faq, idx) => (
                <Reveal key={faq.q} delay={idx * 0.04}>
                  <details className={`group border-t ${RULE} last:border-b`}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 sm:gap-6 py-5 sm:py-6 text-[16px] sm:text-[18px] font-medium tracking-[-0.01em] text-[#151619] [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0">{faq.q}</span>
                      <span
                        aria-hidden="true"
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border ${RULE} text-[#151619] transition-transform duration-200 group-open:rotate-45`}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="pb-6 pr-4 sm:pr-12 text-[15px] leading-[1.65] text-[#5C6260]">
                      {faq.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="relative overflow-hidden bg-[#151619] text-white">
        <BlockPattern />

        <div className={`${CONTAINER} ${SECTION_Y} relative z-10`}>
          <Reveal>
            <Eyebrow tone="dark">LIVE ON QDAY TESTNET</Eyebrow>
            <h2 className="mt-5 max-w-[14ch] text-[38px] sm:text-[64px] leading-[1.02] font-medium tracking-[-0.04em] text-white">
              Built for real shops.
              <br />
              Guarded by code.
            </h2>

            <div className="mt-10 flex flex-wrap items-center gap-5 sm:gap-6">
              <LaunchButton
                href="/stage"
                label="Launch Live Simulator"
                variant="light"
              />
              <Link
                href="/app/dashboard"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white whitespace-nowrap"
              >
                <span>Open merchant dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-[#E2E7E4] bg-white py-14 sm:py-16">
        <div
          className={`${CONTAINER} grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_1fr_1fr_1fr]`}
        >
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="text-[19px] font-semibold tracking-[-0.04em] text-[#151619]"
            >
              hanumpay
            </Link>
            <p className="mt-3 max-w-[30ch] text-[14px] leading-[1.6] text-[#5C6260]">
              Contract-bounded working capital and ERC-8004 supplier rails for
              MSMEs on QDay Aevum Testnet.
            </p>
          </div>

          <div>
            <Eyebrow>SIMULATOR</Eyebrow>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#5C6260]">
              <li>
                <Link href="/stage" className="hover:text-[#151619]">
                  2-Phone Live Simulator
                </Link>
              </li>
              <li>
                <Link href="/app/dashboard" className="hover:text-[#151619]">
                  Merchant Overview
                </Link>
              </li>
              <li>
                <Link href="/app/penjualan" className="hover:text-[#151619]">
                  QR Sales Cashier
                </Link>
              </li>
              <li>
                <Link href="/app/pool" className="hover:text-[#151619]">
                  Community Liquidity Pool
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow>PROTOCOL</Eyebrow>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#5C6260]">
              <li>
                <Link href="/app/pinjaman" className="hover:text-[#151619]">
                  Credit &amp; Pay Suppliers
                </Link>
              </li>
              <li>
                <Link href="/app/identitas" className="hover:text-[#151619]">
                  ERC-8004 Directory
                </Link>
              </li>
              <li>
                <Link href="/app/docs" className="hover:text-[#151619]">
                  Architecture &amp; Red-Team
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow>QDAY 44005</Eyebrow>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#5C6260]">
              <li>
                <a
                  href={`${QDAY_EXPLORER_URL}/address/${TUSD8_CONTRACT.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#151619]"
                >
                  <span>tUSD8 Contract</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={QDAY_FAUCET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#151619]"
                >
                  <span>Testnet Faucet</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={QDAY_EXPLORER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#151619]"
                >
                  <span>Block Explorer</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
