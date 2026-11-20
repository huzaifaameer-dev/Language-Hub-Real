/** Shared date formatting for the journal — safe on both the server and client. */
export function formatBlogDate(value: string | null): string {
  if (!value) return "Draft";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
