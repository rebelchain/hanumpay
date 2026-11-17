import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  DEPLOYED_CONTRACTS,
  HANUMPAY_ABIS,
  QDAY_RPC_URL,
  qDayAevumTestnet,
  qDayPublicClient,
} from "@/lib/qday";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const customSecret = req.headers.get("x-cron-secret");
    const provided =
      customSecret ??
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
    const isSameOriginUi = req.headers.get("sec-fetch-site") === "same-origin";

    if (provided !== cronSecret && (!isSameOriginUi || provided !== null)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized cron trigger." },
        { status: 401 },
      );
    }
  }

  const logs: Array<Record<string, unknown>> = [
    { event: "cycle_start", timestamp: Date.now() },
  ];

  try {
    const agentKey = process.env.AGENT_PRIVATE_KEY;
    const ledgerAddr = DEPLOYED_CONTRACTS.salesLedger;
    const guarantorAddr = DEPLOYED_CONTRACTS.aiGuarantor;

    if (
      agentKey &&
      ledgerAddr &&
      guarantorAddr &&
      /^0x[0-9a-fA-F]{64}$/.test(agentKey)
    ) {
      const account = privateKeyToAccount(agentKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: qDayAevumTestnet,
        transport: http(process.env.QDAY_RPC_URL || QDAY_RPC_URL),
      });

      const shops = (await qDayPublicClient.readContract({
        address: ledgerAddr,
        abi: HANUMPAY_ABIS.salesLedger,
        functionName: "getShops",
        args: [BigInt(0), BigInt(50)],
      })) as `0x${string}`[];

      logs.push({
        event: "shops_fetched",
        count: shops.length,
        timestamp: Date.now(),
      });

      for (const shop of shops) {
        const [eligible, reason] = (await qDayPublicClient.readContract({
          address: guarantorAddr,
          abi: HANUMPAY_ABIS.aiGuarantor,
          functionName: "checkEligibility",
          args: [shop],
        })) as [boolean, string];

        if (!eligible) {
          logs.push({
            event: "shop_skipped",
            shop,
            reason,
            timestamp: Date.now(),
          });
          continue;
        }

        const txHash = await walletClient.writeContract({
          address: guarantorAddr,
          abi: HANUMPAY_ABIS.aiGuarantor,
          functionName: "proposeLoan",
          args: [shop],
        });

        logs.push({
          event: "proposal_submitted",
          shop,
          txHash,
          timestamp: Date.now(),
        });
      }

      logs.push({ event: "cycle_end", timestamp: Date.now() });
      return NextResponse.json({
        ok: true,
        mode: "qday-onchain-cron",
        agentWallet: account.address,
        logs,
      });
    }

    logs.push({
      event: "cycle_end",
      mode: "demo-cron",
      note: "Set AGENT_PRIVATE_KEY, NEXT_PUBLIC_SALES_LEDGER_ADDRESS & NEXT_PUBLIC_AI_GUARANTOR_ADDRESS to run live on QDay Aevum.",
      timestamp: Date.now(),
    });

    return NextResponse.json({
      ok: true,
      mode: "demo-cron",
      logs,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "AI Guarantor cron cycle failed.",
        logs,
      },
      { status: 500 },
    );
  }
}
