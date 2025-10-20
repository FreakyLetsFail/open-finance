import { z } from 'zod'

export const contributionSchema = z.object({
  member_id: z.string().uuid('Ungültige Mitglieds-ID'),
  amount: z.number().positive('Betrag muss positiv sein'),
  currency: z.string().length(3, 'Währungscode muss 3 Zeichen lang sein').default('EUR'),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'semi_annual', 'annual']),
  start_date: z.string().datetime('Ungültiges Startdatum'),
  end_date: z.string().datetime('Ungültiges Enddatum').optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'direct_debit', 'card', 'other']).default('direct_debit'),
  is_active: z.boolean().default(true),
  notes: z.string().optional()
})

export const updateContributionSchema = contributionSchema.partial()

export const contributionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  member_id: z.string().uuid().optional(),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'semi_annual', 'annual']).optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional()
})

export type ContributionInput = z.infer<typeof contributionSchema>
export type UpdateContributionInput = z.infer<typeof updateContributionSchema>
export type ContributionQuery = z.infer<typeof contributionQuerySchema>
