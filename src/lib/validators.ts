import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registrationPeriodSchema = z.object({
  academicYear: z.string().min(3),
  name: z.string().min(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional(),
  allowPrincipal: z.boolean().optional(),
  allowRegistrar: z.boolean().optional(),
  allowCounselor: z.boolean().optional(),
  allowAdmin: z.boolean().optional(),
});

export const registrationSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional().or(z.literal("")),
  lastName: z.string().min(1),

  dateOfBirth: z.coerce.date(),
  gender: z.string().min(1),

  nationality: z.string().optional().or(z.literal("")),
  ethnicity: z.string().optional().or(z.literal("")),
  religion: z.string().optional().or(z.literal("")),

  applyingGradeLevel: z.coerce.number().int().min(9).max(12),

  previousSchoolName: z.string().optional().or(z.literal("")),
  previousSchoolGrade: z.string().optional().or(z.literal("")),
  previousAcademicYear: z.string().optional().or(z.literal("")),
  transferReason: z.string().optional().or(z.literal("")),

  guardianName: z.string().min(1),
  guardianRelationship: z.string().optional().or(z.literal("")),
  guardianPhone: z.string().min(1),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianAddress: z.string().optional().or(z.literal("")),

  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),

  medicalNotes: z.string().optional().or(z.literal("")),
});