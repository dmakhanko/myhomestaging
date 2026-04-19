import { requireAuth } from "@/lib/auth";
import { getSiteContentFromDb, saveSiteContentToDb, deepMerge } from "@/lib/siteContent";

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const content = await getSiteContentFromDb();
  return Response.json({ content });
}

export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { content } = await request.json();
  await saveSiteContentToDb(content);
  return Response.json({ ok: true });
}

export async function PATCH(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { patch } = await request.json();
  const current = await getSiteContentFromDb();
  const merged = deepMerge(current, patch);
  await saveSiteContentToDb(merged);
  return Response.json({ ok: true });
}
