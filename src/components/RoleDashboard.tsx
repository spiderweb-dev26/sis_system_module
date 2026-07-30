import Link from "next/link";
import { Reveal } from "./motion";
import {
  Crest,
  Eyebrow,
  EmptyState,
  GhostLink,
  Kpi,
  Panel,
  PrimaryLink,
  StatusBadge,
} from "./ui";
import type { RoleMeta } from "@/lib/roles";
import { getRoleLabel } from "@/lib/roles";

type Doc = { type: string; verified: boolean };
type Pending = {
  id: string;
  firstName: string;
  lastName: string;
  applyingGradeLevel: number;
  createdAt: string;
  docs: Doc[];
};
type Verify = { id: string; firstName: string; lastName: string; missing: string[] };
type Student = {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  status: string;
  admissionNumber: string;
  photoUrl: string | null;
  createdAt: string;
};
type Audit = { action: string; entity: string; createdAt: string };

interface Data {
  periodOpen: boolean;
  daysLeft: number | null;
  periodName: string | null;
  kpis: {
    activeStudents: number;
    totalStudents: number;
    totalStaff: number;
    pending: number;
    enrolledPeriod: number;
    newEnrollments: number;
  };
  regStatus: Record<string, number>;
  stuStatus: Record<string, number>;
  gradeMap: Record<number, number>;
  staffMix: { role: string; count: number }[];
  pending: Pending[];
  verify: Verify[];
  recentStudents: Student[];
  audit: Audit[];
}

function ago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function inits(s: Student) {
  return ((s.firstName?.[0] ?? "") + (s.lastName?.[0] ?? "")).toUpperCase();
}

