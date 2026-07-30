export interface NavItem { href: string; label: string; }
export interface RoleMeta {
  key: string;
  title: string;
  shortTitle: string;
  kicker: string;
  tagline: string;
  purpose: string;
  accent: string;
  nav: NavItem[];
  roadmap: string[];
  dashboard: "command" | "admissions" | "support" | "finance" | "academics" | "student";
}

const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL: "Principal",
  ADMIN: "Administrator",
  REGISTRAR: "Registrar",
  COUNSELOR: "Counselor",
  ACCOUNTANT: "Bursar",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export function getRoleLabel(role: string) {
  return ROLE_LABELS[role] || role;
}

const META: Record<string, RoleMeta> = {
  PRINCIPAL: {
    key: "PRINCIPAL",
    title: "Office of the Principal",
    shortTitle: "Principal",
    kicker: "Executive Overview",
    tagline: "Full authority over staff, students, admissions and policy.",
    purpose:
      "You hold the keys to the whole school — approve admissions, oversee every record, and keep the institution's single source of truth.",
    accent: "#8a5a2b",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/registrations", label: "Registrations" },
      { href: "/students", label: "Students" },
    ],
    roadmap: ["User management", "Billing & fees", "Reports & transcripts", "Audit log", "Settings"],
    dashboard: "command",
  },
  ADMIN: {
    key: "ADMIN",
    title: "System Administration",
    shortTitle: "Administrator",
    kicker: "Platform Control",
    tagline: "Configure users, roles and the system itself.",
    purpose:
      "You maintain the platform — provision accounts, assign roles, and keep the gates of the system secure.",
    accent: "#6b4a2e",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/registrations", label: "Registrations" },
      { href: "/students", label: "Students" },
    ],
    roadmap: ["Role permissions", "Billing & fees", "Reports", "Audit log", "System settings"],
    dashboard: "command",
  },
  REGISTRAR: {
    key: "REGISTRAR",
    title: "Office of the Registrar",
    shortTitle: "Registrar",
    kicker: "Admissions & Records",
    tagline: "Own the student lifecycle, from application to transcript.",
    purpose:
      "Every student enters and moves through the school across your desk: register, verify, enrol, promote and archive.",
    accent: "#a86a32",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/registrations", label: "Registrations" },
      { href: "/students", label: "Students" },
    ],
    roadmap: ["Document verification queue", "Enrolment & sections", "Transcripts", "Attendance"],
    dashboard: "admissions",
  },
  COUNSELOR: {
    key: "COUNSELOR",
    title: "Student Support & Counselling",
    shortTitle: "Counselor",
    kicker: "Wellbeing & Guidance",
    tagline: "Know every student, support each one.",
    purpose:
      "You carry the human side of the school — welcome new faces, read the full picture of any learner, and hold space for their wellbeing.",
    accent: "#6f7a45",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/students", label: "Students" },
      { href: "/registrations", label: "Registrations" },
    ],
    roadmap: ["Counselling notes", "Appointments", "Interventions", "Attendance"],
    dashboard: "support",
  },
  ACCOUNTANT: {
    key: "ACCOUNTANT",
    title: "The Bursar's Office",
    shortTitle: "Bursar",
    kicker: "Fees & Accounts",
    tagline: "Every account, every figure, reconciled.",
    purpose:
      "You steward the school's finances — raise invoices, record payments, and keep each student's account true.",
    accent: "#7d6a3a",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/students", label: "Students" },
    ],
    roadmap: ["Invoices", "Payments & receipts", "Fee structures", "Financial reports"],
    dashboard: "finance",
  },
  TEACHER: {
    key: "TEACHER",
    title: "Faculty & Academics",
    shortTitle: "Teacher",
    kicker: "Teaching & Assessment",
    tagline: "Your classes, your marks, your students' growth.",
    purpose:
      "You shape the academic record — take your sections, enter marks, and watch each learner progress term by term.",
    accent: "#9c5638",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/students", label: "Students" },
    ],
    roadmap: ["My sections", "Gradebook", "Attendance", "Class reports"],
    dashboard: "academics",
  },
  STUDENT: {
    key: "STUDENT",
    title: "Student Portal",
    shortTitle: "Student",
    kicker: "Coming Soon",
    tagline: "Your grades and records in one place.",
    purpose: "The student portal opens in a later release.",
    accent: "#5b3a22",
    nav: [{ href: "/dashboard", label: "Dashboard" }],
    roadmap: ["My grades", "Report cards", "Attendance", "My bills"],
    dashboard: "student",
  },
};

export function getRoleMeta(role: string): RoleMeta {
  return META[role] || META.STUDENT;
}