import { ObjectId } from "mongodb";
import { getGridFSBucket } from "./db";

export async function uploadToGridFS(buffer, filename, contentType) {
  const bucket = await getGridFSBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: { content_type: contentType },
  });
  const fileId = uploadStream.id;

  await new Promise((resolve, reject) => {
    uploadStream.on("finish", resolve);
    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });

  return String(fileId);
}

export async function downloadFromGridFS(fileIdStr) {
  const bucket = await getGridFSBucket();
  const fileId = new ObjectId(fileIdStr);

  const files = await bucket.find({ _id: fileId }).toArray();
  if (!files.length) return null;

  const contentType = files[0].metadata?.content_type || "image/jpeg";
  const stream = bucket.openDownloadStream(fileId);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);

  return { data: Buffer.concat(chunks), contentType };
}

export async function deleteFromGridFS(fileIdStr) {
  if (!fileIdStr) return;
  try {
    const bucket = await getGridFSBucket();
    await bucket.delete(new ObjectId(fileIdStr));
  } catch {
    // ignore missing files
  }
}

export function extractFileId(url) {
  if (!url || !url.includes("/api/media/")) return null;
  return url.split("/api/media/")[1] || null;
}
