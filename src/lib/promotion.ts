import { StudentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { calculateAge } from "./utils";

export async function runAnnualPromotion(academicYear: string) {
  const students = await prisma.studentProfile.findMany({
    where: {
      status: {
        notIn: [
          StudentStatus.WITHDRAWN,
          StudentStatus.TRANSFERRED,
        ],
      },
    },
  });

  let snapshots = 0;
  let promotions = 0;

  for (const student of students) {
    const age = calculateAge(student.dateOfBirth);

    await prisma.studentYearSnapshot.upsert({
      where: {
        studentId_academicYear: {
          studentId: student.id,
          academicYear,
        },
      },
      update: {
        age,
        gradeLevel: student.gradeLevel,
        status: student.status,
      },
      create: {
        studentId: student.id,
        academicYear,
        age,
        gradeLevel: student.gradeLevel,
        status: student.status,
      },
    });

    snapshots++;
  }

  const promotableStudents = await prisma.studentProfile.findMany({
    where: {
      status: {
        in: [
          StudentStatus.ACTIVE,
          StudentStatus.SUSPENDED,
        ],
      },
      gradeLevel: {
        lt: 12,
      },
      promotionHeld: false,
    },
  });

  for (const student of promotableStudents) {
    const fromGrade = student.gradeLevel;
    const toGrade = student.gradeLevel + 1;

    await prisma.$transaction([
      prisma.studentProfile.update({
        where: { id: student.id },
        data: {
          gradeLevel: toGrade,
          lastPromotedAt: new Date(),
        },
      }),

      prisma.promotionLog.create({
        data: {
          studentId: student.id,
          fromGrade,
          toGrade,
          academicYear,
          reason: "Automatic annual promotion",
        },
      }),
    ]);

    promotions++;
  }

  return {
    academicYear,
    snapshots,
    promotions,
  };
}