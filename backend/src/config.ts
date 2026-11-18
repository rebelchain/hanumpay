import { createPublicClient, defineChain, http, parseAbi } from 'viem';

export const QDAY_CHAIN_ID = 44005;
export const QDAY_RPC_URL = process.env.QDAY_RPC_URL || 'https://rpc-test.qday.info';
export const QDAY_EXPLORER_URL = 'https://explorer-test.qday.info';
export const QDAY_EVM_VERSION = 'shanghai';

export const qDayAevumTestnet = defineChain({
  id: QDAY_CHAIN_ID,
  name: 'QDay Aevum',
  nativeCurrency: {
    name: 'tQDAY',
    symbol: 'tQDAY',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [QDAY_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'QDay Explorer',
      url: QDAY_EXPLORER_URL,
    },
  },
  testnet: true,
});

export const qDayPublicClient = createPublicClient({
  chain: qDayAevumTestnet,
  transport: http(QDAY_RPC_URL, { timeout: 10_000 }),
});

export const DEPLOYED_CONTRACTS = {
  erc8004: (process.env.ERC8004_ADDRESS ||
    process.env.NEXT_PUBLIC_ERC8004_ADDRESS ||
    '0x5533628fE8bFa8A6227C69cca8F7E96e578709c9') as `0x${string}`,
  salesLedger: (process.env.SALES_LEDGER_ADDRESS ||
    process.env.NEXT_PUBLIC_SALES_LEDGER_ADDRESS ||
    '0xbFCe0404F4abbe73Bf4eDB2e0E7F7a0e69d33BE5') as `0x${string}`,
  loanPool: (process.env.LOAN_POOL_ADDRESS ||
    process.env.NEXT_PUBLIC_LOAN_POOL_ADDRESS ||
    '0x5FcF8175bc41B584322Af65979013AbB6FecA6DB') as `0x${string}`,
  aiGuarantor: (process.env.AI_GUARANTOR_ADDRESS ||
    process.env.NEXT_PUBLIC_AI_GUARANTOR_ADDRESS ||
    '0x35E37e86b7676FEA5fb4704b5ce6C015492c1d64') as `0x${string}`,
};

export const HANUMPAY_EIP712_DOMAIN = {
  name: 'HanumPaySalesLedger',
  version: '1',
  chainId: QDAY_CHAIN_ID,
  verifyingContract: DEPLOYED_CONTRACTS.salesLedger,
};

