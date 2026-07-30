import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { getRoleMeta } from "@/lib/roles";
import RoleDashboard from "@/components/RoleDashboard";
import { Crest, Eyebrow, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";

const STAFF = ["PRINCIPAL", "ADMIN", "REGISTRAR", "COUNSELOR", "ACCOUNTANT", "TEACHER"];

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!isStaff(user)) {
    return (
      <Panel className="mx-auto max-w-xl" accent="#5b3a22" kicker="Student" title="Your portal is on the way">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Crest letter="S" size={48} />
          <p className="text-sm text-ink-mute">
            The student view — grades, report cards and attendance — opens in a later release.
          </p>
        </div>
      </Panel>
    );
  }

  const meta = getRoleMeta(user.role);

  const [
    totalStudents,
    activeStudents,
    totalStaff,
    stuByGrade,
    stuByStatus,
    usersByRole,
    regByStatus,
    activePeriod,
    pendingRegs,
    draftPending,
    recentStudents,
    audit,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.studentProfile.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: { not: "STUDENT" } } }),
    prisma.studentProfile.groupBy({ by: ["gradeLevel"], _count: { _all: true } }),
    prisma.studentProfile.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.registrationApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.registrationPeriod.findFirst({ where: { isActive: true } }),
    prisma.registrationApplication.findMany({
      where: { status: "PENDING" },
      include: { documents: { select: { type: true, verifiedAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.registrationApplication.findMany({
      where: { status: { in: ["DRAFT", "PENDING"] } },
      include: { documents: { select: { type: true, verifiedAt: true } } },
      take: 80,
    }),
    prisma.studentProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        status: true,
        admissionNumber: true,
        photoUrl: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const now = new Date();
  const periodOpen =
    !!activePeriod && now >= new Date(activePeriod.startDate) && now <= new Date(activePeriod.endDate);
  const daysLeft = activePeriod
    ? Math.max(0, Math.ceil((new Date(activePeriod.endDate).getTime() - now.getTime()) / 86400000))
    : null;

  const [newEnrollments, enrolledPeriod] = await Promise.all([
    prisma.studentProfile.count({
      where: { status: "ACTIVE", createdAt: { gte: activePeriod?.startDate ?? new Date(now.getTime() - 30 * 86400000) } },
    }),
    activePeriod
      ? prisma.registrationApplication.count({
          where: { status: "ENROLLED", registrationPeriodId: activePeriod.id },
        })
      : Promise.resolve(0),
  ]);

  const gradeMap: Record<number, number> = {};
  stuByGrade.forEach((g) => (gradeMap[g.gradeLevel] = g._count._all));
  const regStatus: Record<string, number> = {};
  regByStatus.forEach((r) => (regStatus[r.status] = r._count._all));
  const stuStatus: Record<string, number> = {};
  stuByStatus.forEach((s) => (stuStatus[s.status] = s._count._all));
  const staffMix = usersByRole
    .filter((r) => STAFF.includes(r.role))
    .map((r) => ({ role: r.role, count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  const pending = pendingRegs.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    applyingGradeLevel: p.applyingGradeLevel,
    createdAt: p.createdAt.toISOString(),
    docs: p.documents.map((d) => ({ type: d.type, verified: !!d.verifiedAt })),
  }));

  const verify = (draftPending
    .map((r) => {
      const missing = r.documents
        .filter(
          (d) => (d.type === "PHOTO" || d.type === "PREVIOUS_ACADEMIC_RECORD") && !d.verifiedAt
        )
        .map((d) => d.type);
      return missing.length ? { id: r.id, firstName: r.firstName, lastName: r.lastName, missing } : null;
    })
    .filter(Boolean) as { id: string; firstName: string; lastName: string; missing: string[] }[]
  ).slice(0, 6);

  const data = {
    periodOpen,
    daysLeft,
    periodName: activePeriod?.name ?? null,
    kpis: {
      activeStudents,
      totalStudents,
      totalStaff,
      pending: regStatus["PENDING"] || 0,
      enrolledPeriod,
      newEnrollments,
    },
    regStatus,
    stuStatus,
    gradeMap,
    staffMix,
    pending,
    verify,
    recentStudents: recentStudents.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
    audit: audit.map((a) => ({
      action: a.action,
      entity: a.entity,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  return (
    <RoleDashboard
      meta={meta}
      user={{ firstName: user.firstName, lastName: user.lastName, role: user.role }}
      data={data}
    />
  );
}