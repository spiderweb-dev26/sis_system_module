import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!canManageUsers(user)) return bad("Forbidden", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed: any = {};
  if (typeof body.firstName === "string") allowed.firstName = body.firstName;
  if (typeof body.lastName === "string") allowed.lastName = body.lastName;
  if (typeof body.role === "string") allowed.role = body.role;
  if (typeof body.status === "string") allowed.status = body.status;

  const u = await prisma.user.update({ where: { id }, data: allowed });
  return json(u);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!canManageUsers(user)) return bad("Forbidden", 403);

  const { id } = await params;
  const u = await prisma.user.update({
    where: { id },
    data: { status: "DEACTIVATED" },
  });
  return json(u);
}