import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXP_HOURS = parseInt(process.env.JWT_EXP_HOURS || "72");

export function createToken() {
  return jwt.sign({ sub: "admin" }, JWT_SECRET, {
    expiresIn: `${JWT_EXP_HOURS}h`,
  });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub === "admin";
  } catch {
    return false;
  }
}

export function getToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

export function requireAuth(request) {
  const token = getToken(request);
  if (!token || !verifyToken(token)) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export const hashPassword = (pwd) => bcrypt.hash(pwd, 10);
export const verifyPassword = (pwd, hash) => bcrypt.compare(pwd, hash);
