# Catatan Progres Hackathon — HanumPay

Dokumen ini menjadi sumber konteks utama antara pengembangan lokal, repository GitHub, dan workspace AI Studio agar setiap tahap pekerjaan tercatat rapi sejak awal hackathon.

---

## Status Saat Ini
- **Tahap Aktif**: Tahap 1 — Fondasi Repository, UI Bahasa Indonesia, & Persiapan Deploy QDay
- **Target Jaringan**: QDay Aevum Testnet (Chain ID `44005`)
- **Kontrak Resmi tUSD8**: `0x456569838f1d43009A91ebA4263147Afd7233483` (6 desimal)

---

## Peta Tahapan Pekerjaan

### Tahap 1 — Fondasi Aplikasi & Repository Awal (Selesai)
- [x] Landing page HanumPay dengan tema hijau emerald, kalkulator limit modal QR, dan perbandingan biaya vs pinjol.
- [x] Simulasi langsung 2 perangkat (`/stage`) untuk skenario penjualan QR, tawaran AI, bayar pemasok, serangan alamat palsu, dan uji serangan prompt.
- [x] Seluruh ruang aplikasi UMKM (`/app/dashboard`, `/app/penjualan`, `/app/pinjaman`, `/app/identitas`, `/app/pool`, `/app/docs`).
- [x] Lokalisasi penuh ke Bahasa Indonesia yang sederhana dan jelas untuk UMKM lokal.
- [x] Penyiapan smart contract Solidity + script deploy & test suite Foundry di `contracts/`.
- [x] Inisialisasi `README.md` dan `PROGRESS.md` serta push baseline ke repository GitHub.

### Tahap 2 — Uji & Deploy Smart Contract ke QDay Testnet (Berikutnya)
- [ ] Pasang & jalankan `forge test -vvv` pada direktori `contracts/` dan catat hasil lulus semua tes.
- [ ] Klaim faucet `tQDAY` & `tUSD8` di `https://faucet.qday.info/en`.
- [ ] Jalankan `Deploy.s.sol` ke QDay Aevum Testnet (`44005`) dan catat 4 alamat kontrak di tabel bawah.
- [ ] Sambungkan 4 alamat kontrak (`NEXT_PUBLIC_*`) serta `RELAYER_PRIVATE_KEY` / `AGENT_PRIVATE_KEY` untuk mode transaksi on-chain nyata.
- [ ] Verifikasi minimal 1 transaksi nyata di QDay Block Explorer (catat penjualan QR, ajukan & terima pinjaman, atau bayar pemasok).

### Tahap 3 — Pengayaan Fitur & Pengujian End-to-End
- [ ] Uji koneksi dompet MetaMask / browser ke QDay Aevum Testnet dan verifikasi pembacaan saldo `tQDAY` & `tUSD8` asli.
- [ ] Uji endpoint `/api/agent/audit` & `/api/agent/red-team` dengan `GEMINI_API_KEY` aktif.
- [ ] Verifikasi tampilan responsif pada perangkat Mobile, Tablet, dan Desktop.

### Tahap 4 — Deployment Produksi (Vercel)
- [ ] Sambungkan repository GitHub ke Vercel.
- [ ] Konfigurasikan Environment Variables (`GEMINI_API_KEY`, `QDAY_RPC_URL`, `NEXT_PUBLIC_*`, serta relayer/agent key bila mode live on-chain diaktifkan).
- [ ] Uji ulang seluruh rute dan transaksi di URL produksi Vercel.

### Tahap 5 — Finalisasi Materi Hackathon (DoraHacks)
- [ ] Rekam video demo produk Bahasa Indonesia (maksimal 3 menit) mencakup Landing Page, Simulasi 2 Ponsel, Uji Serangan AI, dan integrasi QDay.
- [ ] Lengkapi tautan live app, alamat kontrak QDay, dan video demo di `README.md`.
- [ ] Commit final dan kirim pengajuan hackathon.

---

## Catatan Alamat Kontrak & Tx Hash QDay Testnet
*(Perbarui bagian ini setelah Tahap 2 selesai)*

| Komponen | Alamat Kontrak / Tx Hash | Catatan |
| --- | --- | --- |
| `ERC8004Registry` | `-` | Menunggu deploy Tahap 2 |
| `SalesLedger` | `-` | Menunggu deploy Tahap 2 |
| `LoanPool` | `-` | Menunggu deploy Tahap 2 |
| `AIGuarantor` | `-` | Menunggu deploy Tahap 2 |
| Sample Tx QDay Explorer | `-` | Menunggu verifikasi transaksi |

---

## Log Perubahan (Changelog)
- **2026-11-16 (Tahap 1)**: Inisialisasi baseline repository GitHub hackathon, penyelarasan seluruh copy aplikasi ke Bahasa Indonesia ramah UMKM, verifikasi build & lint bersih, serta penambahan `README.md` dan `PROGRESS.md`.
