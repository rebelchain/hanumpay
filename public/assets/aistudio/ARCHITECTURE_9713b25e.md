# ARCHITECTURE.md — Kulaya System Architecture

## Problem in One Sentence

Indonesia's 64 million small shops (UMKM) are credit-invisible because their sales records
live in notebooks — not in any system a fair lender can read.

## Solution in One Sentence

Every QR sale becomes an immutable on-chain record that an AI agent reads to offer
micro-loans with terms written in the contract, not in a chat window.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HUMAN LAYER                              │
│                                                                 │
│  Shop Owner (UMKM)              Lender / Investor               │
│  - Records daily sales          - Deposits tUSD8 to pool        │
│  - Signs loan with 1 signature  - Earns yield from loan fees    │
│  - Zero gas fees                                                │
└────────────────────┬────────────────────────┬───────────────────┘
                     │                        │
                     ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                             │
│                   Next.js 14 App Router                         │
│                                                                 │
│  /app/dashboard    → Sales stats, credit score, active loan     │
│  /app/penjualan    → Record QR sale (gasless EIP-712)           │
│  /app/pinjaman     → View AI proposal, accept, track repayment  │
│  /app/identitas    → Register ERC-8004 identity                 │
│  /app/pool         → Lender deposit / withdraw dashboard        │
└────────────────────┬────────────────────────────────────────────┘
                     │  wagmi + viem
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                             │
│                  QDay Aevum Testnet (44005)                     │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │ ERC8004Registry  │    │   SalesLedger    │                  │
│  │                  │    │                  │                  │
│  │ register()       │    │ recordSale()     │                  │
│  │ resolve()        │    │ getShopStats()   │                  │
│  │ verify()         │    │ getSales()       │                  │
│  └──────────────────┘    └────────┬─────────┘                  │
│                                   │ reads                       │
│  ┌──────────────────┐    ┌────────▼─────────┐                  │
│  │  AIGuarantor     │───▶│    LoanPool      │                  │
│  │                  │    │                  │                  │
│  │ proposeLoan()    │    │ acceptLoan()     │                  │
│  │ (only function)  │    │ repayFromSale()  │                  │
│  │                  │    │ deposit()        │                  │
│  └──────────────────┘    │ withdraw()       │                  │
│                           └──────────────────┘                  │
│                                                                 │
│  Token: tUSD8 (ERC-20, 6 decimals)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │ reads on-chain
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT LAYER                                │
│                   Node.js + TypeScript                          │
│                                                                 │
│  Runs every 15 minutes:                                         │
│  1. Fetch all shops from SalesLedger                            │
│  2. Run eligibility check per shop                              │
│  3. If eligible → call proposeLoan() via AIGuarantor            │
│  4. Log all decisions (audit trail)                             │
│                                                                 │
│  Identity: registered as "Kulaya-AI-Guarantor-v1" in ERC-8004  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Full Lifecycle

### Flow 1 — Shop Owner Records a Sale

```
1. Customer scans shop's QR code
2. Frontend calls SalesLedger.recordSale() 
   with EIP-712 signature (gasless for owner)
3. SalesLedger stores: shop address, amount, hashed customer ID, timestamp
4. Event emitted: SaleRecorded(shop, amount, customerId, timestamp)
5. Frontend updates: today's sales, credit score gauge
```

### Flow 2 — AI Agent Evaluates & Proposes Loan

```
1. Agent runs every 15 minutes (cron job)
2. For each shop with recorded sales:
   a. Call SalesLedger.getShopStats(shop)
      → returns: totalSales30d, uniqueCustomers30d
   b. Run eligibility check (see AGENT_SPEC.md)
   c. If eligible AND no active loan:
      → Calculate: principal = totalSales30d * 10%
      → Calculate: flatFee = principal * 5%
      → Calculate: repayPct = 1000 (10% per sale, basis points)
      → Call AIGuarantor.proposeLoan(shop, principal, flatFee, repayPct)
3. LoanPool emits: LoanProposed(loanId, shop, principal, fee, repayPct)
4. Frontend shows proposal card to shop owner
```

### Flow 3 — Shop Owner Accepts Loan

```
1. Owner opens /app/pinjaman
2. Sees LoanProposalCard:
   - Principal: $X tUSD8
   - Fixed fee: $Y tUSD8 (written once, never changes)
   - Repay: Z% of each future sale
   - Source: "Kulaya-AI-Guarantor-v1 ✓ ERC-8004 Verified"
3. Owner clicks "Accept" → signs ONE EIP-712 signature (gasless)
4. Frontend calls LoanPool.acceptLoan(loanId, signature)
5. tUSD8 transfers from pool to owner's wallet
6. Loan status: Active
```

### Flow 4 — Auto-Repayment Per Sale

```
1. Owner records next sale (Flow 1 repeats)
2. SalesLedger calls LoanPool.repayFromSale(shop, saleAmount)
3. LoanPool auto-deducts repayPct% from sale amount
4. Sends repay amount back to pool
5. Owner receives remaining sale amount
6. If loan fully repaid:
   → Emit LoanRepaid(loanId, shop, totalRepaid)
   → Write credit passport record on-chain
   → Increase shop's credit tier
   → Pool distributes fee as yield to lenders
```

### Flow 5 — ERC-8004 Confirmation of Payee

```
Used in TWO places:
A. Shop Registration:
   - Owner registers "Warung Bu Sri" → their wallet address
   - Customers can verify before paying: "Am I paying the right shop?"

B. AI Agent Identity:
   - Agent registers "Kulaya-AI-Guarantor-v1" → agent wallet
   - Owner sees badge on loan proposal: identity is on-chain verifiable
   - Even if UI is spoofed, owner can verify directly on explorer
```

---

## Contract Dependency Map

```
ERC8004Registry   (no deps — standalone identity layer)
       ↑
SalesLedger       (reads: none | writes: storage)
       ↑
AIGuarantor       (reads: SalesLedger | writes: LoanPool)
       ↑  
LoanPool          (reads: SalesLedger | holds: tUSD8)
```

Deploy order: `ERC8004Registry → SalesLedger → LoanPool → AIGuarantor`

---

## Key Design Decisions

### Why EIP-712 Gasless Signatures?
Shop owners are not crypto-native. They should never need to buy tQDAY for gas.
The relayer (or agent) submits the transaction and pays gas on their behalf.
Owner only signs a human-readable message in their wallet.

### Why Flat Fee Instead of APR?
APR is confusing and psychologically harmful (feels like it grows forever).
A flat fee means: "you borrow $100, you pay back $105 total. Done."
This is explicitly written in the contract — the AI cannot change it after acceptance.

### Why Can the Agent Only Call proposeLoan()?
The AIGuarantor contract uses a modifier `onlyAIGuarantor` on all LoanPool functions.
The agent's private key has ONE capability. Even if the key is compromised:
- Cannot withdraw from pool
- Cannot transfer tokens
- Cannot modify loan terms after acceptance
- Cannot exceed daily proposal budget

### Why On-Chain Credit Passport?
When a shop repays their first loan, an event is emitted that cannot be deleted.
This record is portable — it exists independently of Kulaya.
If Kulaya shuts down, the shop's credit history survives on-chain.

---

## Security Constraints (Enforced by Contract)

| Constraint | Value | Where Enforced |
|-----------|-------|----------------|
| Max loan size | $500 tUSD8 | LoanPool |
| Max daily proposals | 10 | AIGuarantor |
| Pool exposure max | 80% of total pool | LoanPool |
| Cooldown after repay | 30 days | LoanPool |
| Min unique customers | 5 in 30 days | AIGuarantor eligibility |
| Min sales period | 30 days of records | AIGuarantor eligibility |
| Loan fee | Fixed at proposal time | LoanPool (immutable after accept) |

---

## What This Is NOT

- Not a liquidation protocol (no collateral, no price oracle needed)
- Not a governance token system
- Not a cross-chain bridge
- Not an AMM or DEX
