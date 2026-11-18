import {
  createPublicClient,
  defineChain,
  formatUnits,
  http,
  keccak256,
  parseAbi,
  parseUnits,
  toHex,
  type Log,
} from 'viem';
import {
  ACCEPT_LOAN_TYPES,
  addOrSwitchQDayNetwork,
  DEPLOYED_CONTRACTS,
  DEPLOYMENT_START_BLOCK,
  formatTusd8,
  fromTusd8Raw,
  getInjectedProvider,
  HANUMPAY_EIP712_DOMAIN,
  HANUMPAY_GITHUB_URL,
  HANUMPAY_GITBOOK_URL,
  QDAY_CHAIN_ID,
  QDAY_CHAIN_ID_HEX,
  QDAY_EVM_VERSION,
  QDAY_EXPLORER_URL,
  QDAY_FAUCET_URL,
  QDAY_MAX_LOGS_BLOCK_RANGE,
  QDAY_RPC_URL,
  RECORD_SALE_TYPES,
  shortenAddress,
  TUSD8_CONTRACT,
  type EthereumProvider,
} from './qday-constants';

export {
  ACCEPT_LOAN_TYPES,
  addOrSwitchQDayNetwork,
  DEPLOYED_CONTRACTS,
  DEPLOYMENT_START_BLOCK,
  formatTusd8,
  fromTusd8Raw,
  getInjectedProvider,
  HANUMPAY_EIP712_DOMAIN,
  HANUMPAY_GITHUB_URL,
  HANUMPAY_GITBOOK_URL,
  QDAY_CHAIN_ID,
  QDAY_CHAIN_ID_HEX,
  QDAY_EVM_VERSION,
  QDAY_EXPLORER_URL,
  QDAY_FAUCET_URL,
  QDAY_MAX_LOGS_BLOCK_RANGE,
  QDAY_RPC_URL,
  RECORD_SALE_TYPES,
  shortenAddress,
  TUSD8_CONTRACT,
  type EthereumProvider,
};

// Note: QDay Aevum RPC only supports HTTPS polling (No WebSocket RPC).
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
  transport: http(QDAY_RPC_URL, { timeout: 10000 }),
});

/**
 * QDay Aevum limits `eth_getLogs` to at most 1,000 blocks per request.
 * Paginates block ranges safely over HTTPS in small concurrent batches.
 */
export async function getLogsChunked(params: {
  address?: `0x${string}` | `0x${string}`[];
  fromBlock: bigint;
  toBlock: bigint;
  chunkSize?: bigint;
  maxWindows?: number;
}): Promise<Log[]> {
  if (params.toBlock < params.fromBlock) return [];

  const step =
    params.chunkSize && params.chunkSize <= QDAY_MAX_LOGS_BLOCK_RANGE
      ? params.chunkSize
      : QDAY_MAX_LOGS_BLOCK_RANGE;

  const ranges: Array<{ from: bigint; to: bigint }> = [];
  let cursor = params.fromBlock;

  while (cursor <= params.toBlock) {
    const end =
      cursor + step - BigInt(1) < params.toBlock
        ? cursor + step - BigInt(1)
        : params.toBlock;
    ranges.push({ from: cursor, to: end });
    cursor = end + BigInt(1);
  }

  const maxWin = params.maxWindows ?? 45;
  const boundedRanges = ranges.length > maxWin ? ranges.slice(-maxWin) : ranges;

  const logs: Log[] = [];
  const batchSize = 5;

  for (let i = 0; i < boundedRanges.length; i += batchSize) {
    const slice = boundedRanges.slice(i, i + batchSize);
    const results = await Promise.all(
      slice.map((r) =>
        qDayPublicClient
          .getLogs({
            address: params.address,
            fromBlock: r.from,
            toBlock: r.to,
          })
          .catch(() => [] as Log[])
      )
    );
    for (const batch of results) {
      logs.push(...batch);
    }
  }

  return logs;
}

export const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
]);

export function parseTusd8(amount: string): bigint {
  const cleaned = amount.trim();
  if (!cleaned || Number.isNaN(Number(cleaned))) return BigInt(0);
  return parseUnits(cleaned, TUSD8_CONTRACT.decimals);
}

export function hashCustomerId(rawId: string): `0x${string}` {
  return keccak256(toHex(rawId.trim().toLowerCase()));
}

