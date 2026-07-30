import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { getContentType, UPLOAD_ROOT } from "@/lib/upload";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getSessionUser();

  if (!isStaff(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { path: pathParts } = await params;

  if (!pathParts || pathParts.length === 0) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }

  const requestedPath = path.resolve(UPLOAD_ROOT, ...pathParts);

  if (!requestedPath.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const fileStat = await stat(requestedPath);

    if (!fileStat.isFile()) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(requestedPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": getContentType(requestedPath),
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}