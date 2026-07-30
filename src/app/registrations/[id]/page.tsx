import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  canApproveRegistration,
  isStaff,
} from "@/lib/permissions";
import RegistrationDetail from "@/components/RegistrationDetail";

export const dynamic = "force-dynamic";

export default async function RegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!isStaff(user)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const registration = await prisma.registrationApplication.findUnique({
    where: { id },
    include: {
      documents: true,
      registrationPeriod: true,
    },
  });

  if (!registration) {
    notFound();
  }

  const canApprove = canApproveRegistration(user);

  const canUpload =
    isStaff(user) &&
    registration.status === "DRAFT";

  const dto = JSON.parse(JSON.stringify(registration));

  return (
    <RegistrationDetail
      registration={dto}
      canApprove={canApprove}
      canUpload={canUpload}
    />
  );
}