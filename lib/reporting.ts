export interface ReportErrorInput {
  level: "error" | "warning";
  scope: string;
  message: string;
  stack?: string | null;
  url?: string | null;
  tag?: string | null;
}

/** Persist a captured client/server error to the `errors` collection.
 *  Never throws: reporting must not take the app down when Mongo is unreachable. */
export async function reportError(input: ReportErrorInput): Promise<void> {
  try {
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    await db.collection("errors").insertOne({
      ...input,
      createdAt: new Date(),
    });
  } catch {
    // observational only
  }
}