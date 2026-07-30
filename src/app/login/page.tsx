import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { Crest, Eyebrow } from "@/components/ui";
import { getCurrentAcademicYear } from "@/lib/utils";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-[72vh] items-stretch gap-6 md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden rounded-3xl border border-line bg-cocoa-deep p-9 text-cream-100 md:flex">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 font-display text-[15rem] leading-none text-cream-50 opacity-[0.05]"
        >
          S
        </span>
        <div className="relative flex items-center gap-3">
          <Crest letter="S" size={48} />
          <span className="font-display text-xl font-semibold">School SIS</span>
        </div>

        <div className="relative">
          <Eyebrow className="text-gold-soft">Staff Portal</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            The whole school,
            <br />
            on one <span className="italic text-gold-soft">warm</span> desk.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-200/80">
            Admissions, records, wellbeing and accounts — every office in the academy, gathered into a
            single, considered workspace.
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-cream-200/60">
            Admissions · Records · Wellbeing
          </p>
        </div>

        <div className="relative flex items-center justify-between text-xs text-cream-200/60">
          <span>Academic Year {getCurrentAcademicYear()}</span>
          <span>Secured staff access</span>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <div className="mb-6 md:hidden">
          <Eyebrow className="text-gold-deep">Staff Portal</Eyebrow>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Welcome back
          </h1>
        </div>
        <div className="card relative overflow-hidden p-7 md:p-9">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg,#b07d3c,#5b3a22 60%,#6f7a45)" }}
          />
          <div className="mb-6 hidden md:block">
            <Eyebrow className="text-ink-faint">Sign in</Eyebrow>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Staff login</h2>
            <p className="mt-1 text-sm text-ink-mute">Use the credentials issued by your administrator.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}