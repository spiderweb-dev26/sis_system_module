"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { CountUp, Eyebrow, PageHeader, Panel, Reveal, StatusBadge } from "@/components/ui";

const ROLE_ACCENT: Record<string, string> = {
  PRINCIPAL: "#8a5a2b", ADMIN: "#6b4a2e", REGISTRAR: "#a86a32",
  COUNSELOR: "#6f7a45", ACCOUNTANT: "#7d6a3a", TEACHER: "#9c5638", STUDENT: "#5b3a22",
};
const ROLE_LABEL: Record<string, string> = {
  PRINCIPAL: "Principal", ADMIN: "Administrator", REGISTRAR: "Registrar",
  COUNSELOR: "Counselor", ACCOUNTANT: "Bursar", TEACHER: "Teacher", STUDENT: "Student",
};
const ROLE_ORDER = ["PRINCIPAL", "ADMIN", "REGISTRAR", "COUNSELOR", "ACCOUNTANT", "TEACHER"];
const FILTERS = ["ALL", ...ROLE_ORDER];

function useMe() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    fetch("/api/me").then((r) => (r.ok ? r.json() : null)).then((d) => d && setMe(d.user)).catch(() => {});
  }, []);
  return me;
}

function ago(iso: string | null) {
  if (!iso) return "Never signed in";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(f: string, l: string) {
  return ((f?.[0] ?? "") + (l?.[0] ?? "")).toUpperCase();
}

export default function UserManagementPage() {
  const me = useMe();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [modal, setModal] = useState<null | "new" | "edit">(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  const canManage = !!me && (me.role === "PRINCIPAL" || me.role === "ADMIN");

  const load = () => {
    setLoading(true);
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (canManage) load(); }, [canManage]);

  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 4000); };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of users) c[u.role] = (c[u.role] || 0) + 1;
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      const roleOk = filter === "ALL" || u.role === filter;
      const textOk = !needle || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(needle);
      return roleOk && textOk;
    });
  }, [users, q, filter]);

  async function submitNew(fd: FormData) {
    const r = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"), password: fd.get("password"),
        firstName: fd.get("firstName"), lastName: fd.get("lastName"),
        role: fd.get("role"), phone: fd.get("phone") || null,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || "Could not create user");
    flash("ok", `${fd.get("firstName")} ${fd.get("lastName")} added.`); load();
  }

  async function submitEdit(fd: FormData) {
    const r = await fetch(`/api/users/${editUser.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"), lastName: fd.get("lastName"),
        role: fd.get("role"), status: fd.get("status"), phone: fd.get("phone") || null,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || "Could not update user");
    flash("ok", "Member updated."); load();
  }

  async function toggleStatus(u: any) {
    const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const r = await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!r.ok) return flash("err", "Could not change status");
    flash("ok", next === "ACTIVE" ? "Member reactivated." : "Member suspended."); load();
  }

  async function deactivate(u: any) {
    if (!confirm(`Deactivate ${u.firstName} ${u.lastName}? They will no longer be able to sign in.`)) return;
    const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (!r.ok) return flash("err", "Could not deactivate");
    flash("ok", "Member deactivated."); load();
  }

  if (!me) {
    return <Panel className="mx-auto max-w-xl" accent="#6b4a2e" kicker="Access" title="Checking your credentials…"><p className="text-sm text-ink-mute">One moment.</p></Panel>;
  }
  if (!canManage) {
    return (
      <Panel className="mx-auto max-w-xl" accent="#9a4a35" kicker="Restricted" title="Administrators only">
        <p className="text-sm text-ink-mute">Only the Principal and Administrators can manage staff accounts. Your desk is elsewhere — use the navigation above.</p>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader
        kicker="System Administration"
        title="People & Access"
        sub="Provision accounts, assign roles, and hold the gates of the system. Every change is recorded."
        action={
          <button onClick={() => setModal("new")} className="group inline-flex items-center gap-2 rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-soft transition hover:-translate-y-0.5 hover:bg-cocoa-deep hover:shadow-lift">
            Add member
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        }
      />

      {msg && (
        <div className={`col-span-12 rounded-xl border px-3 py-2 text-sm ${msg.t === "ok" ? "border-olive/30 bg-olive/10 text-olive" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.m}</div>
      )}

      <Reveal className="col-span-12 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <div className="card lift relative overflow-hidden p-4">
          <span aria-hidden className="absolute -right-5 -top-6 h-16 w-16 rounded-full bg-cocoa opacity-[0.08]" />
          <Eyebrow className="text-ink-faint">Total staff</Eyebrow>
          <CountUp value={users.length} className="mt-1 block font-display text-3xl font-semibold text-ink tabular-nums" />
        </div>
        {ROLE_ORDER.map((role) => (
          <button
            key={role}
            onClick={() => setFilter(filter === role ? "ALL" : role)}
            className={`card lift relative overflow-hidden p-4 text-left transition ${filter === role ? "ring-2 ring-gold/50" : ""}`}
          >
            <span aria-hidden className="absolute left-0 top-0 h-full w-1" style={{ background: ROLE_ACCENT[role] }} />
            <Eyebrow className="text-ink-faint">{ROLE_LABEL[role]}</Eyebrow>
            <CountUp value={counts[role] || 0} className="mt-1 block font-display text-3xl font-semibold text-ink tabular-nums" />
          </button>
        ))}
      </Reveal>

      <Panel className="col-span-12" accent="#6b4a2e" bodyClass="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="field w-full max-w-xs" />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${filter === f ? "bg-cocoa text-cream-50 shadow-soft" : "bg-cream-100 text-ink-mute hover:bg-cream-200 hover:text-cocoa"}`}
              >
                {f === "ALL" ? "All" : ROLE_LABEL[f]}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-ink-faint">{filtered.length} of {users.length}</span>
        </div>
      </Panel>

      <Panel className="col-span-12" accent="#6b4a2e" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last seen</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="group border-t border-line/60 transition hover:bg-cream-50">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-xs font-semibold text-cream-50 shadow-soft transition group-hover:scale-105" style={{ background: ROLE_ACCENT[u.role] || "#5b3a22" }}>
                        {initials(u.firstName, u.lastName)}
                      </span>
                      <span className="font-medium text-ink">{u.firstName} {u.lastName}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-mute">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-cocoa">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROLE_ACCENT[u.role] }} />
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3 text-ink-faint">{ago(u.lastLoginAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => { setEditUser(u); setModal("edit"); }} className="mr-2 font-semibold text-gold-deep hover:underline">Edit</button>
                    <button onClick={() => toggleStatus(u)} className="mr-2 font-semibold text-cocoa hover:underline">{u.status === "ACTIVE" ? "Suspend" : "Activate"}</button>
                    <button onClick={() => deactivate(u)} className="font-semibold text-bad hover:underline">Deactivate</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-ink-mute">{loading ? "Loading members…" : "No members match your search."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={modal === "new"} onClose={() => setModal(null)} kicker="New account" title="Add a member" wide>
        <form onSubmit={async (e) => { e.preventDefault(); try { await submitNew(new FormData(e.currentTarget)); setModal(null); (e.target as HTMLFormElement).reset(); } catch (err: any) { flash("err", err.message); } }} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block"><span className="lbl">Email *</span><input name="email" type="email" className="field" required /></label>
            <label className="block"><span className="lbl">Temporary password *</span><input name="password" type="text" className="field" required /></label>
            <label className="block"><span className="lbl">First name *</span><input name="firstName" className="field" required /></label>
            <label className="block"><span className="lbl">Last name *</span><input name="lastName" className="field" required /></label>
            <label className="block"><span className="lbl">Phone</span><input name="phone" className="field" /></label>
            <label className="block"><span className="lbl">Role *</span>
              <select name="role" className="field" required defaultValue="">
                <option value="" disabled>Assign a role…</option>
                {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
          </div>
          <p className="text-xs text-ink-faint">The member will be asked to change this password on first sign‑in.</p>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Create account</button>
        </form>
      </Modal>

      <Modal open={modal === "edit"} onClose={() => { setModal(null); setEditUser(null); }} kicker="Edit account" title={editUser ? `${editUser.firstName} ${editUser.lastName}` : "Edit"} wide>
        {editUser && (
          <form onSubmit={async (e) => { e.preventDefault(); try { await submitEdit(new FormData(e.currentTarget)); setModal(null); setEditUser(null); } catch (err: any) { flash("err", err.message); } }} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block"><span className="lbl">First name *</span><input name="firstName" defaultValue={editUser.firstName} className="field" required /></label>
              <label className="block"><span className="lbl">Last name *</span><input name="lastName" defaultValue={editUser.lastName} className="field" required /></label>
              <label className="block"><span className="lbl">Phone</span><input name="phone" defaultValue={editUser.phone || ""} className="field" /></label>
              <label className="block"><span className="lbl">Role *</span>
                <select name="role" defaultValue={editUser.role} className="field" required>
                  {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </label>
              <label className="block md:col-span-2"><span className="lbl">Status *</span>
                <select name="status" defaultValue={editUser.status} className="field" required>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </label>
            </div>
            <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Save changes</button>
          </form>
        )}
      </Modal>
    </div>
  );
}