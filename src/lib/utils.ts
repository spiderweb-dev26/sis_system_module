export function calculateAge(dateOfBirth: Date, on: Date = new Date()) {
  const dob = new Date(dateOfBirth);
  let age = on.getFullYear() - dob.getFullYear();
  const m = on.getMonth() - dob.getMonth();
  const d = on.getDate() - dob.getDate();
  if (m < 0 || (m === 0 && d < 0)) age--;
  return age;
}

export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function getCurrentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
}

export function money(n: number, currency = "ETB") {
  const v = Number.isFinite(n) ? n : 0;
  return `${currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const DEFAULT_SCALE = [
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

export function gradeFromScore(score: number, scale = DEFAULT_SCALE) {
  return scale.find((g) => score >= g.min) || scale[scale.length - 1];
}