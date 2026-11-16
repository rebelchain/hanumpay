# CONTRACTS_SPEC.md — Smart Contract Interfaces

> IMPORTANT: This is the source of truth for all contract interfaces.
> Frontend and agent code MUST match these signatures exactly.
> tUSD8 uses 6 decimals — always use parseUnits(amount, 6).

---

## 1. ERC8004Registry.sol

**Purpose**: On-chain identity registry. Maps human-readable names to wallet addresses.
Used for Confirmation of Payee — verify you're paying the right entity.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC8004Registry {

    // ─── Structs ──────────────────────────────────────────────────

    struct Identity {
        address wallet;         // the wallet this identity resolves to
        string  name;           // human-readable name e.g. "Warung Bu Sri"
        string  category;       // "shop" | "agent" | "lender"
        bytes   metadata;       // optional JSON encoded extra data
        uint256 registeredAt;
        bool    active;
    }

    // ─── Events ───────────────────────────────────────────────────

    event IdentityRegistered(
        bytes32 indexed nameHash,
        address indexed wallet,
        string  name,
        string  category
    );

    event IdentityUpdated(
        bytes32 indexed nameHash,
        address indexed wallet
    );

    event IdentityRevoked(
        bytes32 indexed nameHash
    );

    // ─── Errors ───────────────────────────────────────────────────

    error NameAlreadyTaken(string name);
    error IdentityNotFound(string name);
    error NotIdentityOwner();
    error EmptyName();

    // ─── Write Functions ─────────────────────────────────────────

    /// @notice Register a new identity
    /// @param name Human-readable name. Must be unique. Max 64 chars.
    /// @param category "shop" | "agent" | "lender"
    /// @param metadata Optional JSON bytes. Pass "" if none.
    function register(
        string  calldata name,
        string  calldata category,
        bytes   calldata metadata
    ) external;

    /// @notice Update metadata for your identity (only owner)
    function update(
        string calldata name,
        bytes  calldata newMetadata
    ) external;

    /// @notice Revoke your identity (only owner)
    function revoke(string calldata name) external;

    // ─── Read Functions ───────────────────────────────────────────

    /// @notice Resolve a name to its wallet address
    /// @return wallet address, zero address if not found
    function resolve(string calldata name) external view returns (address wallet);

    /// @notice Get full identity record
    function getIdentity(string calldata name) external view returns (Identity memory);

    /// @notice Check if a name is registered and active
    function isVerified(string calldata name) external view returns (bool);

    /// @notice Get the name registered to a wallet (reverse lookup)
    function nameOf(address wallet) external view returns (string memory);
}
```

---

## 2. SalesLedger.sol

**Purpose**: Immutable record of every QR sale. The source of truth for credit scoring.
Owners record sales via gasless EIP-712 signatures.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISalesLedger {

    // ─── Structs ──────────────────────────────────────────────────

    struct Sale {
        address shop;
        uint256 amountUSD8;    // tUSD8 amount (6 decimals)
        bytes32 customerId;    // keccak256 of customer identifier (privacy)
        uint256 timestamp;
    }

    struct ShopStats {
        uint256 totalSales30d;        // sum of sale amounts in last 30 days (6 dec)
        uint256 uniqueCustomers30d;   // unique customer count in last 30 days
        uint256 totalSalesAllTime;
        uint256 totalSaleCount;
        uint256 lastSaleTimestamp;
        bool    hasMinimumHistory;    // true if shop has 30+ days of records
    }

    // ─── Events ───────────────────────────────────────────────────

    event SaleRecorded(
        address indexed shop,
        uint256 amount,
        bytes32 indexed customerId,
        uint256 timestamp,
        uint256 saleIndex
    );

    // ─── Errors ───────────────────────────────────────────────────

    error InvalidAmount();
    error InvalidSignature();
    error ShopNotRegistered(address shop);
    error ZeroCustomerId();

    // ─── Write Functions ─────────────────────────────────────────

    /// @notice Record a sale. Gasless — owner signs EIP-712 off-chain.
    /// @param shop       The shop's wallet address
    /// @param amountUSD8 Sale amount in tUSD8 (6 decimals)
    /// @param customerId keccak256 hash of customer's phone/ID (for uniqueness, not stored raw)
    /// @param deadline   Signature expiry timestamp
    /// @param signature  EIP-712 signature from shop owner
    function recordSale(
        address shop,
        uint256 amountUSD8,
        bytes32 customerId,
        uint256 deadline,
        bytes   calldata signature
    ) external;

    /// @notice Register a new shop. Called once before first sale.
    /// @param erc8004Name The name registered in ERC8004Registry (e.g. "Warung Bu Sri")
    function registerShop(string calldata erc8004Name) external;

    // ─── Read Functions ───────────────────────────────────────────

    /// @notice Get aggregated stats for credit scoring
    function getShopStats(address shop) external view returns (ShopStats memory);

    /// @notice Get paginated sale records for a shop
    /// @param shop    Shop address
    /// @param offset  Start index
    /// @param limit   Max records to return (max 100)
    function getSales(
        address shop,
        uint256 offset,
        uint256 limit
    ) external view returns (Sale[] memory sales, uint256 total);

    /// @notice Get total number of registered shops
    function totalShops() external view returns (uint256);

    /// @notice Get list of all shop addresses (paginated)
    function getShops(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory);

    // ─── EIP-712 Helpers ─────────────────────────────────────────

    /// @notice Returns the EIP-712 domain separator
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    /// @notice Returns the typehash for recordSale
    /// keccak256("RecordSale(address shop,uint256 amountUSD8,bytes32 customerId,uint256 deadline)")
    function RECORD_SALE_TYPEHASH() external view returns (bytes32);
}
```

