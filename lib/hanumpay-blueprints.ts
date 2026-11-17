export interface BlueprintDoc {
  id: string;
  filename: string;
  title: string;
  category: "docs" | "contracts";
  description: string;
  content: string;
}

export const HANUMPAY_BLUEPRINTS: BlueprintDoc[] = [
  {
    id: "claude-md",
    filename: "CLAUDE.md",
    title: "CLAUDE.md — HanumPay Project Context",
    category: "docs",
    description:
      "Core architecture guide, tech stack, and immutable protocol rules.",
    content: `# CLAUDE.md — HanumPay Project Context

## What Is HanumPay

HanumPay is an on-chain working-capital credit and ERC-8004 Confirmation of Payee protocol for 64M Indonesian MSMEs.
It turns daily QR cashier sales into verifiable on-chain cashflow history, read by an AI Guarantor to propose micro-loans — zero collateral, zero late fees, zero debt collectors.
Repayments are auto-deducted at 10% from incoming QR sales, and merchants can pay verified wholesalers directly using ERC-8004 Confirmation of Payee.

Built for: **Aevum Builder Challenge #1** (QDay Network)
Deadline: **December 11, 2026**

## Core Stack (Locked Rules)

| Layer | Technology |
|-------|------------|
| Network | QDay Aevum Testnet — Chain ID: \`44005\` (\`0xABE5\`) |
| RPC | \`https://rpc-test.qday.info\` (HTTPS polling only, no WebSocket) |
| EVM Target | \`shanghai\` (mandatory in \`foundry.toml\`, avoids Cancun \`MCOPY\`) |
| Stablecoin | tUSD8 — ERC-20, 6 decimals — \`0x456569838f1d43009A91ebA4263147Afd7233483\` |
| Contracts | Solidity \`^0.8.24\` + Foundry |
| Wallets | EOA (\`window.ethereum\` EIP-3085) active now; \`@qday-io/sdk\` ships Q1 2027 |
| Identity | ERC-8004 Registry (On-Chain Confirmation of Payee) |
| Frontend | Next.js App Router + TypeScript + Tailwind + Viem (\`getLogsChunked\` <= 1,000 blocks) |
| AI Agent | Node.js + TypeScript (cron) + Gemini Audit |

## Core Security Invariants

1. Never commit \`.env\` or private keys to git. Always use \`.env.example\`.
2. \`tUSD8\` uses **6 decimals** — always use \`parseUnits(amount, 6)\`, never \`parseEther\`.
3. AI Agent may ONLY call \`proposeLoan(address shop)\` — no other write access.
4. Merchants pay zero gas — use EIP-712 signatures for all shop actions.
5. Loan terms are hardcoded in smart contracts — neither frontend nor AI can override them.
6. ERC-8004 identities are verified directly on-chain.`,
  },
  {
    id: "project-md",
    filename: "docs/PROJECT.md",
    title: "PROJECT.md — Vision & Problem Statement",
    category: "docs",
    description:
      "MSME cashflow problem, solution design, and hackathon alignment.",
    content: `# PROJECT.md — HanumPay

## One-Sentence Summary

An on-chain identity and verified payment layer turning daily QR sales into micro working-capital loans for Indonesia's 64M small businesses — zero collateral, zero late fees, zero debt collectors.

## How It Works

Each QR sale -> recorded permanently on QDay Aevum (tUSD8).
AI Agent reads 30d history -> computes credit limit (10% of verified turnover, capped at $500 tUSD8).
AI proposes loan with smart-contract locked terms (5% flat fee).
Merchant accepts with one gasless EIP-712 signature.
Repayment auto-deducts 10% from incoming QR sales — no due date, no late penalties.
Merchants pay ERC-8004 verified suppliers directly while minting a portable On-Chain Credit Passport.

## Why It Fits Aevum Builder Challenge #1

- **Stablecoin Payments**: tUSD8 (6 decimals) for credit disbursement, B2B supplier settlement, and auto-repayment.
- **Human + AI Collaboration**: Merchant (human) + HanumPay-AI-Guarantor-v1 (autonomous agent) + Community LPs.
- **ERC-8004**: Confirmation of Payee for Shops, AI Agents, and Suppliers.
- **QDay Aevum Testnet**: Chain ID 44005.
- **Gasless UX**: EIP-712 typed signatures — merchants spend 0 tQDAY.`,
  },
  {
    id: "architecture-md",
    filename: "docs/ARCHITECTURE.md",
    title: "ARCHITECTURE.md — System Data Flow",
    category: "docs",
    description:
      "Contract dependency graph, capital cycle, and security bounds.",
    content: `# ARCHITECTURE.md — HanumPay System Architecture

## Contract Map

\`\`\`
ERC8004Registry   (identity layer: shops, AI agents, suppliers, lenders)
       ^
SalesLedger       (gasless EIP-712 QR sales + calls LoanPool.repayFromSale)
       ^
AIGuarantor       (reads SalesLedger + LoanPool; ONLY calls proposeLoan(shop))
       ^
LoanPool          (tUSD8 treasury, 80% utilization cap, Credit Passport minting)
\`\`\`

Deploy order: \`ERC8004Registry -> SalesLedger -> LoanPool -> AIGuarantor\`

## Security Invariants (Contract-Enforced)

| Invariant | Value | Enforced In |
|-----------|-------|-------------|
| Max loan size | $500 tUSD8 | AIGuarantor / LoanPool |
| Max AI proposals / day | 10 / day | AIGuarantor |
| Max pool utilization | 80% of TVL | LoanPool |
| Post-repayment cooldown | 30 days | LoanPool |
| Min unique buyers | 5 within 30d | AIGuarantor |
| Min sales history | 30 days | AIGuarantor |
| Loan fee | 5% flat immutable | LoanPool |`,
  },
  {
    id: "contracts-spec-md",
    filename: "docs/CONTRACTS_SPEC.md",
    title: "CONTRACTS_SPEC.md — Solidity Interface Spec",
    category: "docs",
    description:
      "ABI signatures, EIP-712 domains, and 6-decimal tUSD8 standard.",
    content: `# CONTRACTS_SPEC.md — HanumPay Interfaces

## EIP-712 Domain
- name: \`"HanumPaySalesLedger"\`
- version: \`"1"\`
- chainId: \`44005\`

## tUSD8 Token
- address: \`0x456569838f1d43009A91ebA4263147Afd7233483\`
- decimals: \`6\`
- Always use \`parseUnits(amount, 6)\`

## Core Functions
- \`ERC8004Registry.register(name, category, metadata)\`
- \`ERC8004Registry.resolve(name) -> address\`
- \`SalesLedger.recordSale(shop, amountUSD8, customerId, deadline, signature)\`
- \`SalesLedger.getShopStats(shop) -> ShopStats\`
- \`AIGuarantor.proposeLoan(shop) -> loanId\`
- \`LoanPool.acceptLoan(loanId, deadline, signature)\`
- \`LoanPool.repayFromSale(shop, saleAmount) -> netAmount\`
- \`LoanPool.deposit(amount)\` / \`LoanPool.withdraw(shares)\``,
  },
  {
    id: "erc8004-sol",
    filename: "contracts/src/ERC8004Registry.sol",
    title: "ERC8004Registry.sol — Confirmation of Payee",
    category: "contracts",
    description:
      "On-chain identity directory for merchants, AI agents, suppliers, and lenders.",
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ERC8004Registry {
    struct Identity {
        address wallet;
        string  name;
        string  category; // "shop" | "agent" | "supplier" | "lender"
        bytes   metadata;
        uint256 registeredAt;
        bool    active;
    }

    mapping(bytes32 => Identity) private _identities;
    mapping(address => string) private _nameOf;

    event IdentityRegistered(bytes32 indexed nameHash, address indexed wallet, string name, string category);
    event IdentityUpdated(bytes32 indexed nameHash, address indexed wallet);
    event IdentityRevoked(bytes32 indexed nameHash);

    error NameAlreadyTaken(string name);
    error IdentityNotFound(string name);
    error NotIdentityOwner();
    error EmptyName();

    function register(string calldata name, string calldata category, bytes calldata metadata) external {
        if (bytes(name).length == 0 || bytes(name).length > 64) revert EmptyName();
        bytes32 h = keccak256(bytes(name));
        if (_identities[h].wallet != address(0)) revert NameAlreadyTaken(name);

        _identities[h] = Identity({
            wallet: msg.sender,
            name: name,
            category: category,
            metadata: metadata,
            registeredAt: block.timestamp,
            active: true
        });
        _nameOf[msg.sender] = name;
        emit IdentityRegistered(h, msg.sender, name, category);
    }

    function update(string calldata name, bytes calldata newMetadata) external {
        bytes32 h = keccak256(bytes(name));
        Identity storage id = _identities[h];
        if (id.wallet == address(0)) revert IdentityNotFound(name);
        if (id.wallet != msg.sender) revert NotIdentityOwner();
        id.metadata = newMetadata;
        emit IdentityUpdated(h, msg.sender);
    }

    function revoke(string calldata name) external {
        bytes32 h = keccak256(bytes(name));
        Identity storage id = _identities[h];
        if (id.wallet == address(0)) revert IdentityNotFound(name);
        if (id.wallet != msg.sender) revert NotIdentityOwner();
        id.active = false;
        emit IdentityRevoked(h);
    }

    function resolve(string calldata name) external view returns (address) {
        Identity storage id = _identities[keccak256(bytes(name))];
        return id.active ? id.wallet : address(0);
    }

    function getIdentity(string calldata name) external view returns (Identity memory) {
        return _identities[keccak256(bytes(name))];
    }

    function isVerified(string calldata name) external view returns (bool) {
        return _identities[keccak256(bytes(name))].active;
    }

    function nameOf(address wallet) external view returns (string memory) {
        return _nameOf[wallet];
    }
}`,
  },
  {
    id: "sales-ledger-sol",
    filename: "contracts/src/SalesLedger.sol",
    title: "SalesLedger.sol — Gasless QR Sales Ledger",
    category: "contracts",
    description:
      "Gasless EIP-712 sales recording with 30-day rolling stats and auto-repay hook.",
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILoanPoolHook {
    function repayFromSale(address shop, uint256 saleAmount) external returns (uint256 netAmount);
}

contract SalesLedger {
    struct Sale {
        address shop;
        uint256 amountUSD8;
        bytes32 customerId;
        uint256 timestamp;
    }

    struct ShopStats {
        uint256 totalSales30d;
        uint256 uniqueCustomers30d;
        uint256 totalSalesAllTime;
        uint256 totalSaleCount;
        uint256 lastSaleTimestamp;
        bool    hasMinimumHistory;
    }

    bytes32 public constant RECORD_SALE_TYPEHASH =
        keccak256("RecordSale(address shop,uint256 amountUSD8,bytes32 customerId,uint256 deadline)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    address public loanPool;
    address public owner;
    address[] private _shops;
    mapping(address => bool) public isRegisteredShop;
    mapping(address => uint256) public shopRegisteredAt;
    mapping(address => Sale[]) private _shopSales;
    mapping(address => mapping(bytes32 => uint256)) private _lastSeenCustomer;
    mapping(address => uint256) private _uniqueCount30d;

    event SaleRecorded(address indexed shop, uint256 amount, bytes32 indexed customerId, uint256 timestamp, uint256 saleIndex);

    error InvalidAmount();
    error InvalidSignature();
    error ShopNotRegistered(address shop);
    error ZeroCustomerId();

    constructor() {
        owner = msg.sender;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("HanumPaySalesLedger"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    function setLoanPool(address _loanPool) external {
        require(msg.sender == owner, "Only owner");
        loanPool = _loanPool;
    }

    function registerShop(string calldata) external {
        if (!isRegisteredShop[msg.sender]) {
            isRegisteredShop[msg.sender] = true;
            shopRegisteredAt[msg.sender] = block.timestamp;
            _shops.push(msg.sender);
        }
    }

    function recordSale(
        address shop,
        uint256 amountUSD8,
        bytes32 customerId,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (!isRegisteredShop[shop]) revert ShopNotRegistered(shop);
        if (amountUSD8 < 100_000 || amountUSD8 > 500_000_000) revert InvalidAmount(); // $0.10 - $500 tUSD8
        if (customerId == bytes32(0)) revert ZeroCustomerId();
        if (block.timestamp > deadline || signature.length != 65) revert InvalidSignature();

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\\x19\\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(RECORD_SALE_TYPEHASH, shop, amountUSD8, customerId, deadline))
            )
        );
        address signer = _recover(digest, signature);
        if (signer != shop) revert InvalidSignature();

        if (_lastSeenCustomer[shop][customerId] < block.timestamp - 30 days) {
            _uniqueCount30d[shop] += 1;
        }
        _lastSeenCustomer[shop][customerId] = block.timestamp;

        uint256 idx = _shopSales[shop].length;
        _shopSales[shop].push(Sale(shop, amountUSD8, customerId, block.timestamp));
        emit SaleRecorded(shop, amountUSD8, customerId, block.timestamp, idx);

        if (loanPool != address(0)) {
            ILoanPoolHook(loanPool).repayFromSale(shop, amountUSD8);
        }
    }

    function getShopStats(address shop) external view returns (ShopStats memory stats) {
        Sale[] storage list = _shopSales[shop];
        uint256 cutoff = block.timestamp > 30 days ? block.timestamp - 30 days : 0;
        for (uint256 i = 0; i < list.length; i++) {
            stats.totalSalesAllTime += list[i].amountUSD8;
            if (list[i].timestamp >= cutoff) {
                stats.totalSales30d += list[i].amountUSD8;
            }
            stats.lastSaleTimestamp = list[i].timestamp;
        }
        stats.totalSaleCount = list.length;
        stats.uniqueCustomers30d = _uniqueCount30d[shop];
        stats.hasMinimumHistory = shopRegisteredAt[shop] > 0 && (block.timestamp - shopRegisteredAt[shop] >= 30 days);
    }

    function totalShops() external view returns (uint256) {
        return _shops.length;
    }

    function _recover(bytes32 digest, bytes memory sig) internal pure returns (address) {
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return ecrecover(digest, v, r, s);
    }
}`,
  },
  {
    id: "ai-guarantor-sol",
    filename: "contracts/src/AIGuarantor.sol",
    title: "AIGuarantor.sol — Contract-Bounded AI Agent",
    category: "contracts",
    description:
      "Guardrail contract enforcing $500 cap, 10 proposals/day, 80% pool cap & 5 unique buyers.",
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISalesLedgerView {
    struct ShopStats {
        uint256 totalSales30d;
        uint256 uniqueCustomers30d;
        uint256 totalSalesAllTime;
        uint256 totalSaleCount;
        uint256 lastSaleTimestamp;
        bool    hasMinimumHistory;
    }
    function getShopStats(address shop) external view returns (ShopStats memory);
}

interface ILoanPoolWrite {
    function proposeLoan(address shop, uint256 principal, uint256 flatFee, uint256 repayPct) external returns (uint256);
    function getActiveLoan(address shop) external view returns (uint256);
    function getCooldownEnd(address shop) external view returns (uint256);
}

contract AIGuarantor {
    uint256 public constant MAX_LOAN_USD8        = 500 * 1e6;
    uint256 public constant MIN_LOAN_USD8        = 5 * 1e6;
    uint256 public constant MAX_DAILY_PROPOSALS  = 10;
    uint256 public constant MIN_UNIQUE_CUSTOMERS = 5;
    uint256 public constant FLAT_FEE_BPS         = 500;   // 5% flat
    uint256 public constant REPAY_PCT_BPS        = 1000;  // 10% per sale

    address public immutable agentWallet;
    ISalesLedgerView public immutable salesLedger;
    ILoanPoolWrite public immutable loanPool;

    mapping(uint256 => uint256) private _dailyCount;

    event ProposalSubmitted(address indexed shop, uint256 principal, uint256 flatFee, uint256 loanId, uint256 timestamp);

    error NotAuthorizedAgent();
    error DailyBudgetExhausted(uint256 usedToday, uint256 max);
    error ShopNotEligible(address shop, string reason);

    constructor(address _agentWallet, address _salesLedger, address _loanPool) {
        agentWallet = _agentWallet;
        salesLedger = ISalesLedgerView(_salesLedger);
        loanPool = ILoanPoolWrite(_loanPool);
    }

    function proposeLoan(address shop) external returns (uint256 loanId) {
        if (msg.sender != agentWallet) revert NotAuthorizedAgent();
        uint256 dayKey = block.timestamp / 1 days;
        if (_dailyCount[dayKey] >= MAX_DAILY_PROPOSALS) {
            revert DailyBudgetExhausted(_dailyCount[dayKey], MAX_DAILY_PROPOSALS);
        }

        (bool eligible, string memory reason) = checkEligibility(shop);
        if (!eligible) revert ShopNotEligible(shop, reason);

        ISalesLedgerView.ShopStats memory stats = salesLedger.getShopStats(shop);
        uint256 principal = (stats.totalSales30d * 10) / 100;
        if (principal > MAX_LOAN_USD8) principal = MAX_LOAN_USD8;
        uint256 flatFee = (principal * FLAT_FEE_BPS) / 10_000;

        _dailyCount[dayKey] += 1;
        loanId = loanPool.proposeLoan(shop, principal, flatFee, REPAY_PCT_BPS);
        emit ProposalSubmitted(shop, principal, flatFee, loanId, block.timestamp);
    }

    function checkEligibility(address shop) public view returns (bool eligible, string memory reason) {
        if (loanPool.getActiveLoan(shop) != 0) return (false, "Shop has an active loan");
        if (loanPool.getCooldownEnd(shop) > block.timestamp) return (false, "Shop in 30-day cooldown");

        ISalesLedgerView.ShopStats memory stats = salesLedger.getShopStats(shop);
        if (stats.uniqueCustomers30d < MIN_UNIQUE_CUSTOMERS) return (false, "Fewer than 5 unique customers");
        if (!stats.hasMinimumHistory) return (false, "Less than 30 days of sales history");

        uint256 principal = (stats.totalSales30d * 10) / 100;
        if (principal < MIN_LOAN_USD8) return (false, "Sales too low for minimum $5 tUSD8 loan");

        return (true, "");
    }

    function proposalsToday() external view returns (uint256) {
        return _dailyCount[block.timestamp / 1 days];
    }
}`,
  },
  {
    id: "loan-pool-sol",
    filename: "contracts/src/LoanPool.sol",
    title: "LoanPool.sol — Treasury, EIP-712 & Credit Passport",
    category: "contracts",
    description:
      "Manages tUSD8 liquidity, 80% utilization cap, gasless acceptance, auto-repay & Credit Passports.",
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Full source available in /contracts/src/LoanPool.sol
// Run locally: cd contracts && forge build && forge test -vvv`,
  },
  {
    id: "deploy-script-sol",
    filename: "contracts/script/Deploy.s.sol",
    title: "Deploy.s.sol — QDay Testnet Deployment Script",
    category: "contracts",
    description:
      "Deploys all 4 HanumPay contracts and wires SalesLedger <-> LoanPool <-> AIGuarantor.",
    content: `// Ensure foundry.toml sets evm_version = "shanghai" (required on QDay Aevum).
// Run from /contracts:
// export DEPLOYER_PRIVATE_KEY=0x...
// export AGENT_WALLET_ADDRESS=0x...
// forge script script/Deploy.s.sol --rpc-url https://rpc-test.qday.info --broadcast --legacy
// Note: Explorer contract verification is not yet available; link repo + addresses in submission.`,
  },
  {
    id: "foundry-tests-sol",
    filename: "contracts/test/HanumPay.t.sol",
    title: "HanumPay.t.sol — Foundry Invariant & Safety Tests",
    category: "contracts",
    description:
      "Verifies sybil gate, EIP-712 acceptance, 10% auto-repay, 80% pool cap, $500 ceiling & ERC-8004.",
    content: `// Run from /contracts:
// forge test -vvv
// Test suite includes:
// 1. testCannotProposeWithFewerThan5Customers()
// 2. testEndToEndGaslessSaleAndAIProposal()
// 3. testMerchantCanPauseAndResumeAgentAccess()
// 4. testAcceptLoanAutoRepayAndCooldown()
// 5. testPoolMaxExposure80PercentCap()
// 6. testLoanPrincipalHardCappedAt500()
// 7. testERC8004ConfirmationOfPayeeAndRevoke()`,
  },
];

