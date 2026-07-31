"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/tabs";
import { Modal } from "@/components/modal";
import { Eyebrow, PageHeader, Panel, StatusBadge } from "@/components/ui";

function useMe() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => { fetch("/api/me").then((r) => r.ok ? r.json() : null).then((d) => d && setMe(d.user)).catch(() => {}); }, []);
  return me;
}
const isRecords = (r: string) => ["PRINCIPAL", "ADMIN", "REGISTRAR"].includes(r);
const isGrader = (r: string) => ["PRINCIPAL", "ADMIN", "TEACHER"].includes(r);

export default function AcademicsPage() {
  const me = useMe();
  const role = me?.role || "";
  const [tab, setTab] = useState(role === "TEACHER" ? "homeroom" : "gradebook");
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [sectionId, setSectionId] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [gb, setGb] = useState<any>(null);
  const [gbLoading, setGbLoading] = useState(false);
  const [modal, setModal] = useState<null | string>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [mySection, setMySection] = useState<any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([fetch("/api/academics").then((r) => r.json()), fetch("/api/students").then((r) => r.json()).catch(() => [])])
      .then(([d, s]) => { 
        setData(d); 
        setStudents(Array.isArray(s) ? s : []);
        
        // For teachers, find their homeroom section
        if (role === "TEACHER" && me?.id) {
          const sections = d.sections || [];
          const mySec = sections.find((sec: any) => sec.teacherUserId === me.id);
          setMySection(mySec || null);
          if (mySec) {
            setSectionId(mySec.id);
            openGradebook(mySec.id);
          }
        }
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [role, me]);
  useEffect(() => { fetch("/api/students").then((r) => r.json()).catch(() => []); }, []);

  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 4000); };
  const post = async (body: any) => {
    const r = await fetch("/api/academics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || "Failed");
    return d;
  };

  const openGradebook = async (id: string) => {
    setSectionId(id); setGbLoading(true);
    const r = await fetch(`/api/academics?sectionId=${id}`).then((x) => x.json());
    setGb(r); setGbLoading(false);
    const init: Record<string, string> = {};
    for (const s of r.students) for (const c of r.categories) for (const a of c.assessments) {
      const g = r.grades[`${s.id}_${a.id}`]; init[`${s.id}_${a.id}`] = g?.score ?? "";
    }
    setScores(init);
  };

  const saveGrades = async () => {
    const grades = Object.entries(scores).map(([k, v]) => { const [studentId, assessmentId] = k.split("_"); return { studentId, assessmentId, score: v }; });
    try { await post({ kind: "saveGrades", sectionId, grades }); flash("ok", "Grades saved as draft."); openGradebook(sectionId); } catch (e: any) { flash("err", e.message); }
  };
  const submitGrades = async () => {
    if (!gb) return;
    try { await post({ kind: "submitGrades", sectionId, termId: gb.section?.termId }); flash("ok", "Grades submitted & term grades computed."); openGradebook(sectionId); load(); } catch (e: any) { flash("err", e.message); }
  };

  const sections = data?.sections || [];
  const terms = data?.terms || [];
  const courses = data?.courses || [];
  const categories = data?.categories || [];
  const filteredSections = grade ? sections.filter((s: any) => s.gradeLevel == Number(grade)) : sections;

  const isTeacher = role === "TEACHER";

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader 
        kicker={isTeacher ? "Your Homeroom" : "Faculty & Academics"} 
        title={isTeacher ? `${mySection ? `${mySection.code} — Your Homeroom` : "Academics"}` : "Academics & Gradebook"} 
        sub={isTeacher ? "Enter grades for all students in your section." : "Terms, courses, sections, enrolment and the living gradebook."} 
      />
      {msg && <div className={`col-span-12 rounded-xl border px-3 py-2 text-sm ${msg.t === "ok" ? "border-olive/30 bg-olive/10 text-olive" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.m}</div>}

      <div className="col-span-12">
        <Tabs active={tab} onChange={(t) => { setTab(t); if (t !== "gradebook" && t !== "homeroom") setGb(null); }} tabs={
          isTeacher ? [
            { id: "homeroom", label: "My Homeroom" },
            { id: "gradebook", label: "Gradebook" },
          ] : [
            { id: "gradebook", label: "Gradebook" }, 
            { id: "sections", label: "Sections", count: sections.length },
            { id: "courses", label: "Courses", count: courses.length }, 
            { id: "terms", label: "Terms", count: terms.length },
            { id: "categories", label: "Categories", count: categories.length },
          ]
        } />
      </div>

      {/* Teacher's Homeroom View */}
      {tab === "homeroom" && isTeacher && (
        <>
          {mySection ? (
            <>
              <Panel className="col-span-12" accent="#9c5638" title={`${mySection.code} — ${mySection.name}`} bodyClass="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <Eyebrow className="text-ink-faint">Your Homeroom Section</Eyebrow>
                    <p className="font-display text-2xl font-semibold text-ink">{mySection.code}</p>
                  </div>
                  <div>
                    <Eyebrow className="text-ink-faint">Grade Level</Eyebrow>
                    <p className="font-display text-2xl font-semibold text-ink">{mySection.gradeLevel}</p>
                  </div>
                  <div>
                    <Eyebrow className="text-ink-faint">Students Enrolled</Eyebrow>
                    <p className="font-display text-2xl font-semibold text-ink">{gb?.students?.length || 0}</p>
                  </div>
                  <div className="ml-auto">
                    <button onClick={() => setTab("gradebook")} className="rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5">
                      Open Gradebook →
                    </button>
                  </div>
                </div>
                <p className="text-sm text-ink-mute">
                  As the homeroom teacher for <strong>{mySection.code}</strong>, you are responsible for entering grades for all students in this section.
                </p>
              </Panel>

              <Panel className="col-span-12" accent="#9c5638" title="Your Students" bodyClass="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                      <tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Admission No.</th><th className="px-5 py-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {(gb?.students || []).map((s: any) => (
                        <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
                          <td className="px-5 py-3 font-medium text-ink">{s.firstName} {s.lastName}</td>
                          <td className="px-5 py-3 text-ink-mute">{s.admissionNumber}</td>
                          <td className="px-5 py-3"><span className="rounded-full bg-olive/15 px-2 py-0.5 text-xs font-bold text-olive">Enrolled</span></td>
                        </tr>
                      ))}
                      {!gb?.students?.length && <tr><td colSpan={3} className="px-5 py-10 text-center text-ink-mute">No students enrolled in your section yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          ) : (
            <Panel className="col-span-12" accent="#9c5638">
              <div className="py-12 text-center">
                <p className="text-lg text-ink-mute">No homeroom section assigned yet.</p>
                <p className="mt-2 text-sm text-ink-faint">Please contact the registrar to be assigned a section.</p>
              </div>
            </Panel>
          )}
        </>
      )}

      {tab === "gradebook" && (
        <Panel className="col-span-12" accent="#9c5638" title={gb ? `${gb.section.code} ${isTeacher && mySection?.id === sectionId ? "(Your Homeroom)" : ""}` : "Select a section"} action={
          <div className="flex gap-2">
            {!isTeacher && (
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="field w-32">
                <option value="">All grades</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            )}
            <select value={sectionId} onChange={(e) => e.target.value && openGradebook(e.target.value)} className="field w-64">
              <option value="">Choose section…</option>
              {(isTeacher ? [mySection] : filteredSections).filter(Boolean).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.code} {isTeacher && mySection?.id === s.id ? "(Your Homeroom)" : ""}
                </option>
              ))}
            </select>
          </div>
        } bodyClass="p-0">
          {gbLoading && <div className="p-6 text-sm text-ink-mute">Loading gradebook…</div>}
          {gb && !gbLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="sticky left-0 z-10 bg-cream-100 px-4 py-3">Student</th>
                    {gb.categories.map((c: any) => c.assessments.map((a: any) => (
                      <th key={a.id} className="px-2 py-3 text-center" title={`${c.name} · /${a.maxScore}`}>
                        <div className="text-[10px] font-bold uppercase text-ink-faint">{c.name.slice(0, 4)}</div>
                        <div className="font-semibold text-ink-soft">{a.name}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right">Score</th>
                    <th className="px-3 py-3 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {gb.students.map((s: any) => (
                    <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
                      <td className="sticky left-0 z-10 bg-paper px-4 py-2 font-medium text-ink">{s.firstName} {s.lastName}</td>
                      {gb.categories.map((c: any) => c.assessments.map((a: any) => (
                        <td key={a.id} className="px-1 py-1">
                          <input
                            value={scores[`${s.id}_${a.id}`] ?? ""}
                            onChange={(e) => setScores((p) => ({ ...p, [`${s.id}_${a.id}`]: e.target.value }))}
                            disabled={!isGrader(role) || (isTeacher && mySection?.id !== sectionId)}
                            type="number" min={0} max={a.maxScore} step="0.01"
                            className="w-16 rounded-lg border border-line bg-cream-50/70 px-2 py-1 text-center text-xs tabular-nums focus:border-gold focus:outline-none disabled:opacity-60"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-display font-semibold text-ink tabular-nums">{gb.computed[s.id]?.score ?? "—"}</td>
                      <td className="px-3 py-2 text-right"><span className="rounded-full bg-cocoa/10 px-2 py-0.5 text-xs font-bold text-cocoa">{gb.computed[s.id]?.letter ?? "—"}</span></td>
                    </tr>
                  ))}
                  {!gb.students.length && <tr><td colSpan={99} className="px-4 py-8 text-center text-ink-mute">No students enrolled in this section.</td></tr>}
                </tbody>
              </table>
              {isGrader(role) && gb.students.length > 0 && (!isTeacher || mySection?.id === sectionId) && (
                <div className="flex gap-3 border-t border-line/70 px-4 py-3">
                  <button onClick={saveGrades} className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-cocoa transition hover:bg-cream-100">Save draft</button>
                  <button onClick={submitGrades} className="rounded-full bg-olive px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5">Submit & compute term grades</button>
                </div>
              )}
              {isTeacher && mySection?.id !== sectionId && (
                <div className="border-t border-line/70 px-4 py-3 text-sm text-bad">
                  You can only enter grades for your homeroom section ({mySection?.code || "your section"}).
                </div>
              )}
            </div>
          )}
          {!gb && !gbLoading && <div className="p-8 text-center text-sm text-ink-mute">Pick a section to open its gradebook.</div>}
        </Panel>
      )}

      {tab === "sections" && !isTeacher && (
        <Panel className="col-span-12" accent="#9c5638" action={isRecords(role) ? <button onClick={() => setModal("section")} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">New section</button> : undefined} bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint"><tr><th className="px-5 py-3">Section</th><th className="px-5 py-3">Grade</th><th className="px-5 py-3">Homeroom Teacher</th><th className="px-5 py-3">Enrolled</th><th className="px-5 py-3" /></tr></thead>
              <tbody>
                {sections.map((s: any) => (
                  <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink">{s.code}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.gradeLevel}</td>
                    <td className="px-5 py-3 text-ink-mute">{s.teacherName}</td>
                    <td className="px-5 py-3 tabular-nums text-ink-soft">{s.enrolled}</td>
                    <td className="px-5 py-3 text-right">
                      {isRecords(role) && <button onClick={() => setModal(`enroll:${s.id}`)} className="mr-2 font-semibold text-gold-deep hover:underline">Enrol</button>}
                      <button onClick={() => { setTab("gradebook"); openGradebook(s.id); }} className="font-semibold text-cocoa hover:underline">Gradebook</button>
                    </td>
                  </tr>
                ))}
                {!sections.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-mute">{loading ? "Loading…" : "No sections."}</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "courses" && !isTeacher && (
        <Panel className="col-span-12" accent="#9c5638" action={isRecords(role) ? <button onClick={() => setModal("course")} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">New course</button> : undefined} bodyClass="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint"><tr><th className="px-5 py-3">Code</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Credits</th></tr></thead>
            <tbody>{courses.map((c: any) => <tr key={c.id} className="border-t border-line/60 transition hover:bg-cream-50"><td className="px-5 py-3 font-medium text-ink">{c.code}</td><td className="px-5 py-3 text-ink-soft">{c.name}</td><td className="px-5 py-3 tabular-nums text-ink-mute">{c.credits}</td></tr>)}
              {!courses.length && <tr><td colSpan={3} className="px-5 py-10 text-center text-ink-mute">No courses.</td></tr>}</tbody></table></div>
        </Panel>
      )}

      {tab === "terms" && !isTeacher && (
        <Panel className="col-span-12" accent="#9c5638" action={isRecords(role) ? <button onClick={() => setModal("term")} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">New term</button> : undefined} bodyClass="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint"><tr><th className="px-5 py-3">Term</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Start</th><th className="px-5 py-3">End</th><th className="px-5 py-3">Active</th></tr></thead>
            <tbody>{terms.map((t: any) => <tr key={t.id} className="border-t border-line/60 transition hover:bg-cream-50"><td className="px-5 py-3 font-medium text-ink">{t.name}</td><td className="px-5 py-3 text-ink-mute">{t.type}</td><td className="px-5 py-3 text-ink-soft">{new Date(t.startDate).toLocaleDateString()}</td><td className="px-5 py-3 text-ink-soft">{new Date(t.endDate).toLocaleDateString()}</td><td className="px-5 py-3">{t.isActive ? <span className="font-semibold text-olive">Yes</span> : <span className="text-ink-faint">No</span>}</td></tr>)}</tbody></table></div>
        </Panel>
      )}

      {tab === "categories" && !isTeacher && (
        <Panel className="col-span-12" accent="#9c5638" action={isRecords(role) ? <button onClick={() => setModal("category")} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">New category</button> : undefined} bodyClass="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint"><tr><th className="px-5 py-3">Category</th><th className="px-5 py-3">Weight (%)</th></tr></thead>
            <tbody>{categories.map((c: any) => <tr key={c.id} className="border-t border-line/60 transition hover:bg-cream-50"><td className="px-5 py-3 font-medium text-ink">{c.name}</td><td className="px-5 py-3 tabular-nums text-ink-soft">{c.weight}</td></tr>)}</tbody></table></div>
        </Panel>
      )}

      <Modal open={modal === "term"} onClose={() => setModal(null)} kicker="Academic" title="New term">
        <Form onSubmit={async (fd) => { await post({ kind: "term", name: fd.get("name"), type: fd.get("type"), startDate: fd.get("startDate"), endDate: fd.get("endDate") }); flash("ok", "Term created."); load(); }}>
          <Field label="Name *" name="name" required /><Field label="Type" name="type" as="select" options={["SEMESTER", "QUARTER", "YEAR", "FINAL"]} />
          <Field label="Start *" name="startDate" type="date" required /><Field label="End *" name="endDate" type="date" required />
        </Form>
      </Modal>
      <Modal open={modal === "course"} onClose={() => setModal(null)} kicker="Catalogue" title="New course">
        <Form onSubmit={async (fd) => { await post({ kind: "course", code: fd.get("code"), name: fd.get("name"), credits: fd.get("credits") }); flash("ok", "Course created."); load(); }}>
          <Field label="Code *" name="code" required /><Field label="Name *" name="name" required /><Field label="Credits" name="credits" type="number" />
        </Form>
      </Modal>
      <Modal open={modal === "section"} onClose={() => setModal(null)} kicker="Timetable" title="New section" wide>
        <Form onSubmit={async (fd) => { 
          const gradeLevel = Number(fd.get("gradeLevel"));
          const sectionLetter = fd.get("sectionLetter")?.toString().toUpperCase();
          const code = `${gradeLevel}${sectionLetter}`;
          
          await post({ 
            kind: "section", 
            code, 
            gradeLevel, 
            sectionLetter,
            courseId: fd.get("courseId"), 
            teacherId: fd.get("teacherId"), 
            termId: fd.get("termId"), 
            name: code, 
            room: fd.get("room") 
          }); 
          flash("ok", "Section created."); 
          load(); 
        }}>
          <Field label="Grade *" name="gradeLevel" as="select" options={["9", "10", "11", "12"]} required />
          <Field label="Section letter *" name="sectionLetter" type="text" placeholder="A, B, C..." required />
          <Field label="Course *" name="courseId" as="select" options={courses.map((c: any) => ({ v: c.id, l: c.name }))} required />
          <Field label="Term *" name="termId" as="select" options={terms.map((t: any) => ({ v: t.id, l: t.name }))} required />
          <Field label="Homeroom Teacher *" name="teacherId" as="select" options={data?.teachers?.map((t: any) => ({ v: t.id, l: `${t.user.firstName} ${t.user.lastName}` })) || []} required />
          <Field label="Room" name="room" />
          <p className="text-xs text-ink-faint">The selected teacher will be the homeroom teacher for this section and will enter grades for all students in it.</p>
        </Form>
      </Modal>
      <Modal open={modal === "category"} onClose={() => setModal(null)} kicker="Weighting" title="New grading category">
        <Form onSubmit={async (fd) => { await post({ kind: "category", name: fd.get("name"), weight: fd.get("weight"), sortOrder: fd.get("sortOrder") }); flash("ok", "Category created."); load(); }}>
          <Field label="Name *" name="name" required /><Field label="Weight (%)" name="weight" type="number" required /><Field label="Order" name="sortOrder" type="number" />
        </Form>
      </Modal>
      <Modal open={modal?.startsWith("enroll:") || false} onClose={() => setModal(null)} kicker="Enrolment" title="Enrol / drop a student" wide>
        {modal?.startsWith("enroll:") && (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2 text-sm">
                <span className="font-medium text-ink">{s.firstName} {s.lastName} <span className="text-ink-faint">· {s.admissionNumber}</span></span>
                <div className="flex gap-2">
                  <button onClick={async () => { try { await post({ kind: "enroll", sectionId: modal.split(":")[1], studentId: s.id }); flash("ok", "Enrolled."); load(); } catch (e: any) { flash("err", e.message); } }} className="rounded-full bg-olive/15 px-3 py-1 text-xs font-bold text-olive">Enrol</button>
                  <button onClick={async () => { try { await post({ kind: "drop", sectionId: modal.split(":")[1], studentId: s.id }); flash("ok", "Dropped."); load(); } catch (e: any) { flash("err", e.message); } }} className="rounded-full bg-bad/10 px-3 py-1 text-xs font-bold text-bad">Drop</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Form({ children, onSubmit }: { children: React.ReactNode; onSubmit: (fd: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setErr(""); setBusy(true); try { await onSubmit(new FormData(e.currentTarget)); (e.target as HTMLFormElement).reset(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); } }} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
      {err && <p className="text-sm text-bad">{err}</p>}
      <button disabled={busy} className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
    </form>
  );
}

function Field({ label, name, required, type = "text", as, options }: { label: string; name: string; required?: boolean; type?: string; as?: "select"; options?: any[] }) {
  if (as === "select") {
    const opts = (options || []).map((o) => typeof o === "string" ? { v: o, l: o } : o);
    return <label className="block"><span className="lbl">{label}</span><select name={name} required={required} className="field"><option value="">Select…</option>{opts.filter((o) => o.v !== "").map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>;
  }
  return <label className="block"><span className="lbl">{label}</span><input name={name} type={type} required={required} className="field" /></label>;
}