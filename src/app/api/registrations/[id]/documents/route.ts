import { NextRequest, NextResponse } from "next/server";
import { RegistrationDocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { saveUpload, validateUpload, UploadError } from "@/lib/upload";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isStaff(user)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const registration = await prisma.registrationApplication.findUnique({
      where: { id },
    });
    if (!registration) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (registration.status === "ENROLLED") {
      return NextResponse.json(
        { message: "Registration is already enrolled" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const type = formData.get("type")?.toString() ?? "";
    const title = formData.get("title")?.toString() || "";

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    const validTypes = Object.values(RegistrationDocumentType) as string[];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: "Invalid document type" },
        { status: 400 }
      );
    }

    const kind =
      type === RegistrationDocumentType.PHOTO ? "photo" : "document";
    validateUpload(file as File, kind);

    const uploaded = await saveUpload(file as File, `registrations/${id}`);

    const document = await prisma.registrationDocument.create({
      data: {
        registrationId: id,
        type: type as RegistrationDocumentType,
        title: title || (file as File).name,
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        uploadedById: user.id,
      },
    });

    if (type === RegistrationDocumentType.PHOTO) {
      await prisma.registrationApplication.update({
        where: { id },
        data: { photoUrl: uploaded.url },
      });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status }
      );
    }
    console.error("Upload failed:", err);
    return NextResponse.json(
      {
        message:
          "Upload failed on the server. The file may be too large or of an unsupported type.",
      },
      { status: 500 }
    );
  }
}