---

## 3. LoanPool.sol

**Purpose**: Holds tUSD8 liquidity. Manages full loan lifecycle.
Only AIGuarantor can propose loans. Owners accept with one signature.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILoanPool {

    // ─── Enums ────────────────────────────────────────────────────

    enum LoanStatus {
        Proposed,   // AI proposed, owner not yet accepted
        Active,     // Owner accepted, repaying
        Repaid,     // Fully repaid
        Expired     // Proposal expired (48h), never accepted
    }

    // ─── Structs ──────────────────────────────────────────────────

    struct Loan {
        uint256   id;
        address   shop;
        uint256   principal;      // tUSD8 (6 decimals)
        uint256   flatFee;        // fixed one-time fee (6 decimals)
        uint256   repayPct;       // basis points (1000 = 10%)
        uint256   totalRepaid;    // running total repaid so far
        uint256   proposedAt;
        uint256   acceptedAt;
        uint256   repaidAt;
        LoanStatus status;
    }

    struct PoolStats {
        uint256 totalDeposited;   // total lender deposits (6 decimals)
        uint256 totalLoaned;      // currently loaned out
        uint256 totalAvailable;   // available for new loans
        uint256 utilizationPct;   // basis points
        uint256 totalFeeEarned;   // all-time fee collected
        uint256 activeLoanCount;
    }

    // ─── Events ───────────────────────────────────────────────────

    event LoanProposed(
        uint256 indexed loanId,
        address indexed shop,
        uint256 principal,
        uint256 flatFee,
        uint256 repayPct
    );

    event LoanAccepted(
        uint256 indexed loanId,
        address indexed shop,
        uint256 timestamp
    );

    event LoanRepayment(
        uint256 indexed loanId,
        address indexed shop,
        uint256 amount,
        uint256 totalRepaid,
        uint256 remaining
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed shop,
        uint256 totalRepaid,
        uint256 daysToRepay
    );

    event LoanExpired(uint256 indexed loanId);

    event LenderDeposited(address indexed lender, uint256 amount, uint256 shares);
    event LenderWithdrew(address indexed lender, uint256 amount, uint256 shares);

    // ─── Errors ───────────────────────────────────────────────────

    error NotAIGuarantor();
    error LoanNotFound(uint256 loanId);
    error LoanNotProposed(uint256 loanId);
    error LoanAlreadyActive(address shop);
    error ExceedsMaxLoanSize(uint256 requested, uint256 max);
    error ExceedsPoolExposure();
    error InvalidSignature();
    error ProposalExpired(uint256 loanId);
    error InsufficientPoolLiquidity();
    error CooldownActive(address shop, uint256 unlockTimestamp);

    // ─── Write: AI Guarantor Only ────────────────────────────────

    /// @notice Propose a loan. Called only by AIGuarantor contract.
    /// @param shop       Target shop address
    /// @param principal  Loan amount in tUSD8
    /// @param flatFee    Fixed fee in tUSD8 (not APR)
    /// @param repayPct   Repayment per sale in basis points (1000 = 10%)
    function proposeLoan(
        address shop,
        uint256 principal,
        uint256 flatFee,
        uint256 repayPct
    ) external returns (uint256 loanId);

    // ─── Write: Shop Owner ────────────────────────────────────────

    /// @notice Accept a proposed loan. Gasless — EIP-712 signature.
    /// @param loanId     The proposal ID from proposeLoan()
    /// @param deadline   Signature expiry
    /// @param signature  EIP-712 signature from shop owner
    function acceptLoan(
        uint256 loanId,
        uint256 deadline,
        bytes   calldata signature
    ) external;

    // ─── Write: Called by SalesLedger ────────────────────────────

    /// @notice Auto-deduct repayment from a recorded sale.
    /// Called internally when SalesLedger.recordSale() fires.
    /// @param shop       Shop with active loan
    /// @param saleAmount Gross sale amount (6 decimals)
    /// @return netAmount Amount left for the shop after repayment deduction
    function repayFromSale(
        address shop,
        uint256 saleAmount
    ) external returns (uint256 netAmount);

    // ─── Write: Lenders ───────────────────────────────────────────

    /// @notice Deposit tUSD8 into the lending pool
    /// @param amount Amount in tUSD8 (6 decimals). Must approve first.
    function deposit(uint256 amount) external;

    /// @notice Withdraw tUSD8 from the pool
    /// @param shares Pool share tokens to redeem
    function withdraw(uint256 shares) external;

    // ─── Read Functions ───────────────────────────────────────────

    /// @notice Get loan details by ID
    function getLoan(uint256 loanId) external view returns (Loan memory);

    /// @notice Get active loan for a shop (0 if none)
    function getActiveLoan(address shop) external view returns (uint256 loanId);

    /// @notice Get all loan IDs for a shop (history)
    function getShopLoans(address shop) external view returns (uint256[] memory);

    /// @notice Get pool-wide stats
    function getPoolStats() external view returns (PoolStats memory);

    /// @notice Check if a shop is in cooldown after repayment
    function getCooldownEnd(address shop) external view returns (uint256 timestamp);

    /// @notice Get lender's current balance and shares
    function getLenderBalance(address lender) external view returns (
        uint256 shares,
        uint256 tUSD8Value
    );
}
```

---

## 4. AIGuarantor.sol

**Purpose**: The only contract the AI agent's private key can call.
Thin wrapper that enforces all constraints before forwarding to LoanPool.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAIGuarantor {

    // ─── Constants (enforced in contract) ────────────────────────

    // MAX_LOAN_USD8        = 500 * 1e6  ($500 tUSD8)
    // MAX_DAILY_PROPOSALS  = 10
    // MAX_POOL_EXPOSURE    = 8000       (80% in basis points)
    // MIN_UNIQUE_CUSTOMERS = 5
    // FLAT_FEE_BPS         = 500        (5% of principal)
    // REPAY_PCT_BPS        = 1000       (10% of each sale)

    // ─── Events ───────────────────────────────────────────────────

    event ProposalSubmitted(
        address indexed shop,
        uint256 principal,
        uint256 flatFee,
        uint256 loanId,
        uint256 timestamp
    );

    event ProposalRejected(
        address indexed shop,
        string  reason,
        uint256 timestamp
    );

    // ─── Errors ───────────────────────────────────────────────────

    error NotAuthorizedAgent();
    error DailyBudgetExhausted(uint256 usedToday, uint256 max);
    error ShopHasActiveLoan(address shop);
    error ShopNotEligible(address shop, string reason);
    error ExceedsMaxLoan(uint256 requested, uint256 max);
    error PoolExposureTooHigh();

    // ─── Write: Agent Wallet Only ─────────────────────────────────

    /// @notice The ONLY function the AI agent can call.
    /// All constraints are checked here before calling LoanPool.proposeLoan().
    /// @param shop Target shop address
    function proposeLoan(address shop) external returns (uint256 loanId);

    // ─── Read Functions ───────────────────────────────────────────

    /// @notice Check if a shop would pass eligibility right now
    /// @return eligible True if eligible
    /// @return reason   Empty string if eligible, rejection reason if not
    function checkEligibility(address shop) external view returns (
        bool   eligible,
        string memory reason
    );

    /// @notice How many proposals the agent has made today
    function proposalsToday() external view returns (uint256);

    /// @notice The agent wallet address authorized to call proposeLoan()
    function agentWallet() external view returns (address);
}
```

