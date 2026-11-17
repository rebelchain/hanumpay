# LP Economics, Risk Model & Roadmap

## How Community LP Yield Works

Liquidity Providers (LPs) deposit `tUSD8` into `LoanPool.sol` and receive proportional pool shares. Yield is generated strictly from **real working-capital repayments** — not inflationary token emissions:

- Every loan carries an immutable **`5%` flat fee** on principal.
- Working capital turns over in short restocking cycles (typically ~45–60 days per merchant cycle, or ~5–6 rotations per year).
- At `50%–80%` active pool utilization (capped by contract at `80%` max TVL), annualized LP APY scales organically around **~8%–14% APY**, shared pro-rata by LP pool ownership.

### Withdrawals & Liquidity Reserve

- `LoanPool.sol` enforces a **`20%` idle liquidity buffer** (`80%` utilization cap) so LPs can withdraw available idle `tUSD8` without waiting for all active loans to settle.
- If `availableIdleLiquidity < requestedWithdraw`, the UI surfaces available withdrawable liquidity and settles remaining withdrawals as merchants' incoming QR sales auto-repay `10%` per transaction.

---

## Risk Mitigation & Protocol Sustainability Roadmap

### Phase 1 — QDay Aevum Testnet MVP _(Current — Live)_

- Four Foundry-tested contracts (`ERC8004Registry`, `SalesLedger`, `LoanPool`, `AIGuarantor`) deployed at Block `3310882` on Chain `44005`.
- Gasless EIP-712 QR sales & loan acceptance relayers, community LP pool shares, and ERC-8004 Confirmation of Payee.
- Economic guardrails active today: `30-day` shop history gate, `>= 5` unique buyers, `10%` of 30d revenue cap (`$500` ceiling), `80%` pool exposure cap, and merchant AI Kill Switch.

### Phase 2 — Closed-Loop Risk Hardening & Progressive KYB _(v2 Upgrade)_

- **ERC-8004 Closed-Loop Supplier Escrow**: Upgrade `LoanPool.sol` so approved credit stays escrowed in the pool and settles `tUSD8` **exclusively to whitelisted wholesale suppliers** (`category == "supplier"`) verified in `ERC8004Registry` — eliminating cash-out and off-app transfer risk.
- **Progressive / Tiered e-KYC & KYB**: Keep zero-KYC QR cashier onboarding during Days 1–30, then require a privacy-preserving e-KYC / distributor endorsement hash on `ERC8004Registry` to unlock live working capital at Day 30+.
- **Graduated Credit Tiers & Default Hygiene**: Replace flat day-30 limits with tiered underwriting (`Tier 1: $25–$50` -> `Tier 2: $150` -> `Tier 3: $500` after on-time repayments) and automated inactivity/overdue flags recorded on the merchant's Credit Passport.

### Phase 3 — QDay Mainnet, Gas Abstraction & Treasury Sustainability _(Q1 2027)_

- **Native Account Abstraction**: Migrate EOA relayers to `@qday-io/sdk` ERC-4337 Smart Accounts and native `USD8` Paymasters upon QDay's Q1 2027 SDK release.
- **Sustainable Protocol Revenue**: Activate on-chain fee split on the `5%` flat credit fee (`4.0%` distributed to Community LPs, `1.0%` routed to the HanumPay Protocol Treasury & relayer reserve) alongside optional `0.1%–0.25%` B2B wholesale supplier settlement fees.
- **Real-Time Event Indexing**: Replace `1,000`-block chunked `eth_getLogs` polling with dedicated subgraph/Envio indexing.

### Phase 4 — Distributor Network & Credit Passport Ecosystem

- **Distributor-Sponsored Onboarding**: Enable regional FMCG distributors and merchant cooperatives to co-anchor merchant identity and earn origination rebates on verified inventory restocks.
- **Portable Credit Passport API**: Expose permissioned, merchant-consented on-chain repayment proofs for external cooperatives, neo-banks, and supply-chain finance partners.
