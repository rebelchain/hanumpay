# HanumPay

**Modal kerja adil berbasis omzet QR harian & verifikasi identitas pemasok ERC-8004 untuk UMKM di jaringan QDay Aevum Testnet.**

HanumPay membantu warung dan pelaku UMKM membangun riwayat omzet kasir QR yang terverifikasi di blockchain tanpa biaya gas (*gasless EIP-712*), membuka akses limit modal kerja `tUSD8` yang diawasi oleh smart contract (**maksimal 10% dari omzet 30 hari, batas atas $500 tUSD8, biaya tetap 5% flat, tanpa denda keterlambatan**), serta melindungi pembayaran kulakan ke grosir menggunakan **ERC-8004 Confirmation of Payee**.

---

## Fitur Utama

1. **Kasir QR Bebas Gas (`SalesLedger.sol` + Relayer EIP-712)**
   - Pelanggan membayar memakai `tUSD8`; nomor identitas/HP pembeli di-*hash* secara lokal dengan `keccak256` sebelum ditandatangani.
   - Gerbang anti-transaksi fiktif (*anti-wash trading*): warung wajib memiliki minimal **5 pembeli unik** dalam 30 hari terakhir sebelum layak menerima modal kerja.
2. **Penjaga AI Terbatas Smart Contract (`AIGuarantor.sol` + Gemini Audit)**
   - Agen AI menganalisis omzet dan mengusulkan pinjaman **sebatas aturan kontrak** (rasio maks 10%, batas maks $500 `tUSD8`, kuota harian 10 pengajuan).
   - Pemilik warung memegang **tombol Jeda AI (*Pause Kill Switch*)** untuk menghentikan seluruh tawaran pinjaman baru kapan saja tanpa mengganggu kasir QR harian.
3. **Cicilan Otomatis 10% & Biaya Tetap 5% (`LoanPool.sol`)**
   - Tidak ada jatuh tempo kaku dan **0% denda telat**. Setiap penjualan QR baru otomatis memotong 10% untuk melunasi pinjaman sampai selesai.
   - Ketika lunas, riwayat tercatat sebagai **Paspor Kredit On-Chain** yang portabel.
4. **Konfirmasi Penerima Pemasok (`ERC8004Registry.sol`)**
   - Memverifikasi nama dan alamat dompet grosir/pemasok resmi sebelum transfer dikirim agar terhindar dari salah kirim atau penipuan alamat palsu.
5. **Simulasi 2 Ponsel (`/stage`) & Uji Serangan AI (*Red-Team*)**
   - Demo interaktif sisi-ke-sisi antara **Ponsel Kasir Toko**, **Monitor Penjaga AI**, dan **Panel Skenario** (termasuk serangan *prompt injection* langsung terhadap Gemini yang ditolak oleh aturan deterministik smart contract).

---

## Informasi Jaringan QDay Aevum Testnet

| Parameter | Nilai |
| --- | --- |
| **Network Name** | QDay Aevum Testnet |
| **Chain ID** | `44005` (`0xabe5`) |
| **RPC URL** | `https://rpc-test.qday.info` |
| **Block Explorer** | `https://explorer-test.qday.info` |
| **Faucet** | `https://faucet.qday.info/en` |
| **Token tUSD8 (6 desimal)** | `0x456569838f1d43009A91ebA4263147Afd7233483` |

### Alamat Smart Contract Ter-Deploy (Diisi Setelah Deploy Foundry)

| Kontrak | Alamat di QDay Testnet (44005) | Status |
| --- | --- | --- |
| `ERC8004Registry.sol` | *Belum diisi (Tahap 2)* | Menunggu deploy |
| `SalesLedger.sol` | *Belum diisi (Tahap 2)* | Menunggu deploy |
| `LoanPool.sol` | *Belum diisi (Tahap 2)* | Menunggu deploy |
| `AIGuarantor.sol` | *Belum diisi (Tahap 2)* | Menunggu deploy |

---

## Struktur Proyek

```text
├── app/
│   ├── page.tsx                  # Landing page UMKM + kalkulator limit & penggaris biaya
│   ├── stage/page.tsx            # Simulasi langsung 2 ponsel & panel skenario
│   ├── app/
│   │   ├── dashboard/page.tsx    # Dasbor pemilik usaha & Paspor Kredit
│   │   ├── penjualan/page.tsx    # Kasir QR & riwayat struk terverifikasi
│   │   ├── pinjaman/page.tsx     # Siklus modal kerja, log audit AI, & konsol Red-Team
│   │   ├── identitas/page.tsx    # Direktori ERC-8004 & bayar pemasok resmi
│   │   ├── pool/page.tsx         # Pool likuiditas penyedia dana (LP)
│   │   └── docs/page.tsx         # Panduan Foundry, status dompet QDay, & blueprint
│   └── api/
│       ├── agent/audit/          # Audit kelayakan kredit dengan Gemini
│       ├── agent/red-team/       # Pengujian prompt injection vs aturan kontrak
│       ├── agent/cron/           # Siklus pengecekan agen guarantor
│       └── relay/                # Endpoint relayer bebas gas (record-sale & accept-loan)
├── components/                   # Komponen UI aplikasi & landing page
├── lib/                          # Engine aturan kontrak, state store, klien QDay (viem)
└── contracts/                    # Smart contract Solidity & test suite Foundry
    ├── src/                      # ERC8004Registry, SalesLedger, LoanPool, AIGuarantor
    ├── script/Deploy.s.sol       # Script deployment QDay Testnet
    └── test/HanumPay.t.sol       # Unit & invariant tests Solidity
```

---

## Menjalankan Aplikasi Web Secara Lokal

```bash
# 1. Pasang dependensi
npm install

# 2. Salin contoh environment variable
cp .env.example .env.local
# Isi GEMINI_API_KEY di .env.local (opsional jika hanya menguji mode relayer lokal)

# 3. Jalankan server pengembangan (port 3000)
npm run dev
```

---

## Menguji & Deploy Smart Contract (Foundry)

```bash
cd contracts

# Jalankan seluruh unit & invariant test
forge test -vvv

# Siapkan environment untuk deploy ke QDay Aevum Testnet (Chain ID 44005)
export DEPLOYER_PRIVATE_KEY=0xPRIVATE_KEY_DEPLOYER
export AGENT_WALLET_ADDRESS=0xALAMAT_DOMPET_AGEN

# Deploy 4 kontrak inti ke QDay Testnet
forge script script/Deploy.s.sol --rpc-url https://rpc-test.qday.info --broadcast --legacy
```

Setelah deploy selesai, masukkan keempat alamat kontrak ke `.env.local` (dan Environment Variables Vercel jika di-deploy):
- `NEXT_PUBLIC_ERC8004_ADDRESS`
- `NEXT_PUBLIC_SALES_LEDGER_ADDRESS`
- `NEXT_PUBLIC_LOAN_POOL_ADDRESS`
- `NEXT_PUBLIC_AI_GUARANTOR_ADDRESS`

---

## Tautan Pengumpulan Hackathon
- **Aplikasi Live (Vercel)**: *Akan diisi pada Tahap 4*
- **Video Demo Produk**: *Akan diisi pada Tahap 5*
