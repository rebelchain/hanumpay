export type EntityCategory = 'shop' | 'agent' | 'lender' | 'supplier';

export interface ERC8004Identity {
  name: string;
  wallet: `0x${string}`;
  category: EntityCategory;
  metadata: {
    city?: string;
    businessType?: string;
    agentModel?: string;
    reputationScore: number;
    completedTxCount: number;
    validationMethod: string;
  };
  registeredAt: number;
  active: boolean;
}

export interface SaleRecord {
  id: string;
  shop: `0x${string}`;
  amountUSD8: number; // stored in human-readable tUSD8 for UI, converted via parseTusd8 for 6-dec math
  customerIdHash: `0x${string}`;
  customerLabel: string; // masked phone last 4 digits before hash
  timestamp: number;
  repaidDeductedUSD8: number;
  netToShopUSD8: number;
  eip712Signature: string;
  txHash: string;
}

export type LoanStatus = 'Proposed' | 'Active' | 'Repaid' | 'Expired';

export interface LoanRecord {
  id: number;
  shop: `0x${string}`;
  principalUSD8: number;
  flatFeeUSD8: number;
  repayPctBps: number; // e.g. 1000 = 10%
  totalRepaidUSD8: number;
  proposedAt: number;
  acceptedAt?: number;
  repaidAt?: number;
  expiresAt: number;
  status: LoanStatus;
  agentName: string;
  aiExplanation?: string;
}

export interface PoolEvent {
  id: string;
  type: 'Deposit' | 'Withdraw' | 'LoanDisbursed' | 'RepaymentReceived' | 'SupplierPaid';
  actor: string;
  amountUSD8: number;
  timestamp: number;
  txHash: string;
}

export interface CreditPassportRecord {
  loanId: number;
  shopName: string;
  shopAddress: `0x${string}`;
  principalUSD8: number;
  flatFeeUSD8: number;
  daysToRepay: number;
  newCreditLimitUSD8: number;
  txHash: string;
  timestamp: number;
}

export interface SupplierPayment {
  id: string;
  supplierName: string;
  supplierWallet: `0x${string}`;
  amountUSD8: number;
  itemNote: string;
  copVerified: boolean;
  timestamp: number;
  txHash: string;
}

export interface AgentAuditLog {
  id: string;
  event:
    | 'cycle_start'
    | 'shops_fetched'
    | 'shop_skipped'
    | 'proposal_submitted'
    | 'proposal_rejected'
    | 'cycle_end';
  shop?: string;
  principal?: string;
  flatFee?: string;
  reason?: string;
  txHash?: string;
  timestamp: number;
}

export interface VerifiableReceipt {
  id: string;
  kind: 'sale' | 'loan' | 'supplier';
  title: string;
  amountUSD8: number;
  repaidDeductedUSD8: number;
  netAmountUSD8: number;
  counterpartyName: string;
  counterpartyWallet: string;
  erc8004Verified: boolean;
  proofHash: string;
  txHash: string;
  relayMode: string;
  timestamp: number;
  note?: string;
}

export interface RedTeamResult {
  attackScenario: string;
  attackerPrompt: string;
  aiProposedPrincipal: number;
  aiProposedFeePct: number;
  aiProposedRepayPct: number;
  aiRationale: string;
  contractDecision: 'REJECTED' | 'ALLOWED';
  revertError: string;
  invariantChecks: {
    rule: string;
    limit: string;
    attempted: string;
    passed: boolean;
  }[];
}
