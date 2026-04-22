import { requireAuth } from "@/lib/auth";
import { getSiteContentFromDb, saveSiteContentToDb } from "@/lib/siteContent";

const OLD_PREFIX = "https://fursova-staging-production.up.railway.app/api/media/";
const NEW_PREFIX = "/api/media/";

function fixUrls(value, log) {
  if (typeof value === "string") {
    if (value.startsWith(OLD_PREFIX)) {
      const fixed = NEW_PREFIX + value.slice(OLD_PREFIX.length);
      log.push({ from: value, to: fixed });
      return fixed;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => fixUrls(v, log));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = fixUrls(v, log);
    return out;
  }
  return value;
}

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const content = await getSiteContentFromDb();
  const log = [];
  const fixed = fixUrls(content, log);

  if (log.length === 0) {
    return Response.json({ ok: true, message: "No Railway URLs found", changes: [] });
  }

  await saveSiteContentToDb(fixed);
  return Response.json({ ok: true, message: `Fixed ${log.length} URL(s)`, changes: log });
}
