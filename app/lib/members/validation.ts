/**
 * Validation Schemas for Member Management
 * Using Zod for runtime type validation and DSGVO compliance
 */

import { z } from 'zod';

// Regular expressions for validation
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;
const POSTAL_CODE_REGEX = /^\d{5}$/; // German postal code
const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
const BIC_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enum schemas
export const memberStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending',
  'cancelled'
]);

export const membershipTypeSchema = z.enum([
  'regular',
  'premium',
  'student',
  'senior',
  'family',
  'honorary'
]);

export const genderSchema = z.enum([
  'male',
  'female',
  'diverse',
  'not_specified'
]);

export const paymentMethodSchema = z.enum([
  'sepa',
  'bank_transfer',
  'cash',
  'credit_card',
  'other'
]);

export const legalBasisSchema = z.enum([
  'consent',
  'contract',
  'legal_obligation',
  'vital_interest',
  'public_task',
  'legitimate_interest'
]);

export const consentTypeSchema = z.enum([
  'data_processing',
  'marketing',
  'newsletter',
  'photo_publication',
  'third_party_sharing',
  'profiling'
]);

export const documentTypeSchema = z.enum([
  'contract',
  'consent_form',
  'invoice',
  'receipt',
  'correspondence',
  'dsgvo_export',
  'other'
]);

export const exportTypeSchema = z.enum([
  'full',
  'personal_data',
  'financial',
  'documents'
]);

export const exportFormatSchema = z.enum([
  'json',
  'csv',
  'pdf',
  'xml'
]);

// Custom validators
const validateAge = (dateString: string) => {
  const birthDate = new Date(dateString);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  return age >= 0 && age <= 150;
};

const validateIBAN = (iban: string) => {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  return IBAN_REGEX.test(cleanIban);
};

const sanitizeString = (str: string) => {
  // Remove potentially dangerous characters for XSS prevention
  return str.trim().replace(/[<>]/g, '');
};

// Create Member Schema
export const createMemberSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .transform(sanitizeString),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .transform(sanitizeString),

  email: z.string()
    .email('Invalid email format')
    .regex(EMAIL_REGEX, 'Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .transform((email) => email.toLowerCase().trim()),

  dateOfBirth: z.string()
    .datetime({ message: 'Invalid date format' })
    .refine(validateAge, 'Invalid age')
    .optional(),

  gender: genderSchema.optional(),

  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid phone number format')
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .transform((val) => val ? sanitizeString(val) : val),

  mobile: z.string()
    .regex(PHONE_REGEX, 'Invalid mobile number format')
    .max(50, 'Mobile number must be less than 50 characters')
    .optional()
    .transform((val) => val ? sanitizeString(val) : val),

  street: z.string()
    .max(255, 'Street must be less than 255 characters')
    .optional()
    .transform((val) => val ? sanitizeString(val) : val),

  houseNumber: z.string()
    .max(20, 'House number must be less than 20 characters')
    .optional()
    .transform((val) => val ? sanitizeString(val) : val),

  postalCode: z.string()
    .regex(POSTAL_CODE_REGEX, 'Invalid German postal code (must be 5 digits)')
    .optional(),

  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .transform((val) => val ? sanitizeString(val) : val),

  country: z.string()
    .max(100, 'Country must be less than 100 characters')
    .default('Deutschland')
    .transform(sanitizeString),

  membershipType: membershipTypeSchema,

  status: memberStatusSchema.default('active'),

  entryDate: z.string()
    .datetime({ message: 'Invalid date format' })
    .default(() => new Date().toISOString()),

  monthlyFee: z.number()
    .min(0, 'Monthly fee must be positive')
    .max(10000, 'Monthly fee must be less than 10000')
    .optional(),

  paymentMethod: paymentMethodSchema.optional(),

  iban: z.string()
    .refine(validateIBAN, 'Invalid IBAN format')
    .optional()
    .transform((val) => val ? val.replace(/\s/g, '').toUpperCase() : val),

  bic: z.string()
    .regex(BIC_REGEX, 'Invalid BIC format')
    .optional()
    .transform((val) => val ? val.toUpperCase() : val),

  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional()
    .transform((val) => val ? sanitizeString(val) : val),

  tags: z.array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
});

