# System Architecture

HanumPay connects a gasless Next.js merchant interface, an EIP-712 relayer + Gemini underwriting layer, and four Foundry-verified smart contracts deployed on **QDay Aevum Testnet (Chain ID `44005`)**.

---

## High-Level Data Flow

```text
+-----------------------------------------------------------------------------------+
|                        CLIENT LAYER (Next.js 15 + Tailwind)                       |
|  Merchant POS (/app/penjualan)  |  Credit & Red-Team (/app/pinjaman)              |
|  Payee Directory (/app/identitas) | LP Pool (/app/pool) | Simulator (/stage)      |
+-------------------------------+-------------------------------+-------------------+
                                | EIP-712 / HTTPS               | REST (fetch)
                                v                               v
+---------------------------------------+       +-----------------------------------+
|      GASLESS RELAYER & AGENT API      |       |      GEMINI AI UNDERWRITING       |
|  - /api/relay/record-sale (EIP-712)   |       |  - /api/agent/audit (summary)     |
|  - /api/relay/accept-loan (EIP-712)   |       |  - /api/agent/red-team (guardrail)|
|  - /api/agent/cron (eligibility loop) |       |    ThinkingLevel.LOW + fallback   |
+-------------------+-------------------+       +-----------------+-----------------+
                    | viem (HTTPS Polling, Chain 44005)           |
                    v                                             v
+-----------------------------------------------------------------------------------+
|               QDAY AEVUM TESTNET SMART CONTRACTS (Block 3310882)                  |
|                                                                                   |
|  +------------------+   10% Auto-Repay    +------------------------------------+  |
|  | SalesLedger.sol  | ------------------> | LoanPool.sol                       |  |
|  | - recordSale()   |                     | - deposit() / withdraw() LP shares |  |
|  | - 30d sales/buyer| <------------------ | - 5% flat fee, 80% pool cap        |  |
|  +------------------+   proposeLoan()     +------------------------------------+  |
|           ^                                                 ^                     |
|           | read stats                                      | bounded proposal    |
|  +------------------+                     +------------------------------------+  |
|  | ERC8004Registry  |                     | AIGuarantor.sol                    |  |
|  | - Supplier CoP   |                     | - 30d age, >=5 buyers, 10%/$500 cap|  |
|  | - Credit Passport|                     | - 10/day rate limit + Kill Switch  |  |
|  +------------------+                     +------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## Contract Dependency Order

```text
ERC8004Registry   (identity layer: shops, AI agents, suppliers, lenders)
       ^
SalesLedger       (gasless EIP-712 QR sales + calls LoanPool.repayFromSale)
       ^
AIGuarantor       (reads SalesLedger + LoanPool; ONLY permitted to call proposeLoan)
       ^
LoanPool          (tUSD8 treasury, 80% utilization cap, Credit Passport minting)
```

Deploy sequence: `ERC8004Registry -> SalesLedger -> LoanPool -> AIGuarantor`.

---

## Security Invariants (Contract-Enforced)

| Invariant                   | Value                                      | Enforced In                        |
| --------------------------- | ------------------------------------------ | ---------------------------------- |
| **Max loan principal**      | `10%` of 30d sales, capped at `$500 tUSD8` | `AIGuarantor.sol` / `LoanPool.sol` |
| **Max AI proposals / day**  | `10` proposals / 24h                       | `AIGuarantor.sol`                  |
| **Max pool utilization**    | `80%` of TVL                               | `LoanPool.sol`                     |
| **Post-repayment cooldown** | `30 days`                                  | `LoanPool.sol`                     |
| **Minimum unique buyers**   | `5` within trailing 30d                    | `AIGuarantor.sol`                  |
| **Minimum shop history**    | `30 days`                                  | `AIGuarantor.sol`                  |
| **Loan fee**                | `5%` flat immutable                        | `LoanPool.sol`                     |
| **EVM Target**              | `shanghai` _(avoids Cancun `MCOPY`)_       | `contracts/foundry.toml`           |
