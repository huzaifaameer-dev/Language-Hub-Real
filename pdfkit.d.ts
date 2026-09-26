/**
 * Minimal typings for pdfkit (0.20.x ships no bundled .d.ts). Only the surface
 * used by lib/registration-pdf.ts is declared. This file must stay a global
 * script (no top-level imports) so `declare module` creates an ambient module.
 */
declare module "pdfkit" {
  export interface PDFDocumentOptions {
    size?: string | [number, number];
    layout?: "portrait" | "landscape";
    margin?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    info?: Record<string, string>;
    bufferPages?: boolean;
    autoFirstPage?: boolean;
  }

  export interface PDFTextOptions {
    width?: number;
    height?: number;
    align?: "left" | "center" | "right" | "justify";
    lineBreak?: boolean;
    continued?: boolean;
    features?: string[];
    indent?: number;
    wordSpacing?: number;
    characterSpacing?: number;
    underline?: boolean;
    strikethrough?: boolean;
    link?: string;
    baseline?: string;
    ellipsis?: boolean;
  }

  export interface PDFImageOptions {
    width?: number;
    height?: number;
    fit?: [number, number];
    align?: "left" | "center" | "right";
    valign?: "top" | "center" | "bottom";
    cover?: [number, number];
  }

  export default class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    page: { width: number; height: number };
    pageCount: number;

    font(font: string | Buffer): this;
    fontSize(size: number): this;
    fillColor(color: string | number): this;
    fillOpacity(opacity: number): this;
    strokeColor(color: string | number): this;
    strokeOpacity(opacity: number): this;
    lineWidth(width: number): this;
    lineCap(cap: "butt" | "round" | "square"): this;
    dash(length: number, options?: { space?: number }): this;
    underlineDashes(): this;

    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    rect(x: number, y: number, w: number, h: number): this;
    roundedRect(x: number, y: number, w: number, h: number, r: number): this;
    circle(x: number, y: number, r: number): this;
    polygon(...points: Array<[number, number]>): this;
    stroke(): this;
    fill(color?: string | number, rule?: "nonzero" | "evenodd"): this;
    fillAndStroke(fillColor?: string | number, strokeColor?: string | number, rule?: "nonzero" | "evenodd"): this;
    clip(): this;
    save(): this;
    restore(): this;
    rotate(angle: number, options?: { origin?: [number, number] | string }): this;
    scale(factor: number, options?: { origin?: [number, number] }): this;
    translate(x: number, y: number): this;

    text(text: string, x?: number | PDFTextOptions, y?: number | PDFTextOptions, options?: PDFTextOptions): this;
    widthOfString(text: string, options?: PDFTextOptions): number;
    heightOfString(text: string, options?: PDFTextOptions): number;
    moveDown(lines?: number): this;
    moveUp(lines?: number): this;

    image(src: string | Buffer, x?: number | PDFImageOptions, y?: number | PDFImageOptions, options?: PDFImageOptions): this;

    addPage(options?: PDFDocumentOptions): this;
    end(): this;
    on(event: "data" | "end" | "error", cb: (data?: unknown) => void): this;
    pipe(dest: NodeJS.WritableStream): this;
  }
}