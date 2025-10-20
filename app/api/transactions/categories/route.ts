import { NextRequest } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/api/supabase-client';
import { getUserAccountIds } from '@/lib/permissions/transaction-permissions';
import {
  errorHandler,
  successResponse,
  unauthorizedError,
  ApiError,
  ErrorCodes
} from '@/lib/api/error-handler';

/**
 * GET /api/transactions/categories
 * Get all unique transaction categories for the user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Get user's account IDs
    const accountIds = await getUserAccountIds(user.id);

    if (accountIds.length === 0) {
      return successResponse([]);
    }

    const supabase = createServerClient();

    // Fetch distinct categories
    const { data, error } = await supabase
      .from('transactions')
      .select('category')
      .in('account_id', accountIds)
      .not('category', 'is', null);

    if (error) {
      throw new ApiError(500, ErrorCodes.DATABASE_ERROR, 'Failed to fetch categories', error);
    }

    // Get unique categories
    const uniqueCategories = Array.from(
      new Set(data.map(t => t.category).filter(Boolean))
    ).sort();

    return successResponse(uniqueCategories);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedError();
    }
    return errorHandler(error);
  }
}
