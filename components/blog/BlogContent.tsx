"use client";

import { useMemo } from "react";

/** Escape HTML special characters — every interpolated string passes through
 *  here so tag/attribute breakout is impossible. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SAFE_SCHEMES = /^(https?:|mailto:)/i;

/** URL scheme allow-list: only http(s), mailto, and same-site relative/anchor
 *  hrefs survive. `javascript:`, `data:`, `vbscript:` etc. are dropped. */
function sanitizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  if (url.startsWith("/") || url.startsWith("#")) return url;
  if (!SAFE_SCHEMES.test(url)) return "";
  return url;
}

function escAttr(s: string): string {
  return escapeHtml(s);
}

/** Render inline markdown safely. Links/images are extracted to placeholders
 *  first (escaped + URL-allow-listed), the remaining text is HTML-escaped, then
 *  code/bold/italic wrap already-escaped segments. No raw input reaches HTML. */
function renderInline(text: string): string {
  const placeholders: string[] = [];

  let out = text
    // Images: ![alt](src)
    .replace(/!\[([^\]]*)\]\((https?:[^)\s]+|\/[^\s()]+)\)/g, (_m, alt: string, src: string) => {
      const safe = sanitizeUrl(src);
      if (!safe) return "";
      placeholders.push(
        `<img src="${escAttr(safe)}" alt="${escAttr(alt)}" class="my-4 rounded-xl w-full" loading="lazy" />`
      );
      return `\u0000${placeholders.length - 1}\u0000`;
    })
    // Links: [label](url)
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+|\/[^\s()]+|#[\w-]+|mailto:[^)\s]+)\)/g,
      (_m, label: string, url: string) => {
        const safe = sanitizeUrl(url);
        if (!safe) return escapeHtml(label);
        placeholders.push(
          `<a href="${escAttr(safe)}" target="_blank" rel="noopener noreferrer" class="text-brand-deep underline decoration-brand/30 transition-colors hover:text-brand-magenta hover:decoration-brand-magenta">${escapeHtml(label)}</a>`
        );
        return `\u0000${placeholders.length - 1}\u0000`;
      }
    );

  // Escape all remaining plain text (placeholders stay untouched — \u0000 and
  // digits are not HTML specials).
  out = escapeHtml(out);

  // Inline code / bold / italic on the already-escaped text.
  out = out.replace(/`([^`]+)`/g, (_m, code: string) =>
    `<code class="rounded bg-brand/8 px-1.5 py-0.5 text-[0.85em] text-brand-deep">${code}</code>`
  );
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, (_m, s: string) => `<strong><em>${s}</em></strong>`);
  out = out.replace(/\*\*(.+?)\*\*/g, (_m, s: string) => `<strong class="font-extrabold">${s}</strong>`);
  out = out.replace(/\*([^*\n]+)\*/g, (_m, s: string) => `<em>${s}</em>`);

  // Restore links/images.
  out = out.replace(/\u0000(\d+)\u0000/g, (_m, idx: string) => placeholders[Number(idx)] ?? "");

  return out;
}

/** Minimal, safe Markdown → HTML renderer (no external deps). Exported for
 *  unit tests — never feeds anything back into itself. */
export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let inCode = false;
  const listStack: ("ul" | "ol")[] = [];
  let openLists = 0;

  const closeLists = (target: number) => {
    while (openLists > target) {
      const t = listStack.pop();
      if (t) html.push(`</${t}>`);
      openLists -= 1;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      if (inCode) {
        html.push("</code></pre>");
        inCode = false;
      } else {
        const lang = (line.match(/^```(\w*)/)?.[1] ?? "").replace(/[^a-z0-9]/gi, "");
        html.push(`<pre class="rounded-xl bg-ink/5 p-4 overflow-x-auto text-[0.82rem] leading-relaxed"><code${lang ? ` data-lang="${escAttr(lang)}"` : ""}>`);
        inCode = true;
      }
      i += 1;
      continue;
    }
    if (inCode) {
      html.push(escapeHtml(line));
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      closeLists(0);
      html.push("<hr class=\"my-8 border-ink/10\" />");
      i += 1;
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeLists(0);
      const level = heading[1].length;
      const cls = level <= 2
        ? "mt-10 mb-4 font-display text-[1.4rem] font-extrabold text-ink"
        : "mt-8 mb-3 font-display text-[1.2rem] font-extrabold text-ink";
      html.push(`<h${level} class="${cls}">${renderInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // Blockquote (multi-line)
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      closeLists(0);
      let buf = renderInline(quote[1]);
      i += 1;
      while (i < lines.length) {
        const q = lines[i].match(/^>\s?(.*)$/);
        if (!q) break;
        buf += "<br />" + renderInline(q[1]);
        i += 1;
      }
      html.push(`<blockquote class="my-4 border-l-4 border-brand/40 bg-brand/5 px-4 py-3 text-ink-2 italic">${buf}</blockquote>`);
      continue;
    }

    // Unordered / ordered list
    const ul = line.match(/^(\s*)[*-]\s+(.*)$/);
    const ol = line.match(/^(\s*)\d+\.\s+(.*)$/);
    const item = ul ?? ol;
    if (item) {
      const depth = Math.floor(item[1].length / 2);
      const type = ul ? "ul" : "ol";
      while (openLists < depth + 1) {
        listStack.push(type);
        html.push(`<${type} class="my-4 ml-6 ${type === "ul" ? "list-disc" : "list-decimal"} space-y-1">`);
        openLists += 1;
      }
      if (openLists > depth + 1) {
        closeLists(depth + 1);
        while (openLists < depth + 1) {
          listStack.push(type);
          html.push(`<${type} class="my-4 ml-6 ${type === "ul" ? "list-disc" : "list-decimal"} space-y-1">`);
          openLists += 1;
        }
      }
      html.push(`<li class="text-ink-2">${renderInline(item[2])}</li>`);
      i += 1;
      continue;
    }

    // Paragraph
    closeLists(0);
    if (line.trim()) {
      html.push(`<p class="mb-4 leading-relaxed text-ink-2">${renderInline(line)}</p>`);
    }
    i += 1;
  }

  closeLists(0);
  if (inCode) html.push("</code></pre>");
  return html.join("\n");
}

export function BlogContent({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className="max-w-none font-sans text-[1rem] leading-relaxed text-ink-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}