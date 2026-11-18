import { NextResponse } from 'next/server';
import {
  DEPLOYED_CONTRACTS,
  QDAY_CHAIN_ID,
  QDAY_EVM_VERSION,
  QDAY_RPC_URL,
  qDayPublicClient,
} from '@/lib/qday';

export const dynamic = 'force-dynamic';

export async function GET() {
  let blockNumber: string | null = null;
  let rpcHealthy = false;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('RPC timeout')), 3000)
    );
    const block = await Promise.race([qDayPublicClient.getBlockNumber(), timeoutPromise]);
    blockNumber = block.toString();
    rpcHealthy = true;
  } catch {
    rpcHealthy = false;
  }

  return NextResponse.json(
    {
      ok: rpcHealthy,
      service: 'hanumpay',
      network: {
        name: 'QDay Aevum Testnet',
        chainId: QDAY_CHAIN_ID,
        evmVersion: QDAY_EVM_VERSION,
        rpcUrl: QDAY_RPC_URL,
        rpcHealthy,
        blockNumber,
      },
      contracts: DEPLOYED_CONTRACTS,
      capabilities: {
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        relayerConfigured: Boolean(process.env.RELAYER_PRIVATE_KEY),
        agentConfigured: Boolean(process.env.AGENT_PRIVATE_KEY),
        cronSecretProtected: Boolean(process.env.CRON_SECRET),
      },
      timestamp: new Date().toISOString(),
    },
    { status: rpcHealthy ? 200 : 503 }
  );
}
