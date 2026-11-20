import sharp from "sharp";

/** Matches the exact data-URIs the public forms are allowed to send. */
const DATA_URI_RE = /^data:image\/(?:png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/i;

/** Decoded payload ceiling (mirrors PhotoDataUriSchema). */
const MAX_DECODED_BYTES = 3 * 1024 * 1024;

/** Refuse absurd pixel counts before the decoder allocates anything big. */
const MAX_INPUT_PIXELS = 24_000_000;

/**
 * Re-encodes a user-submitted photo through libvips.
 *
 * Decoding and re-emitting is what makes an upload trustworthy: it proves the
 * bytes really are an image, strips EXIF/GPS metadata, normalises the format to
 * WebP and flattens polyglot payloads that would otherwise be served back to
 * visitors. Returns `null` for anything that is not a decodable image.
 */
export async function normalizePhotoDataUri(
  dataUri: string,
  options: { size?: number; quality?: number } = {}
): Promise<string | null> {
  const match = DATA_URI_RE.exec(dataUri.trim());
  if (!match) return null;

  const input = Buffer.from(match[1], "base64");
  if (input.byteLength === 0 || input.byteLength > MAX_DECODED_BYTES) return null;

  const size = options.size ?? 720;
  const quality = options.quality ?? 82;

  try {
    const pipeline = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
    const meta = await pipeline.metadata();
    if (!meta.width || !meta.height) return null;

    const output = await pipeline
      .rotate()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    if (!output.byteLength) return null;
    return `data:image/webp;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}
