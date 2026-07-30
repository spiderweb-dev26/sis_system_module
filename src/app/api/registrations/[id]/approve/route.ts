import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canApproveRegistration } from "@/lib/permissions";

async function generateAdmissionNumber() {
  const year = new Date().getFullYear();
  const prefix = `${year}/`;

  const last = await prisma.studentProfile.findFirst({
    where: {
      admissionNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      admissionNumber: "desc",
    },
  });

  let nextNumber = 1;

  if (last) {
    const parts = last.admissionNumber.split("/");
    const parsed = parseInt(parts[1], 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!canApproveRegistration(user)) {
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

  if (registration.status !== "PENDING") {
    return NextResponse.json(
      { message: "Only pending registrations can be approved" },
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
          "Photo and previous academic record are required before approval",
      },
      { status: 400 }
    );
  }

  const admissionNumber = await generateAdmissionNumber();

  const student = await prisma.$transaction(async (tx) => {
    const createdStudent = await tx.studentProfile.create({
      data: {
        admissionNumber,
        firstName: registration.firstName,
        middleName: registration.middleName,
        lastName: registration.lastName,
        dateOfBirth: registration.dateOfBirth,
        gender: registration.gender,
        nationality: registration.nationality,
        ethnicity: registration.ethnicity,
        religion: registration.religion,
        gradeLevel: registration.applyingGradeLevel,
        status: "ACTIVE",
        enrollmentDate: new Date(),
        photoUrl: registration.photoUrl,

        previousSchoolName: registration.previousSchoolName,
        previousSchoolGrade: registration.previousSchoolGrade,
        previousAcademicYear: registration.previousAcademicYear,
        transferReason: registration.transferReason,

        guardianName: registration.guardianName,
        guardianRelationship: registration.guardianRelationship,
        guardianPhone: registration.guardianPhone,
        guardianEmail: registration.guardianEmail,
        addressLine1: registration.guardianAddress,

        emergencyContactName: registration.emergencyContactName,
        emergencyContactPhone: registration.emergencyContactPhone,

        medicalNotes: registration.medicalNotes,
      },
    });

    await tx.registrationApplication.update({
      where: { id },
      data: {
        status: "ENROLLED",
        reviewedById: user!.id,
        reviewedAt: new Date(),
        studentId: createdStudent.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user!.id,
        action: "REGISTRATION_APPROVED",
        entity: "RegistrationApplication",
        entityId: id,
        after: {
          studentId: createdStudent.id,
          admissionNumber,
        },
      },
    });

    return createdStudent;
  });

  return NextResponse.json(student, { status: 201 });
}