# HanumPay — Hackathon Pitch Deck & 20-Day X Launch Calendar

Built for QDay Aevum Testnet (`chainId 44005`). Every metric, smart-contract rule, and roadmap note in this playbook matches what is actually implemented and verifiable live.

---

## Part 1: 8-Slide Hackathon Pitch Deck Blueprint

Use the 4 visual Canva slides in `docs/media/slides/` for Slides 1–4, then follow with 4 concise technical/proof/roadmap slides so judges get both the story and full engineering proof in under 3 minutes.

### Slide 1 — Title & Hook
- **Visual**: `docs/media/slides/01-meet-hanumpay.png` (*Meet HanumPay*)
- **Speaker Script (20s)**:
  > "Over 64 million micro-merchants in Indonesia accept digital QR payments every day, yet still have zero access to fair working capital. Meet HanumPay: verifiable on-chain cashflow, contract-bounded working capital, and ERC-8004 supplier protection on QDay Aevum Testnet."

### Slide 2 — The Problem (*Cashflow Rich, Collateral Poor*)
- **Visual**: `docs/media/slides/02-problem-cashflow-rich.jpg`
- **Speaker Script (25s)**:
  > "A neighborhood warung processes real daily revenue via QR, but lacks formal collateral or portable ledger history. When inventory runs out, owners face 35%+ monthly informal loans or irreversible B2B wallet scams. HanumPay turns everyday QR checkouts into verifiable on-chain history without asking shopkeepers to hold gas."

### Slide 3 — How It Works (*From QR Sales to Working Capital*)
- **Visual**: `docs/media/slides/03-how-it-works-vault.jpg`
- **Key Corrections Included in Slide Copy**:
  - Updated Step 3 from ambiguous manual borrowing wording to: **"AI Risk Agent proposes credit bounded by Solidity."**
  - Clarified gasless merchant consent: **"Merchant signs once gaslessly to disburse funds."**
- **Speaker Script (30s)**:
  > "Every QR sale logs to `SalesLedger.sol` via EIP-712 with zero merchant gas. Once 30 days and 5 unique hashed buyers are proven, our AI Risk Agent inspects transaction dispersion for wash-trading anomalies and proposes working capital up to 10% of 30-day revenue, hard-capped at $500 tUSD8 and a 5% flat fee. One gasless signature unlocks funds."

### Slide 4 — Supplier Security, Auto-Repayment & Credit Passport
- **Visual**: `docs/media/slides/04-supplier-repay-passport.jpg`
- **Speaker Script (25s)**:
  > "Before a single cent pays out to a wholesaler, ERC-8004 Confirmation of Payee checks the supplier's name against their registered wallet—blocking phishing spoofs. From there, future QR sales automatically split 90% to the shop and 10% to `LoanPool` until settled, minting an On-Chain Credit Passport with zero fixed due dates or late fees."

### Slide 5 — Mobile Cashier (`/kasir`) & Settlement Bridge UX
- **Visual**: Screenshot/short 15s screen recording of `/kasir` on mobile viewport
- **On-Slide Points**:
  - Designed for real shopkeepers in Indonesian Rupiah (`Rp`) alongside `tUSD8` on-chain settlement
  - 3-step self-onboarding checklist (`Connect Wallet` → `Register ERC-8004 Shop` → `Accept First QR Payment`)
  - Automated relayer settlement simulation with safe fallback when testnet liquidity runs low
- **Speaker Script (20s)**:
  > "Shop owners never touch raw hex calldata. Our standalone `/kasir` mobile POS speaks Rupiah, auto-guides onboarding in three steps, and settles gasless EIP-712 receipts via the QDay relayer."

