import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../components/blog/BlogContent";

describe("renderMarkdown (XSS hardening)", () => {
  it("strips javascript: URLs from links", () => {
    const html = renderMarkdown("[click me](javascript:alert(1))");
    // No anchor is emitted — the payload is neutralized to inert plain text.
    expect(html).not.toContain("<a");
    expect(html).not.toContain("href=");
  });

  it("strips data: and vbscript: URLs", () => {
    expect(renderMarkdown("[x](data:text/html,<script>alert(1)</script>)")).not.toContain("<a");
    expect(renderMarkdown("[x](vbscript:msgbox(1))")).not.toContain("<a");
  });

  it("escapes raw HTML injected via markdown", () => {
    const html = renderMarkdown("**bold <img src=x onerror=alert(1)> tail**");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("escapes tag breakout in headings", () => {
    const html = renderMarkdown("# Head <script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("allows safe https links", () => {
    const html = renderMarkdown("[official](https://www.ielts.org)");
    expect(html).toContain("href=\"https://www.ielts.org\"");
    expect(html).toContain(">official</a>");
  });

  it("allows same-site relative links and images", () => {
    expect(renderMarkdown("[about](/about)")).toContain("href=\"/about\"");
    expect(renderMarkdown("![cover](/uploads/blog/x.webp)")).toContain(
      "<img src=\"/uploads/blog/x.webp\""
    );
  });

  it("escapes alt text on images", () => {
    const html = renderMarkdown("![x\"><img src=x onerror=alert(1)>](https://img.com/a.png)");
    // The attempt to inject a second <img> via the alt attribute is neutralized:
    // the payload is escaped text inside the quoted attribute.
    expect(html).toContain("&quot;&gt;&lt;img");
    expect(html).not.toContain('alt=""><img');
    expect((html.match(/<img\b/g) ?? []).length).toBe(1);
  });

  it("escapes markdown-adjacent HTML in code blocks", () => {
    const html = renderMarkdown("```\n<script>alert(1)</script>\n```");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("renders headings, lists, bold and paragraphs", () => {
    const html = renderMarkdown("# Title\n\n- one\n- two\n\n**bold** text");
    expect(html).toContain("<h1");
    expect(html).toContain("<ul");
    expect(html).toContain("<strong");
    expect(html).toContain("<p");
  });
});