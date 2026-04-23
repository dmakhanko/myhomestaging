import { downloadFromGridFS } from "@/lib/gridfs";

export async function GET(request, { params }) {
  const { fileId } = await params;
  const result = await downloadFromGridFS(fileId);
  if (!result) {
    return Response.json({ detail: "Not found" }, { status: 404 });
  }
  return new Response(result.data, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
