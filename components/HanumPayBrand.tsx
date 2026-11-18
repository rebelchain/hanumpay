import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type BrandVariant = 'light' | 'dark' | 'mint';

interface HanumPayBrandProps {
  href?: string;
  variant?: BrandVariant;
  size?: number;
  alwaysShowText?: boolean;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export function HanumPayBrand({
  href = '/',
  variant = 'light',
  size = 30,
  alwaysShowText = false,
  label = 'HanumPay',
  className = '',
  onClick,
}: HanumPayBrandProps) {
  const frameClasses =
    variant === 'dark'
      ? 'bg-white ring-1 ring-white/15 shadow-xs'
      : variant === 'mint'
        ? 'bg-white/95 ring-1 ring-[#151619]/10 shadow-xs'
        : 'bg-white ring-1 ring-[#151619]/10';

  const textClasses =
    variant === 'dark' ? 'text-white' : 'text-[#151619]';

  const content = (
    <span className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      <span
        className={`relative inline-flex items-center justify-center rounded-lg p-0.5 overflow-hidden shrink-0 transition-transform duration-200 ${frameClasses}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/hanumpay-logo.png"
          alt="HanumPay logo"
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          priority
        />
      </span>
      <span
        className={`text-[18px] font-semibold tracking-[-0.03em] whitespace-nowrap ${textClasses} ${
          alwaysShowText ? 'inline' : 'hidden sm:inline'
        }`}
      >
        {label}
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="HanumPay Home"
      className="inline-flex items-center shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D]"
    >
      {content}
    </Link>
  );
}
