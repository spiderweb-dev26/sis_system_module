import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  isStaff, canManageAcademicsRecords, canEnterGrades,
} from "@/lib/permissions";
import { gradeFromScore } from "@/lib/utils";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

async function teacherOwns(user: any, sectionId: string) {
  if (user.role !== "TEACHER") return true;
  const tp = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
  if (!tp) return false;
  const sec = await prisma.section.findUnique({ where: { id: sectionId } });
  return !!sec && sec.teacherId === tp.id;
}

function compute(scores: Record<string, number | null>, section: any) {
  const byCat: Record<string, { wsum: number; w: number }> = {};
  for (const asg of section.assessments) {
    const sc = scores[asg.id];
    if (sc == null || !asg.maxScore) continue;
    const norm = (sc / asg.maxScore) * 100;
    byCat[asg.categoryId] = byCat[asg.categoryId] || { wsum: 0, w: 0 };
    byCat[asg.categoryId].wsum += norm * asg.weight;
    byCat[asg.categoryId].w += asg.weight;
  }
  let num = 0, den = 0;
  for (const cat of section._count ? [] : []) {} // noop
  const cats = section.categories as any[];
  for (const cat of cats) {
    const b = byCat[cat.id];
    if (!b || b.w === 0) continue;
    num += (b.wsum / b.w) * cat.weight;
    den += cat.weight;
  }
  const score = den ? Math.round((num / den) * 100) / 100 : 0;
  const g = gradeFromScore(score);
  return { score, letter: g.letter, points: g.points };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!isStaff(user)) return bad("Forbidden", 403);
  const sectionId = req.nextUrl.searchParams.get("sectionId");

  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: true, term: true, teacher: { include: { user: true } },
        categories: { include: { assessments: { orderBy: { createdAt: "asc" } } }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!section) return bad("Not found", 404);
    // flatten categories onto section for compute()
    (section as any).categories = (section as any).categories || [];
    const cats = await prisma.gradingCategory.findMany({ include: { assessments: { where: { sectionId } } }, orderBy: { sortOrder: "asc" } });
    (section as any).categories = cats;

    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId, status: "ACTIVE" },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true, photoUrl: true } } },
    });
    const studentIds = enrollments.map((e) => e.studentId);
    const grades = await prisma.grade.findMany({
      where: { studentId: { in: studentIds }, assessment: { sectionId } },
    });
    const gradeMap: Record<string, { score: number | null; status: string }> = {};
    const scoresByStudent: Record<string, Record<string, number | null>> = {};
    for (const g of grades) {
      gradeMap[`${g.studentId}_${g.assessmentId}`] = { score: g.score, status: g.status };
      scoresByStudent[g.studentId] = scoresByStudent[g.studentId] || {};
      scoresByStudent[g.studentId][g.assessmentId] = g.score;
    }
    const computed: Record<string, { score: number; letter: string; points: number }> = {};
    for (const sid of studentIds) computed[sid] = compute(scoresByStudent[sid] || {}, section as any);

    return json({
      section: { id: section.id, code: section.code, name: section.name, room: section.room, courseName: section.course.name, termName: section.term.name, teacherName: `${section.teacher.user.firstName} ${section.teacher.user.lastName}` },
      students: enrollments.map((e) => e.student),
      categories: cats.map((c) => ({ id: c.id, name: c.name, weight: c.weight, assessments: c.assessments.map((a) => ({ id: a.id, name: a.name, type: a.type, maxScore: a.maxScore, weight: a.weight })) })),
      grades: gradeMap,
      computed,
    });
  }

  const [terms, courses, sections, categories] = await Promise.all([
    prisma.term.findMany({ orderBy: { startDate: "desc" } }),
    prisma.course.findMany({ orderBy: { code: "asc" } }),
    prisma.section.findMany({ include: { course: true, term: true, teacher: { include: { user: true } }, _count: { select: { enrollments: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.gradingCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return json({
    terms, courses, categories,
    sections: sections.map((s) => ({ id: s.id, code: s.code, name: s.name, room: s.room, courseName: s.course.name, termName: s.term.name, teacherName: `${s.teacher.user.firstName} ${s.teacher.user.lastName}`, enrolled: s._count.enrollments })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  const kind = body.kind;

  try {
    if (kind === "term") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.term.create({ data: { name: body.name, type: body.type || "SEMESTER", startDate: new Date(body.startDate), endDate: new Date(body.endDate) } });
      return json(r, 201);
    }
    if (kind === "course") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.course.create({ data: { code: body.code, name: body.name, credits: Number(body.credits) || 1 } });
      return json(r, 201);
    }
    if (kind === "section") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.section.create({ data: { code: body.code, courseId: body.courseId, teacherId: body.teacherId, termId: body.termId, name: body.name, room: body.room } });
      return json(r, 201);
    }
    if (kind === "category") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      const r = await prisma.gradingCategory.create({ data: { name: body.name, weight: Number(body.weight) || 0, sortOrder: Number(body.sortOrder) || 0 } });
      return json(r, 201);
    }
    if (kind === "assessment") {
      if (!canEnterGrades(user)) return bad("Forbidden", 403);
      if (!(await teacherOwns(user, body.sectionId))) return bad("Not your section", 403);
      const r = await prisma.assessment.create({ data: { sectionId: body.sectionId, categoryId: body.categoryId, name: body.name, type: body.type || "ASSIGNMENT", maxScore: Number(body.maxScore) || 100, weight: Number(body.weight) || 1, createdById: user.id } });
      return json(r, 201);
    }
    if (kind === "enroll" || kind === "drop") {
      if (!canManageAcademicsRecords(user)) return bad("Forbidden", 403);
      if (kind === "enroll") {
        const r = await prisma.enrollment.upsert({ where: { studentId_sectionId: { studentId: body.studentId, sectionId: body.sectionId } }, update: { status: "ACTIVE", droppedAt: null }, create: { studentId: body.studentId, sectionId: body.sectionId, status: "ACTIVE" } });
        return json(r, 201);
      }
      const r = await prisma.enrollment.updateMany({ where: { studentId: body.studentId, sectionId: body.sectionId }, data: { status: "DROPPED", droppedAt: new Date() } });
      return json(r);
    }
    if (kind === "saveGrades") {
      if (!canEnterGrades(user)) return bad("Forbidden", 403);
      if (!(await teacherOwns(user, body.sectionId))) return bad("Not your section", 403);
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
      if (!(await teacherOwns(user, body.sectionId))) return bad("Not your section", 403);
      const section = await prisma.section.findUnique({ where: { id: body.sectionId }, include: { assessments: true } });
      if (!section) return bad("Not found", 404);
      const cats = await prisma.gradingCategory.findMany({ include: { assessments: { where: { sectionId: body.sectionId } } } });
      (section as any).categories = cats;
      const enrollments = await prisma.enrollment.findMany({ where: { sectionId: body.sectionId, status: "ACTIVE" } });
      const grades = await prisma.grade.findMany({ where: { assessment: { sectionId: body.sectionId } } });
      await prisma.grade.updateMany({ where: { assessment: { sectionId: body.sectionId } }, data: { status: "SUBMITTED" } });
      const byStudent: Record<string, Record<string, number | null>> = {};
      for (const g of grades) { byStudent[g.studentId] = byStudent[g.studentId] || {}; byStudent[g.studentId][g.assessmentId] = g.score; }
      for (const e of enrollments) {
        const c = compute(byStudent[e.studentId] || {}, section as any);
        await prisma.termGrade.upsert({
          where: { studentId_sectionId_termId: { studentId: e.studentId, sectionId: body.sectionId, termId: body.termId || section.termId } },
          update: { calculatedScore: c.score, finalScore: c.score, letterGrade: c.letter, gradePoints: c.points, status: "SUBMITTED", submittedAt: new Date(), submittedById: user.id, submittedByName: `${user.firstName} ${user.lastName}` },
          create: { studentId: e.studentId, sectionId: body.sectionId, termId: body.termId || section.termId, calculatedScore: c.score, finalScore: c.score, letterGrade: c.letter, gradePoints: c.points, status: "SUBMITTED", submittedAt: new Date(), submittedById: user.id, submittedByName: `${user.firstName} ${user.lastName}` },
        });
      }
      return json({ ok: true, count: enrollments.length });
    }
    return bad("Unknown kind", 400);
  } catch (e: any) {
    return bad(e.message || "Failed", 500);
  }
}