export const RECORD_SALE_TYPES = {
  RecordSale: [
    { name: 'shop', type: 'address' },
    { name: 'amountUSD8', type: 'uint256' },
    { name: 'customerId', type: 'bytes32' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export const ACCEPT_LOAN_TYPES = {
  AcceptLoan: [
    { name: 'loanId', type: 'uint256' },
    { name: 'shop', type: 'address' },
    { name: 'principalUSD8', type: 'uint256' },
    { name: 'flatFeeUSD8', type: 'uint256' },
    { name: 'repayPctBps', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export const HANUMPAY_ABIS = {
  salesLedger: parseAbi([
    'function recordSale(address shop, uint256 amountUSD8, bytes32 customerId, uint256 deadline, bytes signature) external',
    'function getShops(uint256 offset, uint256 limit) external view returns (address[])',
  ]),
  loanPool: parseAbi([
    'function acceptLoan(uint256 loanId, uint256 deadline, bytes signature) external',
  ]),
  aiGuarantor: parseAbi([
    'function proposeLoan(address shop) external returns (uint256)',
    'function checkEligibility(address shop) external view returns (bool eligible, string reason)',
  ]),
};

export const CONTRACT_LIMITS = {
  MAX_LOAN_USD8: 500,
  MIN_LOAN_USD8: 5,
  MAX_DAILY_PROPOSALS: 10,
  MAX_POOL_EXPOSURE_BPS: 8000,
  MIN_UNIQUE_CUSTOMERS: 5,
  MIN_SALES_DAYS: 30,
  LOAN_RATIO_PCT: 10,
  FLAT_FEE_BPS: 500,
  REPAY_PCT_BPS: 1000,
  COOLDOWN_DAYS: 30,
} as const;

export interface ShopStatsSnapshot {
  totalSales30dUSD8: number;
  uniqueCustomers30d: number;
  salesHistoryDays: number;
  hasActiveOrProposedLoan: boolean;
  inCooldown: boolean;
  cooldownDaysRemaining: number;
  proposalsToday: number;
  poolUtilizationBps: number;
  poolAvailableUSD8: number;
  agentPaused?: boolean;
}

export function validateProposalAgainstContract(params: {
  attemptedPrincipalUSD8: number;
  attemptedFeePct: number;
  attemptedRepayPct: number;
  stats: ShopStatsSnapshot;
}): {
  contractDecision: 'REJECTED' | 'ALLOWED';
  revertError: string;
  invariantChecks: {
    rule: string;
    limit: string;
    attempted: string;
    passed: boolean;
  }[];
} {
  const tenPercentLimit = Math.min(
    (params.stats.totalSales30dUSD8 * CONTRACT_LIMITS.LOAN_RATIO_PCT) / 100,
    CONTRACT_LIMITS.MAX_LOAN_USD8
  );

  const invariantChecks = [
    {
      rule: 'AIGuarantor: Agent not paused by shop owner',
      limit: 'Agent Active',
      attempted: params.stats.agentPaused ? 'Paused by Owner' : 'Active',
      passed: !params.stats.agentPaused,
    },
    {
      rule: 'AIGuarantor: Hard Max Loan Cap ($500 tUSD8)',
      limit: `<= $${CONTRACT_LIMITS.MAX_LOAN_USD8.toFixed(2)}`,
      attempted: `$${params.attemptedPrincipalUSD8.toFixed(2)}`,
      passed: params.attemptedPrincipalUSD8 <= CONTRACT_LIMITS.MAX_LOAN_USD8,
    },
    {
      rule: 'AIGuarantor: Max 10% of 30d Verified QR Sales',
      limit: `<= $${tenPercentLimit.toFixed(2)}`,
      attempted: `$${params.attemptedPrincipalUSD8.toFixed(2)}`,
      passed: params.attemptedPrincipalUSD8 <= tenPercentLimit,
    },
    {
      rule: 'AIGuarantor: Min 5 Unique Buyers (Anti-Wash Trading)',
      limit: `>= ${CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS} buyers`,
      attempted: `${params.stats.uniqueCustomers30d} buyers`,
      passed: params.stats.uniqueCustomers30d >= CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS,
    },
    {
      rule: 'LoanPool: Immutable 5% Flat Fee',
      limit: '5.00% flat',
      attempted: `${params.attemptedFeePct.toFixed(2)}%`,
      passed: Math.abs(params.attemptedFeePct - 5) < 0.01,
    },
    {
      rule: 'LoanPool: Immutable 10% Auto-Deduct Repayment',
      limit: '10.00% per sale',
      attempted: `${params.attemptedRepayPct.toFixed(2)}%`,
      passed: Math.abs(params.attemptedRepayPct - 10) < 0.01,
    },
    {
      rule: 'LoanPool: Pool Utilization Cap (80%) & Available Liquidity',
      limit: `< 80.0% & <= $${params.stats.poolAvailableUSD8.toFixed(2)}`,
      attempted: `$${params.attemptedPrincipalUSD8.toFixed(2)}`,
      passed:
        params.stats.poolUtilizationBps < CONTRACT_LIMITS.MAX_POOL_EXPOSURE_BPS &&
        params.attemptedPrincipalUSD8 <= params.stats.poolAvailableUSD8,
    },
  ];

  const failed = invariantChecks.filter((c) => !c.passed);

  let revertError = 'ALLOWED (Proposal complies with all smart-contract invariants)';
  if (failed.length > 0) {
    if (params.stats.agentPaused) {
      revertError = `ShopNotEligible("Merchant paused AI Guarantor access")`;
    } else if (params.attemptedPrincipalUSD8 > CONTRACT_LIMITS.MAX_LOAN_USD8) {
      revertError = `ExceedsMaxLoan(${params.attemptedPrincipalUSD8.toFixed(2)} tUSD8 > 500.00 tUSD8 cap)`;
    } else if (params.attemptedPrincipalUSD8 > tenPercentLimit) {
      revertError = `ExceedsMaxLoanSize(requested: ${params.attemptedPrincipalUSD8.toFixed(2)}, 10% cap: ${tenPercentLimit.toFixed(2)})`;
    } else if (params.stats.uniqueCustomers30d < CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS) {
      revertError = `ShopNotEligible("Fewer than 5 unique customers in 30 days")`;
    } else if (
      Math.abs(params.attemptedFeePct - 5) >= 0.01 ||
      Math.abs(params.attemptedRepayPct - 10) >= 0.01
    ) {
      revertError = `ImmutableTermsViolation("AI cannot alter 5% flat fee or 10% auto-repayment")`;
    } else {
      revertError = `ExceedsPoolExposure("Pool exposure exceeds 80% safety limit")`;
    }
  }

  return {
    contractDecision: failed.length > 0 ? 'REJECTED' : 'ALLOWED',
    revertError,
    invariantChecks,
  };
}
