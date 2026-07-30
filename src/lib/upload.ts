import path from "path";

// Kept only so the legacy /api/files route still compiles.
// New uploads are stored as data URLs in the database (see saveUpload),
// so the local filesystem is never written — required on Vercel,
// whose serverless filesystem is read-only.
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

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_DOC_BYTES = 3 * 1024 * 1024; // 3 MB (kept under Vercel's request-size wall)

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function validateUpload(file: File, kind: "photo" | "document") {
  const max = kind === "photo" ? MAX_PHOTO_BYTES : MAX_DOC_BYTES;
  const allowed = kind === "photo" ? PHOTO_TYPES : DOC_TYPES;

  if (!file.type || !allowed.includes(file.type)) {
    throw new UploadError(
      `"${file.name}" is not an allowed file type for this slot.`,
      400
    );
  }

  if (file.size > max) {
    const mb = (max / 1024 / 1024).toFixed(0);
    throw new UploadError(
      `"${file.name}" is ${formatBytes(file.size)} — the limit is ${mb} MB.`,
      413
    );
  }
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Stores the file as a base64 data URL — no filesystem access.
export async function saveUpload(file: File, _subFolder: string) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const dataUrl = `data:${mimeType};base64,${toBase64(bytes)}`;

  return {
    url: dataUrl,
    mimeType,
    fileSize: file.size,
    fileName: file.name,
  };
}