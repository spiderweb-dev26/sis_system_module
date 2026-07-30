import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { calculateAge } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isStaff(user)) redirect("/dashboard");

  const { q } = await searchParams;
  const where = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
          { admissionNumber: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const students = await prisma.studentProfile.findMany({ where, orderBy: { createdAt: "desc" } });

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader
        kicker="Records"
        title="Students"
        sub="Every staff member can view every student record."
        action={
          <form action="/students" className="flex gap-2">
            <input name="q" defaultValue={q || ""} placeholder="Search name or admission no." className="field w-64" />
            <button className="shrink-0 rounded-full bg-cocoa px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-cocoa-deep">
              Search
            </button>
          </form>
        }
      />

      <Panel className="col-span-12" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Admission no.</th>
                <th className="px-5 py-3">Age</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-cocoa/10 text-xs font-semibold text-cocoa">
                        {s.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          ((s.firstName[0] ?? "") + (s.lastName[0] ?? "")).toUpperCase()
                        )}
                      </span>
                      <span className="font-medium text-ink">
                        {s.firstName} {s.lastName}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{s.admissionNumber}</td>
                  <td className="px-5 py-3 text-ink-soft tabular-nums">{calculateAge(s.dateOfBirth)}</td>
                  <td className="px-5 py-3 text-ink-soft tabular-nums">{s.gradeLevel}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/students/${s.id}`} className="font-semibold text-gold-deep hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-mute">
                    No students found.
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