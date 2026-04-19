import { getDb } from "./db";

export async function getSiteContentFromDb() {
  const db = await getDb();
  const doc = await db.collection("site_content").findOne({ _id: "default" });
  return doc?.content || {};
}

export async function saveSiteContentToDb(content) {
  const db = await getDb();
  await db.collection("site_content").updateOne(
    { _id: "default" },
    { $set: { content, updated_at: new Date().toISOString() } },
    { upsert: true }
  );
}

export function deepMerge(base, override) {
  if (Array.isArray(override)) return override;
  if (
    base &&
    typeof base === "object" &&
    override &&
    typeof override === "object"
  ) {
    const out = { ...base };
    for (const [k, v] of Object.entries(override)) {
      out[k] = deepMerge(base[k], v);
    }
    return out;
  }
  return override !== undefined && override !== null ? override : base;
}
