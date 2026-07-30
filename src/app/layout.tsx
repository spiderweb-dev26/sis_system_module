import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "School SIS",
  description: "High School Student Information System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold">
              School SIS
            </Link>

            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  {isStaff(user) && (
                    <>
                      <Link href="/dashboard" className="hover:underline">
                        Dashboard
                      </Link>
                      <Link href="/registrations" className="hover:underline">
                        Registrations
                      </Link>
                      <Link href="/students" className="hover:underline">
                        Students
                      </Link>
                    </>
                  )}

                  <span className="text-slate-500">
                    {user.firstName} {user.lastName} ({user.role})
                  </span>

                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="hover:underline">
                  Login
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}