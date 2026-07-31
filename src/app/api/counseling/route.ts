import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff, canManageCounseling } from "@/lib/permissions";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!isStaff(user)) return bad("Forbidden", 403);
  const studentId = req.nextUrl.searchParams.get("studentId");
  const where = studentId ? { studentId } : {};
  const [notes, appointments, interventions] = await Promise.all([
    prisma.counselingNote.findMany({ where, orderBy: { createdAt: "desc" }, include: { student: { select: { id: true, firstName: true, lastName: true } } } }),
    prisma.appointment.findMany({ where, orderBy: { scheduledAt: "desc" }, include: { student: { select: { id: true, firstName: true, lastName: true } } } }),
    prisma.intervention.findMany({ where, orderBy: { createdAt: "desc" }, include: { student: { select: { id: true, firstName: true, lastName: true } } } }),
  ]);
  return json({ notes, appointments, interventions });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!canManageCounseling(user)) return bad("Forbidden", 403);
  const body = await req.json().catch(() => ({}));
  const who = `${user.firstName} ${user.lastName}`;
  try {
    if (body.kind === "note") {
      const r = await prisma.counselingNote.create({ data: { studentId: body.studentId, category: body.category || "OTHER", riskLevel: body.riskLevel || "NONE", title: body.title, note: body.note, counselorName: who, followUpDate: body.followUpDate ? new Date(body.followUpDate) : null } });
      return json(r, 201);
    }
    if (body.kind === "appointment") {
      const r = await prisma.appointment.create({ data: { studentId: body.studentId, title: body.title, scheduledAt: new Date(body.scheduledAt), location: body.location, status: body.status || "SCHEDULED", notes: body.notes, counselorName: who } });
      return json(r, 201);
    }
    if (body.kind === "intervention") {
      const r = await prisma.intervention.create({ data: { studentId: body.studentId, title: body.title, description: body.description, status: body.status || "PLANNED", startDate: body.startDate ? new Date(body.startDate) : null, endDate: body.endDate ? new Date(body.endDate) : null, counselorName: who } });
      return json(r, 201);
    }
    return bad("Unknown kind");
  } catch (e: any) {
    return bad(e.message || "Failed", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!canManageCounseling(user)) return bad("Forbidden", 403);
  const kind = req.nextUrl.searchParams.get("kind");
  const id = req.nextUrl.searchParams.get("id");
  if (!kind || !id) return bad("kind and id required");
  const body = await req.json().catch(() => ({}));
  const data: any = { ...body };
  for (const k of ["scheduledAt", "followUpDate", "startDate", "endDate"]) if (data[k]) data[k] = new Date(data[k]);
  const model = kind === "note" ? prisma.counselingNote : kind === "appointment" ? prisma.appointment : kind === "intervention" ? prisma.intervention : null;
  if (!model) return bad("Unknown kind");
  const r = await (model as any).update({ where: { id }, data });
  return json(r);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!canManageCounseling(user)) return bad("Forbidden", 403);
  const kind = req.nextUrl.searchParams.get("kind");
  const id = req.nextUrl.searchParams.get("id");
  if (!kind || !id) return bad("kind and id required");
  const model = kind === "note" ? prisma.counselingNote : kind === "appointment" ? prisma.appointment : kind === "intervention" ? prisma.intervention : null;
  if (!model) return bad("Unknown kind");
  await (model as any).delete({ where: { id } });
  return json({ ok: true });
}