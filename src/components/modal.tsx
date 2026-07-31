"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Modal({
  open, onClose, title, kicker, children, wide,
}: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode; wide?: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      const r = requestAnimationFrame(() => setShow(true));
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      return () => { cancelAnimationFrame(r); window.removeEventListener("keydown", onKey); };
    }
    setShow(false);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-cocoa-deep/45 backdrop-blur-sm transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`card relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} overflow-hidden shadow-lift transition-all duration-300 ${
          show ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0"
        }`}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-cocoa to-olive" />
        <header className="flex items-start justify-between gap-4 border-b border-line/70 px-6 pb-3 pt-5">
          <div>
            {kicker && <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">{kicker}</span>}
            <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-mute transition hover:bg-cream-100 hover:text-cocoa">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}