# CLAUDE.md — Kulaya Project Context

> This file is read automatically by Claude Code at the start of every session.
> Do NOT delete or rename this file.

## What This Project Is

Kulaya is an on-chain credit protocol for Indonesia's 64 million informal small shops (UMKM).
It converts daily QR sales into verifiable on-chain records, which an AI agent reads to offer
micro-loans — no collateral, no late fees, no debt collectors.
Repayment is auto-deducted as a fixed percentage of each future sale.

Built for: **Aevum Builder Challenge #1** (QDay Network)
Deadline: **11 December 2026**

---

## Read These Files First (In Order)

Before writing ANY code, read these documents:

1. `docs/ARCHITECTURE.md` — system overview, data flow, contract relationships
2. `docs/CONTRACTS_SPEC.md` — all function signatures, events, errors
3. `docs/FRONTEND_SPEC.md` — pages, components, design system
4. `docs/AGENT_SPEC.md` — AI guarantor logic, eligibility rules, safety constraints

---

## Tech Stack (Do Not Deviate)

| Layer | Technology |
|-------|-----------|
| Chain | QDay Aevum Testnet — Chain ID: `44005` |
| RPC | `https://rpc-test.qday.info` |
| Stablecoin | tUSD8 — ERC-20, 6 decimals — `0x456569838f1d43009A91ebA4263147Afd723348` |
| Contracts | Solidity `^0.8.24` + Foundry |
| Identity | ERC-8004 Registry (on-chain Confirmation of Payee) |
| Frontend | Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui |
| Wallet | Wagmi v2 + Viem v2 + RainbowKit |
| Agent | Node.js + TypeScript (runs as a cron service) |
| Testing | Foundry (contracts) + Vitest (frontend) |

---

## Folder Structure

```
kulaya/
├── CLAUDE.md                  ← YOU ARE HERE (read every session)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTRACTS_SPEC.md
│   ├── FRONTEND_SPEC.md
│   └── AGENT_SPEC.md
├── contracts/                 ← Foundry project
│   ├── src/
│   │   ├── ERC8004Registry.sol
│   │   ├── SalesLedger.sol
│   │   ├── LoanPool.sol
│   │   └── AIGuarantor.sol
│   ├── test/
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
├── frontend/                  ← Next.js App Router
│   ├── app/
│   ├── components/
│   ├── lib/
│   │   ├── contracts.ts       ← ABIs + deployed addresses
│   │   └── wagmi.ts
│   └── public/
├── agent/                     ← AI Guarantor service
│   ├── src/
│   │   ├── index.ts
│   │   ├── eligibility.ts
│   │   └── proposer.ts
│   └── package.json
└── .env.example               ← NEVER commit .env
```

---

## Hardcoded Rules — Never Break These

1. **Never commit `.env` or any private key** to git. Always use `.env.example`.
2. **tUSD8 has 6 decimals** — always use `parseUnits(amount, 6)`, never `parseEther`.
3. **AI agent can ONLY call `proposeLoan()`** — no other write functions.
4. **Shop owners pay zero gas** — use EIP-712 signatures for all owner interactions.
5. **Loan terms come from the contract** — never hardcode loan amounts or fees in the UI.
6. **ERC-8004 must be verified on-chain** — never fake a "verified" badge in the frontend.

---

## Deployed Contract Addresses (Update After Each Deploy)

```typescript
// contracts/deployments/testnet.json
{
  "ERC8004Registry": "0x_FILL_AFTER_DEPLOY",
  "SalesLedger":     "0x_FILL_AFTER_DEPLOY",
  "LoanPool":        "0x_FILL_AFTER_DEPLOY",
  "AIGuarantor":     "0x_FILL_AFTER_DEPLOY",
  "tUSD8":           "0x456569838f1d43009A91ebA4263147Afd723348",
  "chainId":         44005
}
```

---

## Common Commands

```bash
# Contracts
cd contracts
forge build
forge test -vvv
forge script script/Deploy.s.sol --rpc-url $QDAY_RPC_URL --broadcast

# Frontend
cd frontend
npm run dev
npm run build

# Agent
cd agent
npx ts-node src/index.ts
```

---

## Current Build Status

- [ ] Contracts written
- [ ] Contracts tested
- [ ] Contracts deployed to testnet
- [ ] Frontend scaffold
- [ ] Frontend connected to contracts
- [ ] Agent service running
- [ ] End-to-end flow working
- [ ] README complete
- [ ] Demo recorded
