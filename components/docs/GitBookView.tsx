"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface DocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractMarkdownHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  let inCodeBlock = false;
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      headings.push({ id: slugifyHeading(text), text, level: 2 });
    } else if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      headings.push({ id: slugifyHeading(text), text, level: 3 });
    }
  }
  return headings;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`b-${key++}`} className="font-semibold text-[#151619]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`c-${key++}`}
          className="rounded-md bg-[#F5F7F5] border border-[#E2E7E4] px-1.5 py-0.5 font-mono text-[12px] text-[#151619]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function GitBookCodeBlock({
  code,
  language = "solidity",
  filename,
  showLineNumbers = true,
}: {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  async function handleCopy() {
    await navigator.clipboard?.writeText(code).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-2xl border border-[#E2E7E4] bg-[#F5F7F5] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-[#E2E7E4]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center rounded-md bg-[#E8FAF0] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#15803D] font-semibold shrink-0">
            {language}
          </span>
          {filename && (
            <span className="font-mono text-xs text-[#5C6260] truncate">
              {filename}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E7E4] bg-white px-2.5 py-1 text-xs font-medium text-[#151619] hover:bg-[#E8FAF0] transition-colors shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#5C6260]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.65] text-[#151619]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/70">
                {showLineNumbers && (
                  <td className="select-none pr-4 text-right text-[11px] text-[#636966]/70 tabular-nums align-top w-8">
                    {idx + 1}
                  </td>
                )}
                <td className="whitespace-pre align-top">{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GitBookMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <div key={`code-${blockKey++}`} className="my-4">
          <GitBookCodeBlock
            code={codeLines.join("\n")}
            language={lang}
            showLineNumbers={false}
          />
        </div>,
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      const text = trimmed.slice(2).trim();
      blocks.push(
        <h2
          key={`h1-${blockKey++}`}
          className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-[#151619] pt-2 pb-2 border-b border-[#E2E7E4]"
        >
          {renderInlineFormatting(text)}
        </h2>,
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3).trim();
      blocks.push(
        <h3
          key={`h2-${blockKey++}`}
          id={slugifyHeading(text)}
          className="scroll-mt-20 text-lg font-semibold tracking-[-0.02em] text-[#151619] pt-4"
        >
          {renderInlineFormatting(text)}
        </h3>,
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4).trim();
      blocks.push(
        <h4
          key={`h3-${blockKey++}`}
          id={slugifyHeading(text)}
          className="scroll-mt-20 text-base font-semibold text-[#151619] pt-3"
        >
          {renderInlineFormatting(text)}
        </h4>,
      );
      i++;
      continue;
    }

    // Markdown pipe table
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith("|")
    ) {
      const parseRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());

      const headers = parseRow(lines[i]);
      i += 2; // skip header & separator row
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      blocks.push(
        <div
          key={`tbl-${blockKey++}`}
          className="my-4 overflow-x-auto rounded-xl border border-[#E2E7E4] bg-white"
        >
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E2E7E4] bg-[#F5F7F5]">
                {headers.map((h, idx) => (
                  <th
                    key={idx}
                    className="py-2.5 px-4 font-semibold text-xs text-[#151619] whitespace-nowrap"
                  >
                    {renderInlineFormatting(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7E4]">
              {rows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#F5F7F5]/60">
                  {r.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2.5 px-4 text-[13px] text-[#5C6260] align-top"
                    >
                      {renderInlineFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2).trim());
        i++;
      }
      blocks.push(
        <ul
          key={`ul-${blockKey++}`}
          className="space-y-2 pl-5 list-disc marker:text-[#15803D]"
        >
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-[14.5px] leading-[1.65] text-[#5C6260]"
            >
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol
          key={`ol-${blockKey++}`}
          className="space-y-2 pl-5 list-decimal marker:font-mono marker:text-xs marker:font-semibold marker:text-[#15803D]"
        >
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-[14.5px] leading-[1.65] text-[#5C6260]"
            >
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (collect consecutive text lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("|") &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p
        key={`p-${blockKey++}`}
        className="text-[14.5px] leading-[1.7] text-[#5C6260]"
      >
        {renderInlineFormatting(paraLines.join(" "))}
      </p>,
    );
  }

  return <div className="space-y-4">{blocks}</div>;
}
