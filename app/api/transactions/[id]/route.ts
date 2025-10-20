import { NextRequest } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/api/supabase-client';
import {
  transactionUpdateSchema,
  transactionIdSchema
} from '@/lib/validations/transaction-schemas';
import {
  checkTransactionAccess,
  canModifyTransaction
} from '@/lib/permissions/transaction-permissions';
import {
  errorHandler,
  successResponse,
  notFoundError,
  forbiddenError,
  unauthorizedError,
  ApiError,
  ErrorCodes
} from '@/lib/api/error-handler';
import type { Transaction } from '@/types/transaction';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/transactions/[id]
 * Get a single transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Validate ID parameter
    const { id } = transactionIdSchema.parse(params);

    // Check transaction access
    const accessCheck = await checkTransactionAccess(user.id, id);
    if (!accessCheck.allowed) {
      return forbiddenError(accessCheck.reason);
    }

    const supabase = createServerClient();

    // Fetch transaction
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts (
          id,
          account_name,
          account_type,
          currency
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return notFoundError('Transaction');
    }

    return successResponse(data as Transaction);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedError();
    }
    return errorHandler(error);
  }
}

/**
 * PATCH /api/transactions/[id]
 * Update a transaction
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Validate ID parameter
    const { id } = transactionIdSchema.parse(params);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = transactionUpdateSchema.parse(body);

    // Check if user can modify this transaction
    const modifyCheck = await canModifyTransaction(user.id, id);
    if (!modifyCheck.allowed) {
      return forbiddenError(modifyCheck.reason);
    }

    const supabase = createServerClient();

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(validatedData)
      .eq('id', id)
      .select(`
        *,
        accounts (
          id,
          account_name,
          account_type
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('Transaction');
      }
      throw new ApiError(500, ErrorCodes.DATABASE_ERROR, 'Failed to update transaction', error);
    }

    return successResponse(data as Transaction);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedError();
    }
    return errorHandler(error);
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Validate ID parameter
    const { id } = transactionIdSchema.parse(params);

    // Check if user can modify this transaction
    const modifyCheck = await canModifyTransaction(user.id, id);
    if (!modifyCheck.allowed) {
      return forbiddenError(modifyCheck.reason);
    }

    const supabase = createServerClient();

    // Delete transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('Transaction');
      }
      throw new ApiError(500, ErrorCodes.DATABASE_ERROR, 'Failed to delete transaction', error);
    }

    return successResponse({ message: 'Transaction deleted successfully' });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedError();
    }
    return errorHandler(error);
  }
}
