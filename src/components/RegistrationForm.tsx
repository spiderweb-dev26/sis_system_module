"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create registration");
      }

      const registration = await res.json();

      router.push(`/registrations/${registration.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded border bg-white p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">First Name</label>
          <input name="firstName" className="w-full rounded border px-3 py-2" required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Middle Name</label>
          <input name="middleName" className="w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Last Name</label>
          <input name="lastName" className="w-full rounded border px-3 py-2" required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Date of Birth</label>
          <input type="date" name="dateOfBirth" className="w-full rounded border px-3 py-2" required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Gender</label>
          <input name="gender" className="w-full rounded border px-3 py-2" required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Applying Grade</label>
          <select name="applyingGradeLevel" className="w-full rounded border px-3 py-2" required>
            <option value="">Select grade</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Nationality</label>
          <input name="nationality" className="w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ethnicity</label>
          <input name="ethnicity" className="w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Religion</label>
          <input name="religion" className="w-full rounded border px-3 py-2" />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Previous School</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Previous School Name</label>
            <input name="previousSchoolName" className="w-full rounded border px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Previous Grade</label>
            <input name="previousSchoolGrade" className="w-full rounded border px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Previous Academic Year</label>
            <input name="previousAcademicYear" className="w-full rounded border px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Transfer Reason</label>
            <input name="transferReason" className="w-full rounded border px-3 py-2" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Guardian Information</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Guardian Name</label>
            <input name="guardianName" className="w-full rounded border px-3 py-2" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Relationship</label>
            <input name="guardianRelationship" className="w-full rounded border px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Guardian Phone</label>
            <input name="guardianPhone" className="w-full rounded border px-3 py-2" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Guardian Email</label>
            <input type="email" name="guardianEmail" className="w-full rounded border px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Address</label>
            <input name="guardianAddress" className="w-full rounded border px-3 py-2" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Emergency and Medical</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Emergency Contact Name</label>
            <input name="emergencyContactName" className="w-full rounded border px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Emergency Contact Phone</label>
            <input name="emergencyContactPhone" className="w-full rounded border px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Medical Notes</label>
            <textarea name="medicalNotes" className="w-full rounded border px-3 py-2" rows={3} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Registration"}
      </button>

      <p className="text-sm text-slate-500">
        After saving, you will upload the photograph and previous academic records.
      </p>
    </form>
  );
}