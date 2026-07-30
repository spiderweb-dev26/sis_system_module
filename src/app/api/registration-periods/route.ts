import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  canManageRegistrationPeriods,
  isStaff,
} from "@/lib/permissions";
import { registrationPeriodSchema } from "@/lib/validators";

export async function GET() {
  const user = await getSessionUser();

  if (!isStaff(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const periods = await prisma.registrationPeriod.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(periods);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  if (!canManageRegistrationPeriods(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const parsed = registrationPeriodSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid registration period", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.registrationPeriod.updateMany({
        where: {
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    return tx.registrationPeriod.create({
      data: {
        academicYear: data.academicYear,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? false,
        allowPrincipal: data.allowPrincipal ?? true,
        allowRegistrar: data.allowRegistrar ?? true,
        allowCounselor: data.allowCounselor ?? true,
        allowAdmin: data.allowAdmin ?? true,
      },
    });
  });

  return NextResponse.json(created, { status: 201 });
}