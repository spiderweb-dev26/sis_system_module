"use client";

export interface TabDef { id: string; label: string; count?: number; }

export function Tabs({
  tabs, active, onChange,
}: { tabs: TabDef[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`group relative -mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              on ? "text-cocoa" : "text-ink-mute hover:text-cocoa"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${on ? "bg-cocoa/10 text-cocoa" : "bg-cream-200 text-ink-faint"}`}>
                {t.count}
              </span>
            )}
            <span className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"}`} />
          </button>
        );
      })}
    </div>
  );
}