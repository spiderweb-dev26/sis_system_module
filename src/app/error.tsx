"use client";

import { Crest } from "@/components/ui";

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-line bg-paper p-8 text-center shadow-soft">
      <Crest letter="!" size={56} />
      <h1 className="font-display text-2xl font-semibold text-ink">This page stumbled</h1>
      <p className="text-sm text-ink-mute">
        Something went wrong while loading this view. The rest of the school is unaffected — try again, or return to your dashboard.
      </p>
      <pre className="max-h-32 w-full overflow-auto rounded-xl bg-cream-100 p-3 text-left text-[11px] text-ink-faint">
        {error.message}
      </pre>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-full bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:-translate-y-0.5 hover:bg-cocoa-deep">
          Try again
        </button>
        <a href="/dashboard" className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-cream-100">
          Dashboard
        </a>
      </div>
    </div>
  );
}