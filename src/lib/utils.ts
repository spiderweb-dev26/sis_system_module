export function calculateAge(dateOfBirth: Date, on: Date = new Date()) {
  const dob = new Date(dateOfBirth);

  let age = on.getFullYear() - dob.getFullYear();

  const monthDiff = on.getMonth() - dob.getMonth();
  const dayDiff = on.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

export function getCurrentAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
}