---

## EIP-712 Signing (Frontend Reference)

```typescript
// lib/signing.ts

const RECORD_SALE_DOMAIN = {
  name: 'KulayaSalesLedger',
  version: '1',
  chainId: 44005,
  verifyingContract: SALES_LEDGER_ADDRESS,
}

const RECORD_SALE_TYPES = {
  RecordSale: [
    { name: 'shop',       type: 'address' },
    { name: 'amountUSD8', type: 'uint256' },
    { name: 'customerId', type: 'bytes32' },
    { name: 'deadline',   type: 'uint256' },
  ],
}

// Usage:
const signature = await walletClient.signTypedData({
  domain: RECORD_SALE_DOMAIN,
  types:  RECORD_SALE_TYPES,
  primaryType: 'RecordSale',
  message: {
    shop:       shopAddress,
    amountUSD8: parseUnits(amount, 6),
    customerId: keccak256(toHex(customerId)),
    deadline:   BigInt(Math.floor(Date.now() / 1000) + 3600),
  },
})
```

---

## tUSD8 Token Reference

```typescript
const TUSD8 = {
  address:  '0x456569838f1d43009A91ebA4263147Afd723348',
  decimals: 6,
  symbol:   'tUSD8',
  chainId:  44005,
}

// Always use this — NEVER parseEther for tUSD8
import { parseUnits, formatUnits } from 'viem'
const amount = parseUnits('100', 6)   // 100 tUSD8 = 100_000_000n
const display = formatUnits(amount, 6) // "100.0"
```

---

## Deployment Script Order

```bash
# 1. ERC8004Registry (no deps)
# 2. SalesLedger (needs: ERC8004Registry address)
# 3. LoanPool (needs: SalesLedger address, tUSD8 address)
# 4. AIGuarantor (needs: LoanPool address, SalesLedger address, agentWallet address)
# 5. After deploy: call LoanPool.setAIGuarantor(aiGuarantorAddress)
# 6. After deploy: agent registers in ERC8004Registry as "Kulaya-AI-Guarantor-v1"
```
