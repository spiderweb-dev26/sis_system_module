import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!isStaff(user)) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4">Student portal will be enabled later.</p>
      </div>
    );
  }

  const [studentCount, registrationCount, userCount, activePeriod] =
    await Promise.all([
      prisma.studentProfile.count(),
      prisma.registrationApplication.count(),
      prisma.user.count(),
      prisma.registrationPeriod.findFirst({
        where: {
          isActive: true,
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-600">
          Welcome, {user.firstName} {user.lastName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-slate-500">Students</p>
          <p className="text-3xl font-semibold">{studentCount}</p>
        </div>

        <div className="rounded border bg-white p-4">
          <p className="text-sm text-slate-500">Registrations</p>
          <p className="text-3xl font-semibold">{registrationCount}</p>
        </div>

        <div className="rounded border bg-white p-4">
          <p className="text-sm text-slate-500">Users</p>
          <p className="text-3xl font-semibold">{userCount}</p>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="text-lg font-semibold">Active Registration Period</h2>

        {activePeriod ? (
          <div className="mt-2 space-y-1 text-sm">
            <p>Name: {activePeriod.name}</p>
            <p>Academic Year: {activePeriod.academicYear}</p>
            <p>Start: {formatDate(activePeriod.startDate)}</p>
            <p>End: {formatDate(activePeriod.endDate)}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-red-600">
            No active registration period.
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Link
          href="/registrations"
          className="rounded bg-slate-900 px-4 py-2 text-white"
        >
          View Registrations
        </Link>

        <Link
          href="/students"
          className="rounded border bg-white px-4 py-2"
        >
          View Students
        </Link>
      </div>
    </div>
  );
}