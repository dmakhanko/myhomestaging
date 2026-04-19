import { requireAuth } from "@/lib/auth";
import { uploadToGridFS } from "@/lib/gridfs";

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ detail: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) return Response.json({ detail: "Empty file" }, { status: 400 });

  const fileId = await uploadToGridFS(buffer, file.name || "media", "image/jpeg");
  const url = `/api/media/${fileId}`;
  return Response.json({ file_id: fileId, url });
}
