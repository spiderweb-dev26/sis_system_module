import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hashPassword = (p: string) => bcrypt.hash(p, 12);

// deterministic pseudo-random in [0,1) so re-seeds are stable
const rng = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

const SCALE = [
  { min: 93, letter: "A", points: 4.0 },
  { min: 90, letter: "A-", points: 3.7 },
  { min: 87, letter: "B+", points: 3.3 },
  { min: 83, letter: "B", points: 3.0 },
  { min: 80, letter: "B-", points: 2.7 },
  { min: 77, letter: "C+", points: 2.3 },
  { min: 73, letter: "C", points: 2.0 },
  { min: 70, letter: "C-", points: 1.7 },
  { min: 67, letter: "D+", points: 1.3 },
  { min: 63, letter: "D", points: 1.0 },
  { min: 60, letter: "D-", points: 0.7 },
  { min: 0, letter: "F", points: 0.0 },
];
const gradeOf = (s: number) => SCALE.find((g) => s >= g.min) || SCALE[SCALE.length - 1];

async function createStaffUser(input: {
  email: string; role: Role; firstName: string; lastName: string;
  password: string; staffId: string; title: string; department?: string;
}) {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: { passwordHash, role: input.role, status: UserStatus.ACTIVE, firstName: input.firstName, lastName: input.lastName },
    create: { email: input.email, passwordHash, role: input.role, status: UserStatus.ACTIVE, firstName: input.firstName, lastName: input.lastName, mustChangePassword: true },
  });
  if (input.role === Role.TEACHER) {
    await prisma.teacherProfile.upsert({
      where: { userId: user.id }, update: {},
      create: { userId: user.id, staffId: input.staffId, title: input.title, department: input.department },
    });
  } else {
    await prisma.staffProfile.upsert({
      where: { userId: user.id }, update: {},
      create: { userId: user.id, staffId: input.staffId, title: input.title, department: input.department },
    });
  }
  return user;
}

