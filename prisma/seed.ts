import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const hashPassword = (p: string) => bcrypt.hash(p, 12);

const rng = (seed: number) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

const SCALE = [
  { min: 93, letter: "A", points: 4.0 }, { min: 90, letter: "A-", points: 3.7 },
  { min: 87, letter: "B+", points: 3.3 }, { min: 83, letter: "B", points: 3.0 },
  { min: 80, letter: "B-", points: 2.7 }, { min: 77, letter: "C+", points: 2.3 },
  { min: 73, letter: "C", points: 2.0 }, { min: 70, letter: "C-", points: 1.7 },
  { min: 67, letter: "D+", points: 1.3 }, { min: 63, letter: "D", points: 1.0 },
  { min: 60, letter: "D-", points: 0.7 }, { min: 0, letter: "F", points: 0.0 },
];
const gradeOf = (s: number) => SCALE.find((g) => s >= g.min) || SCALE[SCALE.length - 1];

async function createStaffUser(input: { email: string; role: Role; firstName: string; lastName: string; password: string; staffId: string; title: string; department?: string }) {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.upsert({
    where: { email: input.email }, update: { passwordHash, role: input.role, status: UserStatus.ACTIVE, firstName: input.firstName, lastName: input.lastName },
    create: { email: input.email, passwordHash, role: input.role, status: UserStatus.ACTIVE, firstName: input.firstName, lastName: input.lastName, mustChangePassword: true },
  });
  if (input.role === Role.TEACHER) {
    await prisma.teacherProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, staffId: input.staffId, title: input.title, department: input.department } });
  } else {
    await prisma.staffProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, staffId: input.staffId, title: input.title, department: input.department } });
  }
  return user;
}

