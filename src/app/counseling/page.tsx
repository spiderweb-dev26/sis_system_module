"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/tabs";
import { Modal } from "@/components/modal";
import { Eyebrow, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

const RISK: Record<string, string> = { NONE: "bg-olive/15 text-olive", LOW: "bg-gold/15 text-gold-deep", MEDIUM: "bg-clay/15 text-clay", HIGH: "bg-bad/12 text-bad", CRITICAL: "bg-bad/20 text-bad" };

export default function CounselingPage() {
  const [tab, setTab] = useState("notes");
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState<any>({ notes: [], appointments: [], interventions: [] });
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [modal, setModal] = useState<null | string>(null);

  const load = () => {
    const q = studentId ? `?studentId=${studentId}` : "";
    fetch(`/api/counseling${q}`).then((r) => r.json()).then(setData);
  };
  useEffect(() => { fetch("/api/students").then((r) => r.json()).then((s) => setStudents(Array.isArray(s) ? s : [])); }, []);
  useEffect(() => { load(); }, [studentId]);
  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 4000); };
  const post = async (body: any) => { const r = await fetch("/api/counseling", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Failed"); return d; };
  const patch = async (kind: string, id: string, body: any) => { const r = await fetch(`/api/counseling?kind=${kind}&id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error("Failed"); };

  const pickStudent = (id: string) => { setStudentId(id); };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader kicker="Wellbeing & guidance" title="Counselling" sub="Confidential notes, appointments and interventions — for every student you support." action={
        <select value={studentId} onChange={(e) => pickStudent(e.target.value)} className="field w-64"><option value="">All students</option>{students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select>
      } />
      {msg && <div className={`col-span-12 rounded-xl border px-3 py-2 text-sm ${msg.t === "ok" ? "border-olive/30 bg-olive/10 text-olive" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.m}</div>}

      <div className="col-span-12 grid grid-cols-3 gap-4">
        {[{ l: "Notes", v: data.notes.length, a: "#6f7a45" }, { l: "Appointments", v: data.appointments.length, a: "#b07d3c" }, { l: "Interventions", v: data.interventions.length, a: "#9c5638" }].map((c) => (
          <div key={c.l} className="card lift p-4"><Eyebrow className="text-ink-faint">{c.l}</Eyebrow><p className="mt-1 font-display text-3xl font-semibold text-ink tabular-nums">{c.v}</p></div>
        ))}
      </div>

      <div className="col-span-12"><Tabs active={tab} onChange={setTab} tabs={[{ id: "notes", label: "Notes", count: data.notes.length }, { id: "appointments", label: "Appointments", count: data.appointments.length }, { id: "interventions", label: "Interventions", count: data.interventions.length }]} /></div>

      <Panel className="col-span-12" accent="#6f7a45" action={<button onClick={() => setModal(tab)} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">+ New {tab.replace(/s$/, "")}</button>} bodyClass="space-y-2">
        {tab === "notes" && (data.notes.length ? data.notes.map((n: any) => (
          <div key={n.id} className="rounded-xl border border-line/70 bg-cream-50/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="font-display font-semibold text-ink">{n.title}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${RISK[n.riskLevel]}`}>{n.riskLevel}</span><span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{n.category}</span></div>
              <div className="flex items-center gap-2"><span className="text-xs text-ink-faint">{n.student.firstName} {n.student.lastName} · {n.counselorName}</span>
                <button onClick={async () => { try { await patch("note", n.id, { resolved: !n.resolved }); flash("ok", "Updated."); load(); } catch (e: any) { flash("err", e.message); } }} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${n.resolved ? "bg-olive/15 text-olive" : "bg-cream-200 text-ink-faint"}`}>{n.resolved ? "Resolved" : "Open"}</button>
              </div>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{n.note}</p>
          </div>
        )) : <p className="text-sm text-ink-mute">No notes yet.</p>)}

        {tab === "appointments" && (data.appointments.length ? data.appointments.map((a: any) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/70 bg-cream-50/50 px-3 py-2">
            <div><span className="font-medium text-ink">{a.title}</span><span className="ml-2 text-xs text-ink-faint">{a.student.firstName} {a.student.lastName} · {formatDateTime(a.scheduledAt)} · {a.location || ""}</span></div>
            <div className="flex items-center gap-2"><StatusBadge status={a.status} />
              <button onClick={async () => { try { await patch("appointment", a.id, { status: a.status === "COMPLETED" ? "SCHEDULED" : "COMPLETED" }); load(); } catch (e: any) { flash("err", e.message); } }} className="text-xs font-semibold text-gold-deep hover:underline">Toggle</button>
            </div>
          </div>
        )) : <p className="text-sm text-ink-mute">No appointments.</p>)}

        {tab === "interventions" && (data.interventions.length ? data.interventions.map((i: any) => (
          <div key={i.id} className="rounded-xl border border-line/70 bg-cream-50/50 p-3">
            <div className="flex items-center justify-between gap-2"><span className="font-medium text-ink">{i.title}</span><StatusBadge status={i.status} /></div>
            <p className="mt-1 text-sm text-ink-soft">{i.description} <span className="text-ink-faint">· {i.student.firstName} {i.student.lastName}</span></p>
          </div>
        )) : <p className="text-sm text-ink-mute">No interventions.</p>)}
      </Panel>

      <Modal open={modal === "notes"} onClose={() => setModal(null)} kicker="Confidential" title="New counselling note" wide>
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); try { await post({ kind: "note", studentId: fd.get("studentId"), category: fd.get("category"), riskLevel: fd.get("riskLevel"), title: fd.get("title"), note: fd.get("note"), followUpDate: fd.get("followUpDate") }); setModal(null); flash("ok", "Note saved."); load(); } catch (x: any) { flash("err", x.message); } }} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block"><span className="lbl">Student *</span><select name="studentId" className="field" required><option value="">Select…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></label>
            <label className="block"><span className="lbl">Category</span><select name="category" className="field">{["ACADEMIC", "BEHAVIOR", "ATTENDANCE", "MENTAL_HEALTH", "FAMILY", "CAREER", "OTHER"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="block"><span className="lbl">Risk level</span><select name="riskLevel" className="field">{["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="block"><span className="lbl">Follow-up</span><input name="followUpDate" type="date" className="field" /></label>
            <label className="block md:col-span-2"><span className="lbl">Title *</span><input name="title" className="field" required /></label>
            <label className="block md:col-span-2"><span className="lbl">Note *</span><textarea name="note" rows={4} className="field resize-none" required /></label>
          </div>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Save note</button>
        </form>
      </Modal>

      <Modal open={modal === "appointments"} onClose={() => setModal(null)} kicker="Diary" title="New appointment">
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); try { await post({ kind: "appointment", studentId: fd.get("studentId"), title: fd.get("title"), scheduledAt: fd.get("scheduledAt"), location: fd.get("location"), notes: fd.get("notes") }); setModal(null); flash("ok", "Appointment set."); load(); } catch (x: any) { flash("err", x.message); } }} className="space-y-3">
          <label className="block"><span className="lbl">Student *</span><select name="studentId" className="field" required><option value="">Select…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></label>
          <label className="block"><span className="lbl">Title *</span><input name="title" className="field" required /></label>
          <label className="block"><span className="lbl">When *</span><input name="scheduledAt" type="datetime-local" className="field" required /></label>
          <label className="block"><span className="lbl">Location</span><input name="location" className="field" /></label>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Schedule</button>
        </form>
      </Modal>

      <Modal open={modal === "interventions"} onClose={() => setModal(null)} kicker="Support plan" title="New intervention">
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); try { await post({ kind: "intervention", studentId: fd.get("studentId"), title: fd.get("title"), description: fd.get("description"), status: fd.get("status"), startDate: fd.get("startDate") }); setModal(null); flash("ok", "Intervention created."); load(); } catch (x: any) { flash("err", x.message); } }} className="space-y-3">
          <label className="block"><span className="lbl">Student *</span><select name="studentId" className="field" required><option value="">Select…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></label>
          <label className="block"><span className="lbl">Title *</span><input name="title" className="field" required /></label>
          <label className="block"><span className="lbl">Status</span><select name="status" className="field">{["PLANNED", "ACTIVE", "COMPLETED"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="block"><span className="lbl">Start</span><input name="startDate" type="date" className="field" /></label>
          <label className="block"><span className="lbl">Description *</span><textarea name="description" rows={3} className="field resize-none" required /></label>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Create</button>
        </form>
      </Modal>
    </div>
  );
}