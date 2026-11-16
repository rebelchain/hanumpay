'use client';

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  AgentAuditLog,
  CreditPassportRecord,
  EntityCategory,
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
import {
  addOrSwitchQDayNetwork,
  fetchQDayBalances,
  getInjectedProvider,
  hashCustomerId,
  QDAY_CHAIN_ID,
} from './qday';

const SHOP_ADDRESS = '0x8B3f92A1c04E5d18B0a24f4e71cD919F2a01Bu5R'
  .replace('Bu5R', '9C42') as `0x${string}`;
const AGENT_ADDRESS = '0x4E88004a91C2B10eF73291bC8A5D12904410A119' as `0x${string}`;
const SUPPLIER_1_ADDR = '0x71D029a8C1F4b3992eE40b6C1A82840F9002D51A' as `0x${string}`;
const SUPPLIER_2_ADDR = '0x39A112c0F8D29301e6b992A7C55210E38B77C910' as `0x${string}`;
const SUPPLIER_3_ADDR = '0x92F480b1E34C9102A7b881E04C6119D41200E821' as `0x${string}`;
const LENDER_ADDR = '0x55C901a3B72E8401F9a11023D84410A29910F4B2' as `0x${string}`;

function pseudoTxHash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return `0x${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.slice(0, 66);
}

const NOW = 1794600000000; // Deterministic baseline timestamp (Nov 2026)

const INITIAL_IDENTITIES: ERC8004Identity[] = [
  {
    name: 'Warung Bu Sri - Surabaya',
    wallet: SHOP_ADDRESS,
    category: 'shop',
    metadata: {
      city: 'Surabaya, Jawa Timur',
      businessType: 'Toko Sembako & Kebutuhan Harian',
      reputationScore: 96,
      completedTxCount: 148,
      validationMethod: 'Tanda Tangan Pemilik EIP-712 + Catatan QR 30 Hari',
    },
    registeredAt: NOW - 45 * 86400 * 1000,
    active: true,
  },
  {
    name: 'HanumPay-AI-Guarantor-v1',
    wallet: AGENT_ADDRESS,
    category: 'agent',
    metadata: {
      agentModel: 'AIGuarantor Otomatis + Audit Gemini',
      reputationScore: 99,
      completedTxCount: 412,
      validationMethod: 'Kartu Agen ERC-8004 + Batas Aturan Smart Contract',
    },
    registeredAt: NOW - 60 * 86400 * 1000,
    active: true,
  },
  {
    name: 'Pak Joko Distributor',
    wallet: SUPPLIER_1_ADDR,
    category: 'supplier',
    metadata: {
      city: 'Pasar Grosir Surabaya',
      businessType: 'Grosir Minyak Goreng, Beras & Gula',
      reputationScore: 98,
      completedTxCount: 289,
      validationMethod: 'Terverifikasi ERC-8004 Confirmation of Payee',
    },
    registeredAt: NOW - 52 * 86400 * 1000,
    active: true,
  },
  {
    name: 'Surya Rice Mill',
    wallet: SUPPLIER_2_ADDR,
    category: 'supplier',
    metadata: {
      city: 'Sidoarjo, Jawa Timur',
      businessType: 'Pemasok Beras & Biji-bijian Langsung',
      reputationScore: 95,
      completedTxCount: 164,
      validationMethod: 'Terverifikasi ERC-8004 Confirmation of Payee',
    },
    registeredAt: NOW - 40 * 86400 * 1000,
    active: true,
  },
  {
    name: 'Nusantara Beverage Supply',
    wallet: SUPPLIER_3_ADDR,
    category: 'supplier',
    metadata: {
      city: 'Gresik, Jawa Timur',
      businessType: 'Distributor Minuman Kemasan & Susu',
      reputationScore: 93,
      completedTxCount: 97,
      validationMethod: 'Terverifikasi ERC-8004 Confirmation of Payee',
    },
    registeredAt: NOW - 28 * 86400 * 1000,
    active: true,
  },
  {
    name: 'Aevum UMKM Liquidity Guild',
    wallet: LENDER_ADDR,
    category: 'lender',
    metadata: {
      city: 'Pool Dana QDay Testnet',
      businessType: 'Penyedia Dana Modal Kerja Komunitas (LP)',
      reputationScore: 97,
      completedTxCount: 61,
      validationMethod: 'Terverifikasi Bagian Pool LoanPool',
    },
    registeredAt: NOW - 58 * 86400 * 1000,
    active: true,
  },
];

const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale-108',
    shop: SHOP_ADDRESS,
    amountUSD8: 24.5,
    customerIdHash: hashCustomerId('0812-8841'),
    customerLabel: 'Pembeli #8841',
    timestamp: NOW - 2 * 3600 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 24.5,
    eip712Signature: '0x4b12e9...eip712',
    txHash: pseudoTxHash('sale-108'),
  },
  {
    id: 'sale-107',
    shop: SHOP_ADDRESS,
    amountUSD8: 18.0,
    customerIdHash: hashCustomerId('0856-3319'),
    customerLabel: 'Pembeli #3319',
    timestamp: NOW - 5 * 3600 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 18.0,
    eip712Signature: '0x99a4c1...eip712',
    txHash: pseudoTxHash('sale-107'),
  },
  {
    id: 'sale-106',
    shop: SHOP_ADDRESS,
    amountUSD8: 42.0,
    customerIdHash: hashCustomerId('0813-7720'),
    customerLabel: 'Pembeli #7720',
    timestamp: NOW - 1 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 42.0,
    eip712Signature: '0x11d0f8...eip712',
    txHash: pseudoTxHash('sale-106'),
  },
  {
    id: 'sale-105',
    shop: SHOP_ADDRESS,
    amountUSD8: 68.5,
    customerIdHash: hashCustomerId('0878-4490'),
    customerLabel: 'Pembeli #4490',
    timestamp: NOW - 2 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 68.5,
    eip712Signature: '0x6a22b1...eip712',
    txHash: pseudoTxHash('sale-105'),
  },
  {
    id: 'sale-104',
    shop: SHOP_ADDRESS,
    amountUSD8: 112.0,
    customerIdHash: hashCustomerId('0819-5502'),
    customerLabel: 'Pembeli #5502',
    timestamp: NOW - 4 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 112.0,
    eip712Signature: '0x88c1e3...eip712',
    txHash: pseudoTxHash('sale-104'),
  },
  {
    id: 'sale-103',
    shop: SHOP_ADDRESS,
    amountUSD8: 295.0,
    customerIdHash: hashCustomerId('0821-6108'),
    customerLabel: 'Pembeli #6108',
    timestamp: NOW - 9 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 295.0,
    eip712Signature: '0x3f71a2...eip712',
    txHash: pseudoTxHash('sale-103'),
  },
  {
    id: 'sale-102',
    shop: SHOP_ADDRESS,
    amountUSD8: 340.0,
    customerIdHash: hashCustomerId('0852-9014'),
    customerLabel: 'Pembeli #9014',
    timestamp: NOW - 16 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 340.0,
    eip712Signature: '0x2d09c4...eip712',
    txHash: pseudoTxHash('sale-102'),
  },
  {
    id: 'sale-101',
    shop: SHOP_ADDRESS,
    amountUSD8: 350.0,
    customerIdHash: hashCustomerId('0811-1204'),
    customerLabel: 'Pembeli #1204',
    timestamp: NOW - 23 * 86400 * 1000,
    repaidDeductedUSD8: 0,
    netToShopUSD8: 350.0,
    eip712Signature: '0x7e40b9...eip712',
    txHash: pseudoTxHash('sale-101'),
  },
];

// Initial proposal generated by HanumPay-AI-Guarantor-v1 based on $1,250.00 30d sales (10% = $125.00 tUSD8)
const INITIAL_LOANS: LoanRecord[] = [
  {
    id: 42,
    shop: SHOP_ADDRESS,
    principalUSD8: 125.0,
    flatFeeUSD8: 6.25,
    repayPctBps: 1000,
    totalRepaidUSD8: 0,
    proposedAt: NOW - 3 * 3600 * 1000,
    expiresAt: NOW + 45 * 3600 * 1000,
    status: 'Proposed',
    agentName: 'HanumPay-AI-Guarantor-v1',
    aiExplanation:
      'Terverifikasi 8 pembeli berbeda dalam 30 hari dengan total omzet 1,250.00 tUSD8. Batas pinjaman 10% dari omzet = 125.00 tUSD8 dengan biaya tetap 5% (6.25 tUSD8).',
  },
  {
    id: 19,
    shop: SHOP_ADDRESS,
    principalUSD8: 80.0,
    flatFeeUSD8: 4.0,
    repayPctBps: 1000,
    totalRepaidUSD8: 84.0,
    proposedAt: NOW - 62 * 86400 * 1000,
    acceptedAt: NOW - 61 * 86400 * 1000,
    repaidAt: NOW - 39 * 86400 * 1000,
    expiresAt: NOW - 60 * 86400 * 1000,
    status: 'Repaid',
    agentName: 'HanumPay-AI-Guarantor-v1',
  },
];

const INITIAL_PASSPORTS: CreditPassportRecord[] = [
  {
    loanId: 19,
    shopName: 'Warung Bu Sri - Surabaya',
    shopAddress: SHOP_ADDRESS,
    principalUSD8: 80.0,
    flatFeeUSD8: 4.0,
    daysToRepay: 22,
    newCreditLimitUSD8: 125.0,
    txHash: pseudoTxHash('passport-loan-19'),
    timestamp: NOW - 39 * 86400 * 1000,
  },
];

const INITIAL_POOL_EVENTS: PoolEvent[] = [
  {
    id: 'pe-1',
    type: 'Deposit',
    actor: 'Aevum UMKM Liquidity Guild',
    amountUSD8: 12400.0,
    timestamp: NOW - 40 * 86400 * 1000,
    txHash: pseudoTxHash('pe-1'),
  },
  {
    id: 'pe-2',
    type: 'LoanDisbursed',
    actor: 'Warung Bu Sri - Surabaya',
    amountUSD8: 80.0,
    timestamp: NOW - 61 * 86400 * 1000,
    txHash: pseudoTxHash('pe-2'),
  },
  {
    id: 'pe-3',
    type: 'RepaymentReceived',
    actor: 'Warung Bu Sri - Surabaya',
    amountUSD8: 84.0,
    timestamp: NOW - 39 * 86400 * 1000,
    txHash: pseudoTxHash('pe-3'),
  },
];

const INITIAL_AUDIT_LOGS: AgentAuditLog[] = [
  {
    id: 'log-1',
    event: 'cycle_start',
    timestamp: NOW - 3 * 3600 * 1000 - 4000,
  },
  {
    id: 'log-2',
    event: 'shops_fetched',
    reason: 'Mengambil data 3 toko terdaftar dari SalesLedger',
    timestamp: NOW - 3 * 3600 * 1000 - 3000,
  },
  {
    id: 'log-3',
    event: 'shop_skipped',
    shop: '0x2190...7A12 (Kios Kopi Mas Andi)',
    reason: 'Baru 3 pembeli berbeda. Syarat minimal 5 pembeli.',
    timestamp: NOW - 3 * 3600 * 1000 - 2000,
  },
  {
    id: 'log-4',
    event: 'proposal_submitted',
    shop: SHOP_ADDRESS,
    principal: '125000000',
    flatFee: '6250000',
    txHash: pseudoTxHash('proposal-42'),
    timestamp: NOW - 3 * 3600 * 1000,
  },
  {
    id: 'log-5',
    event: 'cycle_end',
    timestamp: NOW - 3 * 3600 * 1000 + 1200,
  },
];

interface WalletState {
  connected: boolean;
  address: `0x${string}` | null;
  chainId: number | null;
  tqdayBalance: string;
  tusd8Balance: string;
  isConnecting: boolean;
  error: string | null;
}

interface HanumPayContextValue {
  // Active shop & identities
  activeShopAddress: `0x${string}`;
  activeShopName: string;
  identities: ERC8004Identity[];
  resolveERC8004: (name: string) => `0x${string}` | null;
  isERC8004Verified: (name: string) => boolean;
  registerIdentity: (name: string, category: EntityCategory, city: string, businessType: string) => { ok: boolean; error?: string };

  // Sales & Credit
  sales: SaleRecord[];
  shopStats: ShopStatsSnapshot;
  eligibility: EligibilityCheckResult;
  recordSale: (
    amountUSD8: number,
    customerIdRaw: string,
    useWalletSign: boolean
  ) => Promise<{ ok: boolean; repaidAmount: number; receipt?: VerifiableReceipt; error?: string }>;

  // Loans & AI Agent
  loans: LoanRecord[];
  proposedLoan: LoanRecord | null;
  activeLoan: LoanRecord | null;
  repaidLoans: LoanRecord[];
  proposalsToday: number;
  agentPaused: boolean;
  setAgentPausedState: (paused: boolean) => void;
  toggleAgentPaused: () => void;
  auditLogs: AgentAuditLog[];
  lastRelayMode: string | null;
  runAgentCycle: (aiExplanation?: string) => Promise<{ ok: boolean; message: string }>;
  acceptLoanProposal: (
    loanId: number,
    useWalletSign: boolean
  ) => Promise<{ ok: boolean; receipt?: VerifiableReceipt; error?: string }>;
  rejectLoanProposal: (loanId: number) => void;

  // Lender Pool
  poolDepositedUSD8: number;
  poolLoanedUSD8: number;
  poolAvailableUSD8: number;
  poolUtilizationBps: number;
  poolFeesEarnedUSD8: number;
  userLenderShares: number;
  poolEvents: PoolEvent[];
  depositToPool: (amountUSD8: number) => { ok: boolean; error?: string };
  withdrawFromPool: (amountUSD8: number) => { ok: boolean; error?: string };

  // Supplier Payments & Credit Passport
  supplierPayments: SupplierPayment[];
  payVerifiedSupplier: (
    supplierName: string,
    amountUSD8: number,
    itemNote: string
  ) => { ok: boolean; receipt?: VerifiableReceipt; error?: string };
  creditPassports: CreditPassportRecord[];
  shopAvailableTusd8: number;

  // Verifiable QDay Receipts & Stage Reset
  receipts: VerifiableReceipt[];
  activeReceipt: VerifiableReceipt | null;
  openReceipt: (receipt: VerifiableReceipt) => void;
  closeReceipt: () => void;
  resetStageDemo: () => void;

  // Real QDay Wallet
  wallet: WalletState;
  connectQDayWallet: () => Promise<void>;
  refreshWalletBalances: () => Promise<void>;
  disconnectWallet: () => void;
}

const HanumPayContext = createContext<HanumPayContextValue | null>(null);

export function HanumPayProvider({ children }: { children: React.ReactNode }) {
  const [identities, setIdentities] = useState<ERC8004Identity[]>(INITIAL_IDENTITIES);
  const [sales, setSales] = useState<SaleRecord[]>(INITIAL_SALES);
  const [loans, setLoans] = useState<LoanRecord[]>(INITIAL_LOANS);
  const [proposalsToday, setProposalsToday] = useState<number>(1);
  const [poolDepositedUSD8, setPoolDepositedUSD8] = useState<number>(12400);
  const [poolLoanedUSD8, setPoolLoanedUSD8] = useState<number>(3640); // includes other SMEs in communal pool
  const [poolFeesEarnedUSD8, setPoolFeesEarnedUSD8] = useState<number>(482.5);
  const [userLenderShares, setUserLenderShares] = useState<number>(1500);
  const [poolEvents, setPoolEvents] = useState<PoolEvent[]>(INITIAL_POOL_EVENTS);
  const [creditPassports, setCreditPassports] = useState<CreditPassportRecord[]>(INITIAL_PASSPORTS);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [shopAvailableTusd8, setShopAvailableTusd8] = useState<number>(145.0);
  const [lastRelayMode, setLastRelayMode] = useState<string | null>(null);
  const [agentPaused, setAgentPaused] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<VerifiableReceipt[]>(() =>
    INITIAL_SALES.slice(0, 3).map((s) => ({
      id: `rcpt-${s.id}`,
      kind: 'sale',
      title: `Penjualan QR · ${s.customerLabel}`,
      amountUSD8: s.amountUSD8,
      repaidDeductedUSD8: s.repaidDeductedUSD8,
      netAmountUSD8: s.netToShopUSD8,
      counterpartyName: 'Warung Bu Sri - Surabaya',
      counterpartyWallet: s.shop,
      erc8004Verified: true,
      proofHash: s.customerIdHash,
      txHash: s.txHash,
      relayMode: 'verified-demo-relay',
      timestamp: s.timestamp,
      note: 'Struk Penjualan QR Bebas Gas (EIP-712)',
    }))
  );
  const [activeReceipt, setActiveReceipt] = useState<VerifiableReceipt | null>(null);

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    tqdayBalance: '0.0000',
    tusd8Balance: '0.00',
    isConnecting: false,
    error: null,
  });

  const activeShopName = 'Warung Bu Sri - Surabaya';

  const resolveERC8004 = useCallback(
    (name: string): `0x${string}` | null => {
      const match = identities.find(
        (i) => i.name.toLowerCase() === name.trim().toLowerCase() && i.active
      );
      return match ? match.wallet : null;
    },
    [identities]
  );

  const isERC8004Verified = useCallback(
    (name: string): boolean => {
      return identities.some(
        (i) => i.name.toLowerCase() === name.trim().toLowerCase() && i.active
      );
    },
    [identities]
  );

  const registerIdentity = useCallback(
    (name: string, category: EntityCategory, city: string, businessType: string) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 64) {
        return { ok: false, error: 'Nama identitas harus antara 1 sampai 64 karakter.' };
      }
      if (identities.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
        return { ok: false, error: `Nama "${trimmed}" sudah terdaftar di ERC8004Registry.` };
      }
      const newWallet = (wallet.address ??
        (`0x${pseudoTxHash(trimmed).slice(2, 42)}`)) as `0x${string}`;
      const newIdentity: ERC8004Identity = {
        name: trimmed,
        wallet: newWallet,
        category,
        metadata: {
          city: city || 'Jaringan QDay Aevum',
          businessType: businessType || 'Usaha Terdaftar',
          reputationScore: 90,
          completedTxCount: 1,
          validationMethod: 'Terdaftar On-Chain ERC-8004',
        },
        registeredAt: Date.now(),
        active: true,
      };
      setIdentities((prev) => [newIdentity, ...prev]);
      return { ok: true };
    },
    [identities, wallet.address]
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

  const poolAvailableUSD8 = Math.max(0, poolDepositedUSD8 - poolLoanedUSD8);
  const poolUtilizationBps =
    poolDepositedUSD8 > 0 ? Math.round((poolLoanedUSD8 / poolDepositedUSD8) * 10000) : 0;

  const shopStats = useMemo<ShopStatsSnapshot>(() => {
    const totalSales30dUSD8 = sales.reduce((acc, s) => acc + s.amountUSD8, 0);
    const uniqueSet = new Set(sales.map((s) => s.customerIdHash));
    return {
      totalSales30dUSD8,
      uniqueCustomers30d: uniqueSet.size,
      salesHistoryDays: 34, // Warung Bu Sri has 34 days of history
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

  const setAgentPausedState = useCallback(
    (paused: boolean) => {
      setAgentPaused(paused);
      setAuditLogs((prev) => [
        {
          id: `log-pause-${Date.now()}`,
          event: paused ? 'shop_skipped' : 'cycle_start',
          shop: SHOP_ADDRESS,
          reason: paused
            ? 'Pemilik toko menjeda akses Penjaga AI (AIGuarantor.setAgentPaused(true))'
            : 'Pemilik toko mengaktifkan lagi Penjaga AI (AIGuarantor.setAgentPaused(false))',
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    },
    []
  );

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
    async (amountUSD8: number, customerIdRaw: string, useWalletSign: boolean) => {
      if (Number.isNaN(amountUSD8) || amountUSD8 < 0.1 || amountUSD8 > 500) {
        return {
          ok: false,
          repaidAmount: 0,
          error: 'Nominal penjualan harus antara 0.10 tUSD8 sampai 500.00 tUSD8.',
        };
      }
      if (!customerIdRaw || customerIdRaw.trim().length < 4) {
        return {
          ok: false,
          repaidAmount: 0,
          error: 'Nomor HP / ID pembeli minimal 4 karakter (diacak langsung di perangkat).',
        };
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const shopSigner =
        useWalletSign && wallet.connected && wallet.address ? wallet.address : SHOP_ADDRESS;
      let sig = `0x${pseudoTxHash(`eip712-${Date.now()}-${amountUSD8}`).slice(2, 20)}...eip712`;
      if (useWalletSign && wallet.connected && wallet.address) {
        const provider = getInjectedProvider();
        if (provider) {
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
                verifyingContract: '0x7A90000000000000000000000000000000008004',
              },
              message: {
                shop: wallet.address,
                amountUSD8: Math.round(amountUSD8 * 1_000_000).toString(),
                customerId: hashCustomerId(customerIdRaw),
                deadline,
              },
            };
            const result = await provider.request({
              method: 'eth_signTypedData_v4',
              params: [wallet.address, JSON.stringify(typedData)],
            });
            sig = String(result);
          } catch {
            return { ok: false, repaidAmount: 0, error: 'Tanda tangan EIP-712 dibatalkan di dompet.' };
          }
        }
      }

      const customerIdHash = hashCustomerId(customerIdRaw);

      // Call Next.js Relayer API (/api/relay/record-sale)
      let relayedTxHash: string | null = null;
      try {
        const relayRes = await fetch('/api/relay/record-sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop: shopSigner,
            amountUSD8,
            customerIdHash,
            deadline,
            signature: sig,
          }),
        });
        const relayData = (await relayRes.json()) as { mode?: string; txHash?: string; error?: string };
        if (!relayRes.ok) {
          return { ok: false, repaidAmount: 0, error: relayData.error ?? 'Verifikasi relayer gagal.' };
        }
        if (relayData.mode) setLastRelayMode(relayData.mode);
        if (relayData.txHash) relayedTxHash = relayData.txHash;
      } catch {
        setLastRelayMode('verified-demo-relay');
      }

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
          setPoolFeesEarnedUSD8((prev) => prev + repaidDeducted * 0.05);
          setPoolEvents((prev) => [
            {
              id: `pe-${Date.now()}`,
              type: 'RepaymentReceived',
              actor: activeShopName,
              amountUSD8: repaidDeducted,
              timestamp: Date.now(),
              txHash: pseudoTxHash(`repay-${Date.now()}`),
            },
            ...prev,
          ]);
        }

        if (isNowRepaid) {
          const nextLimit = Math.min(
            CONTRACT_LIMITS.MAX_LOAN_USD8,
            Math.round(((shopStats.totalSales30dUSD8 + amountUSD8) * 0.1) * 100) / 100
          );
          setCreditPassports((prev) => [
            {
              loanId: activeLoan.id,
              shopName: activeShopName,
              shopAddress: SHOP_ADDRESS,
              principalUSD8: activeLoan.principalUSD8,
              flatFeeUSD8: activeLoan.flatFeeUSD8,
              daysToRepay: Math.max(
                1,
                Math.round(
                  (Date.now() - (activeLoan.acceptedAt ?? Date.now() - 86400000)) / 86400000
                )
              ),
              newCreditLimitUSD8: nextLimit,
              txHash: pseudoTxHash(`passport-${activeLoan.id}`),
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }
      }

      const netToShop = Math.round((amountUSD8 - repaidDeducted) * 100) / 100;
      const resolvedTx = relayedTxHash ?? pseudoTxHash(`sale-${Date.now()}-${amountUSD8}`);
      const newSale: SaleRecord = {
        id: `sale-${Date.now()}`,
        shop: SHOP_ADDRESS,
        amountUSD8,
        customerIdHash,
        customerLabel: `Pembeli #${customerIdRaw.trim().slice(-4)}`,
        timestamp: Date.now(),
        repaidDeductedUSD8: repaidDeducted,
        netToShopUSD8: netToShop,
        eip712Signature: sig,
        txHash: resolvedTx,
      };

      const newReceipt: VerifiableReceipt = {
        id: `rcpt-${newSale.id}`,
        kind: 'sale',
        title: `Penjualan QR · ${newSale.customerLabel}`,
        amountUSD8,
        repaidDeductedUSD8: repaidDeducted,
        netAmountUSD8: netToShop,
        counterpartyName: activeShopName,
        counterpartyWallet: shopSigner,
        erc8004Verified: true,
        proofHash: customerIdHash,
        txHash: resolvedTx,
        relayMode: relayedTxHash ? 'qday-onchain-relay' : 'verified-demo-relay',
        timestamp: newSale.timestamp,
        note:
          repaidDeducted > 0
            ? `Potongan cicilan otomatis 10% (${repaidDeducted.toFixed(2)} tUSD8) masuk ke LoanPool`
            : 'Struk QR pelanggan bebas gas tercatat',
      };

      setSales((prev) => [newSale, ...prev]);
      setReceipts((prev) => [newReceipt, ...prev]);
      setShopAvailableTusd8((prev) => Math.round((prev + netToShop) * 100) / 100);
      return { ok: true, repaidAmount: repaidDeducted, receipt: newReceipt };
    },
    [activeLoan, activeShopName, shopStats.totalSales30dUSD8, wallet.address, wallet.connected]
  );

  const runAgentCycle = useCallback(
    async (aiExplanation?: string) => {
      const now = Date.now();
      await fetch('/api/agent/cron', { method: 'POST' }).catch(() => null);

      if (!eligibility.eligible) {
        const skipLog: AgentAuditLog = {
          id: `log-${now}`,
          event: 'shop_skipped',
          shop: SHOP_ADDRESS,
          reason: eligibility.reason,
          timestamp: now,
        };
        setAuditLogs((prev) => [skipLog, ...prev]);
        return { ok: false, message: `Agen AI melewati Warung Bu Sri: ${eligibility.reason}` };
      }

      const nextId = Math.max(42, ...loans.map((l) => l.id)) + 1;
      const newProposal: LoanRecord = {
        id: nextId,
        shop: SHOP_ADDRESS,
        principalUSD8: eligibility.proposedPrincipalUSD8,
        flatFeeUSD8: eligibility.proposedFlatFeeUSD8,
        repayPctBps: eligibility.proposedRepayPctBps,
        totalRepaidUSD8: 0,
        proposedAt: now,
        expiresAt: now + 48 * 3600 * 1000,
        status: 'Proposed',
        agentName: 'HanumPay-AI-Guarantor-v1',
        aiExplanation:
          aiExplanation ||
          `Pengecekan on-chain lolos (${shopStats.uniqueCustomers30d} pembeli unik, omzet 30 hari $${shopStats.totalSales30dUSD8.toFixed(2)}). Smart contract menghitung batas pokok $${eligibility.proposedPrincipalUSD8.toFixed(2)} tUSD8.`,
      };

      const txHash = pseudoTxHash(`prop-${nextId}`);
      setLoans((prev) => [newProposal, ...prev]);
      setProposalsToday((p) => p + 1);
      setAuditLogs((prev) => [
        {
          id: `log-end-${now}`,
          event: 'cycle_end',
          timestamp: now + 500,
        },
        {
          id: `log-sub-${now}`,
          event: 'proposal_submitted',
          shop: SHOP_ADDRESS,
          principal: String(Math.round(eligibility.proposedPrincipalUSD8 * 1_000_000)),
          flatFee: String(Math.round(eligibility.proposedFlatFeeUSD8 * 1_000_000)),
          txHash,
          timestamp: now,
        },
        ...prev,
      ]);

      return {
        ok: true,
        message: `Penawaran #${nextId} berhasil dikirim on-chain senilai $${eligibility.proposedPrincipalUSD8.toFixed(2)} tUSD8.`,
      };
    },
    [eligibility, loans, shopStats.totalSales30dUSD8, shopStats.uniqueCustomers30d]
  );

  const acceptLoanProposal = useCallback(
    async (loanId: number, useWalletSign: boolean) => {
      const target = loans.find((l) => l.id === loanId && l.status === 'Proposed');
      if (!target) {
        return { ok: false, error: 'Penawaran modal tidak ditemukan atau sudah diambil.' };
      }
      if (!isERC8004Verified(target.agentName)) {
        return {
          ok: false,
          error: 'Verifikasi ERC-8004 gagal: identitas Penjaga AI sedang tidak aktif.',
        };
      }
      if (target.principalUSD8 > poolAvailableUSD8) {
        return { ok: false, error: 'Saldo dana di LoanPool saat ini tidak mencukupi.' };
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const shopSigner =
        useWalletSign && wallet.connected && wallet.address ? wallet.address : SHOP_ADDRESS;
      let sig = `0x${pseudoTxHash(`accept-${loanId}`).slice(2, 20)}...eip712`;

      if (useWalletSign && wallet.connected && wallet.address) {
        const provider = getInjectedProvider();
        if (provider) {
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
                verifyingContract: '0x7A90000000000000000000000000000000009001',
              },
              message: {
                loanId: String(target.id),
                shop: wallet.address,
                principalUSD8: String(Math.round(target.principalUSD8 * 1_000_000)),
                flatFeeUSD8: String(Math.round(target.flatFeeUSD8 * 1_000_000)),
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
            return { ok: false, error: 'Tanda tangan persetujuan modal EIP-712 dibatalkan di dompet.' };
          }
        }
      }

      try {
        const relayRes = await fetch('/api/relay/accept-loan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanId: target.id,
            shop: shopSigner,
            principalUSD8: target.principalUSD8,
            flatFeeUSD8: target.flatFeeUSD8,
            repayPctBps: target.repayPctBps,
            deadline,
            signature: sig,
          }),
        });
        const relayData = (await relayRes.json()) as { mode?: string; error?: string };
        if (!relayRes.ok) {
          return { ok: false, error: relayData.error ?? 'Verifikasi relayer pinjaman gagal.' };
        }
        if (relayData.mode) setLastRelayMode(relayData.mode);
      } catch {
        setLastRelayMode('verified-demo-relay');
      }

      const disbursedTx = pseudoTxHash(`accept-${loanId}`);
      setLoans((prev) =>
        prev.map((l) =>
          l.id === loanId ? { ...l, status: 'Active', acceptedAt: Date.now() } : l
        )
      );
      setPoolLoanedUSD8((prev) => prev + target.principalUSD8);
      setShopAvailableTusd8((prev) => Math.round((prev + target.principalUSD8) * 100) / 100);
      setPoolEvents((prev) => [
        {
          id: `pe-${Date.now()}`,
          type: 'LoanDisbursed',
          actor: activeShopName,
          amountUSD8: target.principalUSD8,
          timestamp: Date.now(),
          txHash: disbursedTx,
        },
        ...prev,
      ]);

      const loanReceipt: VerifiableReceipt = {
        id: `rcpt-loan-${loanId}-${Date.now()}`,
        kind: 'loan',
        title: `Modal Kerja #${loanId} Cair`,
        amountUSD8: target.principalUSD8,
        repaidDeductedUSD8: 0,
        netAmountUSD8: target.principalUSD8,
        counterpartyName: target.agentName,
        counterpartyWallet: AGENT_ADDRESS,
        erc8004Verified: true,
        proofHash: sig,
        txHash: disbursedTx,
        relayMode: 'verified-demo-relay',
        timestamp: Date.now(),
        note: `Biaya tetap 5% (${target.flatFeeUSD8.toFixed(2)} tUSD8) · Cicilan otomatis 10% tiap laku`,
      };
      setReceipts((prev) => [loanReceipt, ...prev]);

      return { ok: true, receipt: loanReceipt };
    },
    [activeShopName, isERC8004Verified, loans, poolAvailableUSD8, wallet.address, wallet.connected]
  );

  const rejectLoanProposal = useCallback((loanId: number) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId && l.status === 'Proposed' ? { ...l, status: 'Expired' } : l))
    );
    setAuditLogs((prev) => [
      {
        id: `log-rej-${Date.now()}`,
        event: 'proposal_rejected',
        shop: SHOP_ADDRESS,
        reason: `Pemilik toko menolak Penawaran #${loanId} saat konfirmasi penerima`,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  }, []);

  const depositToPool = useCallback(
    (amountUSD8: number) => {
      if (Number.isNaN(amountUSD8) || amountUSD8 < 1) {
        return { ok: false, error: 'Setoran minimal adalah 1.00 tUSD8.' };
      }
      setPoolDepositedUSD8((prev) => prev + amountUSD8);
      setUserLenderShares((prev) => prev + amountUSD8);
      setPoolEvents((prev) => [
        {
          id: `pe-dep-${Date.now()}`,
          type: 'Deposit',
          actor: wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'LP Terhubung',
          amountUSD8,
          timestamp: Date.now(),
          txHash: pseudoTxHash(`dep-${Date.now()}`),
        },
        ...prev,
      ]);
      return { ok: true };
    },
    [wallet.address]
  );

  const withdrawFromPool = useCallback(
    (amountUSD8: number) => {
      if (Number.isNaN(amountUSD8) || amountUSD8 <= 0) {
        return { ok: false, error: 'Masukkan jumlah penarikan yang benar.' };
      }
      if (amountUSD8 > userLenderShares) {
        return { ok: false, error: 'Jumlah penarikan melebihi saldo simpanan Anda di pool.' };
      }
      if (amountUSD8 > poolAvailableUSD8) {
        return {
          ok: false,
          error: `Dana menganggur di pool saat ini hanya $${poolAvailableUSD8.toFixed(2)} tUSD8.`,
        };
      }
      setPoolDepositedUSD8((prev) => prev - amountUSD8);
      setUserLenderShares((prev) => prev - amountUSD8);
      setPoolEvents((prev) => [
        {
          id: `pe-wd-${Date.now()}`,
          type: 'Withdraw',
          actor: wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'LP Terhubung',
          amountUSD8,
          timestamp: Date.now(),
          txHash: pseudoTxHash(`wd-${Date.now()}`),
        },
        ...prev,
      ]);
      return { ok: true };
    },
    [poolAvailableUSD8, userLenderShares, wallet.address]
  );

  const payVerifiedSupplier = useCallback(
    (supplierName: string, amountUSD8: number, itemNote: string) => {
      const resolvedWallet = resolveERC8004(supplierName);
      if (!resolvedWallet) {
        return {
          ok: false,
          error: 'Konfirmasi Penerima ditolak: pemasok belum terdaftar resmi di ERC8004Registry.',
        };
      }
      if (Number.isNaN(amountUSD8) || amountUSD8 <= 0) {
        return { ok: false, error: 'Masukkan nominal pembayaran dalam tUSD8 yang benar.' };
      }
      if (amountUSD8 > shopAvailableTusd8) {
        return {
          ok: false,
          error: `Saldo tUSD8 toko belum cukup (tersedia $${shopAvailableTusd8.toFixed(2)} tUSD8). Cairkan modal kerja atau catat penjualan dulu.`,
        };
      }

      const payment: SupplierPayment = {
        id: `sup-${Date.now()}`,
        supplierName,
        supplierWallet: resolvedWallet,
        amountUSD8,
        itemNote: itemNote.trim() || 'Belanja kulakan stok warung',
        copVerified: true,
        timestamp: Date.now(),
        txHash: pseudoTxHash(`sup-${supplierName}-${Date.now()}`),
      };

      setShopAvailableTusd8((prev) => Math.round((prev - amountUSD8) * 100) / 100);
      setSupplierPayments((prev) => [payment, ...prev]);
      setPoolEvents((prev) => [
        {
          id: `pe-sup-${Date.now()}`,
          type: 'SupplierPaid',
          actor: `${activeShopName} -> ${supplierName}`,
          amountUSD8,
          timestamp: Date.now(),
          txHash: payment.txHash,
        },
        ...prev,
      ]);

      const supReceipt: VerifiableReceipt = {
        id: `rcpt-${payment.id}`,
        kind: 'supplier',
        title: `Bayar Pemasok · ${supplierName}`,
        amountUSD8,
        repaidDeductedUSD8: 0,
        netAmountUSD8: amountUSD8,
        counterpartyName: supplierName,
        counterpartyWallet: resolvedWallet,
        erc8004Verified: true,
        proofHash: pseudoTxHash(`cop-${supplierName}-${amountUSD8}`),
        txHash: payment.txHash,
        relayMode: 'erc8004-cop-settlement',
        timestamp: payment.timestamp,
        note: payment.itemNote,
      };
      setReceipts((prev) => [supReceipt, ...prev]);
      return { ok: true, receipt: supReceipt };
    },
    [activeShopName, resolveERC8004, shopAvailableTusd8]
  );

  const resetStageDemo = useCallback(() => {
    setIdentities(INITIAL_IDENTITIES);
    setSales(INITIAL_SALES);
    setLoans(INITIAL_LOANS);
    setProposalsToday(1);
    setPoolDepositedUSD8(12400);
    setPoolLoanedUSD8(3640);
    setPoolFeesEarnedUSD8(482.5);
    setUserLenderShares(1500);
    setPoolEvents(INITIAL_POOL_EVENTS);
    setCreditPassports(INITIAL_PASSPORTS);
    setSupplierPayments([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setShopAvailableTusd8(145.0);
    setAgentPaused(false);
    setActiveReceipt(null);
  }, []);

  const refreshWalletBalances = useCallback(async () => {
    if (!wallet.address) return;
    try {
      const bal = await fetchQDayBalances(wallet.address);
      setWallet((prev) => ({
        ...prev,
        tqdayBalance: bal.tqday,
        tusd8Balance: bal.tusd8,
        error: null,
      }));
    } catch {
      setWallet((prev) => ({
        ...prev,
        error: 'Jaringan QDay RPC sedang sibuk. Coba muat ulang sebentar lagi.',
      }));
    }
  }, [wallet.address]);

  const connectQDayWallet = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      setWallet((prev) => ({
        ...prev,
        error: 'Dompet Web3 tidak terdeteksi (pasang MetaMask). Mode demo tetap berjalan lancar.',
      }));
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error('Tidak ada akun yang dipilih');
      }
      await addOrSwitchQDayNetwork(provider);
      const chainHex = (await provider.request({ method: 'eth_chainId' })) as string;
      const chainId = parseInt(chainHex, 16);
      const addr = accounts[0] as `0x${string}`;
      const bal = await fetchQDayBalances(addr).catch(() => ({
        tqday: '0.0000',
        tusd8: '0.00',
      }));

      setWallet({
        connected: true,
        address: addr,
        chainId,
        tqdayBalance: bal.tqday,
        tusd8Balance: bal.tusd8,
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
            : 'Gagal menghubungkan MetaMask ke QDay Aevum Testnet.',
      }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      chainId: null,
      tqdayBalance: '0.0000',
      tusd8Balance: '0.00',
      isConnecting: false,
      error: null,
    });
  }, []);

  const value: HanumPayContextValue = {
    activeShopAddress: SHOP_ADDRESS,
    activeShopName,
    identities,
    resolveERC8004,
    isERC8004Verified,
    registerIdentity,
    sales,
    shopStats,
    eligibility,
    recordSale,
    loans,
    proposedLoan,
    activeLoan,
    repaidLoans,
    proposalsToday,
    agentPaused,
    setAgentPausedState,
    toggleAgentPaused,
    auditLogs,
    lastRelayMode,
    runAgentCycle,
    acceptLoanProposal,
    rejectLoanProposal,
    poolDepositedUSD8,
    poolLoanedUSD8,
    poolAvailableUSD8,
    poolUtilizationBps,
    poolFeesEarnedUSD8,
    userLenderShares,
    poolEvents,
    depositToPool,
    withdrawFromPool,
    supplierPayments,
    payVerifiedSupplier,
    creditPassports,
    shopAvailableTusd8,
    receipts,
    activeReceipt,
    openReceipt,
    closeReceipt,
    resetStageDemo,
    wallet,
    connectQDayWallet,
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
