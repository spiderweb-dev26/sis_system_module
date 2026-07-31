import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff, canManageAttendance } from "@/lib/permissions";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!isStaff(user)) return bad("Forbidden", 403);
  const sectionId = req.nextUrl.searchParams.get("sectionId");
  const date = req.nextUrl.searchParams.get("date");
  if (!sectionId || !date) return bad("sectionId and date required");
  const day = new Date(date); day.setHours(8, 0, 0, 0);
  const [section, enrollments, records] = await Promise.all([
    prisma.section.findUnique({ where: { id: sectionId }, include: { course: true, term: true } }),
    prisma.enrollment.findMany({ where: { sectionId, status: "ACTIVE" }, include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true, photoUrl: true } } } }),
    prisma.attendanceRecord.findMany({ where: { sectionId, date: day } }),
  ]);
  if (!section) return bad("Not found", 404);
  const map: Record<string, { status: string; note: string | null }> = {};
  for (const r of records) map[r.studentId] = { status: r.status, note: r.note };
  return json({ section: { id: section.id, name: section.name, courseName: section.course.name }, students: enrollments.map((e) => e.student), records: map });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!canManageAttendance(user)) return bad("Forbidden", 403);
  const body = await req.json().catch(() => ({}));
  const day = new Date(body.date); day.setHours(8, 0, 0, 0);
  const arr: { studentId: string; status: string; note?: string }[] = body.records || [];
  for (const r of arr) {
    await prisma.attendanceRecord.upsert({
      where: { studentId_sectionId_date: { studentId: r.studentId, sectionId: body.sectionId, date: day } },
      update: { status: r.status, note: r.note || null, recordedById: user.id },
      create: { studentId: r.studentId, sectionId: body.sectionId, date: day, status: r.status, note: r.note || null, recordedById: user.id },
    });
  }
  return json({ ok: true, count: arr.length });
}