import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import bcrypt from "bcryptjs";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

export async function GET() {
  const user = await getSessionUser();
  if (!canManageUsers(user)) return bad("Forbidden", 403);
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, status: true, phone: true, lastLoginAt: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return json(users);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!canManageUsers(user)) return bad("Forbidden", 403);
  const body = await req.json().catch(() => ({}));

  if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role) {
    return bad("Email, password, name and role are required");
  }

  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) return bad("An account with that email already exists");

  const passwordHash = await bcrypt.hash(body.password, 12);
  const u = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      phone: body.phone || null,
      mustChangePassword: true,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "USER_CREATED", entity: "User", entityId: u.id, after: { role: u.role } },
  });

  return json(u, 201);
}