"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_DOC_BYTES = 3 * 1024 * 1024;

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) {
    return {
      message: `Request failed (HTTP ${res.status}) with no details from the server.`,
    };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 240) };
  }
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

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
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const photoDoc = registration.documents?.find(
    (d: any) => d.type === "PHOTO"
  );
  const initials = (
    (registration.firstName?.[0] ?? "") + (registration.lastName?.[0] ?? "")
  ).toUpperCase();

  async function uploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setSuccess("");
    setUploading(true);

    try {
      const fd = new FormData(e.currentTarget);
      const file = fd.get("file");
      const type = (fd.get("type") as string) || "";

      if (file instanceof File) {
        if (file.size === 0) throw new Error("The selected file is empty.");
        const isPhoto = type === "PHOTO";
        const max = isPhoto ? MAX_PHOTO_BYTES : MAX_DOC_BYTES;
        if (file.size > max) {
          const mb = (max / 1024 / 1024).toFixed(0);
          throw new Error(
            `"${file.name}" is ${formatBytes(
              file.size
            )} — the limit here is ${mb} MB. Compress it and try again.`
          );
        }
      }

      const res = await fetch(
        `/api/registrations/${registration.id}/documents`,
        { method: "POST", body: fd }
      );

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.message || "Upload failed");
      }

      e.currentTarget.reset();
      setSuccess("Document uploaded successfully.");
      router.refresh();
    } catch (err: any) {
      setMessage(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submitRegistration() {
    setMessage("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/registrations/${registration.id}/submit`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.message || "Submit failed");
      }
      setSuccess("Registration submitted for approval.");
      router.refresh();
    } catch (err: any) {
      setMessage(err?.message || "Submit failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function approveRegistration() {
    setMessage("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/registrations/${registration.id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.message || "Approval failed");
      }
      const student = await safeJson(res);
      router.push(`/students/${student.id}`);
      router.refresh();
    } catch (err: any) {
      setMessage(err?.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  }

  const hasPhoto = registration.documents?.some(
    (d: any) => d.type === "PHOTO"
  );
  const hasPreviousRecord = registration.documents?.some(
    (d: any) => d.type === "PREVIOUS_ACADEMIC_RECORD"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-100 text-lg font-semibold text-slate-500">
            {photoDoc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoDoc.url}
                alt="Student photograph"
                className="h-full w-full object-cover"
              />
            ) : (
              initials || "?"
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              {registration.firstName} {registration.lastName}
            </h1>
            <p className="text-slate-600">
              Applying Grade {registration.applyingGradeLevel}
            </p>
          </div>
        </div>
        <span className="rounded border px-3 py-1 text-sm">
          {registration.status}
        </span>
      </div>

      {message && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}
      {success && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Student Information</h2>
          <div className="space-y-1 text-sm">
            <p>First Name: {registration.firstName}</p>
            <p>Middle Name: {registration.middleName || "-"}</p>
            <p>Last Name: {registration.lastName}</p>
            <p>
              Date of Birth:{" "}
              {new Date(registration.dateOfBirth).toLocaleDateString()}
            </p>
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
          <h2 className="mb-1 text-lg font-semibold">Upload Document</h2>
          <p className="mb-4 text-xs text-slate-500">
            Photos: JPG / PNG / WEBP up to 2 MB · Documents: PDF / JPG / PNG up
            to 3 MB.
          </p>

          <form onSubmit={uploadDocument} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Document Type
                </label>
                <select
                  name="type"
                  className="w-full rounded border px-3 py-2"
                  required
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  name="title"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">File</label>
                <input
                  name="file"
                  type="file"
                  className="w-full rounded border px-3 py-2"
                  required
                />
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
          {registration.documents?.map((doc: any) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-slate-500">
                  {doc.type} · {formatBytes(doc.fileSize)}
                </p>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                View
              </a>
            </div>
          ))}

          {(!registration.documents ||
            registration.documents.length === 0) && (
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