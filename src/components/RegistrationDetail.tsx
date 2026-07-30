"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crest, Eyebrow, Panel, StatusBadge } from "./ui";

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
  if (!text) return { message: `Request failed (HTTP ${res.status}) with no details from the server.` };
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

  const photoDoc = registration.documents?.find((d: any) => d.type === "PHOTO");
  const initials = ((registration.firstName?.[0] ?? "") + (registration.lastName?.[0] ?? "")).toUpperCase();

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
          throw new Error(`"${file.name}" is ${formatBytes(file.size)} — the limit here is ${mb} MB.`);
        }
      }
      const res = await fetch(`/api/registrations/${registration.id}/documents`, { method: "POST", body: fd });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.message || "Upload failed");
      }
      e.currentTarget.reset();
      setSuccess("Document uploaded successfully.");
      router.refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submitRegistration() {
    setMessage("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/registrations/${registration.id}/submit`, { method: "POST" });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.message || "Submit failed");
      }
      setSuccess("Registration submitted for approval.");
      router.refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function approveRegistration() {
    setMessage("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/registrations/${registration.id}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.message || "Approval failed");
      }
      const student = await safeJson(res);
      router.push(`/students/${student.id}`);
      router.refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setActionLoading(false);
    }
  }

  const hasPhoto = registration.documents?.some((d: any) => d.type === "PHOTO");
  const hasPreviousRecord = registration.documents?.some((d: any) => d.type === "PREVIOUS_ACADEMIC_RECORD");

  return (
    <div className="space-y-6">
      <Panel className="col-span-12" bodyClass="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-cream-100 text-xl font-semibold text-cocoa">
            {photoDoc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoDoc.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Crest letter={initials || "?"} size={64} />
            )}
          </div>
          <div className="flex-1">
            <Eyebrow className="text-gold-deep">Registration</Eyebrow>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {registration.firstName} {registration.lastName}
            </h1>
            <p className="mt-1 text-sm text-ink-mute">Applying for Grade {registration.applyingGradeLevel}</p>
          </div>
          <StatusBadge status={registration.status} />
        </div>
      </Panel>

      {message && <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{message}</p>}
      {success && <p className="rounded-xl border border-olive/30 bg-olive/10 px-3 py-2 text-sm text-olive">{success}</p>}

      <div className="grid grid-cols-12 gap-4 md:gap-5">
        <Panel kicker="Profile" title="Student information" accent="#5b3a22" className="col-span-12 md:col-span-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["First name", registration.firstName],
              ["Middle name", registration.middleName || "—"],
              ["Last name", registration.lastName],
              ["Date of birth", new Date(registration.dateOfBirth).toLocaleDateString()],
              ["Gender", registration.gender],
              ["Nationality", registration.nationality || "—"],
              ["Ethnicity", registration.ethnicity || "—"],
              ["Religion", registration.religion || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel kicker="Family" title="Guardian information" accent="#6f7a45" className="col-span-12 md:col-span-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Name", registration.guardianName || "—"],
              ["Relationship", registration.guardianRelationship || "—"],
              ["Phone", registration.guardianPhone || "—"],
              ["Email", registration.guardianEmail || "—"],
              ["Address", registration.guardianAddress || "—"],
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
              ["School", registration.previousSchoolName || "—"],
              ["Grade", registration.previousSchoolGrade || "—"],
              ["Year", registration.previousAcademicYear || "—"],
              ["Reason", registration.transferReason || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel kicker="Checklist" title="Required documents" accent="#8a5e26" className="col-span-12 md:col-span-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2">
              <span className="font-medium text-ink-soft">Photograph</span>
              {hasPhoto ? <span className="font-semibold text-olive">Uploaded</span> : <span className="font-semibold text-bad">Missing</span>}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2">
              <span className="font-medium text-ink-soft">Previous academic record</span>
              {hasPreviousRecord ? <span className="font-semibold text-olive">Uploaded</span> : <span className="font-semibold text-bad">Missing</span>}
            </div>
          </div>
        </Panel>

        {canUpload && (
          <Panel kicker="Upload" title="Add a document" accent="#5b3a22" className="col-span-12">
            <p className="mb-4 text-xs text-ink-mute">Photos: JPG / PNG / WEBP up to 2 MB · Documents: PDF / JPG / PNG up to 3 MB.</p>
            <form onSubmit={uploadDocument} className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
              <label className="block">
                <span className="lbl">Document type</span>
                <select name="type" className="field" required>
                  {documentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="lbl">Title</span>
                <input name="title" className="field" />
              </label>
              <label className="block">
                <span className="lbl">File</span>
                <input name="file" type="file" className="field" required />
              </label>
              <button type="submit" disabled={uploading} className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-cocoa-deep disabled:opacity-60">
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </form>
          </Panel>
        )}

        <Panel kicker="Files" title="Uploaded documents" accent="#6b4a2e" className="col-span-12">
          {registration.documents?.length ? (
            <div className="space-y-2">
              {registration.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink">{doc.title}</p>
                    <p className="text-xs text-ink-faint">{doc.type} · {formatBytes(doc.fileSize)}</p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="font-semibold text-gold-deep hover:underline">View</a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-mute">No documents uploaded.</p>
          )}
        </Panel>
      </div>

      <div className="flex flex-wrap gap-3">
        {registration.status === "DRAFT" && (
          <button onClick={submitRegistration} disabled={actionLoading} className="rounded-full bg-gold-deep px-6 py-3 text-sm font-semibold text-cream-50 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60">
            Submit registration
          </button>
        )}
        {registration.status === "PENDING" && canApprove && (
          <button onClick={approveRegistration} disabled={actionLoading} className="rounded-full bg-olive px-6 py-3 text-sm font-semibold text-cream-50 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60">
            Approve &amp; enrol student
          </button>
        )}
      </div>
    </div>
  );
}