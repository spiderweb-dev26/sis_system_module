"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/tabs";
import { PageHeader, Panel } from "@/components/ui";

function useMe() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d.user))
      .catch(() => {});
  }, []);
  return me;
}

const STREAM_TONE: Record<string, string> = {
  NATURAL_SCIENCE: "bg-olive/15 text-olive",
  SOCIAL_SCIENCE: "bg-gold/15 text-gold-deep",
};

export default function AcademicsPage() {
  const me = useMe();
  const role = me?.role || "";
  const isTeacher = role === "TEACHER";

  const [tab, setTab] = useState("gradebook");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [subjectGb, setSubjectGb] = useState<any>(null);
  const [gbLoading, setGbLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});

  // Land teachers on their subject list once we know who they are.
  useEffect(() => {
    if (role === "TEACHER") setTab("mySubjects");
  }, [role]);

  const load = () => {
    setLoading(true);
    fetch("/api/academics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (role === "TEACHER") {
      fetch("/api/academics?mySubjects=1")
        .then((r) => r.json())
        .then((d) => setMySubjects(d.subjects || []))
        .catch(() => {});
    }
  }, [role]);

  const flash = (t: "ok" | "err", m: string) => {
    setMsg({ t, m });
    setTimeout(() => setMsg(null), 4000);
  };

  const openSubject = async (id: string) => {
    if (!id) return;
    setSubjectId(id);
    setGbLoading(true);
    try {
      const r = await fetch(`/api/academics?subjectId=${id}`).then((x) => x.json());
      setSubjectGb(r);
      const init: Record<string, string> = {};
      for (const sec of r.sections || []) {
        for (const s of sec.students || []) {
          for (const a of r.assessments || []) {
            const g = r.grades[`${s.id}_${a.id}`];
            init[`${s.id}_${a.id}`] = g?.score != null ? String(g.score) : "";
          }
        }
      }
      setScores(init);
    } catch (e: any) {
      flash("err", e?.message || "Could not load gradebook");
    } finally {
      setGbLoading(false);
    }
  };

  const saveGrades = async () => {
    const grades = Object.entries(scores).map(([k, v]) => {
      const [studentId, assessmentId] = k.split("_");
      return { studentId, assessmentId, score: v };
    });
    try {
      const r = await fetch("/api/academics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "saveGrades", subjectId, grades }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "Save failed");
      flash("ok", "Grades saved.");
      openSubject(subjectId);
    } catch (e: any) {
      flash("err", e?.message || "Save failed");
    }
  };

  const subjects = data?.subjects || [];
  const sections = data?.sections || [];
  const subjectOptions = isTeacher ? mySubjects : subjects;

  // Flatten every pupil across every section into one graded roster.
  const rows = subjectGb
    ? subjectGb.sections.flatMap((sec: any) =>
        (sec.students || []).map((s: any) => ({ ...s, sectionCode: sec.code }))
      )
    : [];

  const avgOf = (s: any) => {
    if (!subjectGb) return "—";
    let total = 0;
    let n = 0;
    for (const a of subjectGb.assessments || []) {
      const v = parseFloat(scores[`${s.id}_${a.id}`] || "");
      if (!Number.isNaN(v)) {
        total += v;
        n += 1;
      }
    }
    return n ? (total / n).toFixed(1) : "—";
  };

  const teacherTabs = [
    { id: "mySubjects", label: "My Subjects", count: mySubjects.length },
    { id: "gradebook", label: "Gradebook" },
  ];
  const staffTabs = [
    { id: "gradebook", label: "Gradebook" },
    { id: "subjects", label: "Subjects", count: subjects.length },
    { id: "sections", label: "Sections", count: sections.length },
    { id: "streams", label: "Streams" },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader
        kicker={isTeacher ? "Your Subjects" : "Faculty & Academics"}
        title={isTeacher ? "Subject Gradebook" : "Academics & Gradebook"}
        sub={
          isTeacher
            ? "Enter marks for your assigned subjects across every section that takes them."
            : "Twelve national subjects, lettered sections, and the Natural / Social stream split for Grades 11–12."
        }
      />

      {msg && (
        <div
          className={`col-span-12 rounded-xl border px-3 py-2 text-sm ${
            msg.t === "ok"
              ? "border-olive/30 bg-olive/10 text-olive"
              : "border-bad/30 bg-bad/10 text-bad"
          }`}
        >
          {msg.m}
        </div>
      )}

      <div className="col-span-12">
        <Tabs
          active={tab}
          onChange={(t) => setTab(t)}
          tabs={isTeacher ? teacherTabs : staffTabs}
        />
      </div>

      {/* Teacher: list of assigned subjects */}
      {tab === "mySubjects" && isTeacher && (
        <Panel
          className="col-span-12"
          accent="#9c5638"
          kicker="Assigned to you"
          title="Your Subjects"
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {mySubjects.map((s: any) => (
                  <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-5 py-3 text-ink-mute">{s.code}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          setTab("gradebook");
                          openSubject(s.id);
                        }}
                        className="font-semibold text-gold-deep hover:underline"
                      >
                        Open gradebook →
                      </button>
                    </td>
                  </tr>
                ))}
                {!mySubjects.length && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-ink-mute">
                      {loading ? "Loading…" : "No subjects assigned yet — ask the registrar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Gradebook: one subject, every pupil, every section */}
      {tab === "gradebook" && (
        <Panel
          className="col-span-12"
          accent="#9c5638"
          kicker="Mark entry"
          title={subjectGb ? `${subjectGb.subject.name} — all sections` : "Pick a subject"}
          action={
            <select
              value={subjectId}
              onChange={(e) => openSubject(e.target.value)}
              className="field w-64"
            >
              <option value="">Choose subject…</option>
              {subjectOptions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          }
          bodyClass="p-0"
        >
          {gbLoading && <div className="p-6 text-sm text-ink-mute">Loading gradebook…</div>}

          {!gbLoading && !subjectGb && (
            <div className="p-8 text-center text-sm text-ink-mute">
              Select a subject above to open its mark sheet.
            </div>
          )}

          {!gbLoading && subjectGb && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="sticky left-0 z-10 bg-cream-100 px-4 py-3">Student</th>
                    <th className="px-4 py-3">Section</th>
                    {subjectGb.assessments.map((a: any) => (
                      <th key={a.id} className="px-2 py-3 text-center" title={`/${a.maxScore}`}>
                        <div className="text-[10px] font-bold uppercase text-ink-faint">
                          {(a.categoryName || "—").slice(0, 4)}
                        </div>
                        <div className="font-semibold text-ink-soft">{a.name}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s: any) => (
                    <tr key={`${s.id}_${s.sectionCode}`} className="border-t border-line/60 transition hover:bg-cream-50">
                      <td className="sticky left-0 z-10 bg-paper px-4 py-2 font-medium text-ink">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-2 text-ink-mute">{s.sectionCode}</td>
                      {subjectGb.assessments.map((a: any) => (
                        <td key={a.id} className="px-1 py-1">
                          <input
                            value={scores[`${s.id}_${a.id}`] ?? ""}
                            onChange={(e) =>
                              setScores((p) => ({ ...p, [`${s.id}_${a.id}`]: e.target.value }))
                            }
                            type="number"
                            min={0}
                            max={a.maxScore}
                            step="0.01"
                            className="w-16 rounded-lg border border-line bg-cream-50/70 px-2 py-1 text-center text-xs tabular-nums focus:border-gold focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-display font-semibold text-ink tabular-nums">
                        {avgOf(s)}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={99} className="px-4 py-8 text-center text-ink-mute">
                        No pupils enrolled in any section yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {rows.length > 0 && (
                <div className="flex gap-3 border-t border-line/70 px-4 py-3">
                  <button
                    onClick={saveGrades}
                    className="rounded-full bg-olive px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    Save all marks
                  </button>
                  <span className="self-center text-xs text-ink-faint">
                    {rows.length} pupils · {subjectGb.assessments.length} assessments
                  </span>
                </div>
              )}
            </div>
          )}
        </Panel>
      )}

      {/* Subjects catalogue */}
      {tab === "subjects" && !isTeacher && (
        <Panel className="col-span-12" accent="#9c5638" kicker="National curriculum" title="Subjects" bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Subject</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s: any) => (
                  <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink">{s.code}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.name}</td>
                  </tr>
                ))}
                {!subjects.length && (
                  <tr>
                    <td colSpan={2} className="px-5 py-10 text-center text-ink-mute">
                      {loading ? "Loading…" : "No subjects."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Sections */}
      {tab === "sections" && !isTeacher && (
        <Panel className="col-span-12" accent="#9c5638" kicker="Letter catalogue" title="Sections" bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-5 py-3">Section</th>
                  <th className="px-5 py-3">Grade</th>
                  <th className="px-5 py-3">Stream</th>
                  <th className="px-5 py-3">Term</th>
                  <th className="px-5 py-3">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s: any) => (
                  <tr key={s.id} className="border-t border-line/60 transition hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink">{s.code}</td>
                    <td className="px-5 py-3 text-ink-soft tabular-nums">{s.gradeLevel}</td>
                    <td className="px-5 py-3">
                      {s.stream ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STREAM_TONE[s.stream] || "bg-cream-200 text-ink-faint"}`}>
                          {s.stream.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-mute">{s.termName}</td>
                    <td className="px-5 py-3 text-ink-soft tabular-nums">{s.enrolled}</td>
                  </tr>
                ))}
                {!sections.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-ink-mute">
                      {loading ? "Loading…" : "No sections."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Streams */}
      {tab === "streams" && !isTeacher && (
        <Panel
          className="col-span-12"
          accent="#9c5638"
          kicker="Grades 11–12"
          title="Stream classification"
        >
          <p className="mb-4 text-sm text-ink-mute">
            The registrar proposes a stream for each senior section; the principal approves it.
          </p>
          <div className="space-y-2">
            {sections.filter((s: any) => s.gradeLevel >= 11).map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-line/70 bg-cream-50/50 px-3 py-2 transition hover:bg-cream-100"
              >
                <span className="font-medium text-ink">
                  {s.code} <span className="text-ink-faint">· Grade {s.gradeLevel}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.stream ? STREAM_TONE[s.stream] : "bg-cream-200 text-ink-faint"}`}>
                  {s.stream ? s.stream.replace("_", " ") : "Not assigned"}
                </span>
              </div>
            ))}
            {!sections.filter((s: any) => s.gradeLevel >= 11).length && (
              <p className="text-sm text-ink-mute">No Grade 11–12 sections yet.</p>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}