"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const documentTypes = [
  "PHOTO",
  "PREVIOUS_ACADEMIC_RECORD",
  "TRANSCRIPT",
  "REPORT_CARD",
  "BIRTH_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
  "MEDICAL_RECORD",
  "PARENT_ID",
  "OTHER",
];

export default function RegistrationDetail({
  registration,
  canApprove,
  canUpload,
}: {
  registration: any;
  canApprove: boolean;
  canUpload: boolean;
}) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function uploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const res = await fetch(`/api/registrations/${registration.id}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      router.refresh();

      e.currentTarget.reset();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function submitRegistration() {
    setMessage("");
    setActionLoading(true);

    try {
      const res = await fetch(`/api/registrations/${registration.id}/submit`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Submit failed");
      }

      router.refresh();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function approveRegistration() {
    setMessage("");
    setActionLoading(true);

    try {
      const res = await fetch(`/api/registrations/${registration.id}/approve`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Approval failed");
      }

      const student = await res.json();

      router.push(`/students/${student.id}`);
      router.refresh();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  const hasPhoto = registration.documents.some(
    (doc: any) => doc.type === "PHOTO"
  );

  const hasPreviousRecord = registration.documents.some(
    (doc: any) => doc.type === "PREVIOUS_ACADEMIC_RECORD"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {registration.firstName} {registration.lastName}
          </h1>
          <p className="text-slate-600">
            Applying Grade {registration.applyingGradeLevel}
          </p>
        </div>

        <span className="rounded border px-3 py-1 text-sm">
          {registration.status}
        </span>
      </div>

      {message && <p className="text-sm text-red-600">{message}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Student Information</h2>

          <div className="space-y-1 text-sm">
            <p>First Name: {registration.firstName}</p>
            <p>Middle Name: {registration.middleName || "-"}</p>
            <p>Last Name: {registration.lastName}</p>
            <p>Date of Birth: {new Date(registration.dateOfBirth).toLocaleDateString()}</p>
            <p>Gender: {registration.gender}</p>
            <p>Nationality: {registration.nationality || "-"}</p>
            <p>Ethnicity: {registration.ethnicity || "-"}</p>
            <p>Religion: {registration.religion || "-"}</p>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Guardian Information</h2>

          <div className="space-y-1 text-sm">
            <p>Guardian Name: {registration.guardianName || "-"}</p>
            <p>Relationship: {registration.guardianRelationship || "-"}</p>
            <p>Phone: {registration.guardianPhone || "-"}</p>
            <p>Email: {registration.guardianEmail || "-"}</p>
            <p>Address: {registration.guardianAddress || "-"}</p>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Previous School</h2>

          <div className="space-y-1 text-sm">
            <p>School: {registration.previousSchoolName || "-"}</p>
            <p>Grade: {registration.previousSchoolGrade || "-"}</p>
            <p>Academic Year: {registration.previousAcademicYear || "-"}</p>
            <p>Transfer Reason: {registration.transferReason || "-"}</p>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Required Documents</h2>

          <div className="space-y-1 text-sm">
            <p>
              Photograph:{" "}
              {hasPhoto ? (
                <span className="text-green-600">Uploaded</span>
              ) : (
                <span className="text-red-600">Missing</span>
              )}
            </p>

            <p>
              Previous Academic Record:{" "}
              {hasPreviousRecord ? (
                <span className="text-green-600">Uploaded</span>
              ) : (
                <span className="text-red-600">Missing</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {canUpload && (
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Upload Document</h2>

          <form onSubmit={uploadDocument} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Document Type</label>
                <select name="type" className="w-full rounded border px-3 py-2" required>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input name="title" className="w-full rounded border px-3 py-2" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">File</label>
                <input name="file" type="file" className="w-full rounded border px-3 py-2" required />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Documents</h2>

        <div className="space-y-2">
          {registration.documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
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

          {registration.documents.length === 0 && (
            <p className="text-sm text-slate-500">No documents uploaded.</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {registration.status === "DRAFT" && (
          <button
            onClick={submitRegistration}
            disabled={actionLoading}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Submit Registration
          </button>
        )}

        {registration.status === "PENDING" && canApprove && (
          <button
            onClick={approveRegistration}
            disabled={actionLoading}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Approve and Enroll Student
          </button>
        )}
      </div>
    </div>
  );
}