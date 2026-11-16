import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { QDAY_EXPLORER_URL, QDAY_FAUCET_URL, TUSD8_CONTRACT } from '@/lib/qday';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroCreditCalculator } from '@/components/landing/HeroCreditCalculator';
import { LiveTicker } from '@/components/landing/LiveTicker';
import { CreditRuler } from '@/components/landing/CreditRuler';
import {
  CompareCardInteractive,
  LiveEcosystemSplit,
} from '@/components/landing/LandingCompareAndEcosystem';
import { Reveal } from '@/components/landing/Reveal';
import {
  BandArcs,
  BlockPattern,
  CONTAINER,
  Eyebrow,
  H2,
  HeroBars,
  LaunchButton,
  RULE,
  SECTION_Y,
  SectionHead,
} from '@/components/landing/section';

const HOW_STEPS = [
  {
    num: '01',
    title: 'Catat penjualan QR bebas biaya gas',
    body: 'Setiap pembeli membayar belanjaan pakai tUSD8 di kasir, sistem otomatis mengacak ID pembeli secara aman (keccak256) lalu menyimpan bukti transaksi EIP-712 ke SalesLedger.sol tanpa biaya gas.',
  },
  {
    num: '02',
    title: 'Filter otomatis cegah jualan fiktif',
    body: 'Sebelum modal kerja terbuka, SalesLedger.sol memastikan ada minimal 5 pembeli berbeda dalam 30 hari terakhir. Transaksi pura-pura dari dompet yang sama otomatis ditolak.',
  },
  {
    num: '03',
    title: 'Penjaga AI berbatas aturan kontrak',
    body: 'AIGuarantor.sol menghitung 10% dari total omzet QR 30 hari (maksimal $500 tUSD8), mengunci biaya tetap 5%, lalu mengecek izin pemilik warung sebelum mengirim penawaran.',
  },
  {
    num: '04',
    title: 'Bayar pemasok aman & cicilan otomatis',
    body: 'Dana modal dipakai kulakan langsung ke pemasok resmi di ERC8004Registry.sol agar tidak salah transfer. Tiap penjualan QR berikutnya otomatis dipotong 10% untuk melunasi pinjaman.',
  },
];

const SAFETY_PRINCIPLES = [
  {
    num: '01',
    title: 'Biaya tetap 5% tidak bisa diubah',
    body: 'LoanPool.sol menolak usulan AI mana pun yang mencoba menaikkan biaya di atas 5% atau mengubah potongan cicilan 10%. Perintah palsu (prompt injection) tidak akan mempan.',
  },
  {
    num: '02',
    title: 'Tombol Jeda AI di tangan pemilik',
    body: 'Pemilik warung punya kendali penuh lewat AIGuarantor.setAgentPaused(true). Saat dijeda, AI tidak bisa mengajukan pinjaman baru, sementara kasir QR harian tetap berjalan normal.',
  },
  {
    num: '03',
    title: 'Struk resmi & Paspor Kredit UMKM',
    body: 'Setiap jualan QR, pencairan modal, dan pembayaran grosir menghasilkan struk digital yang bisa diaudit dan terhubung langsung ke identitas ERC-8004 di QDay Chain ID 44005.',
  },
];

