import { NextRequest, NextResponse } from "next/server";
import { runAnnualPromotion } from "@/lib/promotion";
import { getCurrentAcademicYear } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  const providedSecret = req.headers.get("x-cron-secret");

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let academicYear = getCurrentAcademicYear();

  try {
    const body = await req.json();

    if (body.academicYear) {
      academicYear = body.academicYear;
    }
  } catch {
    // no body is okay
  }

  const result = await runAnnualPromotion(academicYear);

  return NextResponse.json(result);
}