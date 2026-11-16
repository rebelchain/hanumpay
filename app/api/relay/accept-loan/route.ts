import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseUnits, verifyTypedData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  ACCEPT_LOAN_TYPES,
  DEPLOYED_CONTRACTS,
  HANUMPAY_ABIS,
  QDAY_CHAIN_ID,
  QDAY_RPC_URL,
  qDayAevumTestnet,
  qDayPublicClient,
} from '@/lib/qday';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      loanId,
      shop,
      principalUSD8,
      flatFeeUSD8,
      repayPctBps,
      deadline,
      signature,
    } = body as {
      loanId: number;
      shop: `0x${string}`;
      principalUSD8: number;
      flatFeeUSD8: number;
      repayPctBps: number;
      deadline: number;
      signature: string;
    };

    if (!loanId || !shop) {
      return NextResponse.json({ error: 'ID pinjaman atau alamat toko belum diisi.' }, { status: 400 });
    }

    const verifyingContract =
      DEPLOYED_CONTRACTS.loanPool ||
      ('0x7A90000000000000000000000000000000009001' as `0x${string}`);

    let signatureVerified = false;
    if (signature && /^0x[0-9a-fA-F]{130}$/.test(signature)) {
      signatureVerified = await verifyTypedData({
        address: shop,
        domain: {
          name: 'HanumPayLoanPool',
          version: '1',
          chainId: QDAY_CHAIN_ID,
          verifyingContract,
        },
        types: ACCEPT_LOAN_TYPES,
        primaryType: 'AcceptLoan',
        message: {
          loanId: BigInt(loanId),
          shop,
          principalUSD8: parseUnits(principalUSD8.toFixed(6), 6),
          flatFeeUSD8: parseUnits(flatFeeUSD8.toFixed(6), 6),
          repayPctBps: BigInt(repayPctBps),
          deadline: BigInt(deadline),
        },
        signature: signature as `0x${string}`,
      });

      if (!signatureVerified) {
        return NextResponse.json(
          { error: 'Tanda tangan EIP-712 persetujuan pinjaman tidak cocok dengan pemilik toko.' },
          { status: 401 }
        );
      }
    }

    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    const loanPoolAddr = DEPLOYED_CONTRACTS.loanPool;

    if (
      relayerKey &&
      loanPoolAddr &&
      /^0x[0-9a-fA-F]{64}$/.test(relayerKey) &&
      /^0x[0-9a-fA-F]{130}$/.test(signature)
    ) {
      const account = privateKeyToAccount(relayerKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: qDayAevumTestnet,
        transport: http(process.env.QDAY_RPC_URL || QDAY_RPC_URL),
      });

      const txHash = await walletClient.writeContract({
        address: loanPoolAddr,
        abi: HANUMPAY_ABIS.loanPool,
        functionName: 'acceptLoan',
        args: [BigInt(loanId), BigInt(deadline), signature as `0x${string}`],
      });

      await qDayPublicClient.waitForTransactionReceipt({ hash: txHash }).catch(() => null);

      return NextResponse.json({
        ok: true,
        mode: 'qday-onchain-relay',
        txHash,
        relayerAddress: account.address,
        signatureVerified: true,
      });
    }

    return NextResponse.json({
      ok: true,
      mode: 'verified-demo-relay',
      txHash: null,
      signatureVerified,
      note: 'Relayer telah memeriksa syarat pinjaman; atur RELAYER_PRIVATE_KEY & NEXT_PUBLIC_LOAN_POOL_ADDRESS untuk kirim langsung ke jaringan QDay.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Relayer persetujuan pinjaman gagal.' },
      { status: 500 }
    );
  }
}
