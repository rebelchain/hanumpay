import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum diatur di server.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { shopName, totalSales30dUSD8, uniqueCustomers30d, proposedPrincipalUSD8, flatFeeUSD8 } =
      body as {
        shopName: string;
        totalSales30dUSD8: number;
        uniqueCustomers30d: number;
        proposedPrincipalUSD8: number;
        flatFeeUSD8: number;
      };

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Analisa data modal kerja UMKM ini untuk HanumPay di jaringan QDay Aevum Testnet:
Nama Toko: ${shopName}
Total penjualan QR terverifikasi 30 hari: ${totalSales30dUSD8.toFixed(2)} tUSD8
Jumlah pembeli berbeda (30 hari): ${uniqueCustomers30d} (syarat minimal kontrak: 5)
Pokok modal kerja dihitung kontrak (10% omzet, maks $500): ${proposedPrincipalUSD8.toFixed(2)} tUSD8
Biaya tetap 5% (tidak bisa berubah): ${flatFeeUSD8.toFixed(2)} tUSD8
Cicilan otomatis: dipotong 10% setiap ada penjualan QR baru (tanpa jatuh tempo, tanpa bunga berbunga).

Berikan ringkasan analisa yang simpel, jelas, ramah UMKM, serta satu catatan pengaman risiko dalam bahasa Indonesia.`,
      config: {
        systemInstruction:
          'Kamu adalah HanumPay-AI-Guarantor-v1, asisten penilai modal kerja yang jujur dan mudah dipahami pemilik warung/UMKM Indonesia. Jelaskan ketentuan pinjaman dari smart contract secara jelas dalam 2-3 kalimat bahasa Indonesia tanpa mengarang angka baru.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Ringkasan 2 kalimat bahasa Indonesia yang menjelaskan alasan toko layak berdasarkan omzet dan jumlah pembeli.',
            },
            riskNote: {
              type: Type.STRING,
              description: 'Satu catatan singkat bahasa Indonesia tentang batas keamanan kontrak.',
            },
          },
          required: ['summary', 'riskNote'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menjalankan audit AI Gemini.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
