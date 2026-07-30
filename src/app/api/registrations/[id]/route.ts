import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { registrationSchema } from "@/lib/validators";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!isStaff(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const registration = await prisma.registrationApplication.findUnique({
    where: { id },
    include: {
      documents: true,
      registrationPeriod: true,
    },
  });

  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(registration);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!isStaff(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const registration = await prisma.registrationApplication.findUnique({
    where: { id },
  });

  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (registration.status !== "DRAFT") {
    return NextResponse.json(
      { message: "Only draft registrations can be edited" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const parsed = registrationSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid registration data" },
      { status: 400 }
    );
  }

  const updated = await prisma.registrationApplication.update({
    where: { id },
    data: parsed.data,
    include: {
      documents: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!isStaff(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const registration = await prisma.registrationApplication.findUnique({
    where: { id },
  });

  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (registration.status !== "DRAFT") {
    return NextResponse.json(
      { message: "Only draft registrations can be deleted" },
      { status: 400 }
    );
  }

  await prisma.registrationApplication.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}