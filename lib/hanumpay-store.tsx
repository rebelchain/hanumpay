'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { backendUrl } from './backend';
import {
  checkShopEligibility,
  EligibilityCheckResult,
  ShopStatsSnapshot,
} from './hanumpay-engine';
import {
  AgentAuditLog,
  CreditPassportRecord,
  EntityCategory,
  ERC8004Identity,
  LoanRecord,
  LoanStatus,
  PoolEvent,
  QrisSettlementInfo,
  SaleRecord,
  SupplierPayment,
  VerifiableReceipt,
} from './hanumpay-types';
import {
  addOrSwitchQDayNetwork,
  DEPLOYED_CONTRACTS,
  DEPLOYMENT_START_BLOCK,
  fromTusd8Raw,
  getInjectedProvider,
  QDAY_CHAIN_ID,
  shortenAddress,
  TUSD8_CONTRACT,
} from './qday-constants';

interface WalletState {
  connected: boolean;
  address: `0x${string}` | null;
  chainId: number | null;
  tqdayBalance: string;
  tusd8Balance: string;
  tusd8Raw: bigint;
  isConnecting: boolean;
  error: string | null;
}

interface OnChainEligibilityState {
  checked: boolean;
  eligible: boolean;
  reason: string;
}

interface HanumPayContextValue {
  // Live sync status
  isSyncing: boolean;
  lastSyncedBlock: string | null;
  syncError: string | null;
  syncOnChain: () => Promise<void>;

  // Active shop & ERC-8004 identities
  activeShopAddress: `0x${string}` | null;
  activeShopName: string;
  isRegisteredShop: boolean;
  registerShopOnChain: (
    shopName: string,
    alsoRegisterERC8004?: boolean
  ) => Promise<{ ok: boolean; txHash?: string; error?: string }>;
  identities: ERC8004Identity[];
  resolveERC8004: (name: string) => `0x${string}` | null;
  resolveERC8004OnChain: (
    name: string
  ) => Promise<{ found: boolean; wallet: `0x${string}` | null; identity?: ERC8004Identity }>;
  isERC8004Verified: (name: string) => boolean;
  registerIdentity: (
    name: string,
    category: EntityCategory,
    city: string,
    businessType: string
  ) => Promise<{ ok: boolean; txHash?: string; error?: string }>;
  revokeIdentity: (name: string) => Promise<{ ok: boolean; txHash?: string; error?: string }>;

  // Sales & Credit
  sales: SaleRecord[];
  shopStats: ShopStatsSnapshot;
  eligibility: EligibilityCheckResult;
  onChainEligibility: OnChainEligibilityState | null;
  recordSale: (
    amountUSD8: number,
    customerIdRaw: string
  ) => Promise<{
    ok: boolean;
    repaidAmount: number;
    receipt?: VerifiableReceipt;
    qrisSettlement?: QrisSettlementInfo;
    error?: string;
  }>;

  // Loans & AI Agent
  loans: LoanRecord[];
  proposedLoan: LoanRecord | null;
  activeLoan: LoanRecord | null;
  repaidLoans: LoanRecord[];
  proposalsToday: number;
  agentPaused: boolean;
  toggleAgentPaused: () => Promise<{ ok: boolean; error?: string }>;
  auditLogs: AgentAuditLog[];
  lastRelayMode: string | null;
  runAgentCycle: () => Promise<{ ok: boolean; message: string }>;
  acceptLoanProposal: (
    loanId: number
  ) => Promise<{ ok: boolean; receipt?: VerifiableReceipt; error?: string }>;

  // Lender Pool
  poolDepositedUSD8: number;
  poolLoanedUSD8: number;
  poolAvailableUSD8: number;
  poolUtilizationBps: number;
  poolFeesEarnedUSD8: number;
  poolActiveLoanCount: number;
  userLenderShares: number;
  userLenderValueUSD8: number;
  tusd8AllowancePool: number;
  poolEvents: PoolEvent[];
  depositToPool: (
    amountUSD8: number
  ) => Promise<{ ok: boolean; receipt?: VerifiableReceipt; error?: string }>;
  withdrawFromPool: (
    amountUSD8: number
  ) => Promise<{ ok: boolean; receipt?: VerifiableReceipt; error?: string }>;

  // Supplier Payments & Credit Passport
  supplierPayments: SupplierPayment[];
  payVerifiedSupplier: (
    supplierName: string,
    amountUSD8: number,
    itemNote: string
  ) => Promise<{ ok: boolean; receipt?: VerifiableReceipt; error?: string }>;
  creditPassports: CreditPassportRecord[];
  shopAvailableTusd8: number;

  // Verifiable QDay Receipts
  receipts: VerifiableReceipt[];
  activeReceipt: VerifiableReceipt | null;
  openReceipt: (receipt: VerifiableReceipt) => void;
  closeReceipt: () => void;

