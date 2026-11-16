# Hackathon Progress Tracker — HanumPay

This document serves as the shared source of truth across local development, the GitHub repository, and the AI Studio workspace so every hackathon milestone and deployed contract address stays synchronized.

---

## Current Status
- **Active Stage**: Stage 1 — Repository Baseline, Full English Standardization & QDay Aevum Readiness
- **Target Network**: QDay Aevum Testnet (Chain ID `44005`)
- **Official tUSD8 Token**: `0x456569838f1d43009A91ebA4263147Afd7233483` (6 decimals)

---

## Milestone Roadmap

### Stage 1 — App Foundation & Initial Repository Baseline (Complete)
- [x] HanumPay landing page featuring live credit limit calculator, fee comparison ruler, and modular contract cards.
- [x] Interactive 2-phone live simulator (`/stage`) covering gasless QR sales, AI Guarantor offers, verified supplier payouts, spoofed address defense, and prompt-injection tests.
- [x] Complete merchant workspace (`/app/dashboard`, `/app/penjualan`, `/app/pinjaman`, `/app/identitas`, `/app/pool`, `/app/docs`).
- [x] Standardized 100% into clear English across UI, API prompts, Solidity blueprints, `README.md`, and `PROGRESS.md`.
- [x] QDay Aevum alignment (`evm_version = "shanghai"` in `contracts/foundry.toml`, HTTPS polling only, 1,000-block `getLogsChunked`, EIP-3085 `0xABE5`, and 5-step Aevum readiness checker on `/app/docs`).
- [x] Ready for Stage 1 GitHub baseline push.

### Stage 2 — Foundry Tests & QDay Testnet Deployment (Next)
- [ ] Confirm `contracts/foundry.toml` keeps `evm_version = "shanghai"` (prevents `invalid opcode: MCOPY`).
- [ ] Install Foundry locally and run `forge test -vvv` inside `contracts/` — verify all unit and invariant tests pass.
- [ ] Claim `tQDAY` & `tUSD8` from `https://faucet.qday.info/en`.
- [ ] Run `Deploy.s.sol` against QDay Aevum Testnet (`44005`) and record all 4 contract addresses below (explorer source verification is unavailable, so link the GitHub repo + addresses in submission).
- [ ] Configure the 4 `NEXT_PUBLIC_*` contract addresses plus `RELAYER_PRIVATE_KEY` / `AGENT_PRIVATE_KEY` for live on-chain execution.
- [ ] Verify at least 1 real transaction per core flow on QDay Block Explorer (QR sale, AI credit offer/accept, supplier settlement) because judging counts real on-chain Aevum activity.

### Stage 3 — End-to-End Integration & Responsive QA
- [ ] Test EOA wallet connection (`MetaMask` / `Rabby`) on QDay Aevum (`0xABE5`), check the 5-step readiness panel in `/app/docs`, and confirm live `tQDAY` & `tUSD8` balances.
- [ ] Test `/api/agent/audit` & `/api/agent/red-team` with an active `GEMINI_API_KEY`.
- [ ] Verify responsive ergonomics across mobile, tablet, and desktop viewports.

### Stage 4 — Production Deployment (Vercel)
- [ ] Connect the GitHub repository to Vercel.
- [ ] Set Environment Variables (`GEMINI_API_KEY`, `QDAY_RPC_URL`, `NEXT_PUBLIC_*`, and relayer/agent keys if enabling live on-chain relays).
- [ ] Smoke-test all routes and flows on the live Vercel URL.

### Stage 5 — Hackathon Submission Packaging (DoraHacks)
- [ ] Record an English product demo video (<= 3 minutes) covering the Landing Page, 2-Phone Simulator, AI Red-Team Console, and live QDay transactions.
- [ ] Update `README.md` with the live Vercel URL, deployed QDay addresses, GitHub repo, and demo video link.
- [ ] Final commit and DoraHacks submission.

---

## Deployed QDay Testnet Addresses & Sample Tx Hashes
*(Update this table locally right after Stage 2 deployment)*

| Component | Contract Address / Tx Hash | Notes |
| --- | --- | --- |
| `ERC8004Registry` | `-` | Pending Stage 2 deploy |
| `SalesLedger` | `-` | Pending Stage 2 deploy |
| `LoanPool` | `-` | Pending Stage 2 deploy |
| `AIGuarantor` | `-` | Pending Stage 2 deploy |
| Sample QDay Explorer Tx | `-` | Pending live transaction |

---

## Changelog
- **2026-11-16 (Stage 1c)**: Standardized entire UI, AI prompts, blueprints, `README.md`, and `PROGRESS.md` into clear English.
- **2026-11-16 (Stage 1b)**: Applied QDay Aevum technical requirements (`evm_version = "shanghai"` in `foundry.toml`, HTTPS polling only, 1,000-block `getLogsChunked` helper, EIP-3085 `0xABE5`, and 5-step Aevum readiness checker on `/app/docs`).
- **2026-11-16 (Stage 1)**: Initialized hackathon repository baseline, verified clean build & lint, and created `README.md` and `PROGRESS.md`.
