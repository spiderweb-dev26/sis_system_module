"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { Eyebrow, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const SEV: Record<string, string> = { LOW: "bg-olive/15 text-olive", MEDIUM: "bg-gold/15 text-gold-deep", HIGH: "bg-clay/15 text-clay", CRITICAL: "bg-bad/12 text-bad" };

function useMe() { const [r, setR] = useState<string | null>(null); useEffect(() => { fetch("/api/me").then((x) => x.ok ? x.json() : null).then((d) => d && setR(d.user.role)); }, []); return r; }
const canWrite = (r: string | null) => !!r && ["PRINCIPAL", "ADMIN", "COUNSELOR"].includes(r);
const canExpel = (r: string | null) => !!r && ["PRINCIPAL", "ADMIN"].includes(r);

export default function DisciplinePage() {
  const role = useMe();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [modal, setModal] = useState<null | "incident" | "expel">(null);
  const [actionFor, setActionFor] = useState<string | null>(null);

  const load = () => Promise.all([fetch("/api/discipline").then((r) => r.json()), fetch("/api/students").then((r) => r.json()).catch(() => [])]).then(([i, s]) => { setIncidents(i); setStudents(Array.isArray(s) ? s : []); });
  useEffect(() => { load(); }, []);
  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 4000); };
  const post = async (body: any) => { const r = await fetch("/api/discipline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Failed"); return d; };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader kicker="Conduct & care" title="Discipline" sub="Log incidents, record actions, and — for the principal — administer expulsion." action={
        <div className="flex gap-2">
          {canWrite(role) && <button onClick={() => setModal("incident")} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Log incident</button>}
          {canExpel(role) && <button onClick={() => setModal("expel")} className="rounded-full border border-bad/40 bg-paper px-4 py-2 text-sm font-semibold text-bad transition hover:bg-bad/10">Expel student</button>}
        </div>
      } />
      {msg && <div className={`col-span-12 rounded-xl border px-3 py-2 text-sm ${msg.t === "ok" ? "border-olive/30 bg-olive/10 text-olive" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.m}</div>}

      <div className="col-span-12 space-y-4">
        {incidents.map((inc) => (
          <Panel key={inc.id} accent={inc.severity === "CRITICAL" ? "#9a4a35" : "#a86a32"} className="col-span-12" bodyClass="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><Eyebrow className="text-ink-faint">{formatDate(inc.occurredAt)}</Eyebrow><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SEV[inc.severity]}`}>{inc.severity}</span></div>
                <h3 className="font-display text-lg font-semibold text-ink">{inc.title}</h3>
                <p className="text-sm text-ink-mute">{inc.student.firstName} {inc.student.lastName} · {inc.student.admissionNumber}</p>
              </div>
              {canWrite(role) && <button onClick={() => setActionFor(inc.id)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-cocoa transition hover:bg-cream-100">+ Action</button>}
            </div>
            <p className="text-sm text-ink-soft">{inc.description}</p>
            <div className="space-y-1.5">
              {inc.actions.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-line/70 bg-cream-50/50 px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{a.type.replace("_", " ")} <span className="text-ink-faint">· {a.notes || ""}</span></span>
                  <span className="text-xs text-ink-faint">{a.decidedByName || ""}</span>
                </div>
              ))}
              {!inc.actions.length && <p className="text-xs text-ink-faint">No actions recorded.</p>}
            </div>
          </Panel>
        ))}
        {!incidents.length && <Panel className="col-span-12"><p className="text-sm text-ink-mute">No incidents recorded.</p></Panel>}
      </div>

      <Modal open={modal === "incident"} onClose={() => setModal(null)} kicker="Conduct" title="Log an incident" wide>
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); try { await post({ kind: "incident", studentId: fd.get("studentId"), title: fd.get("title"), description: fd.get("description"), severity: fd.get("severity"), occurredAt: fd.get("occurredAt") }); setModal(null); flash("ok", "Incident logged."); load(); } catch (x: any) { flash("err", x.message); } }} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block"><span className="lbl">Student *</span><select name="studentId" className="field" required><option value="">Select…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></label>
            <label className="block"><span className="lbl">Severity</span><select name="severity" className="field">{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="block md:col-span-2"><span className="lbl">Title *</span><input name="title" className="field" required /></label>
            <label className="block md:col-span-2"><span className="lbl">Description *</span><textarea name="description" rows={3} className="field resize-none" required /></label>
            <label className="block"><span className="lbl">Occurred</span><input name="occurredAt" type="date" className="field" /></label>
          </div>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Log incident</button>
        </form>
      </Modal>

      <Modal open={!!actionFor} onClose={() => setActionFor(null)} kicker="Response" title="Add action">
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); try { await post({ kind: "action", incidentId: actionFor, type: fd.get("type"), notes: fd.get("notes"), startDate: fd.get("startDate"), endDate: fd.get("endDate") }); setActionFor(null); flash("ok", "Action added."); load(); } catch (x: any) { flash("err", x.message); } }} className="space-y-3">
          <label className="block"><span className="lbl">Type</span><select name="type" className="field">{["WARNING", "DETENTION", "COUNSELING", "SUSPENSION", "OTHER"].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="block"><span className="lbl">Notes</span><input name="notes" className="field" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block"><span className="lbl">Start</span><input name="startDate" type="date" className="field" /></label><label className="block"><span className="lbl">End</span><input name="endDate" type="date" className="field" /></label></div>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Add action</button>
        </form>
      </Modal>

      <Modal open={modal === "expel"} onClose={() => setModal(null)} kicker="Final measure" title="Expel a student">
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); if (!confirm("Expel this student? This changes their status and cannot be undone from here.")) return; try { await post({ kind: "expel", studentId: fd.get("studentId"), reason: fd.get("reason") }); setModal(null); flash("ok", "Student expelled."); load(); } catch (x: any) { flash("err", x.message); } }} className="space-y-3">
          <label className="block"><span className="lbl">Student *</span><select name="studentId" className="field" required><option value="">Select…</option>{students.filter((s) => s.status === "ACTIVE").map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></label>
          <label className="block"><span className="lbl">Reason *</span><textarea name="reason" rows={3} className="field resize-none" required /></label>
          <button className="rounded-full bg-bad px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5">Confirm expulsion</button>
        </form>
      </Modal>
    </div>
  );
}