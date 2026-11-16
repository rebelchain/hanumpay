import { Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { generateGeminiJson } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const {
      shopName,
      totalSales30dUSD8,
      uniqueCustomers30d,
      proposedPrincipalUSD8,
      flatFeeUSD8,
    } = body as {
      shopName: string;
      totalSales30dUSD8: number;
      uniqueCustomers30d: number;
      proposedPrincipalUSD8: number;
      flatFeeUSD8: number;
    };

    const text = await generateGeminiJson({
      apiKey,
      contents: `Analyze this MSME working-capital credit profile for HanumPay on QDay Aevum Testnet:
Shop: ${shopName}
Verified 30d QR sales volume: ${totalSales30dUSD8.toFixed(2)} tUSD8
Unique customers (30d): ${uniqueCustomers30d} (minimum contract threshold: 5)
Contract-calculated principal (10% of 30d sales, capped at $500): ${proposedPrincipalUSD8.toFixed(2)} tUSD8
Immutable flat fee (5%): ${flatFeeUSD8.toFixed(2)} tUSD8
Auto-repayment: 10% deducted automatically from each incoming QR sale (no fixed due date, no compounding interest).

Provide a concise, plain-English underwriting summary and one risk-control note.`,
      systemInstruction:
        "You are HanumPay-AI-Guarantor-v1, a transparent working-capital underwriting agent for small merchants. Explain contract-enforced loan terms clearly in 2–3 plain English sentences without inventing new numbers.",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description:
              "A 2-sentence English underwriting summary explaining eligibility based on sales and unique buyers.",
          },
          riskNote: {
            type: Type.STRING,
            description:
              "One short English note highlighting the smart-contract safety limit.",
          },
        },
        required: ["summary", "riskNote"],
      },
    });

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to run Gemini AI audit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