function Bars({
  items,
  colorOf,
  labelOf,
}: {
  items: { label: string; value: number }[];
  colorOf?: (l: string) => string;
  labelOf?: (l: string) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((i) => {
        const w = Math.round((i.value / max) * 100);
        const col = colorOf ? colorOf(i.label) : "#5b3a22";
        return (
          <div key={i.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-ink-mute">
              {labelOf ? labelOf(i.label) : i.label}
            </span>
            <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-cream-200">
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{ width: `${w}%`, background: col }}
              />
            </span>
            <span className="w-7 shrink-0 text-right font-display text-sm font-semibold text-ink tabular-nums">
              {i.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_HEX: Record<string, string> = {
  DRAFT: "#a08c72",
  PENDING: "#b07d3c",
  ENROLLED: "#6f7a45",
  APPROVED: "#6f7a45",
  ACTIVE: "#6f7a45",
  GRADUATED: "#8a5e26",
  SUSPENDED: "#9a4a35",
  EXPELLED: "#9a4a35",
  TRANSFERRED: "#5d6b73",
  WITHDRAWN: "#a08c72",
  INACTIVE: "#a08c72",
};

function Hero({ meta, user, data }: { meta: RoleMeta; user: { firstName: string }; data: Data }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  let cta: React.ReactNode = null;
  if (meta.dashboard === "command")
    cta = data.kpis.pending > 0 ? (
      <PrimaryLink href="/registrations">Review {data.kpis.pending} pending admissions</PrimaryLink>
    ) : (
      <PrimaryLink href="/registrations">Open the admissions desk</PrimaryLink>
    );
  else if (meta.dashboard === "admissions")
    cta = (
      <div className="flex flex-wrap gap-3">
        {data.periodOpen && <PrimaryLink href="/registrations/new">Register new student</PrimaryLink>}
        <GhostLink href="/registrations">Verify &amp; approve</GhostLink>
      </div>
    );
  else if (meta.dashboard === "support")
    cta = <PrimaryLink href="/students">Browse all students</PrimaryLink>;
  else if (meta.dashboard === "finance")
    cta = <PrimaryLink href="/students">Open student accounts</PrimaryLink>;
  else if (meta.dashboard === "academics")
    cta = <PrimaryLink href="/students">Browse the roster</PrimaryLink>;

  return (
    <Reveal>
      <section className="card relative overflow-hidden p-6 md:p-9">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${meta.accent}, transparent 72%)` }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[12rem] leading-none text-cocoa opacity-[0.04]"
        >
          {meta.title[0]}
        </span>
        <div className="relative grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Eyebrow className="text-gold-deep">{meta.kicker}</Eyebrow>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink md:text-5xl">
              {meta.title}
            </h1>
            <p className="mt-2 font-display text-xl italic text-ink-soft">
              {greet}, {user.firstName}.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-mute">{meta.purpose}</p>
            <div className="mt-6">{cta}</div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-cream-50/70 p-4 md:w-full">
              <Crest letter="S" size={42} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
                  {data.periodOpen ? "Registration open" : "Registration closed"}
                </p>
                <p className="font-display text-sm font-semibold leading-tight text-ink">
                  {data.periodName || "No active period"}
                </p>
                <p className="text-xs text-ink-mute">
                  {data.daysLeft === null ? "—" : `${data.daysLeft} days remaining`}
                </p>
              </div>
            </div>
            <p className="px-1 text-xs text-ink-faint md:text-right">{meta.tagline}</p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function Pipeline({ data }: { data: Data }) {
  const order = ["DRAFT", "PENDING", "ENROLLED"];
  const total = order.reduce((a, k) => a + (data.regStatus[k] || 0), 0) || 1;
  return (
    <Panel
      kicker="Admissions"
      title="Registration pipeline"
      accent="#a86a32"
      className="col-span-12 md:col-span-7"
    >
      <div className="flex gap-6">
        {order.map((k) => (
          <div key={k}>
            <p className="font-display text-3xl font-semibold text-ink tabular-nums">
              {data.regStatus[k] || 0}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              {k.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-cream-200">
        {order.map((k) => (
          <span
            key={k}
            style={{ width: `${((data.regStatus[k] || 0) / total) * 100}%`, background: STATUS_HEX[k] }}
          />
        ))}
      </div>
      <div className="mt-5 space-y-2">
        {data.pending.slice(0, 3).map((p) => (
          <Link
            key={p.id}
            href={`/registrations/${p.id}`}
            className="group flex items-center justify-between rounded-xl border border-line/70 bg-cream-50/50 px-3 py-2 transition hover:border-gold/50 hover:bg-cream-100"
          >
            <span className="text-sm font-medium text-ink">
              {p.firstName} {p.lastName}
              <span className="ml-2 text-xs text-ink-faint">Grade {p.applyingGradeLevel}</span>
            </span>
            <span className="text-xs font-semibold text-gold-deep opacity-0 transition group-hover:opacity-100">
              Review →
            </span>
          </Link>
        ))}
        {data.pending.length === 0 && <EmptyState message="Nothing awaiting review — the desk is clear." />}
      </div>
    </Panel>
  );
}

function AtAGlance({ data, meta }: { data: Data; meta: RoleMeta }) {
  return (
    <Panel kicker="Snapshot" title="At a glance" accent={meta.accent} className="col-span-12 md:col-span-5">
      <Kpi label="Active students" value={data.kpis.activeStudents} accent="#6f7a45" />
      <Kpi label="Total staff" value={data.kpis.totalStaff} accent="#5b3a22" />
      <Kpi
        label="Open registration"
        value={data.daysLeft ?? 0}
        accent="#b07d3c"
        hint={data.periodOpen ? data.periodName || undefined : "Period closed"}
      />
      <Kpi label="Pending approvals" value={data.kpis.pending} accent="#9a4a35" />
    </Panel>
  );
}

function GradePanel({ data, accent }: { data: Data; accent: string }) {
  const items = [9, 10, 11, 12].map((g) => ({ label: String(g), value: data.gradeMap[g] || 0 }));
  return (
    <Panel
      kicker="Cohorts"
      title="Students by grade"
      accent={accent}
      className="col-span-12 md:col-span-5"
    >
      <Bars
        items={items}
        colorOf={() => accent}
        labelOf={(l) => `Grade ${l}`}
      />
    </Panel>
  );
}

function StaffPanel({ data }: { data: Data }) {
  const items = data.staffMix.map((s) => ({ label: s.role, value: s.count }));
  return (
    <Panel kicker="People" title="Staff by role" accent="#6b4a2e" className="col-span-12 md:col-span-4">
      {items.length ? (
        <Bars items={items} colorOf={() => "#6b4a2e"} labelOf={(l) => getRoleLabel(l)} />
      ) : (
        <EmptyState message="No staff recorded yet." />
      )}
    </Panel>
  );
}

function AuditPanel({ data }: { data: Data }) {
  return (
    <Panel kicker="Trail" title="Recent activity" accent="#8a5e26" className="col-span-12 md:col-span-3">
      {data.audit.length ? (
        <div className="space-y-2.5">
          {data.audit.map((a, i) => (
            <div key={i} className="text-xs">
              <p className="font-semibold text-ink-soft">{a.action.replace(/_/g, " ")}</p>
              <p className="text-ink-faint">{ago(a.createdAt)}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No recorded actions yet." />
      )}
    </Panel>
  );
}

function VerifyPanel({ data }: { data: Data }) {
  return (
    <Panel
      kicker="Verification"
      title="Documents to verify"
      accent="#a86a32"
      className="col-span-12 md:col-span-5"
    >
      {data.verify.length ? (
        <div className="space-y-2">
          {data.verify.map((v) => (
            <Link
              key={v.id}
              href={`/registrations/${v.id}`}
              className="group flex items-center justify-between rounded-xl border border-line/70 bg-cream-50/50 px-3 py-2 transition hover:border-gold/50 hover:bg-cream-100"
            >
              <span className="text-sm font-medium text-ink">
                {v.firstName} {v.lastName}
              </span>
              <span className="flex gap-1">
                {v.missing.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-bad/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-bad"
                  >
                    {m === "PHOTO" ? "photo" : "record"}
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState message="All submitted documents are verified." />
      )}
    </Panel>
  );
}

function WelcomePanel({ data }: { data: Data }) {
  return (
    <Panel
      kicker="Welcome"
      title="Newly enrolled students"
      accent="#6f7a45"
      className="col-span-12 md:col-span-7"
    >
      {data.recentStudents.length ? (
        <div className="space-y-2">
          {data.recentStudents.map((s) => (
            <Link
              key={s.id}
              href={`/students/${s.id}`}
              className="group flex items-center justify-between rounded-xl border border-line/70 bg-cream-50/50 px-3 py-2 transition hover:border-olive/50 hover:bg-cream-100"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-cocoa/10 text-xs font-semibold text-cocoa">
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    inits(s)
                  )}
                </span>
                <span className="text-sm font-medium text-ink">
                  {s.firstName} {s.lastName}
                  <span className="ml-2 text-xs text-ink-faint">Grade {s.gradeLevel}</span>
                </span>
              </span>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState message="No students enrolled yet." />
      )}
    </Panel>
  );
}

function SearchPanel({ accent, note }: { accent: string; note: string }) {
  return (
    <Panel kicker="Look up" title="Find any student" accent={accent} className="col-span-12 md:col-span-5">
      <form action="/students" className="flex gap-2">
        <input name="q" placeholder="Name or admission no." className="field" />
        <button className="shrink-0 rounded-full bg-cocoa px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-cocoa-deep">
          Search
        </button>
      </form>
      <p className="mt-3 text-xs leading-relaxed text-ink-mute">{note}</p>
    </Panel>
  );
}

function RoadmapPanel({ meta, stat, statLabel }: { meta: RoleMeta; stat: number; statLabel: string }) {
  return (
    <Panel
      kicker="Workspace"
      title={`${meta.shortTitle} tools`}
      accent={meta.accent}
      className="col-span-12 md:col-span-6"
    >
      <div className="mb-4 flex items-baseline justify-between rounded-xl bg-cream-50/70 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">{statLabel}</span>
        <span className="font-display text-2xl font-semibold text-ink tabular-nums">{stat}</span>
      </div>
      <ul className="space-y-2">
        {meta.roadmap.map((r) => (
          <li
            key={r}
            className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2 text-sm text-ink-soft"
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.accent }} />
              {r}
            </span>
            <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-faint">
              soon
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function StatusPanel({ data }: { data: Data }) {
  const items = Object.entries(data.stuStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ label: k, value: v }));
  return (
    <Panel kicker="Status" title="Students by status" accent="#7d6a3a" className="col-span-12 md:col-span-6">
      {items.length ? (
        <Bars
          items={items}
          colorOf={(l) => STATUS_HEX[l] || "#a08c72"}
          labelOf={(l) => l.replace(/_/g, " ").toLowerCase()}
        />
      ) : (
        <EmptyState message="No students yet." />
      )}
    </Panel>
  );
}

function FeeCohorts({ data }: { data: Data }) {
  const rows = [9, 10, 11, 12].map((g) => ({ grade: g, count: data.gradeMap[g] || 0 }));
  return (
    <Panel
      kicker="Accounts"
      title="Fee cohorts by grade"
      accent="#7d6a3a"
      className="col-span-12 md:col-span-7"
    >
      <div className="overflow-hidden rounded-xl border border-line/70">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-2">Grade</th>
              <th className="px-4 py-2">Students</th>
              <th className="px-4 py-2 text-right">Accounts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.grade} className="border-t border-line/60">
                <td className="px-4 py-2 font-medium text-ink">Grade {r.grade}</td>
                <td className="px-4 py-2 text-ink-soft tabular-nums">{r.count}</td>
                <td className="px-4 py-2 text-right text-ink-soft tabular-nums">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-mute">
        Invoices, payments and receipts will be raised per cohort once the billing module activates.
      </p>
    </Panel>
  );
}

function KpiListPanel({ data, meta }: { data: Data; meta: RoleMeta }) {
  return (
    <Panel kicker="Snapshot" title="At a glance" accent={meta.accent} className="col-span-12 md:col-span-5">
      {meta.dashboard === "finance" ? (
        <>
          <Kpi label="Active accounts" value={data.kpis.activeStudents} accent="#7d6a3a" />
          <Kpi label="Future payers (pending)" value={data.kpis.pending} accent="#b07d3c" />
          <Kpi label="Total students" value={data.kpis.totalStudents} accent="#5b3a22" />
        </>
      ) : (
        <>
          <Kpi label="Students on roster" value={data.kpis.totalStudents} accent={meta.accent} />
          <Kpi label="Active" value={data.kpis.activeStudents} accent="#6f7a45" />
          <Kpi label="New this term" value={data.kpis.newEnrollments} accent="#b07d3c" />
        </>
      )}
    </Panel>
  );
}

export default function RoleDashboard({
  meta,
  user,
  data,
}: {
  meta: RoleMeta;
  user: { firstName: string; lastName: string; role: string };
  data: Data;
}) {
  let blocks: React.ReactNode = null;

  if (meta.dashboard === "command") {
    blocks = (
      <>
        <Pipeline data={data} />
        <AtAGlance data={data} meta={meta} />
        <GradePanel data={data} accent="#8a5a2b" />
        <StaffPanel data={data} />
        <AuditPanel data={data} />
      </>
    );
  } else if (meta.dashboard === "admissions") {
    blocks = (
      <>
        <Pipeline data={data} />
        <VerifyPanel data={data} />
        <GradePanel data={data} accent="#a86a32" />
        <WelcomePanel data={data} />
        <Panel kicker="Snapshot" title="At a glance" accent="#a86a32" className="col-span-12 md:col-span-3">
          <Kpi label="Pending" value={data.kpis.pending} accent="#b07d3c" />
          <Kpi label="Enrolled this period" value={data.kpis.enrolledPeriod} accent="#6f7a45" />
          <Kpi label="Total students" value={data.kpis.totalStudents} accent="#5b3a22" />
        </Panel>
      </>
    );
  } else if (meta.dashboard === "support") {
    blocks = (
      <>
        <WelcomePanel data={data} />
        <SearchPanel
          accent="#6f7a45"
          note="Pull up the full record of any learner — demographics, history and documents in one view."
        />
        <GradePanel data={data} accent="#6f7a45" />
        <RoadmapPanel meta={meta} stat={data.kpis.totalStudents} statLabel="Students you can reach" />
      </>
    );
  } else if (meta.dashboard === "finance") {
    blocks = (
      <>
        <FeeCohorts data={data} />
        <KpiListPanel data={data} meta={meta} />
        <StatusPanel data={data} />
        <RoadmapPanel meta={meta} stat={data.kpis.activeStudents} statLabel="Accounts to manage" />
      </>
    );
  } else if (meta.dashboard === "academics") {
    blocks = (
      <>
        <GradePanel data={data} accent="#9c5638" />
        <KpiListPanel data={data} meta={meta} />
        <WelcomePanel data={data} />
        <SearchPanel
          accent="#9c5638"
          note="Open any student to follow their academic record as the gradebook comes online."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Hero meta={meta} user={user} data={data} />
      <div className="grid grid-cols-12 gap-4 md:gap-5">{blocks}</div>
    </div>
  );
}