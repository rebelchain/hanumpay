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
      label: 'Izin Penjaga AI (AI Guarantor) toko aktif',
      passed: !stats.agentPaused,
      detail: stats.agentPaused ? 'Dijeda oleh pemilik toko' : 'Aktif',
    },
    {
      label: 'Tidak ada pinjaman aktif atau tertunda',
      passed: !stats.hasActiveOrProposedLoan,
      detail: stats.hasActiveOrProposedLoan ? 'Pinjaman yang ada harus lunas dulu' : 'Aman',
    },
    {
      label: 'Masa jeda 30 hari terpenuhi',
      passed: !stats.inCooldown,
      detail: stats.inCooldown
        ? `Sisa ${stats.cooldownDaysRemaining} hari lagi`
        : 'Tidak ada masa jeda',
    },
    {
      label: `Minimal ${CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS} pembeli berbeda (30 hari)`,
      passed: stats.uniqueCustomers30d >= CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS,
      detail: `${stats.uniqueCustomers30d} / ${CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS} pembeli unik`,
    },
    {
      label: `Riwayat penjualan minimal ${CONTRACT_LIMITS.MIN_SALES_DAYS} hari`,
      passed: stats.salesHistoryDays >= CONTRACT_LIMITS.MIN_SALES_DAYS,
      detail: `${stats.salesHistoryDays} / ${CONTRACT_LIMITS.MIN_SALES_DAYS} hari`,
    },
    {
      label: `Batas penawaran harian (< ${CONTRACT_LIMITS.MAX_DAILY_PROPOSALS}/hari)`,
      passed: stats.proposalsToday < CONTRACT_LIMITS.MAX_DAILY_PROPOSALS,
      detail: `${stats.proposalsToday} / ${CONTRACT_LIMITS.MAX_DAILY_PROPOSALS} terpakai hari ini`,
    },
    {
      label: 'Pemakaian dana pool di bawah batas 80%',
      passed: stats.poolUtilizationBps < CONTRACT_LIMITS.MAX_POOL_EXPOSURE_BPS,
      detail: `${(stats.poolUtilizationBps / 100).toFixed(1)}% / 80.0%`,
    },
    {
      label: 'Pokok pinjaman antara $5–$500 tUSD8 & dana tersedia',
      passed:
        roundedPrincipal >= CONTRACT_LIMITS.MIN_LOAN_USD8 &&
        roundedPrincipal <= stats.poolAvailableUSD8,
      detail: `$${roundedPrincipal.toFixed(2)} tUSD8 (Dana pool: $${stats.poolAvailableUSD8.toFixed(2)})`,
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
      rule: 'AIGuarantor: Akses AI tidak sedang dijeda pemilik',
      limit: 'Agen Aktif',
      attempted: params.stats.agentPaused ? 'Dijeda Pemilik Toko' : 'Aktif',
      passed: !params.stats.agentPaused,
    },
    {
      rule: 'AIGuarantor: Batas Maksimal Pinjaman ($500 tUSD8)',
      limit: `<= $${CONTRACT_LIMITS.MAX_LOAN_USD8.toFixed(2)}`,
      attempted: `$${params.attemptedPrincipalUSD8.toFixed(2)}`,
      passed: params.attemptedPrincipalUSD8 <= CONTRACT_LIMITS.MAX_LOAN_USD8,
    },
    {
      rule: 'AIGuarantor: Maksimal 10% dari Omzet QR 30 Hari',
      limit: `<= $${tenPercentLimit.toFixed(2)}`,
      attempted: `$${params.attemptedPrincipalUSD8.toFixed(2)}`,
      passed: params.attemptedPrincipalUSD8 <= tenPercentLimit,
    },
    {
      rule: 'AIGuarantor: Min 5 Pembeli Berbeda (Anti Jualan Fiktif)',
      limit: `>= ${CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS} pembeli`,
      attempted: `${params.stats.uniqueCustomers30d} pembeli`,
      passed: params.stats.uniqueCustomers30d >= CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS,
    },
    {
      rule: 'LoanPool: Biaya Tetap 5% Tidak Bisa Diubah',
      limit: '5.00% tetap',
      attempted: `${params.attemptedFeePct.toFixed(2)}%`,
      passed: Math.abs(params.attemptedFeePct - 5) < 0.01,
    },
    {
      rule: 'LoanPool: Potongan Cicilan Otomatis 10% per Jualan',
      limit: '10.00% per transaksi',
      attempted: `${params.attemptedRepayPct.toFixed(2)}%`,
      passed: Math.abs(params.attemptedRepayPct - 10) < 0.01,
    },
    {
      rule: 'LoanPool: Batas Dana Terpakai Pool (80%) & Saldo Tersedia',
      limit: `< 80.0% & <= $${params.stats.poolAvailableUSD8.toFixed(2)}`,
      attempted: `$${params.attemptedPrincipalUSD8.toFixed(2)}`,
      passed:
        params.stats.poolUtilizationBps < CONTRACT_LIMITS.MAX_POOL_EXPOSURE_BPS &&
        params.attemptedPrincipalUSD8 <= params.stats.poolAvailableUSD8,
    },
  ];

  const failed = invariantChecks.filter((c) => !c.passed);

  let revertError = 'LOLOS (Usulan mematuhi seluruh aturan smart contract)';
  if (failed.length > 0) {
    if (params.stats.agentPaused) {
      revertError = `ShopNotEligible("Pemilik warung sedang menjeda akses Penjaga AI")`;
    } else if (params.attemptedPrincipalUSD8 > CONTRACT_LIMITS.MAX_LOAN_USD8) {
      revertError = `ExceedsMaxLoan(${params.attemptedPrincipalUSD8.toFixed(2)} tUSD8 melebihi batas 500.00 tUSD8)`;
    } else if (params.attemptedPrincipalUSD8 > tenPercentLimit) {
      revertError = `ExceedsMaxLoanSize(diminta: ${params.attemptedPrincipalUSD8.toFixed(2)}, maks 10%: ${tenPercentLimit.toFixed(2)})`;
    } else if (params.stats.uniqueCustomers30d < CONTRACT_LIMITS.MIN_UNIQUE_CUSTOMERS) {
      revertError = `ShopNotEligible("Minimal harus ada 5 pembeli berbeda dalam 30 hari")`;
    } else if (Math.abs(params.attemptedFeePct - 5) >= 0.01 || Math.abs(params.attemptedRepayPct - 10) >= 0.01) {
      revertError = `ImmutableTermsViolation("AI dilarang mengubah biaya 5% atau cicilan 10%")`;
    } else {
      revertError = `ExceedsPoolExposure("Dana pool melebihi batas aman 80%")`;
    }
  }

  return {
    contractDecision: failed.length > 0 ? 'REJECTED' : 'ALLOWED',
    revertError,
    invariantChecks,
  };
}
