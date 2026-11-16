import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono, Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { HanumPayProvider } from '@/lib/hanumpay-store';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'HanumPay — Modal Usaha & Pembayaran QR Aman untuk UMKM',
  description:
    'Modal kerja jujur, verifikasi penerima ERC-8004, dan catatan penjualan QR harian untuk UMKM Indonesia di Jaringan QDay Aevum Testnet.',
  openGraph: {
    title: 'HanumPay — Modal Usaha & Pembayaran QR Aman untuk UMKM',
    description:
      'Ubah omzet QR harian jadi batas modal kerja tUSD8 yang adil, diawasi Penjaga AI dan verifikasi penerima ERC-8004.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HanumPay — Modal Usaha & Pembayaran QR Aman untuk UMKM',
    description:
      'Ubah omzet QR harian jadi batas modal kerja tUSD8 yang adil, diawasi Penjaga AI dan verifikasi penerima ERC-8004.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${dmSans.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning className="min-h-screen bg-[#F9FAFB] text-slate-900">
        <HanumPayProvider>{children}</HanumPayProvider>
      </body>
    </html>
  );
}
