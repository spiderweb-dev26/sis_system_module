import { RegistrationPeriod, Role, User } from "@prisma/client";

type UserWithRole = Pick<User, "role"> | null | undefined;

export const STAFF_ROLES: Role[] = [
  Role.PRINCIPAL,
  Role.ADMIN,
  Role.TEACHER,
  Role.ACCOUNTANT,
  Role.REGISTRAR,
  Role.COUNSELOR,
];

export function isStaff(user: UserWithRole) {
  return Boolean(user && STAFF_ROLES.includes(user.role));
}

export function canViewAllStudents(user: UserWithRole) {
  return isStaff(user);
}

export function canManageUsers(user: UserWithRole) {
  return Boolean(
    user &&
      [Role.PRINCIPAL, Role.ADMIN].includes(user.role)
  );
}

export function canManageRegistrationPeriods(user: UserWithRole) {
  return Boolean(
    user &&
      [Role.PRINCIPAL, Role.ADMIN].includes(user.role)
  );
}

export function canCreateRegistration(
  user: UserWithRole,
  period: RegistrationPeriod | null | undefined
) {
  if (!user || !period) return false;
  if (!period.isActive) return false;

  switch (user.role) {
    case Role.PRINCIPAL:
      return period.allowPrincipal;

    case Role.REGISTRAR:
      return period.allowRegistrar;

    case Role.COUNSELOR:
      return period.allowCounselor;

    case Role.ADMIN:
      return period.allowAdmin;

    default:
      return false;
  }
}

export function canApproveRegistration(user: UserWithRole) {
  return Boolean(
    user &&
      [Role.PRINCIPAL, Role.ADMIN, Role.REGISTRAR].includes(user.role)
  );
}

export function canManageStudentRecords(user: UserWithRole) {
  return Boolean(
    user &&
      [Role.PRINCIPAL, Role.ADMIN, Role.REGISTRAR].includes(user.role)
  );
}