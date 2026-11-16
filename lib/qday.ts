import {
  createPublicClient,
  defineChain,
  formatUnits,
  http,
  keccak256,
  parseAbi,
  parseUnits,
  toHex,
} from 'viem';

export const QDAY_CHAIN_ID = 44005;
export const QDAY_RPC_URL = 'https://rpc-test.qday.info';
export const QDAY_WS_URL = 'wss://rpc-test.qday.info';
export const QDAY_EXPLORER_URL = 'https://explorer-test.qday.info';
export const QDAY_FAUCET_URL = 'https://faucet.qday.info/en';

// Official tUSD8 Stablecoin Contract from Aevum Builder Challenge #1 Starter Kit (6 decimals)
export const TUSD8_CONTRACT = {
  address: '0x456569838f1d43009A91ebA4263147Afd7233483' as `0x${string}`,
  decimals: 6,
  symbol: 'tUSD8',
  chainId: QDAY_CHAIN_ID,
};

export const qDayAevumTestnet = defineChain({
  id: QDAY_CHAIN_ID,
  name: 'QDay Aevum Testnet',
  nativeCurrency: {
    name: 'tQDAY',
    symbol: 'tQDAY',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [QDAY_RPC_URL],
      webSocket: [QDAY_WS_URL],
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
  transport: http(QDAY_RPC_URL, { timeout: 8000 }),
});

const ERC20_BALANCE_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
]);

export function parseTusd8(amount: string): bigint {
  const cleaned = amount.trim();
  if (!cleaned || Number.isNaN(Number(cleaned))) return BigInt(0);
  return parseUnits(cleaned, TUSD8_CONTRACT.decimals);
}

export function formatTusd8(raw: bigint, decimals = 2): string {
  const num = Number(formatUnits(raw, TUSD8_CONTRACT.decimals));
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function hashCustomerId(rawId: string): `0x${string}` {
  return keccak256(toHex(rawId.trim().toLowerCase()));
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// EIP-712 typed data definitions matching CONTRACTS_SPEC.md
export const HANUMPAY_EIP712_DOMAIN = {
  name: 'HanumPaySalesLedger',
  version: '1',
  chainId: QDAY_CHAIN_ID,
  verifyingContract: '0x7A90000000000000000000000000000000008004' as `0x${string}`,
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

export const DEPLOYED_CONTRACTS = {
  erc8004: (process.env.NEXT_PUBLIC_ERC8004_ADDRESS || '') as `0x${string}` | '',
  salesLedger: (process.env.NEXT_PUBLIC_SALES_LEDGER_ADDRESS || '') as `0x${string}` | '',
  loanPool: (process.env.NEXT_PUBLIC_LOAN_POOL_ADDRESS || '') as `0x${string}` | '',
  aiGuarantor: (process.env.NEXT_PUBLIC_AI_GUARANTOR_ADDRESS || '') as `0x${string}` | '',
};

export const HANUMPAY_ABIS = {
  salesLedger: parseAbi([
    'function recordSale(address shop, uint256 amountUSD8, bytes32 customerId, uint256 deadline, bytes signature) external',
    'function totalShops() external view returns (uint256)',
    'function getShops(uint256 offset, uint256 limit) external view returns (address[] memory)',
  ]),
  loanPool: parseAbi([
    'function acceptLoan(uint256 loanId, uint256 deadline, bytes signature) external',
  ]),
  aiGuarantor: parseAbi([
    'function proposeLoan(address shop) external returns (uint256)',
    'function checkEligibility(address shop) external view returns (bool eligible, string memory reason)',
    'function proposalsToday() external view returns (uint256)',
  ]),
};

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { ethereum?: EthereumProvider };
  return win.ethereum ?? null;
}

export async function addOrSwitchQDayNetwork(provider: EthereumProvider): Promise<void> {
  const chainIdHex = `0x${QDAY_CHAIN_ID.toString(16)}`; // 0xabe5
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902 || code === -32603 || true) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: 'QDay Aevum Testnet',
            nativeCurrency: {
              name: 'tQDAY',
              symbol: 'tQDAY',
              decimals: 18,
            },
            rpcUrls: [QDAY_RPC_URL],
            blockExplorerUrls: [QDAY_EXPLORER_URL],
          },
        ],
      });
    }
  }
}

export async function fetchQDayBalances(address: `0x${string}`): Promise<{
  tqday: string;
  tusd8: string;
}> {
  const [nativeRaw, tusd8Raw] = await Promise.all([
    qDayPublicClient.getBalance({ address }),
    qDayPublicClient.readContract({
      address: TUSD8_CONTRACT.address,
      abi: ERC20_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
  ]);
  return {
    tqday: Number(formatUnits(nativeRaw, 18)).toFixed(4),
    tusd8: formatTusd8(tusd8Raw, 2),
  };
}
