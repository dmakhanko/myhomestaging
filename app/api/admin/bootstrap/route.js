import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { saveSiteContentToDb } from "@/lib/siteContent";

export async function POST(request) {
  const db = await getDb();
  const doc = await db.collection("admin_config").findOne({ _id: "singleton" });

  if (doc?.password_hash) {
    return Response.json({ detail: "Already initialized" }, { status: 400 });
  }

  const { email, password, initial_content } = await request.json();
  if (!email || !password || password.length < 4) {
    return Response.json({ detail: "Invalid input" }, { status: 422 });
  }

  const password_hash = await hashPassword(password);
  await db.collection("admin_config").updateOne(
    { _id: "singleton" },
    {
      $set: {
        email: email.toLowerCase().trim(),
        password_hash,
        created_at: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  if (initial_content) {
    await saveSiteContentToDb(initial_content);
  }

  return Response.json({ ok: true });
}
