/**
 * Custom Next.js image loader.
 *
 * Language Hub serves all its images from the same origin (blog covers under
 * /uploads/..., avatars, etc.), already re-compressed to WebP at upload time.
 * There is no external image CDN, so we bypass Next's optimization pipeline and
 * hand the browser the original URL — the built-in optimizer would only add a
 * round-trip for images we've already sized on the way in.
 */
const imageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  // Data URLs (temporary avatars / previews before upload) pass through as-is.
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  // Keep the existing width/quality params; next/image supplies the query we
  // intentionally ignore because the images are pre-optimized on upload.
  void width;
  void quality;

  // Absolute external URLs (rare) pass through untouched.
  if (src.startsWith("http://") || src.startsWith("https://")) return src;

  // Same-origin path — return it directly.
  return src;
};

export default imageLoader;