export const HACKATHON_ROADMAP = [
  {
    phase: "Stage 1 · Foundation",
    dates: "Nov 16 – Nov 18",
    focus:
      "Foundry setup, QDay Aevum Testnet faucets, ERC-8004 schema & system architecture.",
    tasks: [
      'Configure Foundry with evm_version = "shanghai" & QDay RPC (Chain ID 44005)',
      "Claim tQDAY and tUSD8 test tokens from faucet.qday.info",
      "Finalize HanumPay /docs specs and ERC-8004 Confirmation of Payee schema",
    ],
  },
  {
    phase: "Stage 2 · Smart Contracts",
    dates: "Nov 19 – Nov 22",
    focus:
      "Write, unit-test, and deploy all 4 core contracts to QDay Aevum Testnet.",
    tasks: [
      "Implement & test ERC8004Registry.sol and SalesLedger.sol (EIP-712 + keccak256)",
      "Implement & test LoanPool.sol (80% cap, LP shares) and AIGuarantor.sol",
      "Run Deploy.s.sol on Chain 44005 and save deployed addresses",
    ],
  },
  {
    phase: "Stage 3 · UI & Wallets",
    dates: "Nov 23 – Nov 29",
    focus:
      "Wire Next.js UI to live contract reads, EOA EIP-3085 wallet & gasless signatures.",
    tasks: [
      "Polish /app/dashboard, /app/penjualan, /app/pinjaman, /app/pool, /app/identitas",
      "Enforce 6-decimal tUSD8 formatting and on-chain ERC-8004 verification checks",
      "Complete Verified Supplier Pay & Credit Passport views",
    ],
  },
  {
    phase: "Stage 4 · Autonomous AI",
    dates: "Nov 30 – Dec 4",
    focus:
      "Run AI Guarantor cron loop and validate automated underwriting proposals.",
    tasks: [
      "Register HanumPay-AI-Guarantor-v1 on ERC8004Registry",
      "Run 15-minute cron cycle reading SalesLedger and submitting proposeLoan(shop)",
      "Store structured JSON audit logs & verify Red-Team guardrail rejections",
    ],
  },
  {
    phase: "Stage 5 · Polish & Submit",
    dates: "Dec 5 – Dec 11",
    focus:
      "Error handling, 3–5 min product demo video, public GitHub repo & DoraHacks submission.",
    tasks: [
      "Verify zero .env secrets in git, clean README, and reproducible repo",
      "Record end-to-end QDay Testnet walkthrough with zero login friction",
      "Submit to dorahacks.io/hackathon/qday before Dec 11, 16:00 HKT",
    ],
  },
];
