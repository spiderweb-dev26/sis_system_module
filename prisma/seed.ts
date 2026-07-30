import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function createStaffUser(input: {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  password: string;
  staffId: string;
  title: string;
  department?: string;
}) {
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      passwordHash,
      role: input.role,
      status: UserStatus.ACTIVE,
      firstName: input.firstName,
      lastName: input.lastName,
    },
    create: {
      email: input.email,
      passwordHash,
      role: input.role,
      status: UserStatus.ACTIVE,
      firstName: input.firstName,
      lastName: input.lastName,
      mustChangePassword: true,
    },
  });

  if (input.role === Role.TEACHER) {
    await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        staffId: input.staffId,
        title: input.title,
        department: input.department,
      },
    });
  } else {
    await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        staffId: input.staffId,
        title: input.title,
        department: input.department,
      },
    });
  }

  return user;
}

async function main() {
  await createStaffUser({
    email: "principal@school.edu",
    role: Role.PRINCIPAL,
    firstName: "System",
    lastName: "Principal",
    password: "Principal@12345",
    staffId: "STAFF-PRINCIPAL",
    title: "Principal",
    department: "Administration",
  });

  await createStaffUser({
    email: "admin@school.edu",
    role: Role.ADMIN,
    firstName: "System",
    lastName: "Admin",
    password: "Admin@12345",
    staffId: "STAFF-ADMIN",
    title: "Administrator",
    department: "Administration",
  });

  await createStaffUser({
    email: "registrar@school.edu",
    role: Role.REGISTRAR,
    firstName: "Default",
    lastName: "Registrar",
    password: "Registrar@12345",
    staffId: "STAFF-REGISTRAR",
    title: "Registrar",
    department: "Academic Administration",
  });

  await createStaffUser({
    email: "counselor@school.edu",
    role: Role.COUNSELOR,
    firstName: "Default",
    lastName: "Counselor",
    password: "Counselor@12345",
    staffId: "STAFF-COUNSELOR",
    title: "School Counselor",
    department: "Student Support",
  });

  await createStaffUser({
    email: "accountant@school.edu",
    role: Role.ACCOUNTANT,
    firstName: "Default",
    lastName: "Accountant",
    password: "Accountant@12345",
    staffId: "STAFF-ACCOUNTANT",
    title: "Accountant/Bursar",
    department: "Finance",
  });

  await createStaffUser({
    email: "teacher@school.edu",
    role: Role.TEACHER,
    firstName: "Default",
    lastName: "Teacher",
    password: "Teacher@12345",
    staffId: "STAFF-TEACHER",
    title: "Teacher",
    department: "Academics",
  });

  const year = new Date().getFullYear();
  const academicYear = `${year}/${year + 1}`;
  const name = `${academicYear} Admission Registration`;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 10);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 60);

  await prisma.registrationPeriod.upsert({
    where: {
      academicYear_name: {
        academicYear,
        name,
      },
    },
    update: {
      startDate,
      endDate,
      isActive: true,
      allowPrincipal: true,
      allowRegistrar: true,
      allowCounselor: true,
      allowAdmin: true,
    },
    create: {
      academicYear,
      name,
      startDate,
      endDate,
      isActive: true,
      allowPrincipal: true,
      allowRegistrar: true,
      allowCounselor: true,
      allowAdmin: true,
    },
  });

  await prisma.registrationPeriod.updateMany({
    where: {
      NOT: {
        academicYear,
        name,
      },
    },
    data: {
      isActive: false,
    },
  });

  console.log("Seed completed.");
  console.log("Login examples:");
  console.log("principal@school.edu / Principal@12345");
  console.log("registrar@school.edu / Registrar@12345");
  console.log("counselor@school.edu / Counselor@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });