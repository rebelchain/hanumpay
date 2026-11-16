# PROJECT.md — Kulaya

## One-liner

On-chain credit protocol that turns daily QR sales into micro-loans for Indonesia's
64 million informal small shops — no collateral, no late fees, no debt collectors.

---

## Problem

Indonesia has ~64 million small shops (UMKM). Their revenue is real, but it lives in
notebooks and cash drawers. No bank or fair lender can verify it. When they need
capital to restock, they turn to predatory pinjol (online loan apps): escalating
interest, debt collectors who contact family members, apps that harvest phone contacts.

Their real asset — a stable daily sales record — is invisible to fair lenders.

---

## Solution

Every QR sale → immutable record on QDay Aevum (tUSD8).
AI agent reads 30 days of records → calculates credit limit (10% of verified sales).
AI proposes loan with terms written in the smart contract.
Owner accepts with one gasless signature.
Repayment auto-deducted as 10% of every future sale — no due dates, no late fees.

---

## Why This Hackathon Fits

| Hackathon Requirement | How Kulaya Uses It |
|----------------------|-------------------|
| Stablecoin payment | tUSD8 for all loan disbursement and repayment |
| Human + AI Agents | Shop owner (human) + AI Guarantor (autonomous agent) |
| ERC-8004 | Identity for shop owner AND AI agent (Confirmation of Payee) |
| QDay Aevum Testnet | All contracts deployed on Chain ID 44005 |
| Gasless UX | EIP-712 signatures — owners pay zero gas |

---

## Key Differentiators vs Generic Lending Apps

1. **ERC-8004 for BOTH sides**: Not just the agent — shop owners also register
   identity so their customers can verify they're paying the right shop.

2. **No due dates, no late fees**: Repayment is a percentage of sales.
   If sales drop, repayment slows. No shock, no default spiral.

3. **Flat fee written at proposal time**: Owner sees exactly "$84 total" before
   signing. The AI cannot change this after acceptance.

4. **Agent-proof by contract**: Even a compromised or jailbroken agent cannot
   exceed the limits enforced by AIGuarantor.sol.

5. **Credit Passport**: Repaid loans create permanent on-chain records.
   The shop's credit history survives even if Kulaya shuts down.

---

## Hackathon Submission Checklist

```
Judging Criteria          → How We Address It              Weight
─────────────────────────────────────────────────────────────────
Innovation & Originality  → ERC-8004 as 2-sided identity   20%
Safety, Trust & Controls  → Agent constraints in contract   15%
Real-world Utility        → 64M UMKM, validated problem     15%
Technical Quality         → Foundry tests, clean code        15%
User Experience           → Gasless, mobile-first, ID       15%
Demo Quality              → End-to-end live testnet flow     10%
Documentation             → README + architecture diagram    10%
─────────────────────────────────────────────────────────────────
Total                                                        100%
```

---

## Team

Solo project — Azhar (Frontend + Smart Contracts + Agent)

---

## Timeline

| Phase | Dates | Deliverable |
|-------|-------|-------------|
| Foundation | Nov 16–18 | Env setup, ERC-8004 research, architecture finalized |
| Contracts | Nov 19–22 | 4 contracts written, tested, deployed |
| Frontend | Nov 23–29 | All 5 pages functional, connected to testnet |
| Agent | Nov 30–Dec 4 | Agent running, proposals working end-to-end |
| Polish | Dec 5–7 | Bug fixes, gasless UX, error states |
| Submit | Dec 8–11 | README, demo recording, DoraHacks submission |