export const HANUMPAY_ABIS = {
  erc8004: parseAbi([
    'function register(string name, string category, bytes metadata) external',
    'function revoke(string name) external',
    'function resolve(string name) external view returns (address)',
    'function isVerified(string name) external view returns (bool)',
    'function nameOf(address wallet) external view returns (string)',
    'function getIdentity(string name) external view returns ((address wallet, string name, string category, bytes metadata, uint256 registeredAt, bool active))',
    'event IdentityRegistered(bytes32 indexed nameHash, address indexed wallet, string name, string category)',
    'event IdentityRevoked(bytes32 indexed nameHash)',
  ]),
  salesLedger: parseAbi([
    'function registerShop(string name) external',
    'function recordSale(address shop, uint256 amountUSD8, bytes32 customerId, uint256 deadline, bytes signature) external',
    'function isRegisteredShop(address shop) external view returns (bool)',
    'function shopRegisteredAt(address shop) external view returns (uint256)',
    'function totalShops() external view returns (uint256)',
    'function getShops(uint256 offset, uint256 limit) external view returns (address[])',
    'function getShopStats(address shop) external view returns ((uint256 totalSales30d, uint256 uniqueCustomers30d, uint256 totalSalesAllTime, uint256 totalSaleCount, uint256 lastSaleTimestamp, bool hasMinimumHistory))',
    'event SaleRecorded(address indexed shop, uint256 amount, bytes32 indexed customerId, uint256 timestamp, uint256 saleIndex)',
  ]),
  loanPool: parseAbi([
    'function deposit(uint256 amount) external',
    'function withdraw(uint256 shares) external',
    'function acceptLoan(uint256 loanId, uint256 deadline, bytes signature) external',
    'function getLoan(uint256 loanId) external view returns ((uint256 id, address shop, uint256 principal, uint256 flatFee, uint256 repayPct, uint256 totalRepaid, uint256 proposedAt, uint256 acceptedAt, uint256 repaidAt, uint8 status))',
    'function getActiveLoan(address shop) external view returns (uint256)',
    'function getShopLoans(address shop) external view returns (uint256[])',
    'function getCooldownEnd(address shop) external view returns (uint256)',
    'function getPoolStats() external view returns ((uint256 totalDeposited, uint256 totalLoaned, uint256 totalAvailable, uint256 utilizationPct, uint256 totalFeeEarned, uint256 activeLoanCount))',
    'function getLenderBalance(address lender) external view returns (uint256 shares, uint256 tUSD8Value)',
    'event LoanProposed(uint256 indexed loanId, address indexed shop, uint256 principal, uint256 flatFee, uint256 repayPct)',
    'event LoanAccepted(uint256 indexed loanId, address indexed shop, uint256 timestamp)',
    'event LoanRepayment(uint256 indexed loanId, address indexed shop, uint256 amount, uint256 totalRepaid, uint256 remaining)',
    'event LoanRepaid(uint256 indexed loanId, address indexed shop, uint256 totalRepaid, uint256 daysToRepay)',
    'event CreditPassportMinted(uint256 indexed loanId, address indexed shop, uint256 principal, uint256 daysToRepay)',
    'event LenderDeposited(address indexed lender, uint256 amount, uint256 shares)',
    'event LenderWithdrew(address indexed lender, uint256 amount, uint256 shares)',
  ]),
  aiGuarantor: parseAbi([
    'function setAgentPaused(bool paused) external',
    'function proposeLoan(address shop) external returns (uint256)',
    'function checkEligibility(address shop) external view returns (bool eligible, string reason)',
    'function proposalsToday() external view returns (uint256)',
    'function shopPausedAgent(address shop) external view returns (bool)',
    'event ProposalSubmitted(address indexed shop, uint256 principal, uint256 flatFee, uint256 loanId, uint256 timestamp)',
    'event AgentAccessUpdated(address indexed shop, bool paused, uint256 timestamp)',
  ]),
};

export async function fetchQDayBalances(address: `0x${string}`): Promise<{
  tqday: string;
  tusd8: string;
  tusd8Raw: bigint;
}> {
  const [nativeRaw, tusd8Raw] = await Promise.all([
    qDayPublicClient.getBalance({ address }),
    qDayPublicClient.readContract({
      address: TUSD8_CONTRACT.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
  ]);
  return {
    tqday: Number(formatUnits(nativeRaw, 18)).toFixed(4),
    tusd8: formatTusd8(tusd8Raw, 2),
    tusd8Raw,
  };
}

export async function sendWalletWriteContract<
  TAbi extends readonly unknown[],
  TFunctionName extends string,
>(params: {
  account: `0x${string}`;
  address: `0x${string}`;
  abi: TAbi;
  functionName: TFunctionName;
  args: readonly unknown[];
}): Promise<`0x${string}`> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error('No browser Web3 wallet detected (install MetaMask or Rabby).');
  }

  await addOrSwitchQDayNetwork(provider);

  const { encodeFunctionData } = await import('viem');
  const data = encodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
  } as Parameters<typeof encodeFunctionData>[0]);

  const txHash = (await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: params.account,
        to: params.address,
        data,
      },
    ],
  })) as `0x${string}`;

  await qDayPublicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
  return txHash;
}
