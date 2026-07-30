import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!isStaff(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const registration = await prisma.registrationApplication.findUnique({
    where: { id },
    include: {
      documents: true,
    },
  });

  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (registration.status !== "DRAFT") {
    return NextResponse.json(
      { message: "Only draft registrations can be submitted" },
      { status: 400 }
    );
  }

  const hasPhoto = registration.documents.some(
    (doc) => doc.type === "PHOTO"
  );

  const hasPreviousAcademicRecord = registration.documents.some(
    (doc) => doc.type === "PREVIOUS_ACADEMIC_RECORD"
  );

  if (!hasPhoto || !hasPreviousAcademicRecord) {
    return NextResponse.json(
      {
        message:
          "Photo and previous academic record are required before submission",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.registrationApplication.update({
    where: { id },
    data: {
      status: "PENDING",
    },
  });

  return NextResponse.json(updated);
}