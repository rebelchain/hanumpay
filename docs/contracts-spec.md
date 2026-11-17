# Smart Contracts & Technical Specification

All four HanumPay contracts are compiled with Solidity `^0.8.24` using `evm_version = "shanghai"` and deployed on **QDay Aevum Testnet (Chain ID `44005`)** at Block `3310882`.

---

## Deployed Addresses (Chain ID `44005`)

| Contract              | Address                                      | Deployment TX                                                        |
| --------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `ERC8004Registry.sol` | `0x5533628fE8bFa8A6227C69cca8F7E96e578709c9` | `0x61225c341f230224c2b8423e0138aaa142962f52e38f67579fd32be311709419` |
| `SalesLedger.sol`     | `0xbFCe0404F4abbe73Bf4eDB2e0E7F7a0e69d33BE5` | `0x1370ba...ae921`                                                   |
| `LoanPool.sol`        | `0x5FcF8175bc41B584322Af65979013AbB6FecA6DB` | `0xaa677d...2dd1b`                                                   |
| `AIGuarantor.sol`     | `0x35E37e86b7676FEA5fb4704b5ce6C015492c1d64` | `0xe7f779...484fe`                                                   |
| `tUSD8` _(Token)_     | `0x456569838f1d43009A91ebA4263147Afd7233483` | `6 decimals`                                                         |

---

## Core Contract Interfaces

### `ERC8004Registry.sol`

- `register(string name, string category, bytes metadata)` — Registers a `"shop"`, `"agent"`, `"supplier"`, or `"lender"`.
- `resolve(string name) -> address` — Resolves an active ERC-8004 name to its verified wallet address.
- `isVerified(string name) -> bool` — Returns whether an identity is active.

### `SalesLedger.sol`

- `recordSale(address shop, uint256 amountUSD8, bytes32 customerId, uint256 deadline, bytes signature)` — Verifies merchant EIP-712 signature, logs the sale, updates 30-day rolling stats, and invokes `LoanPool.repayFromSale`.
- `getShopStats(address shop) -> ShopStats` — Returns `totalSales30d`, `uniqueCustomers30d`, `totalSalesAllTime`, and `shopRegisteredAt`.

### `AIGuarantor.sol`

- `proposeLoan(address shop) -> uint256 loanId` — Callable only by the authorized AI agent wallet; validates 30d history, `>= 5` unique buyers, AI Pause status, and daily rate limit.

### `LoanPool.sol`

- `acceptLoan(uint256 loanId, uint256 deadline, bytes signature)` — Verifies merchant EIP-712 consent and disburses `tUSD8` principal (within `80%` pool utilization cap).
- `repayFromSale(address shop, uint256 saleAmount) -> uint256 netAmount` — Auto-deducts `10%` of each QR sale until `principal + 5% fee` is repaid.
- `deposit(uint256 amount)` / `withdraw(uint256 shares)` — Community LP treasury functions.

---

## EIP-712 & `tUSD8` Standards

- **6 Decimals Strict Rule**: Always scale amounts with `parseUnits(amount, 6)` and `formatUnits(raw, 6)`. Never use `parseEther` (`18` decimals).
- **EIP-712 Domain (`SalesLedger`)**:
  - `name`: `"HanumPaySalesLedger"`
  - `version`: `"1"`
  - `chainId`: `44005`
- **QDay RPC Constraints**:
  - HTTPS polling only (`https://rpc-test.qday.info`) — WebSockets (`wss://`) are not supported.
  - `eth_getLogs` is capped at `1,000` blocks per call; use `getLogsChunked` in `lib/qday.ts`.
