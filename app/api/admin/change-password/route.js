import { getDb } from "@/lib/db";
import { requireAuth, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const db = await getDb();
  const conf = await db.collection("admin_config").findOne({ _id: "singleton" });
  if (!conf?.password_hash) {
    return Response.json({ detail: "Admin not initialized" }, { status: 400 });
  }

  const { current_password, new_password } = await request.json();
  if (!new_password || new_password.length < 4) {
    return Response.json({ detail: "Password too short" }, { status: 422 });
  }

  const valid = await verifyPassword(current_password, conf.password_hash);
  if (!valid) {
    return Response.json({ detail: "Current password is incorrect" }, { status: 401 });
  }

  const new_hash = await hashPassword(new_password);
  await db.collection("admin_config").updateOne(
    { _id: "singleton" },
    { $set: { password_hash: new_hash, updated_at: new Date().toISOString() } }
  );

  return Response.json({ ok: true });
}
