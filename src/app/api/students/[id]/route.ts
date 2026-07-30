import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      registrationApplication: {
        include: {
          documents: true,
        },
      },
      promotionLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
      yearSnapshots: {
        orderBy: {
          snapshotDate: "desc",
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (isStaff(user)) {
    return NextResponse.json(student);
  }

  if (user.role === "STUDENT" && user.student?.id === student.id) {
    return NextResponse.json(student);
  }

  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}