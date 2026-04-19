import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const doc = await db.collection("admin_config").findOne({ _id: "singleton" });
  return Response.json({ password_set: !!(doc?.password_hash) });
}
