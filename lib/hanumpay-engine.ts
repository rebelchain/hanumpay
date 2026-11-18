// Deterministic smart-contract invariant engine mirroring AIGuarantor.sol & LoanPool.sol

export const CONTRACT_LIMITS = {
  MAX_LOAN_USD8: 500, // $500 tUSD8 hard cap
  MIN_LOAN_USD8: 5, // $5 tUSD8 minimum
  MAX_DAILY_PROPOSALS: 10,
  MAX_POOL_EXPOSURE_BPS: 8000, // 80% max utilization
  MIN_UNIQUE_CUSTOMERS: 5,
  MIN_SALES_DAYS: 30,
  LOAN_RATIO_PCT: 10, // 10% of 30d sales
  FLAT_FEE_BPS: 500, // 5% flat fee
  REPAY_PCT_BPS: 1000, // 10% auto-deduct per sale
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

export interface EligibilityCheckResult {
  eligible: boolean;
  reason: string;
  creditScore: number; // 0-100 deterministic score derived from sales volume, customer count, history
  maxLoanUSD8: number;
  proposedPrincipalUSD8: number;
  proposedFlatFeeUSD8: number;
  proposedRepayPctBps: number;
  checks: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

export function computeCreditScore(stats: ShopStatsSnapshot): number {
  const customerScore = Math.min(35, (stats.uniqueCustomers30d / 10) * 35);
  const historyScore = Math.min(30, (stats.salesHistoryDays / 30) * 30);
  const volumeScore = Math.min(35, (stats.totalSales30dUSD8 / 2500) * 35);
  return Math.round(customerScore + historyScore + volumeScore);
}

export function checkShopEligibility(stats: ShopStatsSnapshot): EligibilityCheckResult {
  const rawMaxLoan = (stats.totalSales30dUSD8 * CONTRACT_LIMITS.LOAN_RATIO_PCT) / 100;
  const cappedPrincipal = Math.min(rawMaxLoan, CONTRACT_LIMITS.MAX_LOAN_USD8);
  const roundedPrincipal = Math.floor(cappedPrincipal * 100) / 100;
  const flatFee = Math.round(roundedPrincipal * (CONTRACT_LIMITS.FLAT_FEE_BPS / 10000) * 100) / 100;

  const checks = [
    {
      label: 'Credit offers enabled for your shop',
      passed: !stats.agentPaused,
      detail: stats.agentPaused ? 'Paused by shop owner' : 'Active',
    },
    {
      label: 'No other loan currently active',
      passed: !stats.hasActiveOrProposedLoan,
      detail: stats.hasActiveOrProposedLoan ? 'Finish current plan first' : 'Clear',
    },
    {
      label: 'Waiting period between loans',
      passed: !stats.inCooldown,
      detail: stats.inCooldown
        ? `${stats.cooldownDaysRemaining} days left`
        : 'Ready',
    },
    {
      label: `At least ${CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS} different customers (30d)`,
      passed: stats.uniqueCustomers30d >= CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS,
      detail: `${stats.uniqueCustomers30d} / ${CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS} customers`,
    },
    {
      label: `At least ${CONTRACT_LIMITS.MIN_SALES_DAYS} days of sales history`,
      passed: stats.salesHistoryDays >= CONTRACT_LIMITS.MIN_SALES_DAYS,
      detail: `${stats.salesHistoryDays} / ${CONTRACT_LIMITS.MIN_SALES_DAYS} days`,
    },
    {
      label: `Daily offer limit (max ${CONTRACT_LIMITS.MAX_DAILY_PROPOSALS}/day)`,
      passed: stats.proposalsToday < CONTRACT_LIMITS.MAX_DAILY_PROPOSALS,
      detail: `${stats.proposalsToday} / ${CONTRACT_LIMITS.MAX_DAILY_PROPOSALS} used today`,
    },
    {
      label: 'Community pool cash reserve healthy',
      passed: stats.poolUtilizationBps < CONTRACT_LIMITS.MAX_POOL_EXPOSURE_BPS,
      detail: `${(stats.poolUtilizationBps / 100).toFixed(1)}% / 80.0%`,
    },
    {
      label: 'Offer amount ($5–$500) & pool funds ready',
      passed:
        roundedPrincipal >= CONTRACT_LIMITS.MIN_LOAN_USD8 &&
        roundedPrincipal <= stats.poolAvailableUSD8,
      detail: `$${roundedPrincipal.toFixed(2)} limit (Pool ready: $${stats.poolAvailableUSD8.toFixed(2)})`,
    },
  ];

  const firstFailure = checks.find((c) => !c.passed);

  return {
    eligible: !firstFailure,
    reason: firstFailure ? `${firstFailure.label}: ${firstFailure.detail}` : '',
    creditScore: computeCreditScore(stats),
    maxLoanUSD8: roundedPrincipal,
    proposedPrincipalUSD8: roundedPrincipal,
    proposedFlatFeeUSD8: flatFee,
    proposedRepayPctBps: CONTRACT_LIMITS.REPAY_PCT_BPS,
    checks,
  };
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
    } else if (Math.abs(params.attemptedFeePct - 5) >= 0.01 || Math.abs(params.attemptedRepayPct - 10) >= 0.01) {
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
