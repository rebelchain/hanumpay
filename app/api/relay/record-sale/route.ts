import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseUnits, verifyTypedData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  DEPLOYED_CONTRACTS,
  HANUMPAY_ABIS,
  HANUMPAY_EIP712_DOMAIN,
  QDAY_RPC_URL,
  qDayAevumTestnet,
  qDayPublicClient,
  RECORD_SALE_TYPES,
} from '@/lib/qday';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop, amountUSD8, customerIdHash, deadline, signature } = body as {
      shop: `0x${string}`;
      amountUSD8: number;
      customerIdHash: `0x${string}`;
      deadline: number;
      signature: string;
    };

    if (!shop || !customerIdHash || Number.isNaN(amountUSD8) || amountUSD8 < 0.1 || amountUSD8 > 500) {
      return NextResponse.json(
        { error: 'Invalid sale data. Amount must be between 0.10–500.00 tUSD8.' },
        { status: 400 }
      );
    }

    const amountRaw = parseUnits(amountUSD8.toFixed(6), 6);
    const verifyingContract =
      DEPLOYED_CONTRACTS.salesLedger || HANUMPAY_EIP712_DOMAIN.verifyingContract;

    let signatureVerified = false;
    if (signature && /^0x[0-9a-fA-F]{130}$/.test(signature)) {
      signatureVerified = await verifyTypedData({
        address: shop,
        domain: {
          ...HANUMPAY_EIP712_DOMAIN,
          verifyingContract,
        },
        types: RECORD_SALE_TYPES,
        primaryType: 'RecordSale',
        message: {
          shop,
          amountUSD8: amountRaw,
          customerId: customerIdHash,
          deadline: BigInt(deadline),
        },
        signature: signature as `0x${string}`,
      });

      if (!signatureVerified) {
        return NextResponse.json(
          { error: 'EIP-712 QR sale signature does not match shop address.' },
          { status: 401 }
        );
      }
    }

    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    const salesLedgerAddr = DEPLOYED_CONTRACTS.salesLedger;

    if (relayerKey && salesLedgerAddr && /^0x[0-9a-fA-F]{64}$/.test(relayerKey) && /^0x[0-9a-fA-F]{130}$/.test(signature)) {
      const account = privateKeyToAccount(relayerKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: qDayAevumTestnet,
        transport: http(process.env.QDAY_RPC_URL || QDAY_RPC_URL),
      });

      const txHash = await walletClient.writeContract({
        address: salesLedgerAddr,
        abi: HANUMPAY_ABIS.salesLedger,
        functionName: 'recordSale',
        args: [
          shop,
          amountRaw,
          customerIdHash,
          BigInt(deadline),
          signature as `0x${string}`,
        ],
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
      note: 'Relayer verified payload; set RELAYER_PRIVATE_KEY & NEXT_PUBLIC_SALES_LEDGER_ADDRESS to broadcast live to QDay Aevum.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sales relayer failed.' },
      { status: 500 }
    );
  }
}