const CONTRACT_CARDS = [
  {
    tag: 'BUKTI OMZET',
    name: 'SalesLedger.sol',
    summary:
      'Menyimpan bukti penjualan QR pelanggan bebas gas dengan ID teracak agar warung kecil punya riwayat kredit yang sah.',
    stats: [
      { label: 'Rentang', value: '30 hari' },
      { label: 'Pembeli unik', value: 'Min 5 orang' },
      { label: 'Nominal QR', value: '$0.10–$500' },
      { label: 'Biaya gas', value: 'Gratis (Relayer)' },
    ],
    href: '/app/penjualan',
    linkLabel: 'Buka kasir QR',
  },
  {
    tag: 'AGEN TERKENDALI',
    name: 'AIGuarantor.sol',
    summary:
      'Mengusulkan modal tUSD8 sesuai batas hitungan kontrak dan memberi hak penuh bagi pemilik toko untuk menjeda akses AI.',
    stats: [
      { label: 'Rasio omzet', value: 'Maks 10%' },
      { label: 'Batas modal', value: '$500 tUSD8' },
      { label: 'Kuota harian', value: '10 / hari' },
      { label: 'Kendali toko', value: 'Jeda AI' },
    ],
    href: '/app/docs',
    linkLabel: 'Uji serangan AI',
  },
  {
    tag: 'BRANKAS DANA',
    name: 'LoanPool.sol',
    summary:
      'Menampung dana tUSD8 dari komunitas penyedia dana, menjaga batas pakai maksimal 80%, dan memotong cicilan 10% tiap penjualan.',
    stats: [
      { label: 'Biaya tetap', value: '5.0% flat' },
      { label: 'Batas pakai', value: 'Maks 80%' },
      { label: 'Cicilan otomatis', value: '10% / laku' },
      { label: 'Denda telat', value: '0% selamanya' },
    ],
    href: '/app/pool',
    linkLabel: 'Lihat pool dana',
  },
  {
    tag: 'CEK PENERIMA',
    name: 'ERC8004Registry.sol',
    summary:
      'Memastikan identitas pemasok terdaftar resmi sebelum dana dikirim, mencegah transfer nyasar ke alamat palsu.',
    stats: [
      { label: 'Privasi', value: 'keccak256' },
      { label: 'Cek penerima', value: 'Wajib aktif' },
      { label: 'Identitas', value: 'ERC-8004' },
      { label: 'Paspor Kredit', value: 'Saat lunas' },
    ],
    href: '/app/identitas',
    linkLabel: 'Lihat direktori',
  },
];

const BUILT_FOR_ITEMS = [
  { label: 'Jaringan', name: 'QDay Aevum 44005' },
  { label: 'Pembayaran', name: 'Stablecoin tUSD8' },
  { label: 'Identitas', name: 'Penerima ERC-8004' },
  { label: 'Bebas Gas', name: 'Relayer EIP-712' },
  { label: 'Keamanan', name: 'Foundry + Audit Gemini' },
];

const FAQS = [
  {
    q: 'Apa itu HanumPay secara singkat?',
    a: 'HanumPay mengubah omzet penjualan QR harian di warung atau UMKM menjadi batas modal kerja tUSD8 yang jujur dengan biaya tetap 5%, cicilan otomatis 10% tiap jualan, dan pengecekan identitas pemasok ERC-8004.',
  },
  {
    q: 'Bagaimana batas modal hingga $500 bisa cair tanpa jaminan?',
    a: 'Kontrak AIGuarantor.sol membaca langsung catatan SalesLedger.sol. Toko cukup membuktikan minimal 5 pembeli berbeda dalam 30 hari. Limit modal dihitung otomatis 10% dari total omzet 30 hari, maksimal $500 tUSD8.',
  },
  {
    q: 'Apakah AI bisa menaikkan biaya atau memaksa pinjaman?',
    a: 'Tidak bisa. Biaya tetap 5% dan potongan cicilan 10% dikunci permanen di dalam kode LoanPool.sol. Pemilik toko juga wajib menyetujui lewat tanda tangan EIP-712 dan bisa menjeda akses AI kapan saja.',
  },
  {
    q: 'Mengapa pembayaran pemasok pakai verifikasi ERC-8004?',
    a: 'Salah kirim alamat dompet blockchain tidak bisa ditarik kembali. ERC8004Registry.sol mencocokkan nama pemasok seperti "Pak Joko Distributor" dengan alamat terverifikasi sebelum uang keluar.',
  },
  {
    q: 'Bagaimana jika minggu ini warung sedang sepi pembeli?',
    a: 'Cicilan otomatis ikut berhenti sementara karena potongan hanya terjadi saat ada transaksi QR yang masuk. Tidak ada denda keterlambatan dan tidak ada penagih.',
  },
  {
    q: 'Apa saja yang sudah berjalan di QDay Aevum Testnet?',
    a: 'Koneksi dompet langsung terhubung ke QDay Aevum Testnet (Chain ID 44005) untuk membaca saldo tQDAY & tUSD8 asli, lengkap dengan verifikasi tanda tangan EIP-712, uji serangan Red-Team Gemini, dan simulasi 2 layar.',
  },
];

