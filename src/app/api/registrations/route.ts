import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canCreateRegistration, isStaff } from "@/lib/permissions";
import { registrationSchema } from "@/lib/validators";

export async function GET() {
  const user = await getSessionUser();

  if (!isStaff(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const registrations = await prisma.registrationApplication.findMany({
    include: {
      documents: true,
      registrationPeriod: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(registrations);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const activePeriod = await prisma.registrationPeriod.findFirst({
    where: {
      isActive: true,
    },
  });

  if (!canCreateRegistration(user, activePeriod)) {
    return NextResponse.json(
      { message: "Registration is not open for your role" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const parsed = registrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid registration data", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const registration = await prisma.registrationApplication.create({
    data: {
      registrationPeriodId: activePeriod!.id,
      status: "DRAFT",

      firstName: data.firstName,
      middleName: data.middleName || null,
      lastName: data.lastName,

      dateOfBirth: data.dateOfBirth,
      gender: data.gender,

      nationality: data.nationality || null,
      ethnicity: data.ethnicity || null,
      religion: data.religion || null,

      applyingGradeLevel: data.applyingGradeLevel,

      previousSchoolName: data.previousSchoolName || null,
      previousSchoolGrade: data.previousSchoolGrade || null,
      previousAcademicYear: data.previousAcademicYear || null,
      transferReason: data.transferReason || null,

      guardianName: data.guardianName,
      guardianRelationship: data.guardianRelationship || null,
      guardianPhone: data.guardianPhone,
      guardianEmail: data.guardianEmail || null,
      guardianAddress: data.guardianAddress || null,

      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,

      medicalNotes: data.medicalNotes || null,

      createdById: user.id,
    },
    include: {
      documents: true,
    },
  });

  return NextResponse.json(registration, { status: 201 });
}