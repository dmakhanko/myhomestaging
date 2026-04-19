import { getDb } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request) {
  const db = await getDb();
  const conf = await db.collection("admin_config").findOne({ _id: "singleton" });

  if (!conf?.password_hash) {
    return Response.json({ detail: "Admin not initialized" }, { status: 400 });
  }

  const { email, password } = await request.json();

  if (conf.email && email.toLowerCase().trim() !== conf.email) {
    return Response.json({ detail: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, conf.password_hash);
  if (!valid) {
    return Response.json({ detail: "Invalid credentials" }, { status: 401 });
  }

  return Response.json({ access_token: createToken(), token_type: "bearer" });
}
