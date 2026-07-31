import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff, canManageAcademicsRecords, canEnterGrades } from "@/lib/permissions";
import { gradeFromScore } from "@/lib/utils";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

async function teacherOwnsSubject(user: any, subjectId: string) {
  if (user.role !== "TEACHER") return true;
  const tp = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
  if (!tp) return false;
  const ts = await prisma.teacherSubject.findFirst({ where: { teacherId: tp.id, subjectId } });
  return !!ts;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!isStaff(user)) return bad("Forbidden", 403);

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const mySubjects = req.nextUrl.searchParams.get("mySubjects");

  // Teacher's assigned subjects
  if (mySubjects && user.role === "TEACHER") {
    const tp = await prisma.teacherProfile.findUnique({ where: { userId: user.id }, include: { subjects: { include: { subject: true } } } });
    return json({ subjects: tp?.subjects.map(ts => ts.subject) || [] });
  }

  // Subject-based gradebook
  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return bad("Subject not found", 404);

    const sections = await prisma.section.findMany({
      include: {
        stream: true,
        enrollments: { where: { status: "ACTIVE" }, include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } } }
      }
    });

    const assessments = await prisma.assessment.findMany({
      where: { subjectId },
      include: { category: true }
    });

    const studentIds = sections.flatMap(s => s.enrollments.map(e => e.studentId));
    const grades = await prisma.grade.findMany({ where: { studentId: { in: studentIds }, assessment: { subjectId } } });
    const gradeMap: Record<string, any> = {};
    for (const g of grades) gradeMap[`${g.studentId}_${g.assessmentId}`] = { score: g.score, status: g.status };

    return json({
      subject: { id: subject.id, code: subject.code, name: subject.name },
      sections: sections.map(s => ({ id: s.id, code: s.code, gradeLevel: s.gradeLevel, stream: s.stream?.stream || null, students: s.enrollments.map(e => ({ ...e.student, sectionCode: s.code })) })),
      assessments: assessments.map(a => ({ id: a.id, name: a.name, type: a.type, maxScore: a.maxScore, weight: a.weight, categoryName: a.category.name })),
      grades: gradeMap
    });
  }

  // List all
  const [terms, sections, categories, subjects] = await Promise.all([
    prisma.term.findMany({ orderBy: { startDate: "desc" } }),
    prisma.section.findMany({ include: { term: true, stream: true, _count: { select: { enrollments: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.gradingCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.subject.findMany({ orderBy: { code: "asc" } }),
  ]);

  return json({
    terms, subjects, categories,
    sections: sections.map(s => ({ id: s.id, code: s.code, gradeLevel: s.gradeLevel, stream: s.stream?.stream || null, termName: s.term.name, enrolled: s._count.enrollments }))
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  const kind = body.kind;

  try {
    if (kind === "saveGrades") {
      if (!canEnterGrades(user)) return bad("Forbidden", 403);
      if (!(await teacherOwnsSubject(user, body.subjectId))) return bad("Not your subject", 403);
      const arr: { studentId: string; assessmentId: string; score: string | number | "" }[] = body.grades || [];
      for (const g of arr) {
        const score = g.score === "" || g.score == null ? null : Number(g.score);
        await prisma.grade.upsert({
          where: { assessmentId_studentId: { assessmentId: g.assessmentId, studentId: g.studentId } },
          update: { score: score as number | null, status: "DRAFT", createdById: user.id },
          create: { assessmentId: g.assessmentId, studentId: g.studentId, score: score as number | null, status: "DRAFT", createdById: user.id },
        });
      }
      return json({ ok: true });
    }

    if (kind === "submitGrades") {
      if (!canEnterGrades(user)) return bad("Forbidden", 403);
      if (!(await teacherOwnsSubject(user, body.subjectId))) return bad("Not your subject", 403);
      await prisma.grade.updateMany({ where: { assessment: { subjectId: body.subjectId } }, data: { status: "SUBMITTED" } });
      return json({ ok: true });
    }

    if (kind === "section") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.section.create({ data: { code: body.code, gradeLevel: Number(body.gradeLevel), sectionLetter: body.sectionLetter, termId: body.termId, name: body.name, room: body.room } });
      return json(r, 201);
    }

    if (kind === "term") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.term.create({ data: { name: body.name, type: body.type || "SEMESTER", startDate: new Date(body.startDate), endDate: new Date(body.endDate) } });
      return json(r, 201);
    }

    if (kind === "category") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.gradingCategory.create({ data: { name: body.name, weight: Number(body.weight) || 0, sortOrder: Number(body.sortOrder) || 0 } });
      return json(r, 201);
    }

    if (kind === "stream") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.sectionStream.upsert({ where: { sectionId: body.sectionId }, update: { stream: body.stream, status: body.status || "PENDING", proposedById: user.id }, create: { sectionId: body.sectionId, stream: body.stream, status: body.status || "PENDING", proposedById: user.id } });
      return json(r);
    }

    if (kind === "approveStream") {
      if (user.role !== "PRINCIPAL" && user.role !== "ADMIN") return bad("Forbidden", 403);
      const r = await prisma.sectionStream.update({ where: { sectionId: body.sectionId }, data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() } });
      return json(r);
    }

    return bad("Unknown kind", 400);
  } catch (e: any) {
    return bad(e.message || "Failed", 500);
  }
}