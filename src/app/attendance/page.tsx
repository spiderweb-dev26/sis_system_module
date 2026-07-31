"use client";

import { useEffect, useState } from "react";
import { Eyebrow, PageHeader, Panel, StatusBadge } from "@/components/ui";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
const TONE: Record<string, string> = { PRESENT: "bg-olive/15 text-olive", ABSENT: "bg-bad/12 text-bad", LATE: "bg-gold/15 text-gold-deep", EXCUSED: "bg-info/10 text-info" };

export default function AttendancePage() {
  const [sections, setSections] = useState<any[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/academics").then((r) => r.json()).then((d) => { setSections(d.sections || []); if (d.sections?.[0]) setSectionId(d.sections[0].id); }); }, []);
  const load = () => {
    if (!sectionId || !date) return;
    setLoading(true);
    fetch(`/api/attendance?sectionId=${sectionId}&date=${date}`).then((r) => r.json()).then((d) => {
      setData(d);
      const m: Record<string, string> = {};
      for (const s of d.students) m[s.id] = d.records[s.id]?.status || "PRESENT";
      setMarks(m);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [sectionId, date]);

  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 4000); };
  const save = async () => {
    const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
    const r = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId, date, records }) }).then((x) => x.json());
    if (r.message) flash("err", r.message); else flash("ok", `Marked ${records.length} students.`);
  };
  const markAll = (s: string) => { const m: Record<string, string> = {}; (data?.students || []).forEach((x: any) => (m[x.id] = s)); setMarks(m); };

  const counts = STATUSES.map((s) => ({ s, n: Object.values(marks).filter((v) => v === s).length }));

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader kicker="The register" title="Attendance" sub="Mark the roll for any section, any day." />
      {msg && <div className={`col-span-12 rounded-xl border px-3 py-2 text-sm ${msg.t === "ok" ? "border-olive/30 bg-olive/10 text-olive" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.m}</div>}

      <Panel className="col-span-12" accent="#6f7a45" bodyClass="flex flex-wrap items-end gap-3">
        <label className="block"><span className="lbl">Section</span><select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="field w-64">{sections.map((s) => <option key={s.id} value={s.id}>{s.courseName} — {s.code}</option>)}</select></label>
        <label className="block"><span className="lbl">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" /></label>
        <div className="ml-auto flex gap-2">{STATUSES.map((s) => <button key={s} onClick={() => markAll(s)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${TONE[s]}`}>All {s.toLowerCase()}</button>)}</div>
      </Panel>

      <div className="col-span-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {counts.map((c) => <div key={c.s} className="card lift p-4"><Eyebrow className="text-ink-faint">{c.s}</Eyebrow><p className="mt-1 font-display text-3xl font-semibold text-ink tabular-nums">{c.n}</p></div>)}
      </div>

      <Panel className="col-span-12" accent="#6f7a45" action={<button onClick={save} disabled={loading} className="rounded-full bg-olive px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 disabled:opacity-60">Save register</button>} bodyClass="p-0">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Admission no.</th><th className="px-5 py-3">Status</th></tr></thead>
          <tbody>{(data?.students || []).map((s: any) => (
            <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
              <td className="px-5 py-2.5 font-medium text-ink">{s.firstName} {s.lastName}</td>
              <td className="px-5 py-2.5 text-ink-mute">{s.admissionNumber}</td>
              <td className="px-5 py-2.5"><div className="flex gap-1.5">{STATUSES.map((st) => (
                <button key={st} onClick={() => setMarks((p) => ({ ...p, [s.id]: st }))} className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${marks[s.id] === st ? TONE[st] + " ring-2 ring-offset-1 ring-gold/40" : "bg-cream-100 text-ink-faint hover:bg-cream-200"}`}>{st.slice(0, 3)}</button>
              ))}</div></td>
            </tr>
          ))}
          {!(data?.students || []).length && <tr><td colSpan={3} className="px-5 py-10 text-center text-ink-mute">{loading ? "Loading…" : "No students in this section."}</td></tr>}
        </tbody></table></div>
      </Panel>
    </div>
  );
}