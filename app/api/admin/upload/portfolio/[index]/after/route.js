import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { uploadToGridFS, deleteFromGridFS, extractFileId } from "@/lib/gridfs";
import { getSiteContentFromDb, saveSiteContentToDb, deepMerge } from "@/lib/siteContent";

export async function POST(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { index: indexStr } = await params;
  const index = parseInt(indexStr);
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ detail: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) return Response.json({ detail: "Empty file" }, { status: 400 });

  const current = await getSiteContentFromDb();
  const cards = current?.portfolio?.cards || [];
  if (index < 0 || index >= cards.length) {
    return Response.json({ detail: "Invalid index" }, { status: 400 });
  }

  await deleteFromGridFS(extractFileId(cards[index].afterUrl));

  const fileId = await uploadToGridFS(
    buffer,
    file.name || `portfolio_${index}_after`,
    "image/jpeg"
  );
  const url = `/api/media/${fileId}`;

  cards[index] = { ...cards[index], afterUrl: url };
  await saveSiteContentToDb(deepMerge(current, { portfolio: { cards } }));
  revalidatePath("/", "layout");
  return Response.json({ file_id: fileId, url });
}