### Slide 6 — Why AI + Solidity + ERC-8004 (Not an AI Wrapper)
- **Visual**: Screenshot of `/stage` 2-Device Simulator (Wash-Trading Anomaly + Red-Team Revert cards)
- **On-Slide Points**:
  - **Gemini AI Behavioral Gate (`/api/agent/audit`)**: Inspects raw ticket dispersion, timestamps, and midnight wash-trading bursts that naive `>= 5 unique buyers` counters cannot see.
  - **Solidity Guardrails (`AIGuarantor.sol` + `LoanPool.sol`)**: Deterministically revert out-of-bounds proposals even under adversarial `$5,000 / 0% fee` prompt injection.
  - **Merchant Kill Switch**: `setAgentPaused(true)` freezes new offers while QR sales keep running.

### Slide 7 — Live Deployment & Verifiable Proof on QDay Aevum Testnet
- **Visual**: Screenshot of `docs/media/dashboard.png` + QDay Explorer verified contract links
- **Deployed Stack (`chainId 44005`)**:
  - `tUSD8` · `ERC8004Registry` · `SalesLedger` · `LoanPool` · `AIGuarantor`
  - Live Web App: `https://hanumpay.vercel.app`
  - 2-Device Guided Simulator: `https://hanumpay.vercel.app/stage`
  - Mobile Cashier POS: `https://hanumpay.vercel.app/kasir`

### Slide 8 — Honest Limits & Phase 2 IDRX Roadmap
- **On-Slide Points**:
  - **Testnet Demo Today**: Uses `tUSD8` (6 decimals) + relayer settlement simulation; fiat-to-crypto gateway is Phase 2.
  - **Bank Indonesia Compliance Path**: Retail domestic payments require IDR—Phase 2 swaps settlement from `tUSD8` to Rupiah-backed **`IDRX`** behind a licensed QRIS payment gateway so customers pay via GoPay/DANA/bank apps in IDR and `LoanPool` splits 90%/10% in `IDRX`.

---

## Part 2: 20-Day Daily X Posting Calendar (Countdown to Judging Day)

Each post fits cleanly within **280 characters**, highlights real shipped features, and keeps daily momentum for 20 days leading up to hackathon judging. Attach the paired slide or screenshot on each day.

---

### Week 1: Problem, Vision & Core Mechanics (Days 20–14)

**Day 20 (D-20) — Official Meet HanumPay Launch**
- **Attach**: `docs/media/slides/01-meet-hanumpay.png`
- **Post**:
```text
64M+ MSMEs process daily QR sales yet lack fair working capital.

Meet HanumPay on QDay Aevum Testnet:
• Gasless EIP-712 cashier POS
• On-chain caps: 10% of 30d sales, $500 max, 5% flat fee
• 10% auto-repay + ERC-8004 verified payees

https://hanumpay.vercel.app
```

**Day 19 (D-19) — The Real MSME Problem**
- **Attach**: `docs/media/slides/02-problem-cashflow-rich.jpg`
- **Post**:
```text
Small shops in Indonesia aren't poor in revenue—they're rich in daily QR cashflow, just poor in paper collateral.

Instead of 35%/month informal loans, HanumPay turns counter QR sales into verifiable on-chain credit history.

#BuildInPublic #QDay
```

**Day 18 (D-18) — How QR Sales Become Working Capital**
- **Attach**: `docs/media/slides/03-how-it-works-vault.jpg`
- **Post**:
```text
How HanumPay turns daily QR sales into fair working capital:

1. Gasless EIP-712 sales on QDay
2. Prove 30d history + >=5 unique buyers
3. AI Risk Agent proposes credit capped by Solidity (<=10%, $500 max, 5% flat fee)

One signature. Zero hidden penalties.
```

**Day 17 (D-17) — Supplier Safety & Auto-Repayment**
- **Attach**: `docs/media/slides/04-supplier-repay-passport.jpg`
- **Post**:
```text
Getting working capital is half the battle—not losing it to a spoofed 0x wallet matters just as much.

HanumPay checks supplier names via ERC-8004 Confirmation of Payee, routes 10% per sale to repay, and mints a Credit Passport on payoff.
```

