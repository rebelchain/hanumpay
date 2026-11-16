import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const CONTAINER = 'mx-auto w-full max-w-[1240px] px-5 sm:px-10';
export const SECTION_Y = 'py-24 lg:py-32';
export const RULE = 'border-[#E2E7E4]';

export function Eyebrow({
  children,
  tone = 'light',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'mint' | 'dark';
  className?: string;
}) {
  const toneClass =
    tone === 'mint'
      ? 'text-[#1C1C1C]/65'
      : tone === 'dark'
        ? 'text-[#9FE8C3]/85'
        : 'text-[#636966]';

  return (
    <p
      className={`font-mono text-[12px] tracking-[0.14em] uppercase ${toneClass} ${className}`}
    >
      {children}
    </p>
  );
}

export function H2({
  children,
  tone = 'light',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'mint' | 'dark';
  className?: string;
}) {
  const toneClass = tone === 'dark' ? 'text-white' : 'text-[#151619]';
  return (
    <h2
      className={`text-[38px] sm:text-[52px] leading-[1.05] font-medium tracking-[-0.035em] max-w-[18ch] ${toneClass} ${className}`}
    >
      {children}
    </h2>
  );
}

export function SectionHead({
  eyebrow,
  title,
  note,
  tone = 'light',
}: {
  eyebrow: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  tone?: 'light' | 'mint' | 'dark';
}) {
  const noteClass =
    tone === 'mint'
      ? 'text-[#1C1C1C]/75'
      : tone === 'dark'
        ? 'text-white/70'
        : 'text-[#5C6260]';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
      <div>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <H2 tone={tone} className="mt-4">
          {title}
        </H2>
      </div>
      {note ? (
        <p className={`max-w-[40ch] text-[16px] leading-[1.6] lg:justify-self-end ${noteClass}`}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

export function LaunchButton({
  href,
  label,
  variant = 'dark',
  className = '',
}: {
  href: string;
  label: string;
  variant?: 'dark' | 'light';
  className?: string;
}) {
  const variantClass =
    variant === 'light'
      ? 'bg-white text-[#151619] hover:bg-[#E8FAF0]'
      : 'bg-[#151619] text-white hover:bg-[#24282D]';

  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-between rounded-xl px-6 py-3.5 text-[16px] font-semibold tracking-[-0.01em] whitespace-nowrap transition-colors duration-200 ${variantClass} ${className}`}
    >
      <span>{label}</span>
      <ArrowRight
        className="ml-8 h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
        strokeWidth={2.2}
      />
    </Link>
  );
}

/**
 * Staircase static bar geometry on the right edge of the Mint Hero band (#9FE8C3 -> #BDEFD6 bars).
 */
export function HeroBars() {
  const bars = [
    { top: '0%', left: '54%', width: '6%' },
    { top: '0%', left: '65%', width: '9%' },
    { top: '0%', left: '80%', width: '5%' },
    { top: '16%', left: '59%', width: '6%' },
    { top: '16%', left: '69%', width: '10%' },
    { top: '16%', left: '84%', width: '4%' },
    { top: '34%', left: '74%', width: '9%' },
    { top: '34%', left: '89%', width: '6%' },
    { top: '52%', left: '89%', width: '5%' },
    { top: '52%', left: '95%', width: '5%' },
    { top: '70%', left: '72%', width: '9%' },
    { top: '70%', left: '85%', width: '9%' },
    { top: '86%', left: '64%', width: '6%' },
    { top: '86%', left: '76%', width: '14%' },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden select-none lg:block"
    >
      {bars.map((bar, idx) => (
        <div
          key={idx}
          className="absolute h-[9.5vw] max-h-[136px] bg-[#BDEFD6]"
          style={{
            top: bar.top,
            left: bar.left,
            width: bar.width,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Three subtle giant circles anchored along the top edge of the Mint Contracts band.
 */
export function BandArcs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <div className="absolute -top-[420px] left-[4%] h-[900px] w-[900px] rounded-full border border-white/25 bg-white/[0.06]" />
      <div className="absolute -top-[460px] left-[32%] h-[900px] w-[900px] rounded-full border border-white/20 bg-white/[0.04]" />
      <div className="absolute -top-[380px] -right-[14%] h-[900px] w-[900px] rounded-full border border-white/25 bg-white/[0.06]" />
    </div>
  );
}

/**
 * Mint-emerald staircase pattern bleeding off the top-right corner of the Final Dark CTA (#151619).
 */
export function BlockPattern() {
  const blocks = [
    { top: '0%', right: '26%', width: '5.5%', tone: 'bg-[#9FE8C3]' },
    { top: '0%', right: '14%', width: '7.5%', tone: 'bg-[#BDEFD6]' },
    { top: '0%', right: '2%', width: '6%', tone: 'bg-[#9FE8C3]' },
    { top: '22%', right: '32%', width: '4.5%', tone: 'bg-[#BDEFD6]' },
    { top: '22%', right: '21%', width: '6.5%', tone: 'bg-[#9FE8C3]' },
    { top: '22%', right: '10%', width: '7%', tone: 'bg-[#9FE8C3]' },
    { top: '44%', right: '36%', width: '4.5%', tone: 'bg-[#9FE8C3]' },
    { top: '44%', right: '24%', width: '7.5%', tone: 'bg-[#BDEFD6]' },
    { top: '44%', right: '15%', width: '6%', tone: 'bg-[#9FE8C3]' },
    { top: '66%', right: '28%', width: '6.5%', tone: 'bg-[#9FE8C3]' },
    { top: '66%', right: '12%', width: '10%', tone: 'bg-[#9FE8C3]' },
    { top: '66%', right: '0%', width: '8%', tone: 'bg-[#BDEFD6]' },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden select-none lg:block"
    >
      {blocks.map((block, idx) => (
        <div
          key={idx}
          className={`absolute h-[22%] ${block.tone}`}
          style={{
            top: block.top,
            right: block.right,
            width: block.width,
          }}
        />
      ))}
    </div>
  );
}
