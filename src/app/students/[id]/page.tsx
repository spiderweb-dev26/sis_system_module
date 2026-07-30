import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { calculateAge, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      registrationApplication: {
        include: {
          documents: true,
        },
      },
      promotionLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
      yearSnapshots: {
        orderBy: {
          snapshotDate: "desc",
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  if (!isStaff(user) && user.student?.id !== student.id) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-slate-600">
            Admission Number: {student.admissionNumber}
          </p>
        </div>

        <span className="rounded border px-3 py-1 text-sm">
          {student.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Overview</h2>

          <div className="space-y-1 text-sm">
            <p>Age: {calculateAge(student.dateOfBirth)}</p>
            <p>Date of Birth: {formatDate(student.dateOfBirth)}</p>
            <p>Gender: {student.gender}</p>
            <p>Grade: {student.gradeLevel}</p>
            <p>Enrollment Date: {formatDate(student.enrollmentDate)}</p>
            <p>Nationality: {student.nationality || "-"}</p>
            <p>Ethnicity: {student.ethnicity || "-"}</p>
            <p>Religion: {student.religion || "-"}</p>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Guardian</h2>

          <div className="space-y-1 text-sm">
            <p>Name: {student.guardianName || "-"}</p>
            <p>Relationship: {student.guardianRelationship || "-"}</p>
            <p>Phone: {student.guardianPhone || "-"}</p>
            <p>Email: {student.guardianEmail || "-"}</p>
            <p>Address: {student.addressLine1 || "-"}</p>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Previous School</h2>

          <div className="space-y-1 text-sm">
            <p>School: {student.previousSchoolName || "-"}</p>
            <p>Grade: {student.previousSchoolGrade || "-"}</p>
            <p>Academic Year: {student.previousAcademicYear || "-"}</p>
            <p>Transfer Reason: {student.transferReason || "-"}</p>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Photo</h2>

          {student.photoUrl ? (
            <Link
              href={student.photoUrl}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              View Photo
            </Link>
          ) : (
            <p className="text-sm text-slate-500">No photo available.</p>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Registration Documents</h2>

        <div className="space-y-2">
          {student.registrationApplication?.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-slate-500">{doc.type}</p>
              </div>

              <Link
                href={doc.url}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                View
              </Link>
            </div>
          ))}

          {!student.registrationApplication?.documents.length && (
            <p className="text-sm text-slate-500">No registration documents.</p>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Promotion History</h2>

        <div className="space-y-2">
          {student.promotionLogs.map((log) => (
            <div key={log.id} className="rounded border px-3 py-2 text-sm">
              <p>
                Grade {log.fromGrade} to Grade {log.toGrade}
              </p>
              <p className="text-slate-500">
                {log.academicYear} - {log.reason}
              </p>
            </div>
          ))}

          {student.promotionLogs.length === 0 && (
            <p className="text-sm text-slate-500">No promotion history.</p>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Yearly Snapshots</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-2">Academic Year</th>
                <th className="px-4 py-2">Age</th>
                <th className="px-4 py-2">Grade</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Snapshot Date</th>
              </tr>
            </thead>

            <tbody>
              {student.yearSnapshots.map((snapshot) => (
                <tr key={snapshot.id} className="border-b">
                  <td className="px-4 py-2">{snapshot.academicYear}</td>
                  <td className="px-4 py-2">{snapshot.age}</td>
                  <td className="px-4 py-2">{snapshot.gradeLevel}</td>
                  <td className="px-4 py-2">{snapshot.status}</td>
                  <td className="px-4 py-2">{formatDate(snapshot.snapshotDate)}</td>
                </tr>
              ))}

              {student.yearSnapshots.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                    No yearly snapshots yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}