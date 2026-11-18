import { Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJson } from '@/lib/gemini';

interface AuditSaleItem {
  amountUSD8: number;
  customerLabel: string;
  hoursAgo?: number;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      shopName,
      totalSales30dUSD8,
      uniqueCustomers30d,
      proposedPrincipalUSD8,
      flatFeeUSD8,
      recentSales = [],
    } = body as {
      shopName: string;
      totalSales30dUSD8: number;
      uniqueCustomers30d: number;
      proposedPrincipalUSD8: number;
      flatFeeUSD8: number;
      recentSales?: AuditSaleItem[];
    };

    const salesText =
      recentSales.length > 0
        ? recentSales
            .slice(0, 12)
            .map(
              (s, i) =>
                `#${i + 1}: ${s.customerLabel} paid $${Number(s.amountUSD8).toFixed(2)} tUSD8 (${
                  typeof s.hoursAgo === 'number' ? `${s.hoursAgo}h ago` : 'recent'
                })`
            )
            .join('\n')
        : 'Aggregate ledger only (no granular transaction list provided).';

    const avgTicket =
      recentSales.length > 0
        ? recentSales.reduce((acc, s) => acc + Number(s.amountUSD8 || 0), 0) / recentSales.length
        : totalSales30dUSD8 / Math.max(1, uniqueCustomers30d);

    const estimatedPayoffSales =
      avgTicket > 0
        ? Math.max(1, Math.ceil((proposedPrincipalUSD8 + flatFeeUSD8) / (avgTicket * 0.1)))
        : 30;

    const text = await generateGeminiJson({
      apiKey,
      contents: `Perform behavioral risk & cashflow underwriting for an MSME working-capital request on HanumPay (QDay Aevum Testnet):
Shop: ${shopName}
Verified 30d QR sales volume: ${Number(totalSales30dUSD8 || 0).toFixed(2)} tUSD8
Unique customers (30d): ${Number(uniqueCustomers30d || 0)} (contract minimum: 5)
Contract maximum principal (10% of 30d sales, capped at $500): ${Number(proposedPrincipalUSD8 || 0).toFixed(2)} tUSD8
Immutable flat fee (5%): ${Number(flatFeeUSD8 || 0).toFixed(2)} tUSD8
Auto-repayment: 10% deducted automatically from each incoming QR sale (~${estimatedPayoffSales} average sales to settle).

Recent raw QR ledger entries (check for wash-trading, identical bursts within <1h, or extreme outlier ticket spikes >10x median):
${salesText}

Decide whether behavioral risk is APPROVE or FLAG_ANOMALY, recommend a safe principal <= ${Number(proposedPrincipalUSD8 || 0).toFixed(2)}, explain the repayment runway for the shop owner in plain English, and call out any anomaly flags or clean dispersion.`,
      systemInstruction:
        'You are HanumPay-AI-Guarantor-v1, a risk & fraud underwriting agent that inspects raw off-chain QR cashflow patterns (wash-trading bursts, outlier spikes, buyer dispersion) before Solidity enforces hard caps. Be concrete, analytical, and concise in English without inventing ledger numbers.',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: {
            type: Type.STRING,
            description: 'Must be APPROVE if organic retail flow, or FLAG_ANOMALY if wash-trading burst/spike detected.',
          },
          recommendedPrincipalUSD8: {
            type: Type.NUMBER,
            description: 'Safe recommended loan principal in tUSD8, never exceeding the contract cap.',
          },
          estimatedPayoffSales: {
            type: Type.INTEGER,
            description: 'Estimated number of future average QR sales needed to repay principal + 5% fee at 10% deduction.',
          },
          anomalyFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Short behavioral risk findings (e.g., organic ticket dispersion, or burst timestamp warning).',
          },
          summary: {
            type: Type.STRING,
            description: '2-sentence plain-English underwriting finding covering ledger quality and estimated payoff runway.',
          },
          riskNote: {
            type: Type.STRING,
            description: 'One short sentence on smart-contract safety limit or behavioral risk check.',
          },
        },
        required: [
          'verdict',
          'recommendedPrincipalUSD8',
          'estimatedPayoffSales',
          'anomalyFlags',
          'summary',
          'riskNote',
        ],
      },
    });

    const parsed = JSON.parse(text) as {
      verdict?: string;
      recommendedPrincipalUSD8?: number;
      estimatedPayoffSales?: number;
      anomalyFlags?: string[];
      summary?: string;
      riskNote?: string;
    };

    return NextResponse.json({
      verdict: parsed.verdict === 'FLAG_ANOMALY' ? 'FLAG_ANOMALY' : 'APPROVE',
      recommendedPrincipalUSD8: Math.min(
        Number(proposedPrincipalUSD8 || 0),
        Math.max(0, Number(parsed.recommendedPrincipalUSD8 ?? proposedPrincipalUSD8 ?? 0))
      ),
      estimatedPayoffSales: Number(parsed.estimatedPayoffSales ?? estimatedPayoffSales),
      anomalyFlags: Array.isArray(parsed.anomalyFlags) ? parsed.anomalyFlags : [],
      summary: parsed.summary ?? '',
      riskNote: parsed.riskNote ?? '',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to run Gemini AI audit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
