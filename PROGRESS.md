# Hackathon Progress Tracker — HanumPay

This document serves as the shared source of truth across local development, the GitHub repository, and the AI Studio workspace so every hackathon milestone and deployed contract address stays synchronized.

---

## Current Status

- **Active Stage**: Stage 4 — Vercel Production Verification & Final Submission Prep
- **Live App (Vercel)**: `https://hanumpay.vercel.app`
- **GitHub Repository**: `https://github.com/rebelchain/hanumpay`
- **Target Network**: QDay Aevum Testnet (Chain ID `44005`)
- **Official tUSD8 Token**: `0x456569838f1d43009A91ebA4263147Afd7233483` (6 decimals)
- **Latest Deployment Block**: `3310882`

---

## Milestone Roadmap

### Stage 1 — App Foundation & Initial Repository Baseline (Complete)

- [x] HanumPay landing page featuring live credit limit calculator, fee comparison ruler, and modular contract cards.
- [x] Interactive 2-phone live simulator (`/stage`) covering gasless QR sales, AI Guarantor offers, verified supplier payouts, spoofed address defense, and prompt-injection tests.
- [x] Complete merchant workspace (`/app/dashboard`, `/app/penjualan`, `/app/pinjaman`, `/app/identitas`, `/app/pool`, `/app/docs`).
- [x] Standardized 100% into clear English across UI, API prompts, Solidity blueprints, `README.md`, and `PROGRESS.md`.
- [x] QDay Aevum alignment (`evm_version = "shanghai"` in `contracts/foundry.toml`, HTTPS polling only, 1,000-block `getLogsChunked`, EIP-3085 `0xABE5`, and 5-step Aevum readiness checker on `/app/docs`).
- [x] Ready for Stage 1 GitHub baseline push.

### Stage 2 — Foundry Tests & QDay Testnet Deployment (Deployed)

- [x] Confirm `contracts/foundry.toml` keeps `evm_version = "shanghai"` (prevents `invalid opcode: MCOPY`).
- [x] Install Foundry locally and run `Deploy.s.sol` against QDay Aevum Testnet (`44005`) — all 4 contracts deployed & wired in Block `3310882` (`0.003943121 tQDAY` total gas).
- [x] Claim `tQDAY` & `tUSD8` from `https://faucet.qday.info/en` (`1 tQDAY` and `5 tUSD8` testnet cap per claim).
- [x] Configure `.env.local`, sync `lib/qday.ts` defaults, and align EIP-712 `verifyingContract` bindings in `lib/hanumpay-store.tsx`.
- [x] Register merchant shop on-chain (`SalesLedger.registerShop`) and verify Gasless QR Sale TX on QDay Explorer.
- [x] Record bounded LP `tUSD8` deposit TX hash (`LoanPool.approve` + `LoanPool.deposit` within the `5 tUSD8` faucet budget).
- [x] Run `forge test -vvv` inside `contracts/` to archive unit & invariant test pass output.

### Stage 3 — End-to-End Integration & AI Verification (Verified Locally)

- [x] Verified EOA wallet connection (`MetaMask` / `Rabby`) on QDay Aevum (`0xABE5`) — `/app/docs` readiness panel confirmed **`5 / 5`**.
- [x] Verified live **Gasless QR Sale** TX hash on `https://explorer-test.qday.info`.
- [x] Verified **AI Red-Team Console** & **Gemini Audit** (`GEMINI_API_KEY` active; hardened `lib/gemini.ts` with `ThinkingLevel.LOW` + retry/fallback to `gemini-3.1-flash-lite` on `503` spikes).
- [x] Final quick check on **ERC-8004 Payee Verification + Spoofing Attack** (`/app/identitas` & `/stage`) and responsive viewports on the live Vercel domain.

### Stage 4 — Production Deployment on Vercel (Active)

- [x] Connect `https://github.com/rebelchain/hanumpay` to Vercel and deploy live at `https://hanumpay.vercel.app`.
- [ ] Verify Environment Variable parity in Vercel (`GEMINI_API_KEY`, `QDAY_RPC_URL`, 4 `NEXT_PUBLIC_*` addresses, `RELAYER_PRIVATE_KEY`, `AGENT_PRIVATE_KEY`).
- [ ] Smoke-test all core flows on `https://hanumpay.vercel.app` (`/app/docs` `5/5`, Gasless QR Sale TX, AI Audit + Red-Team `200 OK`, ERC-8004 Spoofing block).

