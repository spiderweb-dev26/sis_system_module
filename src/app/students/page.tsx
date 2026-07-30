import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { calculateAge } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!isStaff(user)) {
    redirect("/dashboard");
  }

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

  const students = await prisma.studentProfile.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-slate-600">All staff can view all student records.</p>
      </div>

      <form className="max-w-md">
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Search by name or admission number"
          className="w-full rounded border px-3 py-2"
        />
      </form>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-2">Admission No.</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Age</th>
              <th className="px-4 py-2">Grade</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b">
                <td className="px-4 py-2">{student.admissionNumber}</td>
                <td className="px-4 py-2">
                  {student.firstName} {student.lastName}
                </td>
                <td className="px-4 py-2">{calculateAge(student.dateOfBirth)}</td>
                <td className="px-4 py-2">{student.gradeLevel}</td>
                <td className="px-4 py-2">{student.status}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/students/${student.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}