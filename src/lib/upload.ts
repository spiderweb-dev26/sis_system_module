import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const mimeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeByExtension[ext] || "application/octet-stream";
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveUpload(file: File, subFolder: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const dir = path.join(UPLOAD_ROOT, subFolder);

  await mkdir(dir, { recursive: true });

  const filePath = path.join(dir, fileName);

  await writeFile(filePath, buffer);

  const publicPath = `/api/files/${subFolder}/${fileName}`;

  return {
    url: publicPath,
    mimeType: file.type || getContentType(filePath),
    fileSize: file.size,
    fileName,
  };
}