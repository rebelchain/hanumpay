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
  title: 'HanumPay — Working Capital Credit & Verified Payee Layer for MSMEs',
  description:
    'On-chain working capital credit, ERC-8004 Confirmation of Payee, and verified QR sales ledger for small merchants on QDay Aevum Testnet.',
  openGraph: {
    title: 'HanumPay — Working Capital Credit & Verified Payee Layer for MSMEs',
    description:
      'Turn daily QR sales into fair tUSD8 working capital limits guarded by smart-contract AI constraints and ERC-8004 payee verification.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HanumPay — Working Capital Credit & Verified Payee Layer for MSMEs',
    description:
      'Turn daily QR sales into fair tUSD8 working capital limits guarded by smart-contract AI constraints and ERC-8004 payee verification.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning className="min-h-screen bg-[#F9FAFB] text-slate-900">
        <HanumPayProvider>{children}</HanumPayProvider>
      </body>
    </html>
  );
}
