/**
 * Conservative HTML sanitizer for blog content.
 *
 * The journal editor is admin-only, but stored HTML is rendered with
 * `dangerouslySetInnerHTML` on the public site — so every save AND every
 * render passes through here. Allowed tags/attributes cover the editor's
 * toolbar (headings, bold/italic/underline, colour, highlight, lists,
 * quotes, code, links, images, alignment, spacing); anything else is
 * dropped instead of being escaped, keeping the author's formatting intact.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "div", "span",
  "h1", "h2", "h3", "h4",
  "strong", "b", "em", "i", "u", "s", "strike", "del", "ins", "mark", "small",
  "ul", "ol", "li", "blockquote", "pre", "code", "hr",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "sup", "sub",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

const GLOBAL_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "background",
  "background-image",
  "font-weight",
  "font-style",
  "font-size",
  "font-family",
  "text-decoration",
  "text-decoration-color",
  "text-align",
  "line-height",
  "letter-spacing",
  "text-transform",
  "border",
  "border-color",
  "border-width",
  "border-style",
  "border-radius",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "box-shadow",
  "display",
  "width",
  "max-width",
  "height",
  "max-height",
  "object-fit",
  "opacity",
]);

/** Only inert values are accepted in a style declaration. */
const STYLE_VALUE = /^[#a-zA-Z0-9\s.,%()\-+/'"*!]*$/;

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeStyle(raw: string): string {
  return raw
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(":");
      if (idx === -1) return "";
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1).trim();
      if (!GLOBAL_STYLE_PROPS.has(prop)) return "";
      if (!STYLE_VALUE.test(value)) return "";
      if (/url\s*\(/i.test(value)) return "";
      return `${prop}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

function parseAttrs(raw: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    out.push([name, value]);
  }
  return out;
}

function sanitizeAttrs(tag: string, raw: string): string {
  const kept: string[] = [];

  for (const [name, value] of parseAttrs(raw)) {
    if (!name || name.startsWith("on")) continue;
    if (name === "class") continue;

    if (name === "style") {
      const safe = sanitizeStyle(value);
      if (safe) kept.push(`style="${escapeAttr(safe)}"`);
      continue;
    }

    if (tag === "a" && ["href", "title", "target", "rel"].includes(name)) {
      if (name === "href" && !SAFE_URL.test(value.trim())) continue;
      if (name === "target" && value !== "_blank") continue;
      kept.push(`${name}="${escapeAttr(value)}"`);
      continue;
    }

    if (tag === "img" && ["src", "alt", "title", "width", "height"].includes(name)) {
      const isData = /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(value.trim());
      if (name === "src" && !isData && !SAFE_URL.test(value.trim())) continue;
      kept.push(`${name}="${escapeAttr(value)}"`);
      continue;
    }

    if ((tag === "td" || tag === "th") && ["colspan", "rowspan"].includes(name)) {
      if (!/^\d{1,2}$/.test(value)) continue;
      kept.push(`${name}="${value}"`);
      continue;
    }

    if (["colspan", "rowspan", "span"].includes(name)) continue;
  }

  if (tag === "a" && kept.some((a) => a.startsWith("href=")) && !kept.some((a) => a.startsWith("rel="))) {
    kept.push('rel="noopener noreferrer nofollow"');
  }

  return kept.length ? ` ${kept.join(" ")}` : "";
}

export function sanitizeBlogHtml(input: string): string {
  if (!input) return "";

  let html = input
    // never keep executable or embedding elements
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button|link|meta|base|svg|math)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button|link|meta|base|svg|math)\b[^>]*\/?>/gi, "");

  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (match, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const closing = match.startsWith("</");
    if (closing) return `</${tag}>`;
    const selfClosing = /\/\s*$/.test(rawAttrs);
    const attrs = sanitizeAttrs(tag, rawAttrs.replace(/\/\s*$/, ""));
    if (VOID_TAGS.has(tag) || selfClosing) return `<${tag}${attrs}>`;
    return `<${tag}${attrs}>`;
  });

  return html.trim();
}

/** Plain-text projection — used for excerpts, meta descriptions and search. */
export function blogText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeExcerpt(html: string, max = 220): string {
  const text = blogText(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function estimateReadMinutes(html: string): number {
  const words = blogText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
