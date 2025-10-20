import { z } from 'zod';

// Transaction type enums
export const transactionTypeEnum = z.enum(['debit', 'credit']);
export const transactionStatusEnum = z.enum(['pending', 'completed', 'failed']);

// Base transaction schema
export const transactionCreateSchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999999.99, 'Amount exceeds maximum value'),
  currency: z.string()
    .length(3, 'Currency must be 3 characters (e.g., EUR, USD)')
    .toUpperCase(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
  category: z.string()
    .max(50, 'Category must not exceed 50 characters')
    .trim()
    .optional(),
  transaction_type: transactionTypeEnum,
  status: transactionStatusEnum.default('completed'),
  transaction_date: z.string()
    .datetime('Invalid datetime format')
    .optional()
    .default(() => new Date().toISOString()),
  metadata: z.record(z.any()).optional()
});

// Transaction update schema (all fields optional)
export const transactionUpdateSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999999.99, 'Amount exceeds maximum value')
    .optional(),
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .toUpperCase()
    .optional(),
  description: z.string()
    .min(1, 'Description cannot be empty')
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  category: z.string()
    .max(50, 'Category must not exceed 50 characters')
    .trim()
    .optional()
    .nullable(),
  transaction_type: transactionTypeEnum.optional(),
  status: transactionStatusEnum.optional(),
  transaction_date: z.string()
    .datetime('Invalid datetime format')
    .optional(),
  metadata: z.record(z.any()).optional().nullable()
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

// Query parameters schema for listing transactions
export const transactionListQuerySchema = z.object({
  // Filtering
  account_id: z.string().uuid().optional(),
  category: z.string().max(50).optional(),
  transaction_type: transactionTypeEnum.optional(),
  status: transactionStatusEnum.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  min_amount: z.coerce.number().positive().optional(),
  max_amount: z.coerce.number().positive().optional(),

  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(20),

  // Sorting
  sort_by: z.enum(['transaction_date', 'amount', 'created_at']).default('transaction_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  'start_date must be before or equal to end_date'
).refine(
  (data) => {
    if (data.min_amount !== undefined && data.max_amount !== undefined) {
      return data.min_amount <= data.max_amount;
    }
    return true;
  },
  'min_amount must be less than or equal to max_amount'
);

// Transaction ID parameter schema
export const transactionIdSchema = z.object({
  id: z.string().uuid('Invalid transaction ID')
});

// Bulk transaction creation schema
export const bulkTransactionCreateSchema = z.object({
  transactions: z.array(transactionCreateSchema)
    .min(1, 'At least one transaction is required')
    .max(100, 'Maximum 100 transactions per batch')
});

// Transaction statistics query schema
export const transactionStatsQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  group_by: z.enum(['category', 'month', 'week', 'day']).default('category')
});

// Category validation
export const categorySchema = z.string()
  .min(1, 'Category name is required')
  .max(50, 'Category name too long')
  .regex(/^[a-zA-Z0-9\s_-]+$/, 'Category can only contain letters, numbers, spaces, hyphens and underscores')
  .trim();
