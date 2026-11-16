# HanumPay

**Revenue-backed working capital and ERC-8004 Confirmation of Payee for micro-merchants on QDay Aevum Testnet.**

HanumPay helps small shops and MSMEs build verifiable on-chain QR sales cashflow with zero gas cost (_gasless EIP-712_), unlocks contract-bounded `tUSD8` working capital (**max 10% of 30-day revenue, $500 tUSD8 cap, 5% flat fee, 0% late penalties**), and protects wholesale supplier payouts using **ERC-8004 Confirmation of Payee**.

---

## Core Features

1. **Gasless QR Cashier (`SalesLedger.sol` + EIP-712 Relayer)**
   - Customers pay with `tUSD8`; customer phone identifiers are hashed locally via `keccak256` before signing.
   - Anti-wash-trading sybil gate: merchants must prove at least **5 unique buyers** over the trailing 30 days before credit unlocks.
2. **Contract-Bounded AI Guarantor (`AIGuarantor.sol` + Gemini Audit)**
   - AI analyzes merchant cashflow and submits credit proposals **strictly within contract bounds** (max 10% ratio, $500 `tUSD8` ceiling, 10 proposals/day rate limit).
   - Merchants hold a sovereign **AI Pause Kill Switch** to halt new credit offers at any time without interrupting daily QR checkout.
3. **10% Auto-Repayment & 5% Flat Fee (`LoanPool.sol`)**
   - No rigid due dates and **0% late penalties**. Every incoming QR sale automatically routes 10% toward loan repayment until settled.
   - Once repaid, settlement history is minted as a portable **On-Chain Credit Passport**.
4. **Supplier Confirmation of Payee (`ERC8004Registry.sol`)**
   - Verifies registered wholesale supplier names against on-chain wallet addresses before transfer to prevent address spoofing and mis-transfers.
5. **2-Phone Live Simulator (`/stage`) & Adversarial AI Red-Team**
   - Side-by-side interactive theater featuring the **Shop QR POS**, **AI Guarantor Monitor**, and **Scenario Director** (including live Gemini prompt-injection tests reverted deterministically by Solidity invariants).

---

## QDay Aevum Testnet Configuration

| Parameter                    | Value                                                                      |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Network Name**             | QDay Aevum                                                                 |
| **Chain ID**                 | `44005` (`0xABE5`)                                                         |
| **RPC URL**                  | `https://rpc-test.qday.info` _(HTTPS polling only — no WebSocket RPC)_     |
| **EVM Target**               | `shanghai` _(required in `contracts/foundry.toml`, avoids Cancun `MCOPY`)_ |
| **Block Explorer**           | `https://explorer-test.qday.info`                                          |
| **Faucet**                   | `https://faucet.qday.info/en`                                              |
| **tUSD8 Token (6 decimals)** | `0x456569838f1d43009A91ebA4263147Afd7233483`                               |

### QDay Aevum Technical Requirements & Wallet Integration

- **Solidity Target (`evm_version = "shanghai"`)**: Solidity `0.8.24` defaults to `cancun`, which can deploy and then revert at runtime with `invalid opcode: MCOPY`. `contracts/foundry.toml` is pre-configured with `evm_version = "shanghai"`.
- **No WebSocket RPC & `eth_getLogs` Limit**: QDay Aevum supports HTTPS polling only (max `1,000` blocks per `eth_getLogs` call — use `getLogsChunked` in `lib/qday.ts`).
- **Wallet Integration (Active EOA vs `@qday-io/sdk` Q1 2027)**: `@qday-io/sdk` and `@qday-io/cli` launch in Q1 2027 and are not yet published on npm. HanumPay uses the active path documented by QDay Wiki: standard EOA wallets (`MetaMask`/`Rabby` via `window.ethereum` + EIP-3085 `0xABE5`) paired with gasless EIP-712 relayer signatures.
- **Explorer Verification & Judging**: Explorer source verification is not available yet; include this GitHub repository link and deployed contract addresses in the hackathon submission. Judging counts real on-chain transaction activity on **QDay Aevum**.

### Deployed Smart Contract Addresses (QDay Aevum Testnet — Block `3310882`)

| Contract              | QDay Testnet (44005) Address                 | Status                        |
| --------------------- | -------------------------------------------- | ----------------------------- |
| `ERC8004Registry.sol` | `0x5533628fE8bFa8A6227C69cca8F7E96e578709c9` | Deployed (`0x61225c...09419`) |
| `SalesLedger.sol`     | `0xbFCe0404F4abbe73Bf4eDB2e0E7F7a0e69d33BE5` | Deployed (`0x1370ba...ae921`) |
| `LoanPool.sol`        | `0x5FcF8175bc41B584322Af65979013AbB6FecA6DB` | Deployed (`0xaa677d...2dd1b`) |
| `AIGuarantor.sol`     | `0x35E37e86b7676FEA5fb4704b5ce6C015492c1d64` | Deployed (`0xe7f779...484fe`) |

### Sample On-Chain Activity Proofs (QDay Explorer)

