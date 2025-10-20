import { NextRequest } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/api/supabase-client';
import { bulkTransactionCreateSchema } from '@/lib/validations/transaction-schemas';
import { checkAccountAccess } from '@/lib/permissions/transaction-permissions';
import {
  errorHandler,
  successResponse,
  forbiddenError,
  unauthorizedError,
  ApiError,
  ErrorCodes
} from '@/lib/api/error-handler';
import type { Transaction } from '@/types/transaction';

/**
 * POST /api/transactions/bulk
 * Create multiple transactions in a single request
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkTransactionCreateSchema.parse(body);

    // Check access to all accounts
    const accountIds = new Set(validatedData.transactions.map(t => t.account_id));

    for (const accountId of accountIds) {
      const accessCheck = await checkAccountAccess(user.id, accountId);
      if (!accessCheck.allowed) {
        return forbiddenError(`Access denied to account: ${accountId}`);
      }
    }

    const supabase = createServerClient();

    // Prepare transactions
    const transactionsToInsert = validatedData.transactions.map(transaction => ({
      ...transaction,
      amount: Math.abs(transaction.amount), // Ensure positive amount
      transaction_type: transaction.transaction_type || (transaction.amount < 0 ? 'debit' : 'credit')
    }));

    // Insert all transactions
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (error) {
      throw new ApiError(500, ErrorCodes.DATABASE_ERROR, 'Failed to create transactions', error);
    }

    return successResponse({
      created: data.length,
      transactions: data as Transaction[]
    }, 201);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedError();
    }
    return errorHandler(error);
  }
}
