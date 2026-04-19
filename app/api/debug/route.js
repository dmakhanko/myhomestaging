import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    return Response.json({ ok: true, collections: collections.map((c) => c.name) });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
