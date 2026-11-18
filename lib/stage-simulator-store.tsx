'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AgentAuditLog,
  CreditPassportRecord,
  ERC8004Identity,
  LoanRecord,
  PoolEvent,
  SaleRecord,
  SupplierPayment,
  VerifiableReceipt,
} from './hanumpay-types';
import {
  checkShopEligibility,
  CONTRACT_LIMITS,
  EligibilityCheckResult,
  ShopStatsSnapshot,
} from './hanumpay-engine';
import { hashCustomerId } from './qday';

const SIM_SHOP_ADDRESS = '0x8B3f92A1c04E5d18B0a24f4e71cD919F2a019C42' as `0x${string}`;
const SIM_AGENT_ADDRESS = '0x4E88004a91C2B10eF73291bC8A5D12904410A119' as `0x${string}`;
const SIM_SUPPLIER_1 = '0x71D029a8C1F4b3992eE40b6C1A82840F9002D51A' as `0x${string}`;
const SIM_LENDER_ADDR = '0x55C901a3B72E8401F9a11023D84410A29910F4B2' as `0x${string}`;

function simProofHash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return `0x${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.slice(0, 66);
}

const NOW = 1794600000000;

const SIM_IDENTITIES: ERC8004Identity[] = [
  {
    name: 'Warung Bu Sri - Surabaya',
    wallet: SIM_SHOP_ADDRESS,
    category: 'shop',
    metadata: {
      city: 'Surabaya, East Java',
      businessType: 'Neighborhood Grocery & Daily Essentials',
      reputationScore: 96,
      completedTxCount: 148,
      validationMethod: 'EIP-712 Merchant Sig + 30d QR Ledger',
    },
    registeredAt: NOW - 45 * 86400 * 1000,
    active: true,
  },
  {
    name: 'HanumPay-AI-Guarantor-v1',
    wallet: SIM_AGENT_ADDRESS,
    category: 'agent',
    metadata: {
      agentModel: 'Behavioral Underwriter + Contract Guardrails',
      reputationScore: 99,
      completedTxCount: 412,
      validationMethod: 'ERC-8004 AgentCard + Contract Guardrails',
    },
    registeredAt: NOW - 60 * 86400 * 1000,
    active: true,
  },
  {
    name: 'Pak Joko Distributor',
    wallet: SIM_SUPPLIER_1,
    category: 'supplier',
    metadata: {
      city: 'Surabaya Wholesale Market',
      businessType: 'Wholesale Cooking Oil, Rice & Sugar',
      reputationScore: 98,
      completedTxCount: 289,
      validationMethod: 'ERC-8004 Confirmation of Payee Verified',
    },
    registeredAt: NOW - 52 * 86400 * 1000,
    active: true,
  },
  {
    name: 'Aevum UMKM Liquidity Guild',
    wallet: SIM_LENDER_ADDR,
    category: 'lender',
    metadata: {
      city: 'QDay Testnet Liquidity Pool',
      businessType: 'Community Working-Capital LP Guild',
      reputationScore: 97,
      completedTxCount: 61,
      validationMethod: 'Verified LoanPool LP Share',
    },
    registeredAt: NOW - 58 * 86400 * 1000,
    active: true,
  },
];

// Starts with 4 verified buyers across 34 days so the judge triggers the 5th QR customer sale
// in Step 1 and immediately sees the contract Sybil gate (4/5 -> 5/5) unlock Step 2.
const SIM_SALES: SaleRecord[] = [
  {
    id: 'sim-sale-107',
    shop: SIM_SHOP_ADDRESS,
    amountUSD8: 42.0,
    customerIdHash: hashCustomerId('0813-7720'),
    customerLabel: 'Customer #7720',
    timestamp: NOW - 1 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 42.0,
    eip712Signature: '0x11d0f8...sandbox',
    txHash: simProofHash('sim-sale-107'),
  },
  {
    id: 'sim-sale-106',
    shop: SIM_SHOP_ADDRESS,
    amountUSD8: 112.0,
    customerIdHash: hashCustomerId('0819-5502'),
    customerLabel: 'Customer #5502',
    timestamp: NOW - 4 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 112.0,
    eip712Signature: '0x88c1e3...sandbox',
    txHash: simProofHash('sim-sale-106'),
  },
  {
    id: 'sim-sale-105',
    shop: SIM_SHOP_ADDRESS,
    amountUSD8: 371.5,
    customerIdHash: hashCustomerId('0821-6108'),
    customerLabel: 'Customer #6108',
    timestamp: NOW - 9 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 371.5,
    eip712Signature: '0x3f71a2...sandbox',
    txHash: simProofHash('sim-sale-105'),
  },
  {
    id: 'sim-sale-104',
    shop: SIM_SHOP_ADDRESS,
    amountUSD8: 700.0,
    customerIdHash: hashCustomerId('0852-9014'),
    customerLabel: 'Customer #9014',
    timestamp: NOW - 16 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 700.0,
    eip712Signature: '0x2d09c4...sandbox',
    txHash: simProofHash('sim-sale-104'),
  },
];

const SIM_LOANS: LoanRecord[] = [];

interface StageSimulatorContextValue {
  activeShopName: string;
  activeShopAddress: `0x${string}`;
  shopAvailableTusd8: number;
  sales: SaleRecord[];
  shopStats: ShopStatsSnapshot;
  eligibility: EligibilityCheckResult;
  proposedLoan: LoanRecord | null;
  activeLoan: LoanRecord | null;
  lastRepaidLoan: LoanRecord | null;
  agentPaused: boolean;
  setAgentPausedState: (paused: boolean) => void;
  toggleAgentPaused: () => void;
  recordSale: (
    amountUSD8: number,
    customerIdRaw: string
  ) => { ok: boolean; repaidAmount: number; receipt?: VerifiableReceipt; error?: string };
  runAgentCycle: (opts?: {
    recommendedPrincipalUSD8?: number;
    aiExplanation?: string;
  }) => { ok: boolean; message: string; loan?: LoanRecord };
  acceptLoanProposal: (
    loanId: number
  ) => { ok: boolean; receipt?: VerifiableReceipt; error?: string };
  rejectLoanProposal: (loanId: number) => void;
  payVerifiedSupplier: (
    supplierName: string,
    amountUSD8: number,
    itemNote: string
  ) => { ok: boolean; receipt?: VerifiableReceipt; error?: string };
  fastForwardLoanRepayment: () => { ok: boolean; passport?: CreditPassportRecord; error?: string };
  receipts: VerifiableReceipt[];
  activeReceipt: VerifiableReceipt | null;
  openReceipt: (receipt: VerifiableReceipt) => void;
  closeReceipt: () => void;
  resetStageDemo: () => void;
  auditLogs: AgentAuditLog[];
  poolEvents: PoolEvent[];
  creditPassports: CreditPassportRecord[];
  supplierPayments: SupplierPayment[];
}

const StageSimulatorContext = createContext<StageSimulatorContextValue | null>(null);

export function StageSimulatorProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<SaleRecord[]>(SIM_SALES);
  const [loans, setLoans] = useState<LoanRecord[]>(SIM_LOANS);
  const [proposalsToday, setProposalsToday] = useState<number>(0);
  const [poolDepositedUSD8, setPoolDepositedUSD8] = useState<number>(12400);
  const [poolLoanedUSD8, setPoolLoanedUSD8] = useState<number>(3640);
  const [poolEvents, setPoolEvents] = useState<PoolEvent[]>([]);
  const [creditPassports, setCreditPassports] = useState<CreditPassportRecord[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([]);
  const [shopAvailableTusd8, setShopAvailableTusd8] = useState<number>(145.0);
  const [agentPaused, setAgentPaused] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<VerifiableReceipt[]>(() =>
    SIM_SALES.slice(0, 2).map((s) => ({
      id: `sim-rcpt-${s.id}`,
      kind: 'sale',
      title: `QR Sale · ${s.customerLabel}`,
      amountUSD8: s.amountUSD8,
      repaidDeductedUSD8: s.repaidDeductedUSD8,
      netAmountUSD8: s.netToShopUSD8,
      counterpartyName: 'Warung Bu Sri - Surabaya (Sandbox)',
      counterpartyWallet: s.shop,
      erc8004Verified: true,
      proofHash: s.customerIdHash,
      txHash: s.txHash,
      relayMode: 'sandbox-simulator',
      timestamp: s.timestamp,
      note: 'Interactive 2-phone simulator receipt (no real funds moved)',
    }))
  );
  const [activeReceipt, setActiveReceipt] = useState<VerifiableReceipt | null>(null);

  const activeShopName = 'Warung Bu Sri - Surabaya';

  const proposedLoan = useMemo(
    () => loans.find((l) => l.status === 'Proposed') ?? null,
    [loans]
  );
  const activeLoan = useMemo(
    () => loans.find((l) => l.status === 'Active') ?? null,
    [loans]
  );
  const lastRepaidLoan = useMemo(
    () => loans.find((l) => l.status === 'Repaid') ?? null,
    [loans]
  );

  const poolAvailableUSD8 = Math.max(0, poolDepositedUSD8 - poolLoanedUSD8);
  const poolUtilizationBps =
    poolDepositedUSD8 > 0 ? Math.round((poolLoanedUSD8 / poolDepositedUSD8) * 10000) : 0;

  const shopStats = useMemo<ShopStatsSnapshot>(() => {
    const totalSales30dUSD8 = sales.reduce((acc, s) => acc + s.amountUSD8, 0);
    const uniqueSet = new Set(sales.map((s) => s.customerIdHash));
    return {
      totalSales30dUSD8,
      uniqueCustomers30d: uniqueSet.size,
      salesHistoryDays: 34,
      hasActiveOrProposedLoan: Boolean(proposedLoan || activeLoan),
      inCooldown: false,
      cooldownDaysRemaining: 0,
      proposalsToday,
      poolUtilizationBps,
      poolAvailableUSD8,
      agentPaused,
    };
  }, [sales, proposedLoan, activeLoan, proposalsToday, poolUtilizationBps, poolAvailableUSD8, agentPaused]);

  const eligibility = useMemo(() => checkShopEligibility(shopStats), [shopStats]);

  const setAgentPausedState = useCallback((paused: boolean) => {
    setAgentPaused(paused);
    setAuditLogs((prev) => [
      {
        id: `sim-pause-${Date.now()}`,
        event: paused ? 'shop_skipped' : 'cycle_start',
        shop: SIM_SHOP_ADDRESS,
        reason: paused
          ? 'Merchant paused AI Guarantor access in simulator'
          : 'Merchant resumed AI Guarantor access in simulator',
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  }, []);

  const toggleAgentPaused = useCallback(() => {
    setAgentPausedState(!agentPaused);
  }, [agentPaused, setAgentPausedState]);

  const openReceipt = useCallback((receipt: VerifiableReceipt) => {
    setActiveReceipt(receipt);
  }, []);

  const closeReceipt = useCallback(() => {
    setActiveReceipt(null);
  }, []);

  const recordSale = useCallback(
    (amountUSD8: number, customerIdRaw: string) => {
      if (Number.isNaN(amountUSD8) || amountUSD8 < 0.1 || amountUSD8 > 500) {
        return {
          ok: false,
          repaidAmount: 0,
          error: 'Sale amount must be between 0.10 and 500.00 tUSD8.',
        };
      }
      const customerIdHash = hashCustomerId(customerIdRaw || '0812-0000');
      let repaidDeducted = 0;

      if (activeLoan) {
        const totalDue = activeLoan.principalUSD8 + activeLoan.flatFeeUSD8;
        const remaining = Math.max(0, totalDue - activeLoan.totalRepaidUSD8);
        const rawCut = Math.round(amountUSD8 * (activeLoan.repayPctBps / 10000) * 100) / 100;
        repaidDeducted = Math.min(remaining, rawCut);

        const nextTotalRepaid = Math.round((activeLoan.totalRepaidUSD8 + repaidDeducted) * 100) / 100;
        const isNowRepaid = nextTotalRepaid >= totalDue - 0.001;

        setLoans((prev) =>
          prev.map((l) => {
            if (l.id !== activeLoan.id) return l;
            return {
              ...l,
              totalRepaidUSD8: isNowRepaid ? totalDue : nextTotalRepaid,
              status: isNowRepaid ? 'Repaid' : 'Active',
              repaidAt: isNowRepaid ? Date.now() : undefined,
            };
          })
        );

        if (repaidDeducted > 0) {
          setPoolLoanedUSD8((prev) => Math.max(0, prev - repaidDeducted));
          setPoolEvents((prev) => [
            {
              id: `sim-pe-${Date.now()}`,
              type: 'RepaymentReceived',
              actor: activeShopName,
              amountUSD8: repaidDeducted,
              timestamp: Date.now(),
              txHash: simProofHash(`sim-repay-${Date.now()}`),
            },
            ...prev,
          ]);
        }

        if (isNowRepaid) {
          const nextLimit = Math.min(
            CONTRACT_LIMITS.MAX_LOAN_USD8,
            Math.round((shopStats.totalSales30dUSD8 + amountUSD8) * 0.1 * 100) / 100
          );
          setCreditPassports((prev) => [
            {
              loanId: activeLoan.id,
              shopName: activeShopName,
              shopAddress: SIM_SHOP_ADDRESS,
              principalUSD8: activeLoan.principalUSD8,
              flatFeeUSD8: activeLoan.flatFeeUSD8,
              daysToRepay: 12,
              newCreditLimitUSD8: nextLimit,
              txHash: simProofHash(`sim-passport-${activeLoan.id}`),
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }
      }

      const netToShop = Math.round((amountUSD8 - repaidDeducted) * 100) / 100;
      const resolvedTx = simProofHash(`sim-sale-${Date.now()}-${amountUSD8}`);
      const newSale: SaleRecord = {
        id: `sim-sale-${Date.now()}`,
        shop: SIM_SHOP_ADDRESS,
        amountUSD8,
        customerIdHash,
        customerLabel: `Customer #${customerIdRaw.trim().slice(-4)}`,
        timestamp: Date.now(),
        repaidDeductedUSD8: repaidDeducted,
        netToShopUSD8: netToShop,
        eip712Signature: `0x${resolvedTx.slice(2, 18)}...sandbox`,
        txHash: resolvedTx,
      };

      const newReceipt: VerifiableReceipt = {
        id: `rcpt-${newSale.id}`,
        kind: 'sale',
        title: `QR Sale · ${newSale.customerLabel}`,
        amountUSD8,
        repaidDeductedUSD8: repaidDeducted,
        netAmountUSD8: netToShop,
        counterpartyName: activeShopName,
        counterpartyWallet: SIM_SHOP_ADDRESS,
        erc8004Verified: true,
        proofHash: customerIdHash,
        txHash: resolvedTx,
        relayMode: 'sandbox-simulator',
        timestamp: newSale.timestamp,
        note:
          repaidDeducted > 0
            ? `90% to Shop (${netToShop.toFixed(2)} tUSD8) · 10% auto-repaid (${repaidDeducted.toFixed(2)} tUSD8)`
            : '100% settled to Shop (no active loan) · gasless EIP-712 proof',
      };

      setSales((prev) => [newSale, ...prev]);
      setReceipts((prev) => [newReceipt, ...prev]);
      setShopAvailableTusd8((prev) => Math.round((prev + netToShop) * 100) / 100);
      return { ok: true, repaidAmount: repaidDeducted, receipt: newReceipt };
    },
    [activeLoan, activeShopName, shopStats.totalSales30dUSD8]
  );

  const runAgentCycle = useCallback(
    (opts?: { recommendedPrincipalUSD8?: number; aiExplanation?: string }) => {
      if (!eligibility.eligible) {
        return { ok: false, message: eligibility.reason };
      }
      const nextId = Math.max(41, ...loans.map((l) => l.id)) + 1;
      const now = Date.now();
      const boundedPrincipal =
        typeof opts?.recommendedPrincipalUSD8 === 'number' &&
        opts.recommendedPrincipalUSD8 >= CONTRACT_LIMITS.MIN_LOAN_USD8 &&
        opts.recommendedPrincipalUSD8 <= eligibility.proposedPrincipalUSD8
          ? Math.floor(opts.recommendedPrincipalUSD8 * 100) / 100
          : eligibility.proposedPrincipalUSD8;
      const flatFee = Math.round(boundedPrincipal * (CONTRACT_LIMITS.FLAT_FEE_BPS / 10000) * 100) / 100;

      const createdLoan: LoanRecord = {
        id: nextId,
        shop: SIM_SHOP_ADDRESS,
        principalUSD8: boundedPrincipal,
        flatFeeUSD8: flatFee,
        repayPctBps: eligibility.proposedRepayPctBps,
        totalRepaidUSD8: 0,
        proposedAt: now,
        expiresAt: now + 48 * 3600 * 1000,
        status: 'Proposed',
        agentName: 'HanumPay-AI-Guarantor-v1',
        aiExplanation:
          opts?.aiExplanation ||
          `Behavioral scan cleared ${shopStats.uniqueCustomers30d} distinct buyers ($${shopStats.totalSales30dUSD8.toFixed(2)} 30d sales). Proposed $${boundedPrincipal.toFixed(2)} tUSD8 within 10% Solidity ceiling; 5% flat fee ($${flatFee.toFixed(2)}).`,
      };

      setLoans((prev) => [createdLoan, ...prev]);
      setProposalsToday((p) => p + 1);
      return {
        ok: true,
        loan: createdLoan,
        message: `Proposal #${nextId} issued for ${boundedPrincipal.toFixed(2)} tUSD8 (5% flat fee: ${flatFee.toFixed(2)} tUSD8).`,
      };
    },
    [eligibility, loans, shopStats.totalSales30dUSD8, shopStats.uniqueCustomers30d]
  );

  const acceptLoanProposal = useCallback(
    (loanId: number) => {
      const target = loans.find((l) => l.id === loanId && l.status === 'Proposed');
      if (!target) {
        return { ok: false, error: 'Loan proposal not found or already claimed.' };
      }
      const tx = simProofHash(`sim-accept-${loanId}-${Date.now()}`);
      setLoans((prev) =>
        prev.map((l) => (l.id === loanId ? { ...l, status: 'Active', acceptedAt: Date.now() } : l))
      );
      setPoolLoanedUSD8((prev) => prev + target.principalUSD8);
      setShopAvailableTusd8((prev) => Math.round((prev + target.principalUSD8) * 100) / 100);

      const receipt: VerifiableReceipt = {
        id: `sim-rcpt-loan-${loanId}`,
        kind: 'loan',
        title: `Working Capital #${loanId} Disbursed`,
        amountUSD8: target.principalUSD8,
        repaidDeductedUSD8: 0,
        netAmountUSD8: target.principalUSD8,
        counterpartyName: target.agentName,
        counterpartyWallet: SIM_AGENT_ADDRESS,
        erc8004Verified: true,
        proofHash: tx,
        txHash: tx,
        relayMode: 'sandbox-simulator',
        timestamp: Date.now(),
        note: '5% flat fee · 10% auto-deducted per QR sale (Sandbox)',
      };
      setReceipts((prev) => [receipt, ...prev]);
      return { ok: true, receipt };
    },
    [loans]
  );

  const rejectLoanProposal = useCallback((loanId: number) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId && l.status === 'Proposed' ? { ...l, status: 'Expired' } : l))
    );
  }, []);

  const payVerifiedSupplier = useCallback(
    (supplierName: string, amountUSD8: number, itemNote: string) => {
      const match = SIM_IDENTITIES.find(
        (i) => i.name.toLowerCase() === supplierName.trim().toLowerCase() && i.active
      );
      if (!match) {
        return {
          ok: false,
          error: 'Confirmation of Payee blocked: supplier is not registered in ERC8004Registry.',
        };
      }
      if (amountUSD8 > shopAvailableTusd8) {
        return {
          ok: false,
          error: `Insufficient simulator balance ($${shopAvailableTusd8.toFixed(2)} tUSD8).`,
        };
      }
      const tx = simProofHash(`sim-sup-${supplierName}-${Date.now()}`);
      const payment: SupplierPayment = {
        id: `sim-sup-${Date.now()}`,
        supplierName: match.name,
        supplierWallet: match.wallet,
        amountUSD8,
        itemNote,
        copVerified: true,
        timestamp: Date.now(),
        txHash: tx,
      };
      setShopAvailableTusd8((prev) => Math.round((prev - amountUSD8) * 100) / 100);
      setSupplierPayments((prev) => [payment, ...prev]);

      const receipt: VerifiableReceipt = {
        id: `sim-rcpt-sup-${Date.now()}`,
        kind: 'supplier',
        title: `Supplier Paid · ${match.name}`,
        amountUSD8,
        repaidDeductedUSD8: 0,
        netAmountUSD8: amountUSD8,
        counterpartyName: match.name,
        counterpartyWallet: match.wallet,
        erc8004Verified: true,
        proofHash: tx,
        txHash: tx,
        relayMode: 'sandbox-simulator',
        timestamp: Date.now(),
        note: itemNote,
      };
      setReceipts((prev) => [receipt, ...prev]);
      return { ok: true, receipt };
    },
    [shopAvailableTusd8]
  );

  const fastForwardLoanRepayment = useCallback(() => {
    if (!activeLoan) {
      return { ok: false, error: 'No active working capital facility to settle.' };
    }
    const totalDue = activeLoan.principalUSD8 + activeLoan.flatFeeUSD8;
    const remainingRepay = Math.max(0, Math.round((totalDue - activeLoan.totalRepaidUSD8) * 100) / 100);
    // Required gross QR sales so 10% equals remainingRepay
    const batchGrossSales = Math.round(remainingRepay * 10 * 100) / 100;
    const batchNetToShop = Math.round((batchGrossSales - remainingRepay) * 100) / 100;

    setLoans((prev) =>
      prev.map((l) =>
        l.id === activeLoan.id ? { ...l, totalRepaidUSD8: totalDue, status: 'Repaid', repaidAt: Date.now() } : l
      )
    );
    setPoolLoanedUSD8((prev) => Math.max(0, prev - remainingRepay));
    setShopAvailableTusd8((prev) => Math.round((prev + batchNetToShop) * 100) / 100);

    const nextLimit = Math.min(
      CONTRACT_LIMITS.MAX_LOAN_USD8,
      Math.round((shopStats.totalSales30dUSD8 + batchGrossSales) * 0.1 * 100) / 100
    );

    const passport: CreditPassportRecord = {
      loanId: activeLoan.id,
      shopName: activeShopName,
      shopAddress: SIM_SHOP_ADDRESS,
      principalUSD8: activeLoan.principalUSD8,
      flatFeeUSD8: activeLoan.flatFeeUSD8,
      daysToRepay: 14,
      newCreditLimitUSD8: nextLimit,
      txHash: simProofHash(`sim-passport-${activeLoan.id}-${Date.now()}`),
      timestamp: Date.now(),
    };
    setCreditPassports((prev) => [passport, ...prev]);
    setPoolEvents((prev) => [
      {
        id: `sim-pe-batch-${Date.now()}`,
        type: 'RepaymentReceived',
        actor: activeShopName,
        amountUSD8: remainingRepay,
        timestamp: Date.now(),
        txHash: passport.txHash,
      },
      ...prev,
    ]);

    return { ok: true, passport };
  }, [activeLoan, activeShopName, shopStats.totalSales30dUSD8]);

  const resetStageDemo = useCallback(() => {
    setSales(SIM_SALES);
    setLoans(SIM_LOANS);
    setProposalsToday(0);
    setPoolDepositedUSD8(12400);
    setPoolLoanedUSD8(3640);
    setPoolEvents([]);
    setCreditPassports([]);
    setSupplierPayments([]);
    setAuditLogs([]);
    setShopAvailableTusd8(145.0);
    setAgentPaused(false);
    setActiveReceipt(null);
  }, []);

  const value: StageSimulatorContextValue = {
    activeShopName,
    activeShopAddress: SIM_SHOP_ADDRESS,
    shopAvailableTusd8,
    sales,
    shopStats,
    eligibility,
    proposedLoan,
    activeLoan,
    lastRepaidLoan,
    agentPaused,
    setAgentPausedState,
    toggleAgentPaused,
    recordSale,
    runAgentCycle,
    acceptLoanProposal,
    rejectLoanProposal,
    payVerifiedSupplier,
    fastForwardLoanRepayment,
    receipts,
    activeReceipt,
    openReceipt,
    closeReceipt,
    resetStageDemo,
    auditLogs,
    poolEvents,
    creditPassports,
    supplierPayments,
  };

  return <StageSimulatorContext.Provider value={value}>{children}</StageSimulatorContext.Provider>;
}

export function useStageSimulator() {
  const ctx = useContext(StageSimulatorContext);
  if (!ctx) {
    throw new Error('useStageSimulator must be used within StageSimulatorProvider');
  }
  return ctx;
}
