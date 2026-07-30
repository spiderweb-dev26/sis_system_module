import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { getRoleMeta } from "@/lib/roles";
import SiteHeader from "@/components/SiteHeader";
import { Crest } from "@/components/ui";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "School SIS — Student Information System",
  description: "A warm, role-based high school student information system.",
};

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const GLOW =
  "radial-gradient(1200px 620px at 10% -12%, rgba(176,125,60,.18), transparent 60%)," +
  "radial-gradient(900px 520px at 100% 0%, rgba(156,86,56,.10), transparent 55%)," +
  "radial-gradient(820px 620px at 50% 122%, rgba(111,122,69,.12), transparent 60%)";

function PublicBar() {
  return (
    <header className="border-b border-line/70">
      <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-4 md:px-6">
        <Crest letter="S" size={38} />
        <span className="font-display text-lg font-semibold tracking-tight text-ink">School SIS</span>
      </div>
    </header>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const meta = user ? getRoleMeta(user.role) : null;

  return (
    <html lang="en">
      <body className={`${nunito.variable} ${fraunces.variable} font-sans text-ink`}>
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ background: GLOW }} />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05] mix-blend-multiply"
          style={{ backgroundImage: GRAIN }}
        />

        {user && meta ? (
          <SiteHeader
            user={{ firstName: user.firstName, lastName: user.lastName, role: user.role }}
            meta={meta}
          />
        ) : (
          <PublicBar />
        )}

        <main className="mx-auto w-full max-w-[1180px] px-4 py-7 md:px-6 md:py-9">{children}</main>

        <footer className="border-t border-line/70">
          <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-ink-faint md:flex-row md:px-6">
            <div className="flex items-center gap-2">
              <Crest letter="S" size={22} />
              <span className="font-display text-sm text-ink-mute">School SIS</span>
              <span>· crafted for the academy</span>
            </div>
            <span>
              {meta ? `${meta.shortTitle} desk` : "Staff portal"} · © {new Date().getFullYear()}
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}