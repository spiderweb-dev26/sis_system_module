import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canCreateRegistration } from "@/lib/permissions";
import RegistrationForm from "@/components/RegistrationForm";

export const dynamic = "force-dynamic";

export default async function NewRegistrationPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const activePeriod = await prisma.registrationPeriod.findFirst({
    where: {
      isActive: true,
    },
  });

  if (!canCreateRegistration(user, activePeriod)) {
    redirect("/registrations");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Register New Student</h1>
        <p className="text-slate-600">
          Registration period: {activePeriod?.name}
        </p>
      </div>

      <RegistrationForm />
    </div>
  );
}