"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/tabs";
import { Modal } from "@/components/modal";
import { CountUp, Eyebrow, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { formatDate, money } from "@/lib/utils";

type Inv = any;

function useMe() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { fetch("/api/me").then((r) => r.ok ? r.json() : null).then((d) => d && setRole(d.user.role)).catch(() => {}); }, []);
  return role;
}

const canWrite = (r: string | null) => !!r && ["PRINCIPAL", "ADMIN", "ACCOUNTANT"].includes(r);

export default function FinancePage() {
  const role = useMe();
  const [tab, setTab] = useState("invoices");
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [payModal, setPayModal] = useState<Inv | null>(null);
  const [feeModal, setFeeModal] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/finance?view=invoices").then((r) => r.json()),
      fetch("/api/finance?view=feeTypes").then((r) => r.json()),
      fetch("/api/finance?view=report").then((r) => r.json()),
      fetch("/api/students").then((r) => r.json()).catch(() => []),
    ]).then(([i, f, rep, s]) => { setInvoices(i); setFees(f); setReport(rep); setStudents(Array.isArray(s) ? s : []); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 4000); };

  async function post(body: any) {
    const r = await fetch("/api/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || "Failed");
    return d;
  }

  const outstanding = invoices.reduce((a, i) => i.status !== "VOID" ? a + Math.max(0, i.total - i.amountPaid) : a, 0);
  const collected = invoices.reduce((a, i) => i.status !== "VOID" ? a + i.amountPaid : a, 0);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      <PageHeader kicker="The Bursar's Office" title="Finance & Fees" sub="Raise invoices, record payments, and reconcile every student account." />

      {msg && <div className={`col-span-12 rounded-xl border px-3 py-2 text-sm ${msg.t === "ok" ? "border-olive/30 bg-olive/10 text-olive" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.m}</div>}

      <div className="col-span-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Issued", v: report?.issued ?? 0 }, { l: "Collected", v: report?.paid ?? 0 },
          { l: "Outstanding", v: report?.outstanding ?? outstanding }, { l: "Invoices", v: report?.invoiceCount ?? invoices.length },
        ].map((s, i) => (
          <div key={s.l} className="card lift relative overflow-hidden p-5">
            <span aria-hidden className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-bronze opacity-[0.08]" />
            <Eyebrow className="text-ink-faint">{s.l}</Eyebrow>
            <p className="mt-2 font-display text-2xl font-semibold text-ink tabular-nums">{i === 3 ? s.v : money(s.v)}</p>
          </div>
        ))}
      </div>

      <div className="col-span-12">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "invoices", label: "Invoices", count: invoices.length },
            { id: "fees", label: "Fee structures", count: fees.length },
            { id: "report", label: "Financial report" },
          ]}
        />
      </div>

      {tab === "invoices" && (
        <Panel className="col-span-12" accent="#7d6a3a" action={canWrite(role) ? <button onClick={() => setInvoiceModal(true)} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">New invoice</button> : undefined} bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <tr><th className="px-5 py-3">No.</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Balance</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody>
                {invoices.map((i: Inv) => (
                  <tr key={i.id} className="border-t border-line/60 transition hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink">{i.number}</td>
                    <td className="px-5 py-3 text-ink-soft">{i.student.firstName} {i.student.lastName}</td>
                    <td className="px-5 py-3 tabular-nums text-ink-soft">{money(i.total)}</td>
                    <td className="px-5 py-3 tabular-nums text-olive">{money(i.amountPaid)}</td>
                    <td className="px-5 py-3 tabular-nums text-clay">{money(Math.max(0, i.total - i.amountPaid))}</td>
                    <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {canWrite(role) && i.status !== "VOID" && i.amountPaid < i.total && <button onClick={() => setPayModal(i)} className="mr-2 font-semibold text-gold-deep hover:underline">Pay</button>}
                      {canWrite(role) && i.status !== "VOID" && <button onClick={async () => { try { await post({ kind: "void", invoiceId: i.id }); flash("ok", "Invoice voided."); load(); } catch (e: any) { flash("err", e.message); } }} className="font-semibold text-bad hover:underline">Void</button>}
                    </td>
                  </tr>
                ))}
                {!invoices.length && <tr><td colSpan={7} className="px-5 py-10 text-center text-ink-mute">{loading ? "Loading…" : "No invoices yet."}</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "fees" && (
        <Panel className="col-span-12" accent="#7d6a3a" action={canWrite(role) ? <button onClick={() => setFeeModal(true)} className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Add fee type</button> : undefined} bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint"><tr><th className="px-5 py-3">Fee</th><th className="px-5 py-3">Default amount</th><th className="px-5 py-3">Description</th></tr></thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id} className="border-t border-line/60 transition hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink">{f.name}</td>
                    <td className="px-5 py-3 tabular-nums text-ink-soft">{money(f.amount)}</td>
                    <td className="px-5 py-3 text-ink-mute">{f.description || "—"}</td>
                  </tr>
                ))}
                {!fees.length && <tr><td colSpan={3} className="px-5 py-10 text-center text-ink-mute">No fee types.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "report" && (
        <Panel className="col-span-12" accent="#7d6a3a" title="Revenue by line item">
          {report && Object.keys(report.byFee || {}).length ? (
            <div className="space-y-2.5">
              {Object.entries(report.byFee as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
                const max = Math.max(...Object.values(report.byFee as Record<string, number>));
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-xs font-semibold text-ink-mute">{k}</span>
                    <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-cream-200"><span className="absolute inset-y-0 left-0 rounded-full bg-bronze transition-all duration-700" style={{ width: `${(v / max) * 100}%` }} /></span>
                    <span className="w-28 shrink-0 text-right font-display text-sm font-semibold text-ink tabular-nums">{money(v)}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-ink-mute">No revenue recorded yet.</p>}
        </Panel>
      )}

      <Modal open={invoiceModal} onClose={() => setInvoiceModal(false)} kicker="New" title="Raise an invoice" wide>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const descs = fd.getAll("desc") as string[]; const qtys = fd.getAll("qty") as string[]; const ups = fd.getAll("up") as string[];
          const items = descs.map((d, i) => ({ description: d, quantity: Number(qtys[i]) || 1, unitPrice: Number(ups[i]) || 0 })).filter((x) => x.description);
          try { await post({ kind: "invoice", studentId: fd.get("studentId"), dueDate: fd.get("dueDate"), notes: fd.get("notes"), items }); setInvoiceModal(false); flash("ok", "Invoice raised."); load(); } catch (err: any) { flash("err", err.message); }
        }} className="space-y-4">
          <label className="block"><span className="lbl">Student *</span><select name="studentId" className="field" required><option value="">Select…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.admissionNumber}</option>)}</select></label>
          <label className="block"><span className="lbl">Due date</span><input name="dueDate" type="date" className="field" /></label>
          <div className="space-y-2">
            <span className="lbl">Line items</span>
            {[0, 1, 2].map((n) => (
              <div key={n} className="grid grid-cols-[1fr_80px_120px] gap-2">
                <input name="desc" placeholder="Description" className="field" />
                <input name="qty" type="number" min={1} defaultValue={1} className="field" />
                <input name="up" type="number" min={0} step="0.01" placeholder="Unit price" className="field" />
              </div>
            ))}
          </div>
          <label className="block"><span className="lbl">Notes</span><textarea name="notes" rows={2} className="field resize-none" /></label>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Raise invoice</button>
        </form>
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} kicker="Payment" title={`Record payment · ${payModal?.number || ""}`}>
        {payModal && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try { await post({ kind: "payment", invoiceId: payModal.id, amount: Number(fd.get("amount")), method: fd.get("method"), reference: fd.get("reference") }); setPayModal(null); flash("ok", "Payment recorded."); load(); } catch (err: any) { flash("err", err.message); }
          }} className="space-y-4">
            <p className="text-sm text-ink-mute">Balance due: <span className="font-semibold text-clay">{money(Math.max(0, payModal.total - payModal.amountPaid))}</span></p>
            <label className="block"><span className="lbl">Amount *</span><input name="amount" type="number" min={0.01} step="0.01" className="field" required /></label>
            <label className="block"><span className="lbl">Method</span><select name="method" className="field">{["CASH", "BANK_TRANSFER", "CARD", "CHECK", "OTHER"].map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}</select></label>
            <label className="block"><span className="lbl">Reference</span><input name="reference" className="field" /></label>
            <button className="rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5">Record payment</button>
          </form>
        )}
      </Modal>

      <Modal open={feeModal} onClose={() => setFeeModal(false)} kicker="Catalogue" title="Add fee type">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          try { await post({ kind: "feeType", name: fd.get("name"), amount: Number(fd.get("amount")), description: fd.get("description") }); setFeeModal(false); flash("ok", "Fee type added."); load(); } catch (err: any) { flash("err", err.message); }
        }} className="space-y-4">
          <label className="block"><span className="lbl">Name *</span><input name="name" className="field" required /></label>
          <label className="block"><span className="lbl">Default amount *</span><input name="amount" type="number" min={0} step="0.01" className="field" required /></label>
          <label className="block"><span className="lbl">Description</span><input name="description" className="field" /></label>
          <button className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">Add fee type</button>
        </form>
      </Modal>
    </div>
  );
}