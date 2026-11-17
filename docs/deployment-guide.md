# Deployment & Verification Guide

## 1. Running the Web App Locally

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Add GEMINI_API_KEY and relayer keys in .env.local (optional in simulation mode)

# Start local Next.js dev server on port 3000
npm run dev
```

---

## 2. Testing & Deploying Contracts (Foundry)

```bash
cd contracts

# Run Solidity unit & invariant test suite
forge test -vvv

# Configure deployment keys for QDay Aevum Testnet (Chain ID 44005)
export DEPLOYER_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
export AGENT_WALLET_ADDRESS=0xYOUR_AGENT_PUBLIC_ADDRESS

# contracts/foundry.toml locks evm_version = "shanghai"
forge script script/Deploy.s.sol --rpc-url https://rpc-test.qday.info --broadcast --legacy
```

After deployment, map the four contract addresses in `.env.local` and Vercel Environment Variables:

- `NEXT_PUBLIC_ERC8004_ADDRESS`
- `NEXT_PUBLIC_SALES_LEDGER_ADDRESS`
- `NEXT_PUBLIC_LOAN_POOL_ADDRESS`
- `NEXT_PUBLIC_AI_GUARANTOR_ADDRESS`

---

## 3. REST API Reference

| Endpoint                 | Method | Purpose                                                                                              |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| `/api/relay/record-sale` | `POST` | Verifies merchant EIP-712 QR sale signature and relays `SalesLedger.recordSale` gaslessly            |
| `/api/relay/accept-loan` | `POST` | Verifies merchant EIP-712 loan acceptance and relays `LoanPool.acceptLoan`                           |
| `/api/agent/cron`        | `POST` | Scans registered shops, validates `AIGuarantor.checkEligibility`, and submits proposals              |
| `/api/agent/audit`       | `POST` | Generates plain-English underwriting summary & risk note via Gemini (`ThinkingLevel.LOW` + fallback) |
| `/api/agent/red-team`    | `POST` | Tests adversarial prompt injections against deterministic Solidity invariants                        |

---

## 4. Stage 4 Production Checklist (`hanumpay.vercel.app`)

1. **`/app/docs`** — Connect MetaMask/Rabby on Chain `44005` and confirm **`5 / 5`** Aevum readiness.
2. **`/app/penjualan`** — Submit a **Gasless QR Sale** (MetaMask EIP-712 sign) and verify a live QDay Explorer TX hash returns.
3. **`/app/pinjaman`** — Run **AI Guarantor Cycle** and **Red-Team Attack** (`200 OK` from Gemini audit/red-team endpoints).
4. **`/app/identitas` & `/stage`** — Verify **ERC-8004 Confirmation of Payee** and the **Spoofed Supplier Address Attack** block.