// Update Member Schema (all fields optional except id)
export const updateMemberSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
  firstName: z.string().min(1).max(100).transform(sanitizeString).optional(),
  lastName: z.string().min(1).max(100).transform(sanitizeString).optional(),
  email: z.string().email().max(255).transform((email) => email.toLowerCase().trim()).optional(),
  dateOfBirth: z.string().datetime().refine(validateAge, 'Invalid age').optional(),
  gender: genderSchema.optional(),
  phone: z.string().regex(PHONE_REGEX).max(50).transform(sanitizeString).optional(),
  mobile: z.string().regex(PHONE_REGEX).max(50).transform(sanitizeString).optional(),
  street: z.string().max(255).transform(sanitizeString).optional(),
  houseNumber: z.string().max(20).transform(sanitizeString).optional(),
  postalCode: z.string().regex(POSTAL_CODE_REGEX).optional(),
  city: z.string().max(100).transform(sanitizeString).optional(),
  country: z.string().max(100).transform(sanitizeString).optional(),
  membershipType: membershipTypeSchema.optional(),
  status: memberStatusSchema.optional(),
  entryDate: z.string().datetime().optional(),
  exitDate: z.string().datetime().optional(),
  monthlyFee: z.number().min(0).max(10000).optional(),
  paymentMethod: paymentMethodSchema.optional(),
  iban: z.string().refine(validateIBAN, 'Invalid IBAN').transform((val) => val.replace(/\s/g, '').toUpperCase()).optional(),
  bic: z.string().regex(BIC_REGEX).transform((val) => val.toUpperCase()).optional(),
  notes: z.string().max(5000).transform(sanitizeString).optional(),
  tags: z.array(z.string().max(50)).max(20).optional()
});

// Create Consent Schema
export const createConsentSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  consentType: consentTypeSchema,
  consentPurpose: z.string().min(10, 'Consent purpose must be descriptive').max(1000),
  granted: z.boolean(),
  legalBasis: legalBasisSchema,
  consentText: z.string().min(20, 'Consent text must be detailed').max(5000),
  consentVersion: z.string().max(20),
  ipAddress: z.string().ip({ version: 'v4' }).optional(),
  userAgent: z.string().max(500).optional()
});

// Update Consent Schema
export const updateConsentSchema = z.object({
  id: z.string().uuid('Invalid consent ID'),
  granted: z.boolean().optional(),
  revokedAt: z.string().datetime().optional()
});

// Search Members Schema
export const searchMembersSchema = z.object({
  query: z.string().max(200).optional(),
  status: memberStatusSchema.optional(),
  membershipType: membershipTypeSchema.optional(),
  tags: z.array(z.string().max(50)).optional(),
  entryDateFrom: z.string().datetime().optional(),
  entryDateTo: z.string().datetime().optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().regex(POSTAL_CODE_REGEX).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum([
    'memberNumber',
    'firstName',
    'lastName',
    'email',
    'entryDate',
    'createdAt',
    'status'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Request Export Schema
export const requestExportSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  exportType: exportTypeSchema.default('full'),
  exportFormat: exportFormatSchema.default('json')
});

// Upload Document Schema
export const uploadDocumentSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  documentType: documentTypeSchema,
  documentName: z.string().min(1).max(255).transform(sanitizeString),
  category: z.string().max(100).transform(sanitizeString).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  containsPersonalData: z.boolean().default(true),
  retentionPeriodDays: z.number().int().min(1).max(36500).optional() // Max ~100 years
});

// Bulk Operations Schema
export const bulkUpdateSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    status: memberStatusSchema.optional(),
    tags: z.array(z.string().max(50)).optional(),
    membershipType: membershipTypeSchema.optional()
  })
});

// Export validation results type
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateConsentInput = z.infer<typeof createConsentSchema>;
export type SearchMembersInput = z.infer<typeof searchMembersSchema>;
export type RequestExportInput = z.infer<typeof requestExportSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