  // Real QDay Wallet & Onboarding Helpers
  wallet: WalletState;
  connectQDayWallet: () => Promise<void>;
  switchToQDayNetwork: () => Promise<{ ok: boolean; error?: string }>;
  approveLoanPoolAutoRepay: (
    amountUSD8?: number
  ) => Promise<{ ok: boolean; txHash?: string; error?: string }>;
  refreshWalletBalances: () => Promise<void>;
  disconnectWallet: () => void;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const LOAN_STATUS_MAP: LoanStatus[] = ['Proposed', 'Active', 'Repaid', 'Expired'];

function hexToUtf8(rawHex: string): string {
  const clean = rawHex.startsWith('0x') ? rawHex.slice(2) : rawHex;
  if (!clean) return '';
  const pairs = clean.match(/.{1,2}/g);
  if (!pairs) return '';
  const bytes = new Uint8Array(pairs.map((b) => parseInt(b, 16)));
  return new TextDecoder().decode(bytes);
}

function parseIdentityMetadata(rawHex: `0x${string}`, category: string): ERC8004Identity['metadata'] {
  const fallback: ERC8004Identity['metadata'] = {
    city: 'QDay Aevum Network',
    businessType: category === 'agent' ? 'AI Guarantor Agent' : `Registered ${category}`,
    reputationScore: 95,
    completedTxCount: 1,
    validationMethod: 'ERC-8004 On-Chain Registry',
  };

  if (!rawHex || rawHex === '0x') return fallback;

  try {
    const text = hexToUtf8(rawHex).replace(/\0/g, '').trim();
    if (!text) return fallback;
    if (text.startsWith('{')) {
      const parsed = JSON.parse(text) as Partial<ERC8004Identity['metadata']>;
      return {
        city: parsed.city ?? fallback.city,
        businessType: parsed.businessType ?? fallback.businessType,
        agentModel: parsed.agentModel,
        reputationScore: typeof parsed.reputationScore === 'number' ? parsed.reputationScore : 95,
        completedTxCount: typeof parsed.completedTxCount === 'number' ? parsed.completedTxCount : 1,
        validationMethod: parsed.validationMethod ?? fallback.validationMethod,
      };
    }
    return {
      ...fallback,
      businessType: text.slice(0, 64),
    };
  } catch {
    return fallback;
  }
}

function normalizeCategory(cat: string): EntityCategory {
  const lower = cat.toLowerCase();
  if (lower === 'shop' || lower === 'agent' || lower === 'lender' || lower === 'supplier') {
    return lower;
  }
  return 'shop';
}

const EMPTY_STATS: ShopStatsSnapshot = {
  totalSales30dUSD8: 0,
  uniqueCustomers30d: 0,
  salesHistoryDays: 0,
  hasActiveOrProposedLoan: false,
  inCooldown: false,
  cooldownDaysRemaining: 0,
  proposalsToday: 0,
  poolUtilizationBps: 0,
  poolAvailableUSD8: 0,
  agentPaused: false,
};

const HanumPayContext = createContext<HanumPayContextValue | null>(null);

export function HanumPayProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedBlock, setLastSyncedBlock] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [identities, setIdentities] = useState<ERC8004Identity[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [proposalsToday, setProposalsToday] = useState<number>(0);

  const [poolDepositedUSD8, setPoolDepositedUSD8] = useState<number>(0);
  const [poolLoanedUSD8, setPoolLoanedUSD8] = useState<number>(0);
  const [poolAvailableUSD8, setPoolAvailableUSD8] = useState<number>(0);
  const [poolUtilizationBps, setPoolUtilizationBps] = useState<number>(0);
  const [poolFeesEarnedUSD8, setPoolFeesEarnedUSD8] = useState<number>(0);
  const [poolActiveLoanCount, setPoolActiveLoanCount] = useState<number>(0);

  const [userLenderSharesRaw, setUserLenderSharesRaw] = useState<bigint>(BigInt(0));
  const [userLenderValueRaw, setUserLenderValueRaw] = useState<bigint>(BigInt(0));
  const [tusd8AllowancePoolRaw, setTusd8AllowancePoolRaw] = useState<bigint>(BigInt(0));
  const [poolEvents, setPoolEvents] = useState<PoolEvent[]>([]);

  const [creditPassports, setCreditPassports] = useState<CreditPassportRecord[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([]);
  const [lastRelayMode, setLastRelayMode] = useState<string | null>(null);

  const [isRegisteredShop, setIsRegisteredShop] = useState<boolean>(false);
  const [onChainShopName, setOnChainShopName] = useState<string>('');
  const [shopStatsRaw, setShopStatsRaw] = useState<{
    totalSales30dUSD8: number;
    uniqueCustomers30d: number;
    salesHistoryDays: number;
    inCooldown: boolean;
    cooldownDaysRemaining: number;
  }>({
    totalSales30dUSD8: 0,
    uniqueCustomers30d: 0,
    salesHistoryDays: 0,
    inCooldown: false,
    cooldownDaysRemaining: 0,
  });
  const [agentPaused, setAgentPaused] = useState<boolean>(false);
  const [onChainEligibility, setOnChainEligibility] = useState<OnChainEligibilityState | null>(null);

  const [receipts, setReceipts] = useState<VerifiableReceipt[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<VerifiableReceipt | null>(null);

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    tqdayBalance: '0.0000',
    tusd8Balance: '0.00',
    tusd8Raw: BigInt(0),
    isConnecting: false,
    error: null,
  });

  const syncSeqRef = useRef(0);

  const refreshWalletBalances = useCallback(async () => {
    if (!wallet.address) return;
    try {
      const qday = await import('./qday');
      const [bal, allowanceRaw] = await Promise.all([
        qday.fetchQDayBalances(wallet.address),
        qday.qDayPublicClient.readContract({
          address: TUSD8_CONTRACT.address,
          abi: qday.ERC20_ABI,
          functionName: 'allowance',
          args: [wallet.address, DEPLOYED_CONTRACTS.loanPool],
        }),
      ]);
      setWallet((prev) => ({
        ...prev,
        tqdayBalance: bal.tqday,
        tusd8Balance: bal.tusd8,
        tusd8Raw: bal.tusd8Raw,
        error: null,
      }));
      setTusd8AllowancePoolRaw(allowanceRaw);
    } catch {
      setWallet((prev) => ({
        ...prev,
        error: 'Unable to fetch live QDay balances. Try refreshing shortly.',
      }));
    }
  }, [wallet.address]);

  const syncOnChain = useCallback(async () => {
    const seq = ++syncSeqRef.current;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const [{ decodeEventLog }, qday] = await Promise.all([
        import('viem'),
        import('./qday'),
      ]);

      const latestBlock = await qday.qDayPublicClient.getBlockNumber();
      if (seq !== syncSeqRef.current) return;

      const scanFrom =
        latestBlock > DEPLOYMENT_START_BLOCK + BigInt(40_000)
          ? latestBlock - BigInt(40_000)
          : DEPLOYMENT_START_BLOCK;

      // 1. Read PoolStats, ProposalsToday, and Recent Protocol Logs
      const [poolStatsRes, todayProposalsRes, regLogs, poolLogs, agentLogs] = await Promise.all([
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.loanPool,
          abi: qday.HANUMPAY_ABIS.loanPool,
          functionName: 'getPoolStats',
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.aiGuarantor,
          abi: qday.HANUMPAY_ABIS.aiGuarantor,
          functionName: 'proposalsToday',
        }),
        qday.getLogsChunked({
          address: DEPLOYED_CONTRACTS.erc8004,
          fromBlock: scanFrom,
          toBlock: latestBlock,
          maxWindows: 40,
        }),
        qday.getLogsChunked({
          address: DEPLOYED_CONTRACTS.loanPool,
          fromBlock: scanFrom,
          toBlock: latestBlock,
          maxWindows: 40,
        }),
        qday.getLogsChunked({
          address: DEPLOYED_CONTRACTS.aiGuarantor,
          fromBlock: scanFrom,
          toBlock: latestBlock,
          maxWindows: 40,
        }),
      ]);

      if (seq !== syncSeqRef.current) return;

      setLastSyncedBlock(latestBlock.toString());
      setPoolDepositedUSD8(fromTusd8Raw(poolStatsRes.totalDeposited));
      setPoolLoanedUSD8(fromTusd8Raw(poolStatsRes.totalLoaned));
      setPoolAvailableUSD8(fromTusd8Raw(poolStatsRes.totalAvailable));
      setPoolUtilizationBps(Number(poolStatsRes.utilizationPct));
      setPoolFeesEarnedUSD8(fromTusd8Raw(poolStatsRes.totalFeeEarned));
      setPoolActiveLoanCount(Number(poolStatsRes.activeLoanCount));
      setProposalsToday(Number(todayProposalsRes));

      // 2. Build live ERC-8004 Directory from IdentityRegistered logs verified via getIdentity()
      const registeredNames = new Set<string>();
      for (const log of regLogs) {
        try {
          const decoded = decodeEventLog({
            abi: qday.HANUMPAY_ABIS.erc8004,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'IdentityRegistered') {
            registeredNames.add(decoded.args.name);
          }
        } catch {
          // ignore unknown log
        }
      }

      const identityResults = await Promise.all(
        Array.from(registeredNames)
          .slice(-40)
          .map(async (name) => {
            try {
              const idData = await qday.qDayPublicClient.readContract({
                address: DEPLOYED_CONTRACTS.erc8004,
                abi: qday.HANUMPAY_ABIS.erc8004,
                functionName: 'getIdentity',
                args: [name],
              });
              if (!idData.wallet || idData.wallet === ZERO_ADDRESS) return null;
              const cat = normalizeCategory(idData.category);
              return {
                name: idData.name,
                wallet: idData.wallet,
                category: cat,
                metadata: parseIdentityMetadata(idData.metadata, cat),
                registeredAt: Number(idData.registeredAt) * 1000,
                active: idData.active,
              } as ERC8004Identity;
            } catch {
              return null;
            }
          })
      );

      if (seq !== syncSeqRef.current) return;
      const liveIdentities = identityResults
        .filter((x): x is ERC8004Identity => x !== null)
        .sort((a, b) => b.registeredAt - a.registeredAt);
      setIdentities(liveIdentities);

      // 3. Parse Pool Events & Credit Passports
      const parsedPoolEvents: PoolEvent[] = [];
      const parsedPassports: CreditPassportRecord[] = [];
      const repaymentMap = new Map<string, number>();

      for (const log of poolLogs) {
        const txHash = log.transactionHash ?? '0x';
        try {
          const decoded = decodeEventLog({
            abi: qday.HANUMPAY_ABIS.loanPool,
            data: log.data,
            topics: log.topics,
          });
          const blockNum = Number(log.blockNumber ?? 0);
          const approxTs = Date.now() - Math.max(0, Number(latestBlock) - blockNum) * 3000;

          if (decoded.eventName === 'LenderDeposited') {
            parsedPoolEvents.push({
              id: `pe-dep-${txHash}-${log.logIndex}`,
              type: 'Deposit',
              actor: shortenAddress(decoded.args.lender),
              amountUSD8: fromTusd8Raw(decoded.args.amount),
              timestamp: approxTs,
              txHash,
            });
          } else if (decoded.eventName === 'LenderWithdrew') {
            parsedPoolEvents.push({
              id: `pe-wd-${txHash}-${log.logIndex}`,
              type: 'Withdraw',
              actor: shortenAddress(decoded.args.lender),
              amountUSD8: fromTusd8Raw(decoded.args.amount),
              timestamp: approxTs,
              txHash,
            });
          } else if (decoded.eventName === 'LoanAccepted') {
            parsedPoolEvents.push({
              id: `pe-acc-${txHash}-${log.logIndex}`,
              type: 'LoanDisbursed',
              actor: shortenAddress(decoded.args.shop),
              amountUSD8: 0,
              timestamp: Number(decoded.args.timestamp) * 1000 || approxTs,
              txHash,
            });
          } else if (decoded.eventName === 'LoanRepayment') {
            const amt = fromTusd8Raw(decoded.args.amount);
            repaymentMap.set(txHash.toLowerCase(), (repaymentMap.get(txHash.toLowerCase()) ?? 0) + amt);
            if (amt > 0) {
              parsedPoolEvents.push({
                id: `pe-rep-${txHash}-${log.logIndex}`,
                type: 'RepaymentReceived',
                actor: shortenAddress(decoded.args.shop),
                amountUSD8: amt,
                timestamp: approxTs,
                txHash,
              });
            }
          } else if (decoded.eventName === 'CreditPassportMinted') {
            const p = fromTusd8Raw(decoded.args.principal);
            parsedPassports.push({
              loanId: Number(decoded.args.loanId),
              shopName: shortenAddress(decoded.args.shop),
              shopAddress: decoded.args.shop,
              principalUSD8: p,
              flatFeeUSD8: Math.round(p * 0.05 * 100) / 100,
              daysToRepay: Number(decoded.args.daysToRepay),
              newCreditLimitUSD8: Math.min(500, Math.round(p * 1.1 * 100) / 100),
              txHash,
              timestamp: approxTs,
            });
          }
        } catch {
          // skip
        }
      }

      setPoolEvents(parsedPoolEvents.reverse());

      // 4. Parse AI Guarantor Audit Logs
      const parsedAgentLogs: AgentAuditLog[] = [];
      for (const log of agentLogs) {
        const txHash = log.transactionHash ?? undefined;
        try {
          const decoded = decodeEventLog({
            abi: qday.HANUMPAY_ABIS.aiGuarantor,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'ProposalSubmitted') {
            parsedAgentLogs.push({
              id: `agl-prop-${txHash}-${log.logIndex}`,
              event: 'proposal_submitted',
              shop: decoded.args.shop,
              principal: decoded.args.principal.toString(),
              flatFee: decoded.args.flatFee.toString(),
              txHash,
              timestamp: Number(decoded.args.timestamp) * 1000,
            });
          } else if (decoded.eventName === 'AgentAccessUpdated') {
            parsedAgentLogs.push({
              id: `agl-pause-${txHash}-${log.logIndex}`,
              event: decoded.args.paused ? 'shop_skipped' : 'cycle_start',
              shop: decoded.args.shop,
              reason: decoded.args.paused
                ? 'Merchant paused AI Guarantor access on-chain'
                : 'Merchant resumed AI Guarantor access on-chain',
              txHash,
              timestamp: Number(decoded.args.timestamp) * 1000,
            });
          }
        } catch {
          // skip
        }
      }
      setAuditLogs(parsedAgentLogs.sort((a, b) => b.timestamp - a.timestamp));

      // 5. Wallet-scoped reads (only when a wallet is connected!)
      const activeWallet = wallet.connected ? wallet.address : null;
      if (!activeWallet) {
        setIsRegisteredShop(false);
        setOnChainShopName('');
        setSales([]);
        setLoans([]);
        setCreditPassports(parsedPassports.reverse());
        setUserLenderSharesRaw(BigInt(0));
        setUserLenderValueRaw(BigInt(0));
        setTusd8AllowancePoolRaw(BigInt(0));
        setShopStatsRaw({
          totalSales30dUSD8: 0,
          uniqueCustomers30d: 0,
          salesHistoryDays: 0,
          inCooldown: false,
          cooldownDaysRemaining: 0,
        });
        setAgentPaused(false);
        setOnChainEligibility(null);
        return;
      }

      const [
        registeredFlag,
        shopRegTimestamp,
        ercName,
        shopStatsContract,
        pausedFlag,
        eligTuple,
        cooldownEndSec,
        shopLoanIds,
        lenderBal,
        bal,
        allowancePool,
        saleLogs,
      ] = await Promise.all([
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.salesLedger,
          abi: qday.HANUMPAY_ABIS.salesLedger,
          functionName: 'isRegisteredShop',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.salesLedger,
          abi: qday.HANUMPAY_ABIS.salesLedger,
          functionName: 'shopRegisteredAt',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.erc8004,
          abi: qday.HANUMPAY_ABIS.erc8004,
          functionName: 'nameOf',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.salesLedger,
          abi: qday.HANUMPAY_ABIS.salesLedger,
          functionName: 'getShopStats',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.aiGuarantor,
          abi: qday.HANUMPAY_ABIS.aiGuarantor,
          functionName: 'shopPausedAgent',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.aiGuarantor,
          abi: qday.HANUMPAY_ABIS.aiGuarantor,
          functionName: 'checkEligibility',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.loanPool,
          abi: qday.HANUMPAY_ABIS.loanPool,
          functionName: 'getCooldownEnd',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.loanPool,
          abi: qday.HANUMPAY_ABIS.loanPool,
          functionName: 'getShopLoans',
          args: [activeWallet],
        }),
        qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.loanPool,
          abi: qday.HANUMPAY_ABIS.loanPool,
          functionName: 'getLenderBalance',
          args: [activeWallet],
        }),
        qday.fetchQDayBalances(activeWallet),
        qday.qDayPublicClient.readContract({
          address: TUSD8_CONTRACT.address,
          abi: qday.ERC20_ABI,
          functionName: 'allowance',
          args: [activeWallet, DEPLOYED_CONTRACTS.loanPool],
        }),
        qday.getLogsChunked({
          address: DEPLOYED_CONTRACTS.salesLedger,
          fromBlock: scanFrom,
          toBlock: latestBlock,
          maxWindows: 40,
        }),
      ]);

      if (seq !== syncSeqRef.current) return;

      setWallet((prev) => ({
        ...prev,
        tqdayBalance: bal.tqday,
        tusd8Balance: bal.tusd8,
        tusd8Raw: bal.tusd8Raw,
        error: null,
      }));
      setIsRegisteredShop(Boolean(registeredFlag));
      setOnChainShopName(ercName || '');
      setAgentPaused(Boolean(pausedFlag));
      setOnChainEligibility({
        checked: true,
        eligible: Boolean(eligTuple[0]),
        reason: eligTuple[1] || '',
      });
      setUserLenderSharesRaw(lenderBal[0]);
      setUserLenderValueRaw(lenderBal[1]);
      setTusd8AllowancePoolRaw(allowancePool);

      const nowSec = Math.floor(Date.now() / 1000);
      const regSec = Number(shopRegTimestamp);
      const historyDays = regSec > 0 ? Math.max(0, Math.floor((nowSec - regSec) / 86400)) : 0;
      const cooldownSec = Number(cooldownEndSec);
      const inCooldown = cooldownSec > nowSec;
      const cooldownDaysRemaining = inCooldown ? Math.ceil((cooldownSec - nowSec) / 86400) : 0;

      setShopStatsRaw({
        totalSales30dUSD8: fromTusd8Raw(shopStatsContract.totalSales30d),
        uniqueCustomers30d: Number(shopStatsContract.uniqueCustomers30d),
        salesHistoryDays: historyDays,
        inCooldown,
        cooldownDaysRemaining,
      });

      // Fetch full Loan structs for connected shop
      const loanStructs = await Promise.all(
        shopLoanIds.map((id) =>
          qday.qDayPublicClient.readContract({
            address: DEPLOYED_CONTRACTS.loanPool,
            abi: qday.HANUMPAY_ABIS.loanPool,
            functionName: 'getLoan',
            args: [id],
          })
        )
      );

      if (seq !== syncSeqRef.current) return;

      const parsedLoans: LoanRecord[] = loanStructs
        .map((l) => {
          const proposedMs = Number(l.proposedAt) * 1000;
          const status = LOAN_STATUS_MAP[Number(l.status)] ?? 'Proposed';
          return {
            id: Number(l.id),
            shop: l.shop,
            principalUSD8: fromTusd8Raw(l.principal),
            flatFeeUSD8: fromTusd8Raw(l.flatFee),
            repayPctBps: Number(l.repayPct),
            totalRepaidUSD8: fromTusd8Raw(l.totalRepaid),
            proposedAt: proposedMs,
            acceptedAt: Number(l.acceptedAt) > 0 ? Number(l.acceptedAt) * 1000 : undefined,
            repaidAt: Number(l.repaidAt) > 0 ? Number(l.repaidAt) * 1000 : undefined,
            expiresAt: proposedMs + 48 * 3600 * 1000,
            status,
            agentName: 'HanumPay-AI-Guarantor-v1',
          };
        })
        .sort((a, b) => b.id - a.id);

      setLoans(parsedLoans);
      setCreditPassports(
        parsedPassports
          .filter((cp) => cp.shopAddress.toLowerCase() === activeWallet.toLowerCase())
          .reverse()
      );

      // Parse SaleRecorded logs for this shop
      const parsedSales: SaleRecord[] = [];
      for (const log of saleLogs) {
        try {
          const decoded = decodeEventLog({
            abi: qday.HANUMPAY_ABIS.salesLedger,
            data: log.data,
            topics: log.topics,
          });
          if (
            decoded.eventName === 'SaleRecorded' &&
            decoded.args.shop.toLowerCase() === activeWallet.toLowerCase()
          ) {
            const txHash = log.transactionHash ?? '0x';
            const gross = fromTusd8Raw(decoded.args.amount);
            const repaid = repaymentMap.get(txHash.toLowerCase()) ?? 0;
            parsedSales.push({
              id: `sale-${decoded.args.saleIndex.toString()}-${txHash.slice(2, 10)}`,
              shop: decoded.args.shop,
              amountUSD8: gross,
              customerIdHash: decoded.args.customerId,
              customerLabel: `Customer ${decoded.args.customerId.slice(0, 8)}...`,
              timestamp: Number(decoded.args.timestamp) * 1000,
              repaidDeductedUSD8: repaid,
              netToShopUSD8: Math.max(0, Math.round((gross - repaid) * 100) / 100),
              eip712Signature: 'Verified on QDay SalesLedger',
              txHash,
            });
          }
        } catch {
          // skip
        }
      }
      setSales(parsedSales.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      if (seq === syncSeqRef.current) {
        setSyncError(err instanceof Error ? err.message : 'Unable to sync QDay Aevum state.');
      }
    } finally {
      if (seq === syncSeqRef.current) {
        setIsSyncing(false);
      }
    }
  }, [wallet.address, wallet.connected]);

  useEffect(() => {
    void syncOnChain();
  }, [syncOnChain]);

  // Listen to MetaMask / Rabby account or chain switches
  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider?.on || !provider?.removeListener) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? (accounts as string[]) : [];
      if (list.length === 0) {
        setWallet({
          connected: false,
          address: null,
          chainId: null,
          tqdayBalance: '0.0000',
          tusd8Balance: '0.00',
          tusd8Raw: BigInt(0),
          isConnecting: false,
          error: null,
        });
      } else {
        setWallet((prev) => ({
          ...prev,
          connected: true,
          address: list[0] as `0x${string}`,
          error: null,
        }));
      }
    };

    const handleChainChanged = (chainHex: unknown) => {
      const parsed = typeof chainHex === 'string' ? parseInt(chainHex, 16) : null;
      setWallet((prev) => ({ ...prev, chainId: parsed }));
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  const activeShopAddress = wallet.connected ? wallet.address : null;
  const activeShopName = !wallet.connected
    ? 'No Wallet Connected'
    : onChainShopName || (wallet.address ? shortenAddress(wallet.address) : 'Merchant Wallet');

  const resolveERC8004 = useCallback(
    (name: string): `0x${string}` | null => {
      const match = identities.find(
        (i) => i.name.toLowerCase() === name.trim().toLowerCase() && i.active
      );
      return match ? match.wallet : null;
    },
    [identities]
  );

  const resolveERC8004OnChain = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { found: false, wallet: null };

    const qday = await import('./qday');
    const idData = await qday.qDayPublicClient.readContract({
      address: DEPLOYED_CONTRACTS.erc8004,
      abi: qday.HANUMPAY_ABIS.erc8004,
      functionName: 'getIdentity',
      args: [trimmed],
    });

    if (!idData.wallet || idData.wallet === ZERO_ADDRESS || !idData.active) {
      return { found: false, wallet: null };
    }

    const cat = normalizeCategory(idData.category);
    const identity: ERC8004Identity = {
      name: idData.name,
      wallet: idData.wallet,
      category: cat,
      metadata: parseIdentityMetadata(idData.metadata, cat),
      registeredAt: Number(idData.registeredAt) * 1000,
      active: idData.active,
    };

    setIdentities((prev) => {
      const exists = prev.some((i) => i.name.toLowerCase() === identity.name.toLowerCase());
      return exists
        ? prev.map((i) => (i.name.toLowerCase() === identity.name.toLowerCase() ? identity : i))
        : [identity, ...prev];
    });

    return { found: true, wallet: idData.wallet, identity };
  }, []);

  const isERC8004Verified = useCallback(
    (name: string): boolean => {
      return identities.some(
        (i) => i.name.toLowerCase() === name.trim().toLowerCase() && i.active
      );
    },
    [identities]
  );

  const registerShopOnChain = useCallback(
    async (shopName: string, alsoRegisterERC8004 = true) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your QDay MetaMask wallet first.' };
      }
      const trimmed = shopName.trim();
      if (!trimmed || trimmed.length > 64) {
        return { ok: false, error: 'Shop name must be 1–64 characters.' };
      }

      try {
        const [{ toHex }, qday] = await Promise.all([import('viem'), import('./qday')]);
        const txHash = await qday.sendWalletWriteContract({
          account: wallet.address,
          address: DEPLOYED_CONTRACTS.salesLedger,
          abi: qday.HANUMPAY_ABIS.salesLedger,
          functionName: 'registerShop',
          args: [trimmed],
        });

        if (alsoRegisterERC8004 && !onChainShopName) {
          const alreadyTaken = await qday.qDayPublicClient.readContract({
            address: DEPLOYED_CONTRACTS.erc8004,
            abi: qday.HANUMPAY_ABIS.erc8004,
            functionName: 'isVerified',
            args: [trimmed],
          });
          if (!alreadyTaken) {
            const metaHex = toHex(
              JSON.stringify({
                city: 'QDay Aevum Network',
                businessType: 'MSME Merchant Shop',
                validationMethod: 'SalesLedger + ERC-8004 Registered',
              })
            );
            await qday.sendWalletWriteContract({
              account: wallet.address,
              address: DEPLOYED_CONTRACTS.erc8004,
              abi: qday.HANUMPAY_ABIS.erc8004,
              functionName: 'register',
              args: [trimmed, 'shop', metaHex],
            });
          }
        }

        await syncOnChain();
        return { ok: true, txHash };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Failed to register shop on-chain.',
        };
      }
    },
    [onChainShopName, syncOnChain, wallet.address, wallet.connected]
  );

  const registerIdentity = useCallback(
    async (name: string, category: EntityCategory, city: string, businessType: string) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your QDay MetaMask wallet to register on-chain.' };
      }
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 64) {
        return { ok: false, error: 'Identity name must be 1–64 characters.' };
      }

      try {
        const [{ toHex }, qday] = await Promise.all([import('viem'), import('./qday')]);
        const metaHex = toHex(
          JSON.stringify({
            city: city.trim() || 'QDay Aevum Network',
            businessType: businessType.trim() || `Registered ${category}`,
            reputationScore: 95,
            completedTxCount: 1,
            validationMethod: 'ERC-8004 On-Chain Registry',
          })
        );

        const txHash = await qday.sendWalletWriteContract({
          account: wallet.address,
          address: DEPLOYED_CONTRACTS.erc8004,
          abi: qday.HANUMPAY_ABIS.erc8004,
          functionName: 'register',
          args: [trimmed, category, metaHex],
        });

        await syncOnChain();
        return { ok: true, txHash };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'ERC8004Registry.register failed.',
        };
      }
    },
    [syncOnChain, wallet.address, wallet.connected]
  );

  const revokeIdentity = useCallback(
    async (name: string) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your QDay wallet first.' };
      }
      try {
        const qday = await import('./qday');
        const txHash = await qday.sendWalletWriteContract({
          account: wallet.address,
          address: DEPLOYED_CONTRACTS.erc8004,
          abi: qday.HANUMPAY_ABIS.erc8004,
          functionName: 'revoke',
          args: [name],
        });
        await syncOnChain();
        return { ok: true, txHash };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'ERC8004Registry.revoke failed.',
        };
      }
    },
    [syncOnChain, wallet.address, wallet.connected]
  );

  const proposedLoan = useMemo(
    () => loans.find((l) => l.status === 'Proposed') ?? null,
    [loans]
  );
  const activeLoan = useMemo(
    () => loans.find((l) => l.status === 'Active') ?? null,
    [loans]
  );
  const repaidLoans = useMemo(
    () => loans.filter((l) => l.status === 'Repaid'),
    [loans]
  );

  const shopStats = useMemo<ShopStatsSnapshot>(() => {
    if (!wallet.connected) return EMPTY_STATS;
    return {
      totalSales30dUSD8: shopStatsRaw.totalSales30dUSD8,
      uniqueCustomers30d: shopStatsRaw.uniqueCustomers30d,
      salesHistoryDays: shopStatsRaw.salesHistoryDays,
      hasActiveOrProposedLoan: Boolean(proposedLoan || activeLoan),
      inCooldown: shopStatsRaw.inCooldown,
      cooldownDaysRemaining: shopStatsRaw.cooldownDaysRemaining,
      proposalsToday,
      poolUtilizationBps,
      poolAvailableUSD8,
      agentPaused,
    };
  }, [
    activeLoan,
    agentPaused,
    poolAvailableUSD8,
    poolUtilizationBps,
    proposalsToday,
    proposedLoan,
    shopStatsRaw,
    wallet.connected,
  ]);

  const eligibility = useMemo(() => checkShopEligibility(shopStats), [shopStats]);

  const toggleAgentPaused = useCallback(async () => {
    if (!wallet.connected || !wallet.address) {
      return { ok: false, error: 'Connect your QDay wallet first.' };
    }
    try {
      const qday = await import('./qday');
      const nextPaused = !agentPaused;
      await qday.sendWalletWriteContract({
        account: wallet.address,
        address: DEPLOYED_CONTRACTS.aiGuarantor,
        abi: qday.HANUMPAY_ABIS.aiGuarantor,
        functionName: 'setAgentPaused',
        args: [nextPaused],
      });
      await syncOnChain();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'AIGuarantor.setAgentPaused transaction failed.',
      };
    }
  }, [agentPaused, syncOnChain, wallet.address, wallet.connected]);

  const openReceipt = useCallback((receipt: VerifiableReceipt) => {
    setActiveReceipt(receipt);
  }, []);

  const closeReceipt = useCallback(() => {
    setActiveReceipt(null);
  }, []);

  const recordSale = useCallback(
    async (amountUSD8: number, customerIdRaw: string) => {
      if (!wallet.connected || !wallet.address) {
        return {
          ok: false,
          repaidAmount: 0,
          error: 'Connect your QDay MetaMask wallet before recording a QR sale.',
        };
      }
      if (!isRegisteredShop) {
        return {
          ok: false,
          repaidAmount: 0,
          error: 'Register your wallet as a shop in SalesLedger first.',
        };
      }
      if (Number.isNaN(amountUSD8) || amountUSD8 < 0.1 || amountUSD8 > 500) {
        return {
          ok: false,
          repaidAmount: 0,
          error: 'Sale amount must be between 0.10 tUSD8 and 500.00 tUSD8.',
        };
      }
      if (!customerIdRaw || customerIdRaw.trim().length < 4) {
        return {
          ok: false,
          repaidAmount: 0,
          error: 'Customer phone / ID must be at least 4 characters.',
        };
      }

      const provider = getInjectedProvider();
      if (!provider) {
        return { ok: false, repaidAmount: 0, error: 'No browser Web3 wallet detected.' };
      }

      try {
        await addOrSwitchQDayNetwork(provider);
      } catch {
        return { ok: false, repaidAmount: 0, error: 'Please switch wallet to QDay Aevum (44005).' };
      }

      const [{ parseUnits }, qday] = await Promise.all([import('viem'), import('./qday')]);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const customerIdHash = qday.hashCustomerId(customerIdRaw);
      const amountRaw = parseUnits(amountUSD8.toFixed(6), TUSD8_CONTRACT.decimals);

      let sig = '';
      try {
        const typedData = {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' },
            ],
            RecordSale: [
              { name: 'shop', type: 'address' },
              { name: 'amountUSD8', type: 'uint256' },
              { name: 'customerId', type: 'bytes32' },
              { name: 'deadline', type: 'uint256' },
            ],
          },
          primaryType: 'RecordSale',
          domain: {
            name: 'HanumPaySalesLedger',
            version: '1',
            chainId: QDAY_CHAIN_ID,
            verifyingContract: DEPLOYED_CONTRACTS.salesLedger,
          },
          message: {
            shop: wallet.address,
            amountUSD8: amountRaw.toString(),
            customerId: customerIdHash,
            deadline: String(deadline),
          },
        };
        const result = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [wallet.address, JSON.stringify(typedData)],
        });
        sig = String(result);
      } catch {
        return { ok: false, repaidAmount: 0, error: 'EIP-712 signature was cancelled in wallet.' };
      }

      try {
        const relayRes = await fetch(backendUrl('/api/relay/record-sale'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop: wallet.address,
            amountUSD8,
            customerIdHash,
            deadline,
            signature: sig,
          }),
        });
        const relayData = (await relayRes.json()) as {
          ok?: boolean;
          mode?: string;
          txHash?: string | null;
          qrisSettlement?: QrisSettlementInfo;
          error?: string;
        };
        if (!relayRes.ok || !relayData.txHash) {
          return {
            ok: false,
            repaidAmount: 0,
            error:
              relayData.error ??
              'Relayer did not return an on-chain QDay TX hash. Check RELAYER_PRIVATE_KEY on backend.',
          };
        }

        if (relayData.mode) setLastRelayMode(relayData.mode);

        let estimatedRepaid = 0;
        if (activeLoan) {
          const totalDue = activeLoan.principalUSD8 + activeLoan.flatFeeUSD8;
          const remaining = Math.max(0, totalDue - activeLoan.totalRepaidUSD8);
          estimatedRepaid = Math.min(
            remaining,
            Math.round(amountUSD8 * (activeLoan.repayPctBps / 10000) * 100) / 100
          );
        }

        const qrisInfo = relayData.qrisSettlement;
        const settlementNote = qrisInfo?.simulated
          ? `QRIS Rupiah payment settled $${amountUSD8.toFixed(2)} tUSD8 to shop wallet${
              estimatedRepaid > 0 ? ` (-$${estimatedRepaid.toFixed(2)} auto-repaid to pool)` : ''
            }`
          : 'Sale saved on QDay SalesLedger (relayer test reserve empty; skipped tUSD8 gateway top-up)';

        const newReceipt: VerifiableReceipt = {
          id: `rcpt-sale-${Date.now()}`,
          kind: 'sale',
          title: `QR Sale · Customer #${customerIdRaw.trim().slice(-4)}`,
          amountUSD8,
          repaidDeductedUSD8: estimatedRepaid,
          netAmountUSD8: Math.max(0, Math.round((amountUSD8 - estimatedRepaid) * 100) / 100),
          counterpartyName: activeShopName,
          counterpartyWallet: wallet.address,
          erc8004Verified: Boolean(onChainShopName),
          proofHash: customerIdHash,
          txHash: relayData.txHash,
          relayMode: relayData.mode ?? 'qday-onchain-relay',
          timestamp: Date.now(),
          note: settlementNote,
        };
        setReceipts((prev) => [newReceipt, ...prev]);

        await syncOnChain();
        return {
          ok: true,
          repaidAmount: estimatedRepaid,
          receipt: newReceipt,
          qrisSettlement: qrisInfo,
        };
      } catch (err) {
        return {
          ok: false,
          repaidAmount: 0,
          error:
            err instanceof Error
              ? err.message
              : 'Unable to reach Relayer backend.',
        };
      }
    },
    [
      activeLoan,
      activeShopName,
      isRegisteredShop,
      onChainShopName,
      syncOnChain,
      wallet.address,
      wallet.connected,
    ]
  );

  const runAgentCycle = useCallback(async () => {
    try {
      const res = await fetch(backendUrl('/api/agent/cron'), { method: 'POST' });
      const data = (await res.json()) as {
        ok?: boolean;
        mode?: string;
        error?: string;
        logs?: Array<{
          event?: AgentAuditLog['event'];
          shop?: string;
          reason?: string;
          txHash?: string;
          timestamp?: number;
        }>;
      };

      if (!res.ok) {
        return {
          ok: false,
          message: data.error ?? 'AI Guarantor backend cron returned an error.',
        };
      }

      if (Array.isArray(data.logs) && data.logs.length > 0) {
        const mapped: AgentAuditLog[] = data.logs.map((entry, idx) => ({
          id: `cron-${Date.now()}-${idx}`,
          event: entry.event ?? 'cycle_start',
          shop: entry.shop,
          reason: entry.reason,
          txHash: entry.txHash,
          timestamp: entry.timestamp ?? Date.now(),
        }));
        setAuditLogs((prev) => [...mapped.reverse(), ...prev]);
      }

      await syncOnChain();

      const submitted = data.logs?.filter((l) => l.event === 'proposal_submitted') ?? [];
      const skipped = data.logs?.filter((l) => l.event === 'shop_skipped') ?? [];

      return {
        ok: true,
        message:
          submitted.length > 0
            ? `AI Guarantor submitted ${submitted.length} live on-chain loan proposal(s).`
            : `Live cycle completed (${skipped.length} shop(s) skipped by Solidity eligibility rules).`,
      };
    } catch (err) {
      return {
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Unable to reach AI Guarantor cron endpoint.',
      };
    }
  }, [syncOnChain]);

  const acceptLoanProposal = useCallback(
    async (loanId: number) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your QDay MetaMask wallet first.' };
      }
      const target = loans.find((l) => l.id === loanId && l.status === 'Proposed');
      if (!target) {
        return { ok: false, error: 'Loan proposal not found or no longer in Proposed status.' };
      }

      const provider = getInjectedProvider();
      if (!provider) {
        return { ok: false, error: 'No browser Web3 wallet detected.' };
      }

      try {
        await addOrSwitchQDayNetwork(provider);
      } catch {
        return { ok: false, error: 'Please switch wallet to QDay Aevum (44005).' };
      }

      const { parseUnits } = await import('viem');
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const principalRaw = parseUnits(target.principalUSD8.toFixed(6), TUSD8_CONTRACT.decimals);
      const flatFeeRaw = parseUnits(target.flatFeeUSD8.toFixed(6), TUSD8_CONTRACT.decimals);

      let sig = '';
      try {
        const typedData = {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' },
            ],
            AcceptLoan: [
              { name: 'loanId', type: 'uint256' },
              { name: 'shop', type: 'address' },
              { name: 'principalUSD8', type: 'uint256' },
              { name: 'flatFeeUSD8', type: 'uint256' },
              { name: 'repayPctBps', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
            ],
          },
          primaryType: 'AcceptLoan',
          domain: {
            name: 'HanumPayLoanPool',
            version: '1',
            chainId: QDAY_CHAIN_ID,
            verifyingContract: DEPLOYED_CONTRACTS.loanPool,
          },
          message: {
            loanId: String(target.id),
            shop: wallet.address,
            principalUSD8: principalRaw.toString(),
            flatFeeUSD8: flatFeeRaw.toString(),
            repayPctBps: String(target.repayPctBps),
            deadline: String(deadline),
          },
        };
        const result = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [wallet.address, JSON.stringify(typedData)],
        });
        sig = String(result);
      } catch {
        return { ok: false, error: 'EIP-712 loan acceptance signature was cancelled in wallet.' };
      }

      try {
        const relayRes = await fetch(backendUrl('/api/relay/accept-loan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanId: target.id,
            shop: wallet.address,
            principalUSD8: target.principalUSD8,
            flatFeeUSD8: target.flatFeeUSD8,
            repayPctBps: target.repayPctBps,
            deadline,
            signature: sig,
          }),
        });
        const relayData = (await relayRes.json()) as {
          ok?: boolean;
          mode?: string;
          txHash?: string | null;
          error?: string;
        };
        if (!relayRes.ok || !relayData.txHash) {
          return {
            ok: false,
            error: relayData.error ?? 'Loan acceptance relayer did not broadcast transaction.',
          };
        }
        if (relayData.mode) setLastRelayMode(relayData.mode);

        const loanReceipt: VerifiableReceipt = {
          id: `rcpt-loan-${loanId}-${Date.now()}`,
          kind: 'loan',
          title: `Working Capital #${loanId} Disbursed`,
          amountUSD8: target.principalUSD8,
          repaidDeductedUSD8: 0,
          netAmountUSD8: target.principalUSD8,
          counterpartyName: target.agentName,
          counterpartyWallet: DEPLOYED_CONTRACTS.aiGuarantor,
          erc8004Verified: true,
          proofHash: sig,
          txHash: relayData.txHash,
          relayMode: relayData.mode ?? 'qday-onchain-relay',
          timestamp: Date.now(),
          note: `5% flat fee (${target.flatFeeUSD8.toFixed(2)} tUSD8) · 10% auto-deducted per QR sale`,
        };
        setReceipts((prev) => [loanReceipt, ...prev]);

        await syncOnChain();
        return { ok: true, receipt: loanReceipt };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Unable to reach LoanPool relayer.',
        };
      }
    },
    [loans, syncOnChain, wallet.address, wallet.connected]
  );

  const depositToPool = useCallback(
    async (amountUSD8: number) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your QDay MetaMask wallet first.' };
      }
      if (Number.isNaN(amountUSD8) || amountUSD8 <= 0) {
        return { ok: false, error: 'Enter a valid tUSD8 deposit amount.' };
      }

      try {
        const [{ parseUnits }, qday] = await Promise.all([import('viem'), import('./qday')]);
        const rawAmount = parseUnits(amountUSD8.toFixed(6), TUSD8_CONTRACT.decimals);
        if (rawAmount > wallet.tusd8Raw) {
          return {
            ok: false,
            error: `Insufficient wallet tUSD8 balance (${wallet.tusd8Balance} tUSD8).`,
          };
        }

        const currentAllowance = await qday.qDayPublicClient.readContract({
          address: TUSD8_CONTRACT.address,
          abi: qday.ERC20_ABI,
          functionName: 'allowance',
          args: [wallet.address, DEPLOYED_CONTRACTS.loanPool],
        });

        if (currentAllowance < rawAmount) {
          await qday.sendWalletWriteContract({
            account: wallet.address,
            address: TUSD8_CONTRACT.address,
            abi: qday.ERC20_ABI,
            functionName: 'approve',
            args: [DEPLOYED_CONTRACTS.loanPool, rawAmount],
          });
        }

        const txHash = await qday.sendWalletWriteContract({
          account: wallet.address,
          address: DEPLOYED_CONTRACTS.loanPool,
          abi: qday.HANUMPAY_ABIS.loanPool,
          functionName: 'deposit',
          args: [rawAmount],
        });

        const receipt: VerifiableReceipt = {
          id: `rcpt-pool-dep-${Date.now()}`,
          kind: 'pool',
          title: 'LoanPool Liquidity Deposit',
          amountUSD8,
          repaidDeductedUSD8: 0,
          netAmountUSD8: amountUSD8,
          counterpartyName: 'HanumPay LoanPool',
          counterpartyWallet: DEPLOYED_CONTRACTS.loanPool,
          erc8004Verified: true,
          proofHash: txHash,
          txHash,
          relayMode: 'qday-onchain-direct',
          timestamp: Date.now(),
          note: 'tUSD8 deposited directly into LoanPool.sol',
        };
        setReceipts((prev) => [receipt, ...prev]);

        await syncOnChain();
        return { ok: true, receipt };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'LoanPool deposit transaction failed.',
        };
      }
    },
    [syncOnChain, wallet.address, wallet.connected, wallet.tusd8Balance, wallet.tusd8Raw]
  );

  const withdrawFromPool = useCallback(
    async (amountUSD8: number) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your QDay MetaMask wallet first.' };
      }
      if (Number.isNaN(amountUSD8) || amountUSD8 <= 0) {
        return { ok: false, error: 'Enter a valid tUSD8 withdrawal amount.' };
      }
      if (userLenderSharesRaw === BigInt(0) || userLenderValueRaw === BigInt(0)) {
        return { ok: false, error: 'You do not have active LP shares in LoanPool.' };
      }

      try {
        const [{ parseUnits }, qday] = await Promise.all([import('viem'), import('./qday')]);
        const rawAmount = parseUnits(amountUSD8.toFixed(6), TUSD8_CONTRACT.decimals);
        if (rawAmount > userLenderValueRaw) {
          return {
            ok: false,
            error: `Requested withdrawal exceeds your LP balance (${fromTusd8Raw(userLenderValueRaw).toFixed(2)} tUSD8).`,
          };
        }
        if (amountUSD8 > poolAvailableUSD8) {
          return {
            ok: false,
            error: `Only ${poolAvailableUSD8.toFixed(2)} tUSD8 idle liquidity is currently available.`,
          };
        }

        let sharesToBurn = (rawAmount * userLenderSharesRaw) / userLenderValueRaw;
        if (sharesToBurn > userLenderSharesRaw || rawAmount === userLenderValueRaw) {
          sharesToBurn = userLenderSharesRaw;
        }
        if (sharesToBurn === BigInt(0)) {
          return { ok: false, error: 'Withdrawal amount rounds to zero shares.' };
        }

        const txHash = await qday.sendWalletWriteContract({
          account: wallet.address,
          address: DEPLOYED_CONTRACTS.loanPool,
          abi: qday.HANUMPAY_ABIS.loanPool,
          functionName: 'withdraw',
          args: [sharesToBurn],
        });

        const receipt: VerifiableReceipt = {
          id: `rcpt-pool-wd-${Date.now()}`,
          kind: 'pool',
          title: 'LoanPool Liquidity Withdrawal',
          amountUSD8,
          repaidDeductedUSD8: 0,
          netAmountUSD8: amountUSD8,
          counterpartyName: 'HanumPay LoanPool',
          counterpartyWallet: DEPLOYED_CONTRACTS.loanPool,
          erc8004Verified: true,
          proofHash: txHash,
          txHash,
          relayMode: 'qday-onchain-direct',
          timestamp: Date.now(),
          note: 'LP shares redeemed from LoanPool.sol',
        };
        setReceipts((prev) => [receipt, ...prev]);

        await syncOnChain();
        return { ok: true, receipt };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'LoanPool withdrawal failed.',
        };
      }
    },
    [
      poolAvailableUSD8,
      syncOnChain,
      userLenderSharesRaw,
      userLenderValueRaw,
      wallet.address,
      wallet.connected,
    ]
  );

  const payVerifiedSupplier = useCallback(
    async (supplierName: string, amountUSD8: number, itemNote: string) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your QDay MetaMask wallet first.' };
      }
      if (Number.isNaN(amountUSD8) || amountUSD8 <= 0) {
        return { ok: false, error: 'Enter a valid payment amount in tUSD8.' };
      }

      try {
        const [{ parseUnits }, qday] = await Promise.all([import('viem'), import('./qday')]);
        const rawAmount = parseUnits(amountUSD8.toFixed(6), TUSD8_CONTRACT.decimals);
        if (rawAmount > wallet.tusd8Raw) {
          return {
            ok: false,
            error: `Insufficient wallet tUSD8 balance (${wallet.tusd8Balance} tUSD8).`,
          };
        }

        // Live on-chain Confirmation of Payee check before signing token transfer
        const resolvedWallet = await qday.qDayPublicClient.readContract({
          address: DEPLOYED_CONTRACTS.erc8004,
          abi: qday.HANUMPAY_ABIS.erc8004,
          functionName: 'resolve',
          args: [supplierName.trim()],
        });

        if (!resolvedWallet || resolvedWallet === ZERO_ADDRESS) {
          return {
            ok: false,
            error: `ERC-8004 blocked transfer: "${supplierName}" is not active in ERC8004Registry.`,
          };
        }

        const txHash = await qday.sendWalletWriteContract({
          account: wallet.address,
          address: TUSD8_CONTRACT.address,
          abi: qday.ERC20_ABI,
          functionName: 'transfer',
          args: [resolvedWallet, rawAmount],
        });

        const payment: SupplierPayment = {
          id: `sup-${Date.now()}`,
          supplierName: supplierName.trim(),
          supplierWallet: resolvedWallet,
          amountUSD8,
          itemNote: itemNote.trim() || 'Wholesale inventory restock',
          copVerified: true,
          timestamp: Date.now(),
          txHash,
        };
        setSupplierPayments((prev) => [payment, ...prev]);

        const receipt: VerifiableReceipt = {
          id: `rcpt-${payment.id}`,
          kind: 'supplier',
          title: `Supplier Paid · ${payment.supplierName}`,
          amountUSD8,
          repaidDeductedUSD8: 0,
          netAmountUSD8: amountUSD8,
          counterpartyName: payment.supplierName,
          counterpartyWallet: resolvedWallet,
          erc8004Verified: true,
          proofHash: txHash,
          txHash,
          relayMode: 'qday-onchain-direct',
          timestamp: payment.timestamp,
          note: payment.itemNote,
        };
        setReceipts((prev) => [receipt, ...prev]);

        await refreshWalletBalances();
        return { ok: true, receipt };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Supplier tUSD8 transfer failed.',
        };
      }
    },
    [
      refreshWalletBalances,
      wallet.address,
      wallet.connected,
      wallet.tusd8Balance,
      wallet.tusd8Raw,
    ]
  );

  const connectQDayWallet = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      setWallet((prev) => ({
        ...prev,
        error: 'No Web3 wallet detected (install MetaMask or Rabby). Use /stage for interactive simulation.',
      }));
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error('No account selected.');
      }
      await addOrSwitchQDayNetwork(provider);
      const chainHex = (await provider.request({ method: 'eth_chainId' })) as string;
      const chainId = parseInt(chainHex, 16);
      const addr = accounts[0] as `0x${string}`;
      const qday = await import('./qday');
      const bal = await qday.fetchQDayBalances(addr).catch(() => ({
        tqday: '0.0000',
        tusd8: '0.00',
        tusd8Raw: BigInt(0),
      }));

      setWallet({
        connected: true,
        address: addr,
        chainId,
        tqdayBalance: bal.tqday,
        tusd8Balance: bal.tusd8,
        tusd8Raw: bal.tusd8Raw,
        isConnecting: false,
        error: null,
      });
    } catch (err) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to connect MetaMask to QDay Aevum Testnet.',
      }));
    }
  }, []);

  const switchToQDayNetwork = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      return { ok: false, error: 'No browser Web3 wallet detected.' };
    }
    try {
      await addOrSwitchQDayNetwork(provider);
      setWallet((prev) => ({ ...prev, chainId: QDAY_CHAIN_ID, error: null }));
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Could not switch to QDay Aevum network.',
      };
    }
  }, []);

  const approveLoanPoolAutoRepay = useCallback(
    async (amountUSD8 = 10000) => {
      if (!wallet.connected || !wallet.address) {
        return { ok: false, error: 'Connect your browser wallet first.' };
      }
      try {
        const [{ parseUnits }, qday] = await Promise.all([import('viem'), import('./qday')]);
        const rawAmount = parseUnits(amountUSD8.toFixed(6), TUSD8_CONTRACT.decimals);
        const txHash = await qday.sendWalletWriteContract({
          account: wallet.address,
          address: TUSD8_CONTRACT.address,
          abi: qday.ERC20_ABI,
          functionName: 'approve',
          args: [DEPLOYED_CONTRACTS.loanPool, rawAmount],
        });
        await refreshWalletBalances();
        return { ok: true, txHash };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Auto-repay permission transaction failed.',
        };
      }
    },
    [refreshWalletBalances, wallet.address, wallet.connected]
  );

  const disconnectWallet = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      chainId: null,
      tqdayBalance: '0.0000',
      tusd8Balance: '0.00',
      tusd8Raw: BigInt(0),
      isConnecting: false,
      error: null,
    });
  }, []);

  const value: HanumPayContextValue = {
    isSyncing,
    lastSyncedBlock,
    syncError,
    syncOnChain,
    activeShopAddress,
    activeShopName,
    isRegisteredShop,
    registerShopOnChain,
    identities,
    resolveERC8004,
    resolveERC8004OnChain,
    isERC8004Verified,
    registerIdentity,
    revokeIdentity,
    sales,
    shopStats,
    eligibility,
    onChainEligibility,
    recordSale,
    loans,
    proposedLoan,
    activeLoan,
    repaidLoans,
    proposalsToday,
    agentPaused,
    toggleAgentPaused,
    auditLogs,
    lastRelayMode,
    runAgentCycle,
    acceptLoanProposal,
    poolDepositedUSD8,
    poolLoanedUSD8,
    poolAvailableUSD8,
    poolUtilizationBps,
    poolFeesEarnedUSD8,
    poolActiveLoanCount,
    userLenderShares: fromTusd8Raw(userLenderSharesRaw),
    userLenderValueUSD8: fromTusd8Raw(userLenderValueRaw),
    tusd8AllowancePool: fromTusd8Raw(tusd8AllowancePoolRaw),
    poolEvents,
    depositToPool,
    withdrawFromPool,
    supplierPayments,
    payVerifiedSupplier,
    creditPassports,
    shopAvailableTusd8: wallet.connected ? fromTusd8Raw(wallet.tusd8Raw) : 0,
    receipts,
    activeReceipt,
    openReceipt,
    closeReceipt,
    wallet,
    connectQDayWallet,
    switchToQDayNetwork,
    approveLoanPoolAutoRepay,
    refreshWalletBalances,
    disconnectWallet,
  };

  return <HanumPayContext.Provider value={value}>{children}</HanumPayContext.Provider>;
}

export function useHanumPay() {
  const ctx = useContext(HanumPayContext);
  if (!ctx) {
    throw new Error('useHanumPay must be used within HanumPayProvider');
  }
  return ctx;
}
