import { NextResponse } from "next/server";
import { getSessionUser, safeUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { message: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: safeUser(user),
  });
}