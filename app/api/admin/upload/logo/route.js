import { requireAuth } from "@/lib/auth";
import { uploadToGridFS, deleteFromGridFS, extractFileId } from "@/lib/gridfs";
import { getSiteContentFromDb, saveSiteContentToDb, deepMerge } from "@/lib/siteContent";

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ detail: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) return Response.json({ detail: "Empty file" }, { status: 400 });

  const current = await getSiteContentFromDb();
  const oldId = extractFileId(current?.brand?.logoUrl);
  await deleteFromGridFS(oldId);

  const contentType = file.type || "image/png";
  const fileId = await uploadToGridFS(buffer, file.name || "logo", contentType);
  const url = `/api/media/${fileId}`;

  await saveSiteContentToDb(deepMerge(current, { brand: { logoUrl: url } }));
  return Response.json({ file_id: fileId, url });
}
