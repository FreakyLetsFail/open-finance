import { z } from 'zod'

// User schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters')
})

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const userUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().datetime().optional()
})

// Account schemas
export const accountCreationSchema = z.object({
  accountType: z.enum(['checking', 'savings', 'investment', 'credit']),
  accountName: z.string().min(2, 'Account name must be at least 2 characters'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  initialBalance: z.number().default(0)
})

// Transaction schemas
export const transactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  currency: z.string().length(3),
  description: z.string().min(1).max(500),
  category: z.string().optional(),
  transactionDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
})

// Budget schemas
export const budgetSchema = z.object({
  name: z.string().min(2, 'Budget name must be at least 2 characters'),
  category: z.string(),
  amount: z.number().positive(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional()
})

// Goal schemas
export const goalSchema = z.object({
  name: z.string().min(2, 'Goal name must be at least 2 characters'),
  targetAmount: z.number().positive(),
  currentAmount: z.number().default(0),
  deadline: z.string().datetime().optional(),
  description: z.string().optional()
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
})
