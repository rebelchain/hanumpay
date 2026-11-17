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
} from "viem";

export const QDAY_CHAIN_ID = 44005;
export const QDAY_CHAIN_ID_HEX = "0xABE5";
export const QDAY_RPC_URL = "https://rpc-test.qday.info";
export const QDAY_EXPLORER_URL = "https://explorer-test.qday.info";
export const QDAY_FAUCET_URL = "https://faucet.qday.info/en";
export const QDAY_EVM_VERSION = "shanghai";
export const QDAY_MAX_LOGS_BLOCK_RANGE = BigInt(1000);
export const HANUMPAY_GITBOOK_URL = "https://rebelxyz.gitbook.io/hanumpay";
export const HANUMPAY_GITHUB_URL = "https://github.com/rebelchain/hanumpay";

// Official tUSD8 Stablecoin Contract from Aevum Builder Challenge #1 Starter Kit (6 decimals)
export const TUSD8_CONTRACT = {
  address: "0x456569838f1d43009A91ebA4263147Afd7233483" as `0x${string}`,
  decimals: 6,
  symbol: "tUSD8",
  chainId: QDAY_CHAIN_ID,
};

// Note: QDay Aevum RPC only supports HTTPS polling (No WebSocket RPC).
export const qDayAevumTestnet = defineChain({
  id: QDAY_CHAIN_ID,
  name: "QDay Aevum",
  nativeCurrency: {
    name: "tQDAY",
    symbol: "tQDAY",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [QDAY_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "QDay Explorer",
      url: QDAY_EXPLORER_URL,
    },
  },
  testnet: true,
});

export const qDayPublicClient = createPublicClient({
  chain: qDayAevumTestnet,
  transport: http(QDAY_RPC_URL, { timeout: 8000 }),
});

/**
 * QDay Aevum limits `eth_getLogs` to at most 1,000 blocks per request.
 * Use this helper to paginate block ranges safely over HTTPS.
 */
export async function getLogsChunked(params: {
  address?: `0x${string}` | `0x${string}`[];
  fromBlock: bigint;
  toBlock: bigint;
  chunkSize?: bigint;
}): Promise<Log[]> {
  const step =
    params.chunkSize && params.chunkSize <= QDAY_MAX_LOGS_BLOCK_RANGE
      ? params.chunkSize
      : QDAY_MAX_LOGS_BLOCK_RANGE;

  const logs: Log[] = [];
  let cursor = params.fromBlock;

  while (cursor <= params.toBlock) {
    const end =
      cursor + step - BigInt(1) < params.toBlock
        ? cursor + step - BigInt(1)
        : params.toBlock;

    const batch = await qDayPublicClient.getLogs({
      address: params.address,
      fromBlock: cursor,
      toBlock: end,
    });
    logs.push(...batch);
    cursor = end + BigInt(1);
  }

  return logs;
}

const ERC20_BALANCE_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

export function parseTusd8(amount: string): bigint {
  const cleaned = amount.trim();
  if (!cleaned || Number.isNaN(Number(cleaned))) return BigInt(0);
  return parseUnits(cleaned, TUSD8_CONTRACT.decimals);
}

export function formatTusd8(raw: bigint, decimals = 2): string {
  const num = Number(formatUnits(raw, TUSD8_CONTRACT.decimals));
  return num.toLocaleString("en-US", {
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
  name: "HanumPaySalesLedger",
  version: "1",
  chainId: QDAY_CHAIN_ID,
  verifyingContract:
    "0x7A90000000000000000000000000000000008004" as `0x${string}`,
};

export const RECORD_SALE_TYPES = {
  RecordSale: [
    { name: "shop", type: "address" },
    { name: "amountUSD8", type: "uint256" },
    { name: "customerId", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export const ACCEPT_LOAN_TYPES = {
  AcceptLoan: [
    { name: "loanId", type: "uint256" },
    { name: "shop", type: "address" },
    { name: "principalUSD8", type: "uint256" },
    { name: "flatFeeUSD8", type: "uint256" },
    { name: "repayPctBps", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export const DEPLOYED_CONTRACTS = {
  erc8004: (process.env.NEXT_PUBLIC_ERC8004_ADDRESS ||
    "0x5533628fE8bFa8A6227C69cca8F7E96e578709c9") as `0x${string}`,
  salesLedger: (process.env.NEXT_PUBLIC_SALES_LEDGER_ADDRESS ||
    "0xbFCe0404F4abbe73Bf4eDB2e0E7F7a0e69d33BE5") as `0x${string}`,
  loanPool: (process.env.NEXT_PUBLIC_LOAN_POOL_ADDRESS ||
    "0x5FcF8175bc41B584322Af65979013AbB6FecA6DB") as `0x${string}`,
  aiGuarantor: (process.env.NEXT_PUBLIC_AI_GUARANTOR_ADDRESS ||
    "0x35E37e86b7676FEA5fb4704b5ce6C015492c1d64") as `0x${string}`,
};

export const HANUMPAY_ABIS = {
  salesLedger: parseAbi([
    "function recordSale(address shop, uint256 amountUSD8, bytes32 customerId, uint256 deadline, bytes signature) external",
    "function totalShops() external view returns (uint256)",
    "function getShops(uint256 offset, uint256 limit) external view returns (address[] memory)",
  ]),
  loanPool: parseAbi([
    "function acceptLoan(uint256 loanId, uint256 deadline, bytes signature) external",
  ]),
  aiGuarantor: parseAbi([
    "function proposeLoan(address shop) external returns (uint256)",
    "function checkEligibility(address shop) external view returns (bool eligible, string memory reason)",
    "function proposalsToday() external view returns (uint256)",
  ]),
};

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as { ethereum?: EthereumProvider };
  return win.ethereum ?? null;
}

// EIP-3085 wallet_addEthereumChain configuration from QDay Wiki
export async function addOrSwitchQDayNetwork(
  provider: EthereumProvider,
): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: QDAY_CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4001) {
      throw err;
    }
    if (code === 4902 || code === -32603 || code === undefined) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: QDAY_CHAIN_ID_HEX, // 44005
            chainName: "QDay Aevum",
            rpcUrls: [QDAY_RPC_URL],
            blockExplorerUrls: [QDAY_EXPLORER_URL],
            nativeCurrency: {
              name: "tQDAY",
              symbol: "tQDAY",
              decimals: 18,
            },
          },
        ],
      });
      return;
    }
    throw err;
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
      functionName: "balanceOf",
      args: [address],
    }),
  ]);
  return {
    tqday: Number(formatUnits(nativeRaw, 18)).toFixed(4),
    tusd8: formatTusd8(tusd8Raw, 2),
  };
}
