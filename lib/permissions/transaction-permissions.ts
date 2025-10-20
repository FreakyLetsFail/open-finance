import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role for permission checks
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user has access to a specific account
 */
export async function checkAccountAccess(
  userId: string,
  accountId: string
): Promise<PermissionCheckResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('id, user_id')
      .eq('id', accountId)
      .single();

    if (error) {
      return {
        allowed: false,
        reason: 'Account not found'
      };
    }

    if (data.user_id !== userId) {
      return {
        allowed: false,
        reason: 'User does not have access to this account'
      };
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      reason: 'Error checking account access'
    };
  }
}

/**
 * Check if user has access to a specific transaction
 */
export async function checkTransactionAccess(
  userId: string,
  transactionId: string
): Promise<PermissionCheckResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        account_id,
        accounts!inner (
          user_id
        )
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      return {
        allowed: false,
        reason: 'Transaction not found'
      };
    }

    const account = data.accounts as any;
    if (account.user_id !== userId) {
      return {
        allowed: false,
        reason: 'User does not have access to this transaction'
      };
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      reason: 'Error checking transaction access'
    };
  }
}

/**
 * Check if user is admin
 */
export async function checkAdminAccess(userId: string): Promise<PermissionCheckResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return {
        allowed: false,
        reason: 'User not found'
      };
    }

    if (data.role !== 'admin') {
      return {
        allowed: false,
        reason: 'User is not an admin'
      };
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      reason: 'Error checking admin access'
    };
  }
}

/**
 * Validate transaction ownership through account
 */
export async function validateTransactionOwnership(
  userId: string,
  accountId: string
): Promise<boolean> {
  const result = await checkAccountAccess(userId, accountId);
  return result.allowed;
}

/**
 * Check if user can modify transaction (only for pending transactions)
 */
export async function canModifyTransaction(
  userId: string,
  transactionId: string
): Promise<PermissionCheckResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        status,
        account_id,
        accounts!inner (
          user_id
        )
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      return {
        allowed: false,
        reason: 'Transaction not found'
      };
    }

    const account = data.accounts as any;
    if (account.user_id !== userId) {
      return {
        allowed: false,
        reason: 'User does not have access to this transaction'
      };
    }

    // Only allow modification of pending or failed transactions
    if (data.status === 'completed') {
      return {
        allowed: false,
        reason: 'Cannot modify completed transactions'
      };
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      reason: 'Error checking transaction modification permission'
    };
  }
}

/**
 * Get user's accessible account IDs
 */
export async function getUserAccountIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('user_id', userId);

    if (error || !data) {
      return [];
    }

    return data.map(account => account.id);
  } catch (error) {
    return [];
  }
}
