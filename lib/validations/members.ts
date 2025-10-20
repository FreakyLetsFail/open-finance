import { z } from 'zod'

export const memberSchema = z.object({
  first_name: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  last_name: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  date_of_birth: z.string().datetime('Ungültiges Geburtsdatum'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  street: z.string().min(1, 'Straße ist erforderlich'),
  postal_code: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  country: z.string().length(2, 'Ländercode muss 2 Zeichen haben').default('DE'),
  iban: z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, 'Ungültige IBAN').optional(),
  bic: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Ungültige BIC').optional(),
  sepa_mandate_signed: z.boolean().default(false),
  sepa_mandate_date: z.string().datetime().optional(),
  data_processing_consent: z.boolean(),
  newsletter_consent: z.boolean().default(false),
  photo_consent: z.boolean().default(false)
})

export const updateMemberSchema = memberSchema.partial()

export const memberQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  search: z.string().optional()
})

export type MemberInput = z.infer<typeof memberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type MemberQuery = z.infer<typeof memberQuerySchema>