**Day 16 (D-16) — Inside the Mobile Cashier (`/kasir`)**
- **Attach**: Mobile screenshot or 10s screen capture of `/kasir`
- **Post**:
```text
Warung owners shouldn't read hex calldata to run a register.

Built a standalone mobile POS (/kasir) in Rupiah (Rp) with 1-tap presets, instant QR customer checkout, and gasless EIP-712 settlement via the QDay relayer.

Try it: https://hanumpay.vercel.app/kasir
```

**Day 15 (D-15) — Automatic 3-Step Shop Onboarding**
- **Attach**: Screenshot of `ShopOnboardingChecklist` on `/kasir` or `/app/dashboard`
- **Post**:
```text
Onboarding a micro-merchant to Web3 should take 3 clear steps, not a Solidity tutorial:

1. Connect shop wallet
2. Register ERC-8004 shop identity
3. Accept your first gasless QR sale

Built an auto-checklist right inside /kasir & Home.
```

**Day 14 (D-14) — Zero Merchant Gas Architecture**
- **Attach**: Screenshot of a verifiable EIP-712 receipt modal + QDay Explorer tx
- **Post**:
```text
How does a shop owner record sales on-chain without buying gas tokens?

POS hashes buyer phone IDs locally (keccak256), signs an EIP-712 typed message, and our QDay relayer pays the gas to settle on SalesLedger.sol.

0 tQDAY required from the cashier.
```

---

### Week 2: Security, AI Risk Gate & Real-World Economics (Days 13–7)

**Day 13 (D-13) — Why We Built an AI Behavioral Risk Gate (Not an AI Wrapper)**
- **Attach**: Screenshot of `/stage` Device 02 flagging a wash-trading burst
- **Post**:
```text
Honest question: why use AI if Solidity already enforces loan caps?

Solidity only counts >=5 buyers—it can't spot 5 burner wallets wash-trading $250 at 3:00 AM inside 4 minutes.

Our Gemini AI Risk Gate scans cadence & spikes BEFORE proposing to AIGuarantor.sol.
```

**Day 12 (D-12) — Red-Team Prompt Injection Test**
- **Attach**: Screen clip or screenshot of `/stage` Prompt Injection (`$5,000 / 0% fee`) reverting
- **Post**:
```text
What happens if someone prompt-injects our AI Guarantor to issue a $5,000 loan at 0% fee?

Solidity doesn't care what the AI says. LoanPool & AIGuarantor deterministically revert out-of-bounds proposals on-chain.

Test the live red-team simulator: https://hanumpay.vercel.app/stage
```

**Day 11 (D-11) — Blocking Phishing Payees with ERC-8004**
- **Attach**: Screenshot of ERC-8004 Phishing Block alert in `/stage`
- **Post**:
```text
Sending inventory payouts to a raw 0x address is one copy-paste typo away from losing working capital.

HanumPay runs ERC-8004 Confirmation of Payee before signing: if "Pak Joko Distributor" doesn't match the registered wallet, transfer aborts immediately.
```

**Day 10 (D-10) — Instant Merchant AI Kill Switch**
- **Attach**: Screenshot of `Pause AI` / `Credit Offers Paused` toggle in sidebar or `/stage`
- **Post**:
```text
Trust in AI agents requires an emergency brake owned by the user.

Any HanumPay merchant can flip setAgentPaused(true) in AIGuarantor.sol to freeze all automatic credit offers instantly—while daily QR sales keep running uninterrupted.
```

**Day 9 (D-9) — Watch 90% / 10% Auto-Repayment Live**
- **Attach**: Short screen recording of Step 5 in `/stage` splitting a post-loan sale
- **Post**:
```text
Why small shops fear fixed monthly due dates: a slow rainy week triggers late penalties.

On HanumPay, active loans split incoming QR sales 90% to the shop and 10% to LoanPool automatically. Busy days pay faster; quiet days incur 0% late fees.
```

