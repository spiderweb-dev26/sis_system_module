import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canCreateRegistration, isStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { PageHeader, Panel, PrimaryLink, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isStaff(user)) redirect("/dashboard");

  const [registrations, activePeriod] = await Promise.all([
    prisma.registrationApplication.findMany({
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.registrationPeriod.findFirst({ where: { isActive: true } }),
  ]);

  const canCreate = canCreateRegistration(user, activePeriod);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader
        kicker="Admissions desk"
        title="Registrations"
        sub={
          activePeriod
            ? `${activePeriod.name} · closes ${formatDate(activePeriod.endDate)}`
            : "No active registration period."
        }
        action={canCreate ? <PrimaryLink href="/registrations/new">Register new student</PrimaryLink> : null}
      />

      <Panel className="col-span-12" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3">Applicant</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Docs</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-t border-line/60 transition hover:bg-cream-50">
                  <td className="px-5 py-3 font-medium text-ink">
                    {r.firstName} {r.lastName}
                  </td>
                  <td className="px-5 py-3 text-ink-soft tabular-nums">{r.applyingGradeLevel}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-soft tabular-nums">{r._count.documents}</td>
                  <td className="px-5 py-3 text-ink-faint">{formatDate(r.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/registrations/${r.id}`} className="font-semibold text-gold-deep hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-mute">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}