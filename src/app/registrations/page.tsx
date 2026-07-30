import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canCreateRegistration, isStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!isStaff(user)) {
    redirect("/dashboard");
  }

  const [registrations, activePeriod] = await Promise.all([
    prisma.registrationApplication.findMany({
      include: {
        documents: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.registrationPeriod.findFirst({
      where: {
        isActive: true,
      },
    }),
  ]);

  const canCreate = canCreateRegistration(user, activePeriod);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Registrations</h1>

          {activePeriod ? (
            <p className="text-slate-600">
              {activePeriod.name} ends {formatDate(activePeriod.endDate)}
            </p>
          ) : (
            <p className="text-red-600">No active registration period.</p>
          )}
        </div>

        {canCreate && (
          <Link
            href="/registrations/new"
            className="rounded bg-slate-900 px-4 py-2 text-white"
          >
            Register New Student
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Grade</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Documents</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id} className="border-b">
                <td className="px-4 py-2">
                  {registration.firstName} {registration.lastName}
                </td>
                <td className="px-4 py-2">{registration.applyingGradeLevel}</td>
                <td className="px-4 py-2">{registration.status}</td>
                <td className="px-4 py-2">{registration.documents.length}</td>
                <td className="px-4 py-2">{formatDate(registration.createdAt)}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/registrations/${registration.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {registrations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}