| Flow                                  | Transaction Hash / Explorer Link                                     | Notes                                             |
| ------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| **4-Contract Deployment Batch**       | `0x61225c341f230224c2b8423e0138aaa142962f52e38f67579fd32be311709419` | Block `3310882` (`0.003943121 tQDAY` gas)         |
| **Gasless QR Sale (EIP-712 Relayer)** | `0x98731de9e728d4cd43b9eb7eed153d8a90ce526b1fc961f5fae80688784c55c6` | `SalesLedger.recordSale` on Chain `44005`         |
| **Community LP Deposit (`tUSD8`)**    | `0x1fc8460f1eeeede30c03db8793b7119b92039fe1ad2e8644bfbc324ef5413f4e` | `LoanPool.deposit` within `5 tUSD8` faucet budget |

> **Testnet Faucet & On-Chain Guardrail Notes**
>
> - QDay Aevum's public faucet distributes **`1 tQDAY` and `5 tUSD8`** per claim, keeping live testnet `LoanPool` liquidity intentionally small while proving real on-chain settlement flows.
> - `AIGuarantor.sol` enforces a **`30-day` minimum shop history** (`shopRegisteredAt`) and **`>= 5` unique buyers** before submitting live on-chain loan proposals. On day one after deployment, `/api/agent/cron` connects cleanly to QDay RPC (`200 OK`) and deterministically skips shops under 30 days, while Gemini AI underwriting (`/api/agent/audit`), adversarial testing (`/api/agent/red-team` with `ThinkingLevel.LOW` + automatic retry/fallback), and the `/stage` simulator demonstrate full credit lifecycle mechanics.

---

## Project Structure

```text
├── app/
│   ├── page.tsx                  # Landing page + credit limit calculator & fee comparison ruler
│   ├── stage/page.tsx            # 2-phone live simulator & scenario director
│   ├── app/
│   │   ├── dashboard/page.tsx    # Merchant dashboard & Credit Passport
│   │   ├── penjualan/page.tsx    # QR cashier & verifiable receipt history
│   │   ├── pinjaman/page.tsx     # Loan lifecycle, AI audit logs & Red-Team console
│   │   ├── identitas/page.tsx    # ERC-8004 directory & verified supplier payouts
│   │   ├── pool/page.tsx         # Community LP liquidity pool
│   │   └── docs/page.tsx         # Foundry guide, Aevum readiness checker & blueprints
│   └── api/
│       ├── agent/audit/          # Gemini credit eligibility explanation endpoint
│       ├── agent/red-team/       # Prompt-injection vs contract invariant verifier
│       ├── agent/cron/           # AI Guarantor check cycle
│       └── relay/                # Gasless EIP-712 relayers (record-sale & accept-loan)
├── components/                   # App & landing UI components
├── lib/                          # Deterministic contract rules engine, Gemini helper, state store, viem QDay client
└── contracts/                    # Solidity smart contracts & Foundry test suite
    ├── src/                      # ERC8004Registry, SalesLedger, LoanPool, AIGuarantor
    ├── script/Deploy.s.sol       # QDay Testnet deployment script
    └── test/HanumPay.t.sol       # Solidity unit & invariant tests
```

---

## Running the Web App Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local
# Add GEMINI_API_KEY in .env.local (optional when testing local relayer mode)

# 3. Start the development server (port 3000)
npm run dev
```

---

## Testing & Deploying Smart Contracts (Foundry)

```bash
cd contracts

# Run unit & invariant test suite
forge test -vvv

# Configure deployment keys for QDay Aevum Testnet (Chain ID 44005)
export DEPLOYER_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
export AGENT_WALLET_ADDRESS=0xYOUR_AGENT_PUBLIC_ADDRESS

# Ensure foundry.toml uses evm_version = "shanghai" (pre-configured)
# Deploy the 4 core contracts to QDay Testnet
forge script script/Deploy.s.sol --rpc-url https://rpc-test.qday.info --broadcast --legacy
```

Once deployed, add the four contract addresses to `.env.local` (and Vercel Environment Variables for production):

- `NEXT_PUBLIC_ERC8004_ADDRESS`
- `NEXT_PUBLIC_SALES_LEDGER_ADDRESS`
- `NEXT_PUBLIC_LOAN_POOL_ADDRESS`
- `NEXT_PUBLIC_AI_GUARANTOR_ADDRESS`

---

## Stage 4 Production Checklist (Vercel)

Ensure all Environment Variables in Vercel match `.env.local` (`GEMINI_API_KEY`, `QDAY_RPC_URL`, all 4 `NEXT_PUBLIC_*` contract addresses, `RELAYER_PRIVATE_KEY`, and `AGENT_PRIVATE_KEY`), then verify on `https://hanumpay.vercel.app`:

1. **`/app/docs`** — Connect MetaMask/Rabby on Chain `44005` and confirm **`5 / 5`** Aevum readiness.
2. **`/app/penjualan`** — Submit a **Gasless QR Sale** (MetaMask EIP-712 sign) and verify a live QDay Explorer TX hash returns.
3. **`/app/pinjaman`** — Run **AI Guarantor Cycle** and **Red-Team Attack** (`200 OK` from Gemini audit/red-team endpoints).
4. **`/app/identitas` & `/stage`** — Verify **ERC-8004 Confirmation of Payee** and the **Spoofed Supplier Address Attack** block.

---

## Hackathon Submission Links

- **Live App (Vercel)**: https://hanumpay.vercel.app
- **GitHub Repository**: https://github.com/rebelchain/hanumpay
- **Product Demo Video**: `<PASTE_DEMO_VIDEO_URL>` _(Stage 5)_
