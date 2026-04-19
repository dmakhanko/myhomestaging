import { getSiteContentFromDb } from "@/lib/siteContent";

export async function GET() {
  try {
    const content = await getSiteContentFromDb();
    return Response.json({ content });
  } catch {
    return Response.json({ content: {} });
  }
}