async function main() {
  // ---- staff ----
  await createStaffUser({ email: "principal@school.edu", role: Role.PRINCIPAL, firstName: "System", lastName: "Principal", password: "Principal@12345", staffId: "STAFF-PRINCIPAL", title: "Principal", department: "Administration" });
  await createStaffUser({ email: "admin@school.edu", role: Role.ADMIN, firstName: "System", lastName: "Admin", password: "Admin@12345", staffId: "STAFF-ADMIN", title: "Administrator", department: "Administration" });
  await createStaffUser({ email: "registrar@school.edu", role: Role.REGISTRAR, firstName: "Default", lastName: "Registrar", password: "Registrar@12345", staffId: "STAFF-REGISTRAR", title: "Registrar", department: "Academic Administration" });
  await createStaffUser({ email: "counselor@school.edu", role: Role.COUNSELOR, firstName: "Selam", lastName: "Bekele", password: "Counselor@12345", staffId: "STAFF-COUNSELOR", title: "School Counselor", department: "Student Support" });
  await createStaffUser({ email: "accountant@school.edu", role: Role.ACCOUNTANT, firstName: "Default", lastName: "Accountant", password: "Accountant@12345", staffId: "STAFF-ACCOUNTANT", title: "Accountant/Bursar", department: "Finance" });
  const teacherUser = await createStaffUser({ email: "teacher@school.edu", role: Role.TEACHER, firstName: "Hanna", lastName: "Tadesse", password: "Teacher@12345", staffId: "STAFF-TEACHER", title: "Teacher", department: "Academics" });
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: teacherUser.id } });

  // ---- registration period ----
  const year = new Date().getFullYear();
  const academicYear = `${year}/${year + 1}`;
  const periodName = `${academicYear} Admission Registration`;
  const start = new Date(); start.setDate(start.getDate() - 10);
  const end = new Date(); end.setDate(end.getDate() + 60);
  await prisma.registrationPeriod.upsert({
    where: { academicYear_name: { academicYear, name: periodName } },
    update: { startDate: start, endDate: end, isActive: true },
    create: { academicYear, name: periodName, startDate: start, endDate: end, isActive: true },
  });
  await prisma.registrationPeriod.updateMany({ where: { NOT: { academicYear, name: periodName } }, data: { isActive: false } });

  // ---- terms ----
  const term1 = await prisma.term.upsert({
    where: { name_type: { name: "Semester 1", type: "SEMESTER" } }, update: { isActive: true },
    create: { name: "Semester 1", type: "SEMESTER", startDate: start, endDate: end, isActive: true },
  });
  await prisma.term.upsert({
    where: { name_type: { name: "Semester 2", type: "SEMESTER" } }, update: {},
    create: { name: "Semester 2", type: "SEMESTER", startDate: end, endDate: new Date(end.getTime() + 120 * 86400000), isActive: false },
  });

  // ---- grading categories ----
  const cats: Record<string, { weight: number; order: number }> = {
    Assignments: { weight: 30, order: 1 }, Quizzes: { weight: 20, order: 2 },
    Midterm: { weight: 20, order: 3 }, Final: { weight: 30, order: 4 },
  };
  const catRows: Record<string, string> = {};
  for (const [name, c] of Object.entries(cats)) {
    const row = await prisma.gradingCategory.upsert({
      where: { name }, update: { weight: c.weight, sortOrder: c.order },
      create: { name, weight: c.weight, sortOrder: c.order },
    });
    catRows[name] = row.id;
  }

  // ---- courses + sections ----
  const courseDefs = [
    { code: "MATH", name: "Mathematics" }, { code: "ENG", name: "English" },
    { code: "PHY", name: "Physics" }, { code: "HIST", name: "History" },
  ];
  const sections: { id: string; code: string; catAssessments: { cat: string; asgId: string; max: number; weight: number }[] }[] = [];
  for (const cd of courseDefs) {
    const course = await prisma.course.upsert({ where: { code: cd.code }, update: { name: cd.name }, create: { code: cd.code, name: cd.name, credits: 1 } });
    const section = await prisma.section.upsert({
      where: { code: `${cd.code}-S1` }, update: {},
      create: { code: `${cd.code}-S1`, courseId: course.id, teacherId: teacher!.id, termId: term1.id, name: `${cd.name} — Section A`, room: "Room 204" },
    });
    const catAssessments: { cat: string; asgId: string; max: number; weight: number }[] = [];
    let i = 0;
    for (const catName of Object.keys(cats)) {
      const count = catName === "Midterm" || catName === "Final" ? 1 : 2;
      for (let n = 1; n <= count; n++) {
        const max = catName === "Assignments" || catName === "Quizzes" ? 20 : 100;
        const weight = 1;
        const asg = await prisma.assessment.upsert({
          where: { key: `asg-${section.code}-${catName}-${n}` }, update: {},
          create: { key: `asg-${section.code}-${catName}-${n}`, sectionId: section.id, categoryId: catRows[catName], name: `${catName} ${n}`, type: catName === "Midterm" ? "TEST" : catName === "Final" ? "EXAM" : catName === "Quizzes" ? "QUIZ" : "ASSIGNMENT", maxScore: max, weight, createdById: teacherUser.id },
        });
        catAssessments.push({ cat: catName, asgId: asg.id, max, weight });
        i++;
      }
    }
    sections.push({ id: section.id, code: section.code, catAssessments });
  }

  // ---- demo students ----
  const demoDefs = [
    { n: "0001", first: "Dawit", last: "Alemu", g: 9, dob: "2010-04-12", gender: "Male" },
    { n: "0002", first: "Meron", last: "Girma", g: 9, dob: "2010-08-21", gender: "Female" },
    { n: "0003", first: "Yonas", last: "Kebede", g: 10, dob: "2009-02-03", gender: "Male" },
    { n: "0004", first: "Sara", last: "Hailu", g: 10, dob: "2009-11-17", gender: "Female" },
    { n: "0005", first: "Abel", last: "Tesfaye", g: 11, dob: "2008-06-30", gender: "Male" },
    { n: "0006", first: "Liya", last: "Desta", g: 12, dob: "2007-09-09", gender: "Female" },
  ];
  const demoStudents: { id: string; admission: string; grade: number }[] = [];
  for (const d of demoDefs) {
    const s = await prisma.studentProfile.upsert({
      where: { admissionNumber: `DEMO-2026-${d.n}` },
      update: {},
      create: { admissionNumber: `DEMO-2026-${d.n}`, firstName: d.first, lastName: d.last, dateOfBirth: new Date(d.dob), gender: d.gender, gradeLevel: d.g, status: "ACTIVE", enrollmentDate: start, nationality: "Ethiopian", ethnicity: "Amhara", religion: "Orthodox", guardianName: `${d.last} Family`, guardianPhone: "0911000000", city: "Addis Ababa" },
    });
    demoStudents.push({ id: s.id, admission: s.admissionNumber, grade: d.g });
  }

  // existing active (non-demo) students also join the roster
  const existing = await prisma.studentProfile.findMany({ where: { status: "ACTIVE", NOT: { admissionNumber: { startsWith: "DEMO-" } } } });
  const allStudents = [...demoStudents, ...existing.map((e) => ({ id: e.id, admission: e.admissionNumber, grade: e.gradeLevel }))];

  // ---- enrol + grades + attendance ----
  const today = new Date();
  for (const stu of allStudents) {
    const mySections = sections.filter((_, idx) => idx < 2 || (idx === 2 && stu.grade >= 10));
    for (const sec of mySections) {
      await prisma.enrollment.upsert({
        where: { studentId_sectionId: { studentId: stu.id, sectionId: sec.id } },
        update: { status: "ACTIVE" },
        create: { studentId: stu.id, sectionId: sec.id, status: "ACTIVE" },
      });
      // grades
      const byCat: Record<string, { wsum: number; w: number }> = {};
      for (const ca of sec.catAssessments) {
        const seedNum = (stu.admission.charCodeAt(stu.admission.length - 1) || 1) * 31 + ca.asgId.charCodeAt(ca.asgId.length - 1) + ca.max;
        const pct = 0.55 + rng(seedNum) * 0.43;
        const score = Math.round(pct * ca.max * 100) / 100;
        await prisma.grade.upsert({
          where: { assessmentId_studentId: { assessmentId: ca.asgId, studentId: stu.id } },
          update: { score, status: "SUBMITTED" },
          create: { assessmentId: ca.asgId, studentId: stu.id, score, status: "SUBMITTED", createdById: teacherUser.id },
        });
        const norm = (score / ca.max) * 100;
        byCat[ca.cat] = byCat[ca.cat] || { wsum: 0, w: 0 };
        byCat[ca.cat].wsum += norm * ca.weight;
        byCat[ca.cat].w += ca.weight;
      }
      let num = 0, den = 0;
      for (const catName of Object.keys(cats)) {
        const b = byCat[catName];
        if (!b || b.w === 0) continue;
        const avg = b.wsum / b.w;
        num += avg * cats[catName].weight;
        den += cats[catName].weight;
      }
      const finalScore = den ? Math.round((num / den) * 100) / 100 : 0;
      const g = gradeOf(finalScore);
      await prisma.termGrade.upsert({
        where: { studentId_sectionId_termId: { studentId: stu.id, sectionId: sec.id, termId: term1.id } },
        update: { calculatedScore: finalScore, finalScore, letterGrade: g.letter, gradePoints: g.points, status: "SUBMITTED", submittedAt: today, submittedById: teacherUser.id, submittedByName: "Hanna Tadesse" },
        create: { studentId: stu.id, sectionId: sec.id, termId: term1.id, calculatedScore: finalScore, finalScore, letterGrade: g.letter, gradePoints: g.points, status: "SUBMITTED", submittedAt: today, submittedById: teacherUser.id, submittedByName: "Hanna Tadesse" },
      });
      // attendance for 5 recent weekdays
      for (let d = 0; d < 5; d++) {
        const date = new Date(today); date.setDate(date.getDate() - d); date.setHours(8, 0, 0, 0);
        const r = rng(stu.admission.length * 7 + d * 13 + sec.code.length);
        const status = r > 0.85 ? "ABSENT" : r > 0.78 ? "LATE" : "PRESENT";
        await prisma.attendanceRecord.upsert({
          where: { studentId_sectionId_date: { studentId: stu.id, sectionId: sec.id, date } },
          update: { status },
          create: { studentId: stu.id, sectionId: sec.id, date, status, recordedById: teacherUser.id },
        });
      }
    }
  }

  // ---- report cards for demo students ----
  for (const stu of demoStudents) {
    const tgs = await prisma.termGrade.findMany({ where: { studentId: stu.id, termId: term1.id } });
    const pts = tgs.filter((t) => t.gradePoints != null).map((t) => t.gradePoints as number);
    const gpa = pts.length ? Math.round((pts.reduce((a, b) => a + b, 0) / pts.length) * 100) / 100 : 0;
    await prisma.reportCard.upsert({
      where: { studentId_termId: { studentId: stu.id, termId: term1.id } },
      update: { overallGPA: gpa, status: "PUBLISHED", generatedAt: today, generatedById: teacherUser.id },
      create: { studentId: stu.id, termId: term1.id, overallGPA: gpa, status: "PUBLISHED", generatedAt: today, generatedById: teacherUser.id, comment: "A solid term of consistent effort." },
    });
  }

  // ---- discipline ----
  const incStudent = demoStudents[1].id;
  const incident = await prisma.disciplineIncident.upsert({
    where: { key: "demo-incident-1" }, update: {},
    create: { key: "demo-incident-1", studentId: incStudent, title: "Repeated lateness", description: "Arrived late to first period four times this month.", severity: "MEDIUM", occurredAt: today, reportedByName: "Selam Bekele" },
  });
  await prisma.disciplineAction.upsert({
    where: { key: "demo-action-1" }, update: {},
    create: { key: "demo-action-1", incidentId: incident.id, type: "WARNING", notes: "Verbal warning issued; parent notified.", decidedByName: "Selam Bekele" },
  });

  // ---- counselling ----
  const cStudent = demoStudents[2].id;
  await prisma.counselingNote.upsert({
    where: { key: "demo-note-1" }, update: {},
    create: { key: "demo-note-1", studentId: cStudent, category: "ACADEMIC", riskLevel: "LOW", title: "Study-skills check-in", note: "Discussed a weekly revision timetable; student responded well.", counselorName: "Selam Bekele" },
  });
  await prisma.counselingNote.upsert({
    where: { key: "demo-note-2" }, update: {},
    create: { key: "demo-note-2", studentId: cStudent, category: "FAMILY", riskLevel: "NONE", title: "Transition support", note: "New to the school this term; settling in nicely.", counselorName: "Selam Bekele" },
  });
  const apptDate = new Date(today.getTime() + 3 * 86400000);
  await prisma.appointment.upsert({
    where: { key: "demo-appt-1" }, update: {},
    create: { key: "demo-appt-1", studentId: cStudent, title: "Follow-up: revision plan", scheduledAt: apptDate, location: "Counselling Office", status: "SCHEDULED", counselorName: "Selam Bekele" },
  });
  await prisma.intervention.upsert({
    where: { key: "demo-int-1" }, update: {},
    create: { key: "demo-int-1", studentId: cStudent, title: "Peer study group", description: "Placed in a Grade 10 mathematics study circle.", status: "ACTIVE", startDate: today, counselorName: "Selam Bekele" },
  });

  // ---- finance ----
  const feeDefs = [
    { name: "Tuition Fee", amount: 4500, description: "Per-semester tuition" },
    { name: "Science Lab Fee", amount: 600, description: "Laboratory access" },
    { name: "Library Fee", amount: 250, description: "Annual library membership" },
    { name: "Examination Fee", amount: 400, description: "End-of-term examinations" },
  ];
  for (const f of feeDefs) {
    await prisma.feeType.upsert({ where: { name: f.name }, update: { amount: f.amount, description: f.description }, create: { name: f.name, amount: f.amount, description: f.description } });
  }
  for (let si = 0; si < allStudents.length; si++) {
    const stu = allStudents[si];
    const number = `INV-2026-${stu.admission.replace(/[^0-9A-Za-z]/g, "")}`;
    const existingInv = await prisma.invoice.findUnique({ where: { number } });
    if (!existingInv) {
      const items = [
        { description: "Tuition Fee — Semester 1", quantity: 1, unitPrice: 4500 },
        { description: "Science Lab Fee", quantity: 1, unitPrice: 600 },
        { description: "Library Fee", quantity: 1, unitPrice: 250 },
      ];
      const subtotal = items.reduce((a, it) => a + it.quantity * it.unitPrice, 0);
      const inv = await prisma.invoice.create({
        data: { number, studentId: stu.id, status: "ISSUED", issueDate: start, dueDate: end, subtotal, total: subtotal, createdByName: "Bursar's Office",
          items: { create: items.map((it) => ({ ...it, total: it.quantity * it.unitPrice })) } },
      });
      // some students have paid (deterministic)
      const mod = si % 3;
      if (mod === 0) {
        await prisma.payment.create({ data: { invoiceId: inv.id, amount: subtotal, method: "BANK_TRANSFER", reference: `TXN-${si}-FULL`, receivedByName: "Bursar's Office" } });
        await prisma.invoice.update({ where: { id: inv.id }, data: { amountPaid: subtotal, status: "PAID" } });
      } else if (mod === 1) {
        const part = 2000;
        await prisma.payment.create({ data: { invoiceId: inv.id, amount: part, method: "CASH", reference: `TXN-${si}-PART`, receivedByName: "Bursar's Office" } });
        await prisma.invoice.update({ where: { id: inv.id }, data: { amountPaid: part, status: "PARTIALLY_PAID" } });
      }
    }
  }

  // ---- settings ----
  await prisma.setting.upsert({ where: { key: "gradingScale" }, update: {}, create: { key: "gradingScale", value: SCALE } });
  await prisma.setting.upsert({ where: { key: "schoolInfo" }, update: {}, create: { key: "schoolInfo", value: { name: "Demonstration High School", motto: "Discipline · Knowledge · Character", currency: "ETB", academicYear } } });

  console.log("Seed completed.");
  console.log("Logins: principal@ / registrar@ / counselor@ / accountant@ / teacher@  (Role@12345)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());