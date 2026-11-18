'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

export interface TechnicalDetailItem {
  label: string;
  value: string;
  href?: string;
}

export default function TechnicalDetailsToggle({
  label = 'Technical Details',
  items,
  children,
  dark = false,
  defaultOpen = false,
}: {
  label?: string;
  items?: TechnicalDetailItem[];
  children?: React.ReactNode;
  dark?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        dark
          ? 'border-white/15 bg-white/[0.04]'
          : 'border-[#E2E7E4] bg-[#F7F8F9]'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-medium cursor-pointer transition-colors ${
          dark
            ? 'text-white/75 hover:text-white'
            : 'text-[#5C6260] hover:text-[#151619]'
        }`}
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`px-3.5 pb-3 pt-1 space-y-2 border-t text-xs ${
            dark ? 'border-white/10 text-white/80' : 'border-[#E2E7E4] text-[#5C6260]'
          }`}
        >
          {items &&
            items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 py-0.5"
              >
                <span className={dark ? 'text-white/55' : 'text-[#636966]'}>{item.label}</span>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 font-mono truncate max-w-[220px] hover:underline ${
                      dark ? 'text-[#9FE8C3]' : 'text-[#15803D]'
                    }`}
                  >
                    <span className="truncate">{item.value}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span
                    className={`font-mono tabular-nums truncate max-w-[240px] ${
                      dark ? 'text-white/90' : 'text-[#151619]'
                    }`}
                  >
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          {children}
        </div>
      )}
    </div>
  );
}