**Day 8 (D-8) — Community LP Liquidity Pool Mechanics**
- **Attach**: Screenshot of `/app/pool` showing live pool TVL & 20% idle reserve cap
- **Post**:
```text
Where does merchant working capital come from?

Community LPs deposit tUSD8 into LoanPool.sol with an on-chain 80% max utilization rule (keeping a 20% liquidity buffer idle) and earn pro-rata yield from the flat 5% fee as sales settle.
```

**Day 7 (D-7) — Why No Fixed Due Dates Beats Predatory Credit**
- **Attach**: Screenshot of landing page comparison / calculator (`HeroCreditCalculator`)
- **Post**:
```text
$125 working capital at an immutable 5% flat fee = $6.25 total fee. No compounding APR, no hidden rollover charges, no surprise penalties.

Transparency encoded in Solidity rather than buried in fine print.

https://hanumpay.vercel.app
```

---

### Week 3: Transparency, IDRX Roadmap & Judging Countdown (Days 6–1)

**Day 6 (D-6) — Try the Guided 2-Device Sandbox Yourself**
- **Attach**: Full desktop screenshot of `/stage` 5-step bar + 2 phones
- **Post**:
```text
Want to test HanumPay in 90 seconds without connecting a wallet or faucets?

Follow Steps 01 -> 05 in our 2-Device Simulator:
• Unlock 5/5 buyer gate
• Run AI behavioral audit
• Accept credit & verify supplier
• Watch 90/10 auto-repay

https://hanumpay.vercel.app/stage
```

**Day 5 (D-5) — Honest Limits: Testnet Today vs Licensed Gateway**
- **Attach**: Screenshot of the Honest Limits & Architecture section in `/app/docs`
- **Post**:
```text
Building in public means being honest about testnet boundaries:

Today on QDay Testnet, our relayer simulates QRIS tUSD8 settlement end-to-end. Production fiat-to-crypto onboarding requires a licensed payment gateway bridging GoPay/DANA/IDR into stablecoin rails.
```

**Day 4 (D-4) — Rupiah Compliance & Phase 2 `IDRX` Migration**
- **Attach**: Graphic or docs screenshot showing `IDR (QRIS) -> IDRX -> 90/10 LoanPool Split`
- **Post**:
```text
In Indonesia, domestic commerce runs in Rupiah—never USD.

That's why Phase 2 moves settlement from testnet tUSD8 to Rupiah-backed IDRX: customers pay IDR via any QRIS e-wallet, gateway settles in IDRX, and LoanPool splits 90/10 on-chain.
```

**Day 3 (D-3) — 5 Live Contracts on QDay Aevum (`44005`)**
- **Attach**: `docs/media/dashboard.png`
- **Post**:
```text
3 days until judging. All 5 HanumPay smart contracts are live on QDay Aevum Testnet (Chain 44005):

• tUSD8 Settlement Token
• ERC8004Registry
• SalesLedger (EIP-712)
• LoanPool (90/10 split)
• AIGuarantor (5% cap + kill switch)

Inspect everything live: https://hanumpay.vercel.app/app/docs
```

**Day 2 (D-2) — On-Chain Credit Passport for Repeat Merchants**
- **Attach**: Screenshot of Credit Passport unlocked on `/stage` or `/app/pinjaman`
- **Post**:
```text
When a warung repays 100% from daily QR cashflow, LoanPool mints an On-Chain Credit Passport—portable proof of creditworthiness that unlocks higher working-capital ceilings without paper collateral.

2 days to judging!
```

**Day 1 (D-1) — Demo Day / Judging Ready Post**
- **Attach**: `docs/media/slides/01-meet-hanumpay.png` (or 4-image carousel using all 4 English slides `01`–`04`!)
- **Post**:
```text
Judging starts tomorrow. We built HanumPay so 64M+ Indonesian micro-merchants can turn daily QR receipts into fair, gasless working capital.

Live App: https://hanumpay.vercel.app
2-Phone Guided Demo: https://hanumpay.vercel.app/stage
Mobile POS: https://hanumpay.vercel.app/kasir

Feedback welcome!
```
