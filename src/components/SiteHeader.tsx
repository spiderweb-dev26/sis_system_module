"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Crest, RoleBadge } from "./ui";
import type { RoleMeta } from "@/lib/roles";

function initials(first: string, last: string) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase();
}

export default function SiteHeader({
  user,
  meta,
}: {
  user: { firstName: string; lastName: string; role: string };
  meta: RoleMeta;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream-100/85 backdrop-blur">
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg,#b07d3c,#5b3a22 55%,#6f7a45)" }}
      />
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <Crest letter="S" size={38} className="transition-transform duration-300 group-hover:rotate-6" />
          <span className="leading-none">
            <span className="block font-display text-lg font-semibold tracking-tight text-ink">
              School SIS
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
              {meta.kicker}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {meta.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                isActive(item.href) ? "text-cocoa" : "text-ink-mute hover:text-cocoa"
              }`}
            >
              {item.label}
              <span
                className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gold transition-transform duration-300 ${
                  isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          ))}

          <div className="group relative">
            <button className="flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-mute transition hover:text-cocoa">
              Roadmap
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="invisible absolute right-0 top-full z-50 mt-2 w-60 origin-top-right scale-95 rounded-2xl border border-line bg-paper p-2 opacity-0 shadow-lift transition duration-200 group-hover:visible group-hover:scale-100 group-hover:opacity-100">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                {meta.shortTitle} workspace — coming next
              </p>
              {meta.roadmap.map((r) => (
                <div
                  key={r}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-soft"
                >
                  {r}
                  <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-faint">
                    soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <span
              className="grid h-9 w-9 place-items-center rounded-full font-display text-sm font-semibold text-cream-50"
              style={{ background: meta.accent }}
            >
              {initials(user.firstName, user.lastName)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">
                {user.firstName} {user.lastName}
              </p>
              <RoleBadge role={user.role} accent={meta.accent} />
            </div>
          </div>
          <button
            onClick={logout}
            className="hidden rounded-full border border-line bg-paper px-3.5 py-2 text-sm font-semibold text-bad transition hover:bg-bad/10 sm:inline-flex"
          >
            Logout
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper text-cocoa md:hidden"
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="grid h-8 w-8 place-items-center rounded-full font-display text-xs font-semibold text-cream-50"
              style={{ background: meta.accent }}
            >
              {initials(user.firstName, user.lastName)}
            </span>
            <span className="text-sm font-semibold text-ink">
              {user.firstName} {user.lastName}
            </span>
          </div>
          {meta.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2 text-sm font-semibold ${
                isActive(item.href) ? "bg-cream-100 text-cocoa" : "text-ink-soft"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
            Coming next
          </p>
          {meta.roadmap.map((r) => (
            <div key={r} className="flex items-center justify-between px-3 py-1.5 text-sm text-ink-mute">
              {r}
              <span className="text-[9px] font-bold uppercase tracking-wide text-ink-faint">soon</span>
            </div>
          ))}
          <button
            onClick={logout}
            className="mt-2 w-full rounded-full border border-line px-3 py-2 text-sm font-semibold text-bad"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}