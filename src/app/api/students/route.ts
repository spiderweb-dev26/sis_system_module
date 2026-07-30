import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canViewAllStudents } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();

  if (!canViewAllStudents(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const where = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
          { admissionNumber: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const students = await prisma.studentProfile.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(students);
}