### Stage 5 — Hackathon Submission Packaging (DoraHacks)

- [ ] Record an English product demo video (<= 3 minutes) covering the Landing Page, 2-Phone Simulator, AI Red-Team Console, and live QDay transactions.
- [ ] Add Demo Video URL into `README.md` and `PROGRESS.md`.
- [ ] Final commit to `https://github.com/rebelchain/hanumpay` and DoraHacks submission.

---

## Deployed QDay Testnet Addresses & Sample Tx Hashes

| Component                | Contract Address / Tx Hash                                           | Notes                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ERC8004Registry`        | `0x5533628fE8bFa8A6227C69cca8F7E96e578709c9`                         | Block `3310882` · Deploy Tx `0x61225c341f230224c2b8423e0138aaa142962f52e38f67579fd32be311709419`                                    |
| `SalesLedger`            | `0xbFCe0404F4abbe73Bf4eDB2e0E7F7a0e69d33BE5`                         | Block `3310882` · Deploy Tx `0x1370ba11990eceff2b7a69e83998bf82834a3af0854bf30d4bc066054a6ae921` · `setLoanPool` `0xf4399353...`    |
| `LoanPool`               | `0x5FcF8175bc41B584322Af65979013AbB6FecA6DB`                         | Block `3310882` · Deploy Tx `0xaa677dff6e1d517aad06eb4ce16258ded2f5128c4e0c0b0a53835a483782dd1b` · `setAIGuarantor` `0x56ee6d89...` |
| `AIGuarantor`            | `0x35E37e86b7676FEA5fb4704b5ce6C015492c1d64`                         | Block `3310882` · Deploy Tx `0xe7f779da8be0e78be67df7e348faf234891b8c3e44d057274a0168d8a73484fe`                                    |
| Contract Deploy Batch Tx | `0x61225c341f230224c2b8423e0138aaa142962f52e38f67579fd32be311709419` | Initial contract deployment batch                                                                                                   |
| Gasless QR Sale Tx       | `0x98731de9e728d4cd43b9eb7eed153d8a90ce526b1fc961f5fae80688784c55c6` | Verified live `SalesLedger.recordSale` TX                                                                                           |
| LP Deposit (`tUSD8`) Tx  | `0x1fc8460f1eeeede30c03db8793b7119b92039fe1ad2e8644bfbc324ef5413f4e` | Bounded `LoanPool.deposit` within `5 tUSD8` faucet                                                                                  |

> **Testnet Faucet & Guardrail Note**: QDay Aevum faucet provides `1 tQDAY` and `5 tUSD8`, and `AIGuarantor.sol` requires `>= 30 days` shop registration age for new on-chain loan proposals—so day-one `/api/agent/cron` connects cleanly (`200 OK`) and skips fresh shops per contract rules while AI underwriting & Red-Team verification run live via Gemini.

---

## Changelog

- **2026-11-16 (Stage 4)**: Deployed production app to `https://hanumpay.vercel.app`, linked `https://github.com/rebelchain/hanumpay`, hardened Gemini AI routes (`lib/gemini.ts` `ThinkingLevel.LOW` + `503` retry/fallback), and updated `README.md` / `PROGRESS.md` with Stage 4 QA checklist.
- **2026-11-16 (Stage 3)**: Verified `5 / 5` Aevum wallet readiness, live Gasless QR Sale TX on QDay Explorer, and AI Red-Team Console locally.
- **2026-11-16 (Stage 2)**: Deployed all 4 contracts to QDay Aevum Testnet (`44005`) in Block `3310882`, synced deployed defaults in `lib/qday.ts`, and aligned EIP-712 `verifyingContract` addresses in `lib/hanumpay-store.tsx`.
- **2026-11-16 (Stage 1c)**: Standardized entire UI, AI prompts, blueprints, `README.md`, and `PROGRESS.md` into clear English.
- **2026-11-16 (Stage 1b)**: Applied QDay Aevum technical requirements (`evm_version = "shanghai"` in `foundry.toml`, HTTPS polling only, 1,000-block `getLogsChunked` helper, EIP-3085 `0xABE5`, and 5-step Aevum readiness checker on `/app/docs`).
- **2026-11-16 (Stage 1)**: Initialized hackathon repository baseline, verified clean build & lint, and created `README.md` and `PROGRESS.md`.
