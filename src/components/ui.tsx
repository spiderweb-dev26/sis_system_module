"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CountUp, Reveal } from "./motion";
import { getRoleLabel } from "@/lib/roles";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block text-[11px] font-bold uppercase tracking-[0.2em] ${className}`}>
      {children}
    </span>
  );
}

export function Crest({
  letter = "S",
  size = 44,
  className = "",
}: {
  letter?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`relative inline-grid shrink-0 place-items-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 30% 25%, #7a4f2e, #3a2414)",
        boxShadow:
          "inset 0 0 0 2px rgba(203,157,84,.75), inset 0 0 0 5px rgba(58,36,20,.92), 0 8px 18px -8px rgba(58,36,20,.6)",
      }}
    >
      <span className="font-display font-semibold text-gold-soft" style={{ fontSize: size * 0.42 }}>
        {letter}
      </span>
    </span>
  );
}

const STATUS_TONE: Record<string, { cls: string; dot: string }> = {
  DRAFT: { cls: "bg-cream-200 text-ink-mute", dot: "bg-ink-faint" },
  PENDING: { cls: "bg-gold/15 text-gold-deep", dot: "bg-gold" },
  PENDING_ENROLLMENT: { cls: "bg-gold/15 text-gold-deep", dot: "bg-gold" },
  APPROVED: { cls: "bg-olive/15 text-olive", dot: "bg-olive" },
  ENROLLED: { cls: "bg-olive/15 text-olive", dot: "bg-olive" },
  ACTIVE: { cls: "bg-olive/15 text-olive", dot: "bg-olive" },
  GRADUATED: { cls: "bg-gold/15 text-gold-deep", dot: "bg-gold" },
  INACTIVE: { cls: "bg-cream-200 text-ink-mute", dot: "bg-ink-faint" },
  WITHDRAWN: { cls: "bg-cream-200 text-ink-mute", dot: "bg-ink-faint" },
  TRANSFERRED: { cls: "bg-info/10 text-info", dot: "bg-info" },
  SUSPENDED: { cls: "bg-bad/12 text-bad", dot: "bg-bad" },
  EXPELLED: { cls: "bg-bad/12 text-bad", dot: "bg-bad" },
};

export function statusDot(status: string) {
  return STATUS_TONE[status]?.dot || "bg-ink-faint";
}

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_TONE[status] || { cls: "bg-cream-200 text-ink-mute", dot: "bg-ink-faint" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${c.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function RoleBadge({ role, accent }: { role: string; accent: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-cocoa">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      {getRoleLabel(role)}
    </span>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PrimaryLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:bg-cocoa-deep hover:shadow-lift active:translate-y-0 ${className}`}
    >
      {children}
      <Arrow />
    </Link>
  );
}

export function GhostLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-cocoa transition duration-200 hover:-translate-y-0.5 hover:bg-cream-100 hover:shadow-soft ${className}`}
    >
      {children}
    </Link>
  );
}

export function Panel({
  kicker,
  title,
  action,
  accent,
  className = "",
  bodyClass = "",
  delay = 0,
  children,
}: {
  kicker?: string;
  title?: string;
  action?: ReactNode;
  accent?: string;
  className?: string;
  bodyClass?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <section className="card lift relative flex h-full flex-col overflow-hidden">
        {accent && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: `linear-gradient(90deg, ${accent}, transparent 70%)` }}
          />
        )}
        {(kicker || title || action) && (
          <header className="flex items-end justify-between gap-3 border-b border-line/70 px-5 pb-3 pt-4">
            <div>
              {kicker && <Eyebrow className="text-ink-faint">{kicker}</Eyebrow>}
              {title && (
                <h3 className="font-display text-lg font-semibold leading-tight text-ink">{title}</h3>
              )}
            </div>
            {action}
          </header>
        )}
        <div className={`flex-1 px-5 py-4 ${bodyClass}`}>{children}</div>
      </section>
    </Reveal>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  hint,
  accent = "#5b3a22",
  className = "",
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  accent?: string;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="card lift relative flex h-full flex-col justify-between overflow-hidden p-5">
        <span
          aria-hidden
          className="absolute -right-6 -top-7 h-20 w-20 rounded-full opacity-[0.08]"
          style={{ background: accent }}
        />
        <Eyebrow className="text-ink-faint">{label}</Eyebrow>
        <div className="mt-3 flex items-end gap-1">
          <CountUp
            value={value}
            className="font-display text-4xl font-semibold leading-none text-ink tabular-nums"
          />
          {suffix && <span className="mb-1 font-display text-lg text-ink-mute">{suffix}</span>}
        </div>
        {hint && <p className="mt-2 text-xs text-ink-mute">{hint}</p>}
      </div>
    </Reveal>
  );
}

export function Kpi({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          {hint && <p className="text-xs text-ink-mute">{hint}</p>}
        </div>
      </div>
      <CountUp value={value} className="font-display text-2xl font-semibold text-ink tabular-nums" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-cream-200 text-ink-faint">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="text-sm text-ink-mute">{message}</p>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  sub,
  action,
}: {
  kicker: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal className="col-span-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <Eyebrow className="text-gold-deep">{kicker}</Eyebrow>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            {title}
          </h1>
          {sub && <p className="mt-1 max-w-2xl text-sm text-ink-mute">{sub}</p>}
        </div>
        {action}
      </div>
    </Reveal>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="lbl">
        {label}
        {required && <span className="text-clay"> *</span>}
      </span>
      <input name={name} type={type} required={required} placeholder={placeholder} className="field" />
    </label>
  );
}

export function Select({
  label,
  name,
  required,
  children,
  className = "",
}: {
  label: string;
  name: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="lbl">
        {label}
        {required && <span className="text-clay"> *</span>}
      </span>
      <select name={name} required={required} className="field">
        {children}
      </select>
    </label>
  );
}

export function TextArea({
  label,
  name,
  rows = 3,
  className = "",
}: {
  label: string;
  name: string;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="lbl">{label}</span>
      <textarea name={name} rows={rows} className="field resize-none" />
    </label>
  );
}