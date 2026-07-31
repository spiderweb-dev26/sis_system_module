import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff, canManageDiscipline, canExpelStudent } from "@/lib/permissions";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!isStaff(user)) return bad("Forbidden", 403);
  const studentId = req.nextUrl.searchParams.get("studentId");
  const incidents = await prisma.disciplineIncident.findMany({
    where: studentId ? { studentId } : {},
    include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }, actions: { orderBy: { createdAt: "desc" } } },
    orderBy: { occurredAt: "desc" },
  });
  return json(incidents);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  const who = `${user.firstName} ${user.lastName}`;
  try {
    if (body.kind === "incident") {
      if (!canManageDiscipline(user)) return bad("Forbidden", 403);
      const r = await prisma.disciplineIncident.create({ data: { studentId: body.studentId, title: body.title, description: body.description, severity: body.severity || "LOW", occurredAt: new Date(body.occurredAt || Date.now()), reportedByName: who } });
      return json(r, 201);
    }
    if (body.kind === "action") {
      if (!canManageDiscipline(user)) return bad("Forbidden", 403);
      const r = await prisma.disciplineAction.create({ data: { incidentId: body.incidentId, type: body.type, startDate: body.startDate ? new Date(body.startDate) : null, endDate: body.endDate ? new Date(body.endDate) : null, notes: body.notes, decidedByName: who } });
      return json(r, 201);
    }
    if (body.kind === "expel") {
      if (!canExpelStudent(user)) return bad("Forbidden", 403);
      const r = await prisma.$transaction(async (tx) => {
        const student = await tx.studentProfile.update({ where: { id: body.studentId }, data: { status: "EXPELLED", expelledAt: new Date(), expulsionReason: body.reason } });
        const incident = await tx.disciplineIncident.create({ data: { studentId: body.studentId, title: "Expulsion", description: body.reason || "Expelled by administration", severity: "CRITICAL", occurredAt: new Date(), reportedByName: who } });
        await tx.disciplineAction.create({ data: { incidentId: incident.id, type: "EXPULSION", startDate: new Date(), notes: body.reason, decidedByName: who } });
        await tx.auditLog.create({ data: { actorId: user.id, action: "STUDENT_EXPELLED", entity: "StudentProfile", entityId: body.studentId, after: { reason: body.reason } } });
        return student;
      });
      return json(r);
    }
    return bad("Unknown kind");
  } catch (e: any) {
    return bad(e.message || "Failed", 500);
  }
}