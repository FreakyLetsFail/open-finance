import { NextRequest } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/api/supabase-client';
import { transactionStatsQuerySchema } from '@/lib/validations/transaction-schemas';
import { getUserAccountIds } from '@/lib/permissions/transaction-permissions';
import {
  errorHandler,
  successResponse,
  unauthorizedError,
  ApiError,
  ErrorCodes
} from '@/lib/api/error-handler';
import type { TransactionStats } from '@/types/transaction';

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedQuery = transactionStatsQuerySchema.parse(searchParams);

    const supabase = createServerClient();

    // Build base query
    let query = supabase
      .from('transactions')
      .select('amount, transaction_type, category, created_at');

    // Filter by account if specified, otherwise filter by user's accounts
    if (validatedQuery.account_id) {
      query = query.eq('account_id', validatedQuery.account_id);
    } else {
      const accountIds = await getUserAccountIds(user.id);
      if (accountIds.length === 0) {
        // User has no accounts, return empty stats
        return successResponse({
          total_debit: 0,
          total_credit: 0,
          net_amount: 0,
          transaction_count: 0,
          by_category: []
        });
      }
      query = query.in('account_id', accountIds);
    }

    // Apply date filters
    if (validatedQuery.start_date) {
      query = query.gte('transaction_date', validatedQuery.start_date);
    }

    if (validatedQuery.end_date) {
      query = query.lte('transaction_date', validatedQuery.end_date);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, ErrorCodes.DATABASE_ERROR, 'Failed to fetch transaction statistics', error);
    }

    // Calculate statistics
    let totalDebit = 0;
    let totalCredit = 0;
    const categoryStats = new Map<string, { amount: number; count: number }>();

    data.forEach(transaction => {
      if (transaction.transaction_type === 'debit') {
        totalDebit += Number(transaction.amount);
      } else {
        totalCredit += Number(transaction.amount);
      }

      // Aggregate by category
      const category = transaction.category || 'Uncategorized';
      const existing = categoryStats.get(category) || { amount: 0, count: 0 };
      categoryStats.set(category, {
        amount: existing.amount + Number(transaction.amount),
        count: existing.count + 1
      });
    });

    // Format category statistics
    const byCategoryArray = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      amount: stats.amount,
      count: stats.count
    }));

    // Sort by amount descending
    byCategoryArray.sort((a, b) => b.amount - a.amount);

    const stats: TransactionStats = {
      total_debit: totalDebit,
      total_credit: totalCredit,
      net_amount: totalCredit - totalDebit,
      transaction_count: data.length,
      by_category: byCategoryArray
    };

    return successResponse(stats);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedError();
    }
    return errorHandler(error);
  }
}
