import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Tenant-private uploads root — never served by the static public dir. On
 * serverless platforms (Vercel) the runtime filesystem is read-only, so
 * `saveDataUriUpload`/`savePdf` transparently fall back to keeping the raw
 * bytes (base64 data-URI) so callers persist them in Mongo instead.
 */
const PRIVATE_DIR = path.join(process.cwd(), "private");

/**
 * What save helpers hand back. `ref` is either a tenant-relative path (e.g.
 * `registrations/LH-.../photo.webp`, disk mode) or a literal data-URI (db
 * mode). Everything downstream reads it through `readPrivateFile`, which
 * handles both shapes.
 */
export interface StoredFile {
  ref: string;
  mime: string;
  mode: "disk" | "db";
}

export function registrationFolder(ref: string): string {
  return path.join(PRIVATE_DIR, "registrations", ref);
}

/** Split a `data:<mime>;base64,...` URI into its MIME type and bytes. */
export function dataUriParts(uri: string): { mime: string; buffer: Buffer } {
  const semicolon = uri.indexOf(";");
  const comma = uri.indexOf(",");
  const mime = uri.slice(5, semicolon > 5 ? semicolon : undefined);
  const b64 = uri.slice(comma + 1);
  return { mime, buffer: Buffer.from(b64, "base64") };
}

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "application/pdf") return "pdf";
  return "webp";
}

function mimeForExt(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "pdf":
      return "application/pdf";
    default:
      return "image/webp";
  }
}

/**
 * Writes an uploaded data-URI into the tenant-private folder for a
 * registration reference. When the filesystem is not writable (serverless),
 * the original data-URI is returned as-is so the caller stores it in the DB —
 * a registration must never fail because a disk write was denied.
 */
export async function saveDataUriUpload(
  ref: string,
  field: string,
  uri: string
): Promise<StoredFile> {
  const { mime, buffer } = dataUriParts(uri);
  const rel = `registrations/${ref}/${field}.${extForMime(mime)}`;
  try {
    await mkdir(registrationFolder(ref), { recursive: true });
    await writeFile(path.join(registrationFolder(ref), `${field}.${extForMime(mime)}`), buffer);
    return { ref: rel, mime, mode: "disk" };
  } catch {
    return { ref: uri, mime, mode: "db" };
  }
}

/** Writes a generated PDF summary; falls back to storing it as a data-URI. */
export async function savePdf(ref: string, buffer: Buffer): Promise<StoredFile> {
  try {
    const dir = registrationFolder(ref);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "summary.pdf"), buffer);
    return { ref: `registrations/${ref}/summary.pdf`, mime: "application/pdf", mode: "disk" };
  } catch {
    return {
      ref: `data:application/pdf;base64,${buffer.toString("base64")}`,
      mime: "application/pdf",
      mode: "db",
    };
  }
}

/** Resolve a stored disk path safely — rejects anything escaping private/. */
export function resolvePrivateFile(rel: string): string | null {
  const base = path.resolve(PRIVATE_DIR);
  const target = path.resolve(base, rel);
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}

/**
 * Read a stored file back. Accepts either a disk-relative path or a data-URI
 * (serverless fallback), so callers never need to know how it was persisted.
 */
export async function readPrivateFile(
  stored: string
): Promise<{ buffer: Buffer; mime: string } | null> {
  if (stored.startsWith("data:")) {
    try {
      const { mime, buffer } = dataUriParts(stored);
      return { buffer, mime };
    } catch {
      return null;
    }
  }
  const file = resolvePrivateFile(stored);
  if (!file) return null;
  try {
    const buffer = await readFile(file);
    const ext = path.extname(file).toLowerCase().replace(/^\./, "");
    return { buffer, mime: mimeForExt(ext) };
  } catch {
    return null;
  }
}