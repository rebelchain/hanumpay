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

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | `GET` | Verifies QDay RPC (`Chain 44005`) connectivity, deployed contract addresses, and server env readiness |
| `/api/relay/record-sale` | `POST` | Verifies merchant EIP-712 QR sale signature and relays `SalesLedger.recordSale` gaslessly |
| `/api/relay/accept-loan` | `POST` | Verifies merchant EIP-712 loan acceptance and relays `LoanPool.acceptLoan` |
| `/api/agent/cron` | `POST` | Scans registered shops, validates `AIGuarantor.checkEligibility`, and submits proposals (supports optional `x-cron-secret`) |
| `/api/agent/audit` | `POST` | Generates plain-English underwriting summary & risk note via Gemini (`ThinkingLevel.LOW` + fallback) |
| `/api/agent/red-team` | `POST` | Tests adversarial prompt injections against deterministic Solidity invariants |

---

## 4. Stage 4 Production Checklist (`hanumpay.vercel.app`)

1. **`GET /api/health`** — Confirm `{ ok: true }` with live QDay `blockNumber` and capability flags.
2. **`/app/docs`** — Connect MetaMask/Rabby on Chain `44005` and confirm **`5 / 5`** Aevum readiness.
3. **`/app/penjualan`** — Submit a **Gasless QR Sale** (MetaMask EIP-712 sign) and verify a live QDay Explorer TX hash returns.
4. **`/app/pinjaman`** — Run **AI Guarantor Cycle** and **Red-Team Attack** (`200 OK` from Gemini audit/red-team endpoints).
5. **`/app/identitas` & `/stage`** — Verify **ERC-8004 Confirmation of Payee** and the **Spoofed Supplier Address Attack** block.

---

## 5. Standalone Backend Deployment on Oracle Cloud VPS (`backend/`)

Instead of hosting your relayer private keys inside serverless functions, you can run the standalone Express 5 backend (`backend/`) on an Oracle Cloud Free Tier Ubuntu VPS while keeping the Next.js UI on Vercel (`https://hanumpay.vercel.app`).

### Step A — Open Firewall Ports on Oracle Cloud
1. In **Oracle Cloud Console -> Virtual Cloud Networks -> Security Lists**, add Ingress Rules for **TCP `80`** and **TCP `443`** (`0.0.0.0/0`).
2. Inside the VPS via SSH:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Step B — Build & Start Backend with Node 22 + PM2 (or Docker)
```bash
git clone https://github.com/rebelchain/hanumpay.git
cd hanumpay/backend
npm install
cp .env.example .env
# Edit .env: set GEMINI_API_KEY, RELAYER_PRIVATE_KEY, AGENT_PRIVATE_KEY,
# ALLOWED_ORIGIN="https://hanumpay.vercel.app,http://localhost:3000", and CRON_SECRET

npm run build
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

*(Alternative with Docker: `docker build -t hanumpay-backend . && docker run -d --name hanumpay-backend --restart unless-stopped -p 127.0.0.1:4000:4000 --env-file .env hanumpay-backend`)*

### Step C — Enable Automatic HTTPS with Caddy
Because browsers block mixed `http://` calls from `https://hanumpay.vercel.app`, proxy port `4000` behind Caddy HTTPS. If you do not own a custom domain, use `<YOUR_VPS_PUBLIC_IP>.sslip.io` (configured in `backend/Caddyfile.example`):
```bash
sudo apt install -y caddy
sudo cp Caddyfile.example /etc/caddy/Caddyfile
# Replace <YOUR_DOMAIN_OR_IP>.sslip.io in /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl https://<YOUR_DOMAIN_OR_IP>.sslip.io/api/health
```

### Step D — Connect Vercel Frontend & Autonomous VPS Cron
1. In **Vercel -> Project Settings -> Environment Variables**, add:
   `NEXT_PUBLIC_BACKEND_URL=https://<YOUR_DOMAIN_OR_IP>.sslip.io`
   and redeploy Vercel.
2. Add an autonomous 15-minute cron trigger on the VPS (`crontab -e`):
```bash
*/15 * * * * curl -fsS -X POST -H "x-cron-secret: YOUR_CRON_SECRET" https://<YOUR_DOMAIN_OR_IP>.sslip.io/api/agent/cron >/dev/null 2>&1
```

---

## 6. Real End-to-End Hackathon Demo Flow (100% Live QDay Chain `44005`)

- **Quick Sandbox Demo (`/stage`)**: Use the isolated 2-Phone Simulator to preview gasless QR sales, AI Guarantor offers, spoofed address blocking, and Gemini Red-Team prompt injections without touching real wallets.
- **Live On-Chain Workspace (`/app/*`)**:
  1. Claim `1 tQDAY` & `5 tUSD8` from `https://faucet.qday.info/en` for both your Merchant MetaMask wallet and your Relayer/Agent wallet.
  2. Connect MetaMask on `/app/dashboard` -> switch to **QDay Aevum (`44005`)** -> run **Onboard Shop (`SalesLedger.registerShop` + `ERC8004Registry.register`)**.
  3. On `/app/penjualan`, collect a real **Gasless QR Sale** (Merchant signs **EIP-712** in MetaMask with zero `tQDAY` gas -> VPS Relayer settles on `SalesLedger`) and open the live **QDay Explorer** TX link.
  4. On `/app/pool`, approve & deposit real `tUSD8` into `LoanPool`, or withdraw shares cleanly.
  5. On `/app/pinjaman`, inspect live `AIGuarantor` eligibility, toggle `setAgentPaused`, and test **Gemini Audit** & **Red-Team Attack** against real on-chain shop stats.
  6. On `/app/identitas`, verify suppliers via **ERC-8004 Confirmation of Payee** and send live `tUSD8` transfers with spoof-protection enforced.
