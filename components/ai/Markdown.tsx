"use client";

import { Fragment } from "react";

/**
 * Minimal, dependency-free markdown renderer for AI output (headings, lists,
 * bold/italic/code, blockquotes, tables and paragraphs). Deliberately small so
 * AI-generated text never renders raw HTML or executes anything.
 */
export function Markdown({ text }: { text: string }) {
  const blocks = splitBlocks(text);
  return (
    <div className="space-y-3 text-[0.92rem] leading-relaxed text-ink">
      {blocks.map((b, i) => (
        <Fragment key={i}>{renderBlock(b)}</Fragment>
      ))}
    </div>
  );
}

function splitBlocks(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
}

function renderInline(line: string, keyPrefix: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={`${keyPrefix}-${k++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={`${keyPrefix}-${k++}`} className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.84em]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("~~")) {
      parts.push(<del key={`${keyPrefix}-${k++}`}>{token.slice(2, -2)}</del>);
    } else {
      parts.push(<em key={`${keyPrefix}-${k++}`}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

function isTableBlock(block: string): boolean {
  const lines = block.split("\n").map((l) => l.trim());
  return lines.length >= 2 && /^\|.*\|$/.test(lines[0]) && /^[\s|:\-]+$/.test(lines[1]);
}

function renderBlock(block: string): React.ReactNode {
  const lines = block.split("\n").map((l) => l.trim());

  // Table
  if (isTableBlock(block)) {
    const header = lines[0].split("|").map((c) => c.trim()).filter(Boolean);
    const rows = lines.slice(2).map((l) => l.split("|").map((c) => c.trim()).filter(Boolean));
    return (
      <div className="overflow-x-auto rounded-xl border border-ink/10">
        <table className="w-full text-[0.85rem]">
          <thead>
            <tr className="bg-ink/[0.04] text-left">
              {header.map((h, i) => (
                <th key={i} className="px-3 py-2 font-display font-bold text-ink">
                  {renderInline(h, `th-${i}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-ink/[0.06]">
                {r.map((c, ci) => (
                  <td key={ci} className="px-3 py-2 text-ink-2">
                    {renderInline(c, `td-${ri}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Heading
  const h = block.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const text = renderInline(h[2], "h");
    const cls = "font-display font-extrabold tracking-[-0.01em] text-ink";
    if (h[1].length === 1) return <h2 className={`${cls} text-[1.15rem]`}>{text}</h2>;
    if (h[1].length === 2) return <h3 className={`${cls} text-[1.02rem]`}>{text}</h3>;
    if (h[1].length === 3) return <h4 className={`${cls} text-[0.95rem]`}>{text}</h4>;
    return <h5 className={`${cls} text-[0.9rem]`}>{text}</h5>;
  }

  // UL list (all lines match list markers)
  if (lines.every((l) => /^[-*•]\s+/.test(l))) {
    return (
      <ul className="space-y-1.5 pl-1">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-deep" />
            <span>{renderInline(l.replace(/^[-*•]\s+/, ""), `li-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // OL list
  if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
    return (
      <ol className="space-y-1.5 pl-1">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="font-mono text-[0.8rem] font-bold text-brand-deep">
              {parseInt(l, 10) || i + 1}.
            </span>
            <span>{renderInline(l.replace(/^\d+[.)]\s+/, ""), `oli-${i}`)}</span>
          </li>
        ))}
      </ol>
    );
  }

  // Blockquote
  if (block.startsWith(">")) {
    return (
      <blockquote className="border-l-4 border-brand/30 bg-brand/[0.05] px-4 py-3 text-ink-2">
        {renderInline(block.replace(/^>\s?/, ""), "bq")}
      </blockquote>
    );
  }

  // Ruler
  if (/^([-*_]\s*){3,}$/.test(block)) {
    return <hr className="border-ink/10" />;
  }

  return <p>{renderInline(block, "p")}</p>;
}