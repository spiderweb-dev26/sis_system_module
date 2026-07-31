import { RegistrationPeriod, Role, User } from "@prisma/client";

type U = Pick<User, "role"> | null | undefined;

export const STAFF_ROLES: Role[] = [
  Role.PRINCIPAL, Role.ADMIN, Role.TEACHER, Role.ACCOUNTANT, Role.REGISTRAR, Role.COUNSELOR,
];

export const isStaff = (u: U) => Boolean(u && STAFF_ROLES.includes(u.role));
export const canViewAllStudents = (u: U) => isStaff(u);
export const canManageUsers = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN].includes(u.role));
export const canManageRegistrationPeriods = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN].includes(u.role));

export function canCreateRegistration(u: U, period: RegistrationPeriod | null | undefined) {
  if (!u || !period || !period.isActive) return false;
  switch (u.role) {
    case Role.PRINCIPAL: return period.allowPrincipal;
    case Role.REGISTRAR: return period.allowRegistrar;
    case Role.COUNSELOR: return period.allowCounselor;
    case Role.ADMIN: return period.allowAdmin;
    default: return false;
  }
}

export const canApproveRegistration = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.REGISTRAR].includes(u.role));
export const canManageStudentRecords = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.REGISTRAR].includes(u.role));

export const canManageFinance = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.ACCOUNTANT].includes(u.role));
export const canManageAcademicsRecords = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.REGISTRAR].includes(u.role));
export const canEnterGrades = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.TEACHER].includes(u.role));
export const canManageAttendance = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.REGISTRAR, Role.TEACHER, Role.COUNSELOR].includes(u.role));
export const canManageDiscipline = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.COUNSELOR].includes(u.role));
export const canManageCounseling = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN, Role.COUNSELOR].includes(u.role));
export const canExpelStudent = (u: U) => Boolean(u && [Role.PRINCIPAL, Role.ADMIN].includes(u.role));