async function main() {
  // Staff
  await createStaffUser({ email: "principal@school.edu", role: Role.PRINCIPAL, firstName: "System", lastName: "Principal", password: "Principal@12345", staffId: "STAFF-PRINCIPAL", title: "Principal", department: "Administration" });
  await createStaffUser({ email: "admin@school.edu", role: Role.ADMIN, firstName: "System", lastName: "Admin", password: "Admin@12345", staffId: "STAFF-ADMIN", title: "Administrator", department: "Administration" });
  await createStaffUser({ email: "registrar@school.edu", role: Role.REGISTRAR, firstName: "Default", lastName: "Registrar", password: "Registrar@12345", staffId: "STAFF-REGISTRAR", title: "Registrar", department: "Academic Administration" });
  await createStaffUser({ email: "counselor@school.edu", role: Role.COUNSELOR, firstName: "Selam", lastName: "Bekele", password: "Counselor@12345", staffId: "STAFF-COUNSELOR", title: "School Counselor", department: "Student Support" });
  await createStaffUser({ email: "accountant@school.edu", role: Role.ACCOUNTANT, firstName: "Default", lastName: "Accountant", password: "Accountant@12345", staffId: "STAFF-ACCOUNTANT", title: "Accountant/Bursar", department: "Finance" });
  const teacherUser = await createStaffUser({ email: "teacher@school.edu", role: Role.TEACHER, firstName: "Hanna", lastName: "Tadesse", password: "Teacher@12345", staffId: "STAFF-TEACHER", title: "Teacher", department: "Academics" });
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: teacherUser.id } });

  // Registration period
  const year = new Date().getFullYear();
  const academicYear = `${year}/${year + 1}`;
  const periodName = `${academicYear} Admission Registration`;
  const start = new Date(); start.setDate(start.getDate() - 10);
  const end = new Date(); end.setDate(end.getDate() + 60);
  await prisma.registrationPeriod.upsert({ where: { academicYear_name: { academicYear, name: periodName } }, update: { startDate: start, endDate: end, isActive: true }, create: { academicYear, name: periodName, startDate: start, endDate: end, isActive: true } });
  await prisma.registrationPeriod.updateMany({ where: { NOT: { academicYear, name: periodName } }, data: { isActive: false } });

  // Term
  const term1 = await prisma.term.upsert({ where: { name_type: { name: "Semester 1", type: "SEMESTER" } }, update: { isActive: true }, create: { name: "Semester 1", type: "SEMESTER", startDate: start, endDate: end, isActive: true } });

  // Ethiopian subjects
  const ethiopianSubjects = [
    { code: "ENG", name: "English" }, { code: "MATH", name: "Mathematics" }, { code: "OROM", name: "Affan Oromo" },
    { code: "PHY", name: "Physics" }, { code: "BIO", name: "Biology" }, { code: "CHEM", name: "Chemistry" },
    { code: "HIST", name: "History" }, { code: "GEO", name: "Geography" }, { code: "AMH", name: "Amharic" },
    { code: "IT", name: "IT" }, { code: "HPE", name: "HPE" }, { code: "APT", name: "Aptitude/SAT" },
  ];
  const subjects: Record<string, string> = {};
  for (const subj of ethiopianSubjects) {
    const s = await prisma.subject.upsert({ where: { code: subj.code }, update: { name: subj.name }, create: { code: subj.code, name: subj.name } });
    subjects[subj.code] = s.id;
  }

  // Subject offerings
  const offerings = [
    ...["ENG", "MATH", "OROM", "PHY", "BIO", "CHEM", "HIST", "GEO", "AMH", "IT", "HPE", "APT"].flatMap(code => [
      { subjectId: subjects[code], gradeLevel: 9, stream: null }, { subjectId: subjects[code], gradeLevel: 10, stream: null },
    ]),
    ...["ENG", "MATH", "PHY", "BIO", "CHEM", "IT", "HPE"].flatMap(code => [
      { subjectId: subjects[code], gradeLevel: 11, stream: "NATURAL_SCIENCE" as const }, { subjectId: subjects[code], gradeLevel: 12, stream: "NATURAL_SCIENCE" as const },
    ]),
    ...["ENG", "MATH", "HIST", "GEO", "AMH", "IT", "HPE"].flatMap(code => [
      { subjectId: subjects[code], gradeLevel: 11, stream: "SOCIAL_SCIENCE" as const }, { subjectId: subjects[code], gradeLevel: 12, stream: "SOCIAL_SCIENCE" as const },
    ]),
  ];
  for (const off of offerings) {
    await prisma.subjectOffering.upsert({ where: { subjectId_gradeLevel_stream: { subjectId: off.subjectId, gradeLevel: off.gradeLevel, stream: off.stream } }, update: { isActive: true }, create: off });
  }

  // Grading categories
  const cats: Record<string, { weight: number; order: number }> = { Assignments: { weight: 30, order: 1 }, Quizzes: { weight: 20, order: 2 }, Midterm: { weight: 20, order: 3 }, Final: { weight: 30, order: 4 } };
  const catRows: Record<string, string> = {};
  for (const [name, c] of Object.entries(cats)) {
    const row = await prisma.gradingCategory.upsert({ where: { name }, update: { weight: c.weight, sortOrder: c.order }, create: { name, weight: c.weight, sortOrder: c.order } });
    catRows[name] = row.id;
  }

  // Sections (Ethiopian format: 9A, 9B, 10C, etc.)
  const sectionDefs = [
    { code: "9A", grade: 9, letter: "A" }, { code: "9B", grade: 9, letter: "B" },
    { code: "10A", grade: 10, letter: "A" }, { code: "11A", grade: 11, letter: "A" },
  ];
  const sections: any[] = [];
  for (const sd of sectionDefs) {
    const section = await prisma.section.upsert({
      where: { code: sd.code }, update: {},
      create: { code: sd.code, gradeLevel: sd.grade, sectionLetter: sd.letter, termId: term1.id, name: `Grade ${sd.grade} Section ${sd.letter}`, room: "Room 204" },
    });
    sections.push({ id: section.id, code: section.code, grade: sd.grade });
  }

  // Assign stream to 11A (Natural Science)
  const sec11 = sections.find(s => s.grade === 11);
  if (sec11) {
    await prisma.sectionStream.upsert({ where: { sectionId: sec11.id }, update: {}, create: { sectionId: sec11.id, stream: "NATURAL_SCIENCE", status: "APPROVED", approvedAt: new Date() } });
  }

  // Assign subjects to teacher (Math and English)
  for (const code of ["MATH", "ENG"]) {
    await prisma.teacherSubject.upsert({ where: { teacherId_subjectId: { teacherId: teacher!.id, subjectId: subjects[code] } }, update: {}, create: { teacherId: teacher!.id, subjectId: subjects[code] } });
  }

  // Demo students
  const demoDefs = [
    { n: "0001", first: "Dawit", last: "Alemu", g: 9 }, { n: "0002", first: "Meron", last: "Girma", g: 9 },
    { n: "0003", first: "Yonas", last: "Kebede", g: 10 }, { n: "0004", first: "Sara", last: "Hailu", g: 10 },
    { n: "0005", first: "Abel", last: "Tesfaye", g: 11 }, { n: "0006", first: "Liya", last: "Desta", g: 11 },
  ];
  const demoStudents: any[] = [];
  for (const d of demoDefs) {
    const s = await prisma.studentProfile.upsert({
      where: { admissionNumber: `DEMO-2026-${d.n}` }, update: {},
      create: { admissionNumber: `DEMO-2026-${d.n}`, firstName: d.first, lastName: d.last, dateOfBirth: new Date(2010, 3, 12), gender: "Male", gradeLevel: d.g, status: "ACTIVE", enrollmentDate: start, nationality: "Ethiopian" },
    });
    demoStudents.push({ id: s.id, admission: s.admissionNumber, grade: d.g });
  }

  // Enroll students in sections by grade
  for (const stu of demoStudents) {
    const mySection = sections.find(s => s.grade === stu.grade);
    if (mySection) {
      await prisma.enrollment.upsert({ where: { studentId_sectionId: { studentId: stu.id, sectionId: mySection.id } }, update: {}, create: { studentId: stu.id, sectionId: mySection.id, status: "ACTIVE" } });
    }
  }

  // Create assessments for Math (teacher's subject) across all sections
  for (const sec of sections) {
    for (const catName of Object.keys(cats)) {
      const count = catName === "Midterm" || catName === "Final" ? 1 : 2;
      for (let n = 1; n <= count; n++) {
        const max = catName === "Assignments" || catName === "Quizzes" ? 20 : 100;
        await prisma.assessment.upsert({
          where: { key: `asg-${sec.code}-MATH-${catName}-${n}` }, update: {},
          create: { key: `asg-${sec.code}-MATH-${catName}-${n}`, sectionId: sec.id, subjectId: subjects["MATH"], categoryId: catRows[catName], name: `${catName} ${n}`, type: catName === "Midterm" ? "TEST" : catName === "Final" ? "EXAM" : catName === "Quizzes" ? "QUIZ" : "ASSIGNMENT", maxScore: max, weight: 1, createdById: teacherUser.id },
        });
      }
    }
  }

  // Grades for demo students in Math
  const mathAssessments = await prisma.assessment.findMany({ where: { subjectId: subjects["MATH"] } });
  for (const stu of demoStudents) {
    for (const asg of mathAssessments) {
      const seedNum = (stu.admission.charCodeAt(stu.admission.length - 1) || 1) * 31 + asg.id.charCodeAt(asg.id.length - 1) + asg.maxScore;
      const pct = 0.55 + rng(seedNum) * 0.43;
      const score = Math.round(pct * asg.maxScore * 100) / 100;
      await prisma.grade.upsert({ where: { assessmentId_studentId: { assessmentId: asg.id, studentId: stu.id } }, update: { score, status: "SUBMITTED" }, create: { assessmentId: asg.id, studentId: stu.id, score, status: "SUBMITTED", createdById: teacherUser.id } });
    }
  }

  console.log("Seed completed.");
  console.log("Logins: principal@ / registrar@ / counselor@ / accountant@ / teacher@ (Role@12345)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());