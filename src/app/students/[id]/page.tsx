import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { calculateAge, formatDate } from "@/lib/utils";
import { Crest, Eyebrow, Panel, Reveal, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      registrationApplication: { include: { documents: true } },
      promotionLogs: { orderBy: { createdAt: "desc" } },
      yearSnapshots: { orderBy: { snapshotDate: "desc" } },
    },
  });
  if (!student) notFound();
  if (!isStaff(user) && user.student?.id !== student.id) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <Reveal>
        <section className="card relative overflow-hidden p-6 md:p-8">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-cocoa to-olive" />
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-cream-100 text-xl font-semibold text-cocoa">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Crest letter={(student.firstName[0] ?? "S").toUpperCase()} size={64} />
              )}
            </div>
            <div className="flex-1">
              <Eyebrow className="text-gold-deep">Student record</Eyebrow>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                {student.firstName} {student.lastName}
              </h1>
              <p className="mt-1 text-sm text-ink-mute">Admission No. {student.admissionNumber}</p>
            </div>
            <StatusBadge status={student.status} />
          </div>
        </section>
      </Reveal>

      <div className="grid grid-cols-12 gap-4 md:gap-5">
        <Panel kicker="Profile" title="Overview" accent="#5b3a22" className="col-span-12 md:col-span-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Age", String(calculateAge(student.dateOfBirth))],
              ["Date of birth", formatDate(student.dateOfBirth)],
              ["Gender", student.gender],
              ["Grade", String(student.gradeLevel)],
              ["Enrolled", formatDate(student.enrollmentDate)],
              ["Nationality", student.nationality || "—"],
              ["Ethnicity", student.ethnicity || "—"],
              ["Religion", student.religion || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel kicker="Family" title="Guardian" accent="#6f7a45" className="col-span-12 md:col-span-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Name", student.guardianName || "—"],
              ["Relationship", student.guardianRelationship || "—"],
              ["Phone", student.guardianPhone || "—"],
              ["Email", student.guardianEmail || "—"],
              ["Address", student.addressLine1 || "—"],
              ["Emergency", student.emergencyContactPhone || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel kicker="History" title="Previous school" accent="#a86a32" className="col-span-12 md:col-span-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["School", student.previousSchoolName || "—"],
              ["Grade", student.previousSchoolGrade || "—"],
              ["Year", student.previousAcademicYear || "—"],
              ["Reason", student.transferReason || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel kicker="Files" title="Registration documents" accent="#8a5e26" className="col-span-12 md:col-span-6">
          {student.registrationApplication?.documents.length ? (
            <div className="space-y-2">
              {student.registrationApplication.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2 text-sm">
                  <span className="font-medium text-ink-soft">{d.title}</span>
                  <Link href={d.url} target="_blank" className="font-semibold text-gold-deep hover:underline">
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-mute">No registration documents.</p>
          )}
        </Panel>

        <Panel kicker="Progress" title="Promotion history" accent="#6b4a2e" className="col-span-12 md:col-span-6">
          {student.promotionLogs.length ? (
            <div className="space-y-2">
              {student.promotionLogs.map((l) => (
                <div key={l.id} className="rounded-xl border border-line/70 px-3 py-2 text-sm">
                  <p className="font-medium text-ink">
                    Grade {l.fromGrade} → Grade {l.toGrade}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {l.academicYear} · {l.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-mute">No promotion history.</p>
          )}
        </Panel>

        <Panel kicker="Archive" title="Yearly snapshots" accent="#7d6a3a" className="col-span-12 md:col-span-6" bodyClass="p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">Age</th>
                <th className="px-4 py-2">Grade</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {student.yearSnapshots.map((s) => (
                <tr key={s.id} className="border-t border-line/60">
                  <td className="px-4 py-2 text-ink-soft">{s.academicYear}</td>
                  <td className="px-4 py-2 text-ink-soft tabular-nums">{s.age}</td>
                  <td className="px-4 py-2 text-ink-soft tabular-nums">{s.gradeLevel}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
              {student.yearSnapshots.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-mute">
                    No snapshots yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}