export default function LandingPage() {
  return (
    <div className="font-landing min-h-screen overflow-x-clip bg-white text-[#151619] antialiased selection:bg-[#9FE8C3] selection:text-[#151619]">
      <LandingHeader />

      {/* 1. HERO BAND (Mint-Emerald #9FE8C3 + Staircase HeroBars) */}
      <section className="relative overflow-hidden bg-[#9FE8C3] text-[#151619]">
        <HeroBars />

        <div className={`${CONTAINER} relative z-10 pt-24 pb-14 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24`}>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-12">
            {/* Left column */}
            <div className="min-w-0">
              <Reveal y={18}>
                <h1 className="text-[44px] sm:text-[72px] xl:text-[90px] leading-[0.98] font-semibold tracking-[-0.05em] text-[#151619]">
                  Modal usaha adil.
                  <br />
                  Cair dari jualan.
                </h1>
              </Reveal>

              <Reveal delay={0.08} y={18}>
                <p className="mt-6 max-w-[42ch] text-[16px] sm:text-[18px] leading-[1.55] font-medium text-[#1C1C1C]/80">
                  HanumPay mencatat penjualan QR harian warung di QDay, memberi limit modal tUSD8
                  lewat Penjaga AI, dan memotong cicilan 10% otomatis tiap ada pembeli.
                </p>
              </Reveal>

              <Reveal delay={0.14} y={18}>
                <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
                  <LaunchButton href="/stage" label="Buka Simulasi Langsung" variant="dark" />
                  <Link
                    href="/app/dashboard"
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#151619] underline decoration-[#151619]/35 underline-offset-4 transition-colors hover:decoration-[#151619] whitespace-nowrap"
                  >
                    <span>Masuk ke dasbor usaha</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>

              {/* Hairline & two protocol figures */}
              <Reveal delay={0.2} y={18}>
                <div className="mt-10 sm:mt-12 grid max-w-[460px] grid-cols-2 gap-6 sm:gap-8 border-t border-[#151619]/15 pt-7 sm:pt-8">
                  <div className="min-w-0">
                    <div className="text-[32px] sm:text-[42px] leading-none font-medium tracking-[-0.04em] text-[#151619] tabular-nums">
                      5.0%
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.45] text-[#1C1C1C]/75">
                      biaya tetap di smart contract vs bunga pinjol 35%+/bulan
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[32px] sm:text-[42px] leading-none font-medium tracking-[-0.04em] text-[#151619] tabular-nums">
                      10%
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.45] text-[#1C1C1C]/75">
                      limit modal dari omzet 30 hari, dicicil otomatis tiap laku
                    </p>
                  </div>
                </div>

                <Link
                  href="/app/docs"
                  className="mt-7 sm:mt-8 inline-flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.12em] uppercase text-[#1C1C1C]/70 transition-colors hover:text-[#151619]"
                >
                  <span>Periksa kontrak QDay 44005 &amp; uji serangan AI</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              </Reveal>
            </div>

            {/* Right column: Kalkulator Kredit QR */}
            <Reveal delay={0.12} y={24} className="min-w-0">
              <HeroCreditCalculator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. LIVE TICKER */}
      <LiveTicker />

      {/* 3. CARA KERJA */}
      <section id="how" className="scroll-mt-16 bg-white">
        <div className={`${CONTAINER} ${SECTION_Y}`}>
          <Reveal>
            <SectionHead
              eyebrow="CARA KERJA"
              title="Modal dihitung dari omzet kasir, bukan rentenir."
              note="Setiap transaksi QR tercatat aman di QDay. Setelah 5 pembeli berbeda bertransaksi dalam 30 hari, AIGuarantor.sol membuka batas modal kerja tUSD8."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <CreditRuler />
          </Reveal>

          {/* 01..04 Numbered rows divided by 1px hairlines */}
          <div className={`mt-14 sm:mt-16 border-t ${RULE}`}>
            {HOW_STEPS.map((step, idx) => (
              <Reveal key={step.num} delay={idx * 0.05}>
                <div
                  className={`grid grid-cols-1 gap-3 border-b ${RULE} py-6 sm:py-7 md:grid-cols-[56px_minmax(0,0.9fr)_minmax(0,1.2fr)] md:items-baseline md:gap-8`}
                >
                  <span className="font-mono text-[13px] text-[#636966] tabular-nums">
                    {step.num}
                  </span>
                  <h3 className="min-w-0 text-[19px] sm:text-[20px] font-medium tracking-[-0.015em] text-[#151619]">
                    {step.title}
                  </h3>
                  <p className="min-w-0 text-[15px] leading-[1.6] text-[#5C6260]">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STICKY COMPARISON SPLIT (#compare, max-w-[1600px]) */}
      <section id="compare" className="scroll-mt-16 bg-white">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          {/* Left Sticky Warm Off-White Display Panel */}
          <div className="min-w-0 bg-[#F5F7F5] px-5 py-14 sm:px-10 md:px-14 lg:sticky lg:top-14 lg:flex lg:h-[calc(100vh-3.5rem)] lg:flex-col lg:justify-between lg:rounded-b-[240px] lg:px-16 lg:py-24">
            <Reveal>
              <Eyebrow>PERBANDINGAN &amp; PENGAMAN</Eyebrow>
              <h2 className="mt-4 sm:mt-5 text-[38px] sm:text-[56px] xl:text-[68px] leading-none font-medium tracking-[-0.035em] text-[#151619]">
                Anti mencekik.
                <br />
                Selalu terukur.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 lg:mt-8 max-w-[34ch] text-[15px] sm:text-[16px] leading-[1.6] text-[#5C6260]">
                64 juta UMKM Indonesia bukan tidak punya omzet—mereka hanya belum punya catatan struk
                digital yang menjaga biaya pinjaman tetap rendah dan adil.
              </p>
            </Reveal>
          </div>

          {/* Right Scrolling Compare Card + Principles */}
          <div className="min-w-0 px-5 py-14 sm:px-10 lg:px-14 lg:py-28">
            <Reveal>
              <CompareCardInteractive />
            </Reveal>

            <div className={`mt-12 sm:mt-14 border-t ${RULE}`}>
              {SAFETY_PRINCIPLES.map((item, idx) => (
                <Reveal key={item.num} delay={idx * 0.06}>
                  <div
                    className={`grid grid-cols-[36px_minmax(0,1fr)] sm:grid-cols-[44px_minmax(0,1fr)] gap-3 sm:gap-4 border-b ${RULE} py-6 sm:py-7`}
                  >
                    <span className="font-mono text-[13px] text-[#636966] tabular-nums pt-1">
                      {item.num}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[19px] sm:text-[20px] font-medium tracking-[-0.015em] text-[#151619]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-[1.6] text-[#5C6260] break-words">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. MODULAR CONTRACTS BAND (#contracts, Mint-Emerald #9FE8C3 + BandArcs) */}
      <section id="contracts" className="relative scroll-mt-16 overflow-hidden bg-[#9FE8C3] text-[#151619]">
        <BandArcs />

        <div className={`${CONTAINER} ${SECTION_Y} relative z-10`}>
          <Reveal>
            <SectionHead
              tone="mint"
              eyebrow="KONTRAK ON-CHAIN"
              title="Empat kontrak teruji. Tanpa titipan pihak ketiga."
              note="Setiap batas pinjaman, saringan pembeli asli, hingga cek identitas pemasok ERC-8004 dijaga langsung oleh Solidity di jaringan QDay."
            />
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {CONTRACT_CARDS.map((card, idx) => (
              <Reveal key={card.name} delay={idx * 0.06} className="h-full min-w-0">
                <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_12px_36px_rgb(15_90_54/0.08)]">
                  <Eyebrow>{card.tag}</Eyebrow>
                  <h3 className="mt-3 text-[20px] sm:text-[22px] font-medium tracking-[-0.02em] text-[#151619] break-words">
                    {card.name}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-[1.6] text-[#5C6260]">
                    {card.summary}
                  </p>

                  {/* 2x2 hairline dl stats */}
                  <dl className={`mt-6 grid grid-cols-2 border-t ${RULE} pt-4 gap-x-4 gap-y-4`}>
                    {card.stats.map((st) => (
                      <div key={st.label} className="min-w-0">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#636966]">
                          {st.label}
                        </dt>
                        <dd className="mt-1 text-[14px] font-medium text-[#151619] tabular-nums">
                          {st.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <Link
                    href={card.href}
                    className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#15803D] underline decoration-[#15803D]/35 underline-offset-4 hover:decoration-[#15803D]"
                  >
                    <span>{card.linkLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ECOSYSTEM TWO-COLUMN SPLIT (White, wired to live LoanPool TVL) */}
      <LiveEcosystemSplit />

      {/* 7. BUILT FOR STRIP (Warm Off-White #F5F7F5) */}
      <section className="border-y border-[#E2E7E4] bg-[#F5F7F5] py-16 lg:py-20">
        <div className={CONTAINER}>
          <Reveal>
            <Eyebrow>DIBANGUN DI QDAY AEVUM TESTNET DENGAN</Eyebrow>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-[#E2E7E4]">
              {BUILT_FOR_ITEMS.map((item) => (
                <div
                  key={item.name}
                  className="min-w-0 border-r border-b border-[#E2E7E4] bg-white/60 px-5 py-5"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#636966]">
                    {item.label}
                  </div>
                  <div className="mt-1.5 text-[16px] font-medium tracking-[-0.015em] text-[#151619]">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="scroll-mt-16 bg-white">
        <div className={`${CONTAINER} ${SECTION_Y}`}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
            <Reveal className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <Eyebrow>TANYA JAWAB</Eyebrow>
              <H2 className="mt-4">Semua pertanyaan terjawab.</H2>
              <p className="mt-4 max-w-[32ch] text-[15px] sm:text-[16px] leading-[1.6] text-[#5C6260]">
                Penjelasan singkat soal catatan QR bebas gas, batas aman Penjaga AI, dan pencairan di QDay.
              </p>
            </Reveal>

            <div className="min-w-0">
              {FAQS.map((faq, idx) => (
                <Reveal key={faq.q} delay={idx * 0.04}>
                  <details className={`group border-t ${RULE} last:border-b`}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 sm:gap-6 py-5 sm:py-6 text-[16px] sm:text-[18px] font-medium tracking-[-0.01em] text-[#151619] [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0">{faq.q}</span>
                      <span
                        aria-hidden="true"
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border ${RULE} text-[#151619] transition-transform duration-200 group-open:rotate-45`}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="pb-6 pr-4 sm:pr-12 text-[15px] leading-[1.65] text-[#5C6260]">
                      {faq.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. CTA AKHIR */}
      <section className="relative overflow-hidden bg-[#151619] text-white">
        <BlockPattern />

        <div className={`${CONTAINER} ${SECTION_Y} relative z-10`}>
          <Reveal>
            <Eyebrow tone="dark">AKTIF DI QDAY TESTNET</Eyebrow>
            <h2 className="mt-5 max-w-[14ch] text-[38px] sm:text-[64px] leading-[1.02] font-medium tracking-[-0.04em] text-white">
              Dibuat untuk warung nyata.
              <br />
              Dijaga langsung oleh kode.
            </h2>

            <div className="mt-10 flex flex-wrap items-center gap-5 sm:gap-6">
              <LaunchButton href="/stage" label="Buka Simulasi Langsung" variant="light" />
              <Link
                href="/app/dashboard"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white whitespace-nowrap"
              >
                <span>Buka dasbor pemilik usaha</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-[#E2E7E4] bg-white py-14 sm:py-16">
        <div
          className={`${CONTAINER} grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_1fr_1fr_1fr]`}
        >
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="text-[19px] font-semibold tracking-[-0.04em] text-[#151619]"
            >
              hanumpay
            </Link>
            <p className="mt-3 max-w-[30ch] text-[14px] leading-[1.6] text-[#5C6260]">
              Modal kerja berbatas kontrak dan jalur bayar pemasok ERC-8004 untuk UMKM Indonesia di QDay Aevum Testnet.
            </p>
          </div>

          <div>
            <Eyebrow>SIMULASI</Eyebrow>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#5C6260]">
              <li>
                <Link href="/stage" className="hover:text-[#151619]">
                  Simulasi 2 Layar Langsung
                </Link>
              </li>
              <li>
                <Link href="/app/dashboard" className="hover:text-[#151619]">
                  Ringkasan Usaha
                </Link>
              </li>
              <li>
                <Link href="/app/penjualan" className="hover:text-[#151619]">
                  Kasir Penjualan QR
                </Link>
              </li>
              <li>
                <Link href="/app/pool" className="hover:text-[#151619]">
                  Pool Dana Komunitas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow>PROTOKOL</Eyebrow>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#5C6260]">
              <li>
                <Link href="/app/pinjaman" className="hover:text-[#151619]">
                  Modal &amp; Bayar Pemasok
                </Link>
              </li>
              <li>
                <Link href="/app/identitas" className="hover:text-[#151619]">
                  Direktori ERC-8004
                </Link>
              </li>
              <li>
                <Link href="/app/docs" className="hover:text-[#151619]">
                  Arsitektur &amp; Uji Serangan
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow>QDAY 44005</Eyebrow>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#5C6260]">
              <li>
                <a
                  href={`${QDAY_EXPLORER_URL}/address/${TUSD8_CONTRACT.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#151619]"
                >
                  <span>Kontrak tUSD8</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={QDAY_FAUCET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#151619]"
                >
                  <span>Faucet Token Uji</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={QDAY_EXPLORER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#151619]"
                >
                  <span>Block Explorer</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
