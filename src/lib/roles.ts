export interface NavItem { href: string; label: string; }
export interface RoleMeta {
  key: string; title: string; shortTitle: string; kicker: string; tagline: string;
  purpose: string; accent: string; nav: NavItem[]; roadmap: string[];
  dashboard: "command" | "admissions" | "support" | "finance" | "academics" | "student";
}

const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL: "Principal", ADMIN: "Administrator", REGISTRAR: "Registrar",
  COUNSELOR: "Counselor", ACCOUNTANT: "Bursar", TEACHER: "Teacher", STUDENT: "Student",
};
export const getRoleLabel = (role: string) => ROLE_LABELS[role] || role;

const META: Record<string, RoleMeta> = {
  PRINCIPAL: {
    key: "PRINCIPAL", title: "Office of the Principal", shortTitle: "Principal", kicker: "Executive Overview",
    tagline: "Full authority over staff, students, admissions and policy.",
    purpose: "You hold the keys to the whole school — oversee admissions, academics, wellbeing and the bursary from a single vantage point.",
    accent: "#8a5a2b",
    nav: [
      { href: "/dashboard", label: "Dashboard" }, { href: "/registrations", label: "Registrations" },
      { href: "/students", label: "Students" }, { href: "/academics", label: "Academics" },
      { href: "/finance", label: "Finance" }, { href: "/attendance", label: "Attendance" },
      { href: "/discipline", label: "Discipline" }, { href: "/counseling", label: "Counselling" },
    ],
    roadmap: ["Reports & transcripts", "User management", "System settings", "Audit log viewer"],
    dashboard: "command",
  },
  ADMIN: {
    key: "ADMIN", title: "System Administration", shortTitle: "Administrator", kicker: "Platform Control",
    tagline: "Configure users, roles and the system itself.",
    purpose: "You maintain the platform — provision accounts, assign roles, and keep the gates of the system secure.",
    accent: "#6b4a2e",
    nav: [
      { href: "/dashboard", label: "Dashboard" }, { href: "/registrations", label: "Registrations" },
      { href: "/students", label: "Students" }, { href: "/academics", label: "Academics" },
      { href: "/finance", label: "Finance" }, { href: "/attendance", label: "Attendance" },
      { href: "/discipline", label: "Discipline" }, { href: "/counseling", label: "Counselling" },
    ],
    roadmap: ["Role permissions", "System settings", "Audit log viewer", "Data import"],
    dashboard: "command",
  },
  REGISTRAR: {
    key: "REGISTRAR", title: "Office of the Registrar", shortTitle: "Registrar", kicker: "Admissions & Records",
    tagline: "Own the student lifecycle, from application to transcript.",
    purpose: "Every student enters and moves through the school across your desk: register, verify, enrol, promote and archive.",
    accent: "#a86a32",
    nav: [
      { href: "/dashboard", label: "Dashboard" }, { href: "/registrations", label: "Registrations" },
      { href: "/students", label: "Students" }, { href: "/academics", label: "Academics" },
      { href: "/attendance", label: "Attendance" },
    ],
    roadmap: ["Transcripts", "Document verification queue", "Bulk enrolment"],
    dashboard: "admissions",
  },
  COUNSELOR: {
    key: "COUNSELOR", title: "Student Support & Counselling", shortTitle: "Counselor", kicker: "Wellbeing & Guidance",
    tagline: "Know every student, support each one.",
    purpose: "You carry the human side of the school — welcome new faces, hold confidential notes, and track every intervention.",
    accent: "#6f7a45",
    nav: [
      { href: "/dashboard", label: "Dashboard" }, { href: "/students", label: "Students" },
      { href: "/registrations", label: "Registrations" }, { href: "/counseling", label: "Counselling" },
      { href: "/attendance", label: "Attendance" },
    ],
    roadmap: ["Referrals", "Wellbeing flags", "Parent outreach"],
    dashboard: "support",
  },
  ACCOUNTANT: {
    key: "ACCOUNTANT", title: "The Bursar's Office", shortTitle: "Bursar", kicker: "Fees & Accounts",
    tagline: "Every account, every figure, reconciled.",
    purpose: "You steward the school's finances — raise invoices, record payments, and keep each student's account true.",
    accent: "#7d6a3a",
    nav: [
      { href: "/dashboard", label: "Dashboard" }, { href: "/finance", label: "Finance" },
      { href: "/students", label: "Students" },
    ],
    roadmap: ["Receipts (PDF)", "Bulk invoicing", "Refunds", "Account statements"],
    dashboard: "finance",
  },
  TEACHER: {
    key: "TEACHER", title: "Faculty & Academics", shortTitle: "Teacher", kicker: "Teaching & Assessment",
    tagline: "Your classes, your marks, your students' growth.",
    purpose: "You shape the academic record — take your sections, enter marks, mark the roll, and watch each learner progress.",
    accent: "#9c5638",
    nav: [
      { href: "/dashboard", label: "Dashboard" }, { href: "/academics", label: "Academics" },
      { href: "/attendance", label: "Attendance" }, { href: "/students", label: "Students" },
    ],
    roadmap: ["Class reports", "Comment bank", "Seating & groups"],
    dashboard: "academics",
  },
  STUDENT: {
    key: "STUDENT", title: "Student Portal", shortTitle: "Student", kicker: "Coming Soon",
    tagline: "Your grades and records in one place.",
    purpose: "The student portal opens in a later release.",
    accent: "#5b3a22",
    nav: [{ href: "/dashboard", label: "Dashboard" }],
    roadmap: ["My grades", "Report cards", "Attendance", "My bills"],
    dashboard: "student",
  },
};

export const getRoleMeta = (role: string): RoleMeta => META[role] || META.STUDENT;