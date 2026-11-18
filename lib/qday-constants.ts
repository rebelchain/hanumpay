export const QDAY_CHAIN_ID = 44005;
export const QDAY_CHAIN_ID_HEX = '0xABE5';
export const QDAY_RPC_URL = 'https://rpc-test.qday.info';
export const QDAY_EXPLORER_URL = 'https://explorer-test.qday.info';
export const QDAY_FAUCET_URL = 'https://faucet.qday.info/en';
export const QDAY_EVM_VERSION = 'shanghai';
export const QDAY_MAX_LOGS_BLOCK_RANGE = BigInt(1000);
export const DEPLOYMENT_START_BLOCK = BigInt(3310882);
export const HANUMPAY_GITBOOK_URL = 'https://rebelxyz.gitbook.io/hanumpay';
export const HANUMPAY_GITHUB_URL = 'https://github.com/rebelchain/hanumpay';

// Official tUSD8 Stablecoin Contract from Aevum Builder Challenge #1 Starter Kit (6 decimals)
export const TUSD8_CONTRACT = {
  address: '0x456569838f1d43009A91ebA4263147Afd7233483' as `0x${string}`,
  decimals: 6,
  symbol: 'tUSD8',
  chainId: QDAY_CHAIN_ID,
};

export const DEPLOYED_CONTRACTS = {
  erc8004: (process.env.NEXT_PUBLIC_ERC8004_ADDRESS ||
    '0x5533628fE8bFa8A6227C69cca8F7E96e578709c9') as `0x${string}`,
  salesLedger: (process.env.NEXT_PUBLIC_SALES_LEDGER_ADDRESS ||
    '0xbFCe0404F4abbe73Bf4eDB2e0E7F7a0e69d33BE5') as `0x${string}`,
  loanPool: (process.env.NEXT_PUBLIC_LOAN_POOL_ADDRESS ||
    '0x5FcF8175bc41B584322Af65979013AbB6FecA6DB') as `0x${string}`,
  aiGuarantor: (process.env.NEXT_PUBLIC_AI_GUARANTOR_ADDRESS ||
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

export function fromTusd8Raw(raw: bigint): number {
  return Number(raw) / 1_000_000;
}

export function formatTusd8(raw: bigint, decimals = 2): string {
  const num = fromTusd8Raw(raw);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { ethereum?: EthereumProvider };
  return win.ethereum ?? null;
}

// EIP-3085 wallet_addEthereumChain configuration from QDay Wiki
export async function addOrSwitchQDayNetwork(provider: EthereumProvider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: QDAY_CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4001) {
      throw err;
    }
    if (code === 4902 || code === -32603 || code === undefined) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: QDAY_CHAIN_ID_HEX,
            chainName: 'QDay Aevum',
            rpcUrls: [QDAY_RPC_URL],
            blockExplorerUrls: [QDAY_EXPLORER_URL],
            nativeCurrency: {
              name: 'tQDAY',
              symbol: 'tQDAY',
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
