# HanumPay

**Revenue-backed working capital and ERC-8004 Confirmation of Payee for micro-merchants on QDay Aevum Testnet.**

HanumPay turns daily QR cashier sales (`tUSD8`, 6 decimals) into verifiable on-chain cashflow history with zero merchant gas fees (*gasless EIP-712*). An autonomous, contract-bounded AI Guarantor reads 30-day verified turnover to unlock micro working-capital credit (**max 10% of 30-day revenue, $500 tUSD8 cap, 5% flat fee, 0% late penalties**), while **ERC-8004 Confirmation of Payee** protects B2B wholesale supplier payouts.

---

## Core Protocol Capabilities

1. **Gasless QR Cashier (`SalesLedger.sol` + EIP-712 Relayer)**
   - Customers settle QR purchases in `tUSD8`; customer phone identifiers are hashed locally via `keccak256` before signing.
   - Anti-wash-trading sybil gate requires at least **5 unique buyers** and **30 days** of shop history before credit unlocks.
2. **Contract-Bounded AI Guarantor (`AIGuarantor.sol` + Gemini Audit)**
   - Proposes micro-loans strictly within immutable Solidity bounds (`10%` of 30d revenue, `$500` ceiling, `10 proposals/day` rate limit).
   - Merchants retain a sovereign **AI Pause Kill Switch** to halt new credit offers at any time without affecting QR checkout.
3. **10% Auto-Repayment & On-Chain Credit Passport (`LoanPool.sol`)**
   - Zero due dates and zero late penalties. Every incoming QR sale automatically routes `10%` toward loan repayment until settled.
   - Completed settlements mint a portable **On-Chain Credit Passport**.
4. **Supplier Confirmation of Payee (`ERC8004Registry.sol`)**
   - Resolves and verifies human-readable supplier names against on-chain wallet addresses before payout to prevent address spoofing.

---

## Live Environment & Links

| Resource | Endpoint / URL |
| --- | --- |
| **Live Web App** | `https://hanumpay.vercel.app` |
| **2-Phone Live Simulator** | `https://hanumpay.vercel.app/stage` |
| **In-App Readiness & Blueprints** | `https://hanumpay.vercel.app/app/docs` |
| **Network** | QDay Aevum Testnet — Chain ID `44005` (`0xABE5`) |
| **RPC Endpoint** | `https://rpc-test.qday.info` *(HTTPS polling only)* |
| **Block Explorer** | `https://explorer-test.qday.info` |
| **Testnet Faucet** | `https://faucet.qday.info/en` (`1 tQDAY` + `5 tUSD8`) |
| **tUSD8 Token (6 decimals)** | `0x456569838f1d43009A91ebA4263147Afd7233483` |
