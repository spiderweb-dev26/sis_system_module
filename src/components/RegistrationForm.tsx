"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eyebrow, Field, Panel, Select, TextArea } from "./ui";

export default function RegistrationForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = Object.fromEntries(formData.entries());
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create registration");
      }
      const registration = await res.json();
      router.push(`/registrations/${registration.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Panel kicker="Step 1" title="Student information" accent="#5b3a22">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First name" name="firstName" required />
          <Field label="Middle name" name="middleName" />
          <Field label="Last name" name="lastName" required />
          <Field label="Date of birth" name="dateOfBirth" type="date" required />
          <Field label="Gender" name="gender" required />
          <Select label="Applying grade" name="applyingGradeLevel" required>
            <option value="">Select grade</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </Select>
          <Field label="Nationality" name="nationality" />
          <Field label="Ethnicity" name="ethnicity" />
          <Field label="Religion" name="religion" className="md:col-span-2" />
        </div>
      </Panel>

      <Panel kicker="Step 2" title="Previous school" accent="#a86a32">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="School name" name="previousSchoolName" />
          <Field label="Previous grade" name="previousSchoolGrade" />
          <Field label="Academic year" name="previousAcademicYear" />
          <Field label="Transfer reason" name="transferReason" />
        </div>
      </Panel>

      <Panel kicker="Step 3" title="Guardian information" accent="#6f7a45">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Guardian name" name="guardianName" required />
          <Field label="Relationship" name="guardianRelationship" />
          <Field label="Phone" name="guardianPhone" required />
          <Field label="Email" name="guardianEmail" type="email" />
          <Field label="Address" name="guardianAddress" className="md:col-span-2" />
        </div>
      </Panel>

      <Panel kicker="Step 4" title="Emergency & medical" accent="#8a5e26">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Emergency contact name" name="emergencyContactName" />
          <Field label="Emergency contact phone" name="emergencyContactPhone" />
          <TextArea label="Medical notes" name="medicalNotes" className="md:col-span-2" />
        </div>
      </Panel>

      {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="max-w-sm text-xs text-ink-mute">
          After saving you will upload the photograph and previous academic records.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-cocoa px-6 py-3 text-sm font-semibold text-cream-50 shadow-soft transition hover:-translate-y-0.5 hover:bg-cocoa-deep hover:shadow-lift disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save registration"}
        </button>
      </div>
    </form>
  );
}