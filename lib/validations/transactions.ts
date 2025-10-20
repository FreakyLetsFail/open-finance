import { z } from 'zod'

export const transactionSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein'),
  currency: z.string().length(3, 'Währungscode muss 3 Zeichen lang sein').default('EUR'),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  transaction_date: z.string().datetime('Ungültiges Datum'),
  value_date: z.string().datetime('Ungültiges Datum').optional(),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  category_id: z.string().uuid('Ungültige Kategorie-ID'),
  member_id: z.string().uuid('Ungültige Mitglieds-ID').optional(),
  contribution_id: z.string().uuid('Ungültige Beitrags-ID').optional(),
  receipt_number: z.string().optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'direct_debit', 'card', 'other']).optional(),
  notes: z.string().optional()
})

export const updateTransactionSchema = transactionSchema.partial()

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  transaction_type: z.enum(['income', 'expense', 'transfer']).optional(),
  category_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'reconciled']).optional(),
  search: z.string().optional()
})

export type TransactionInput = z.infer<typeof transactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
