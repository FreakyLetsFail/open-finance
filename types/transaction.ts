// Transaction types for the booking system

export type TransactionType = 'debit' | 'credit';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  currency: string;
  description: string;
  category?: string | null;
  transaction_type: TransactionType;
  status: TransactionStatus;
  transaction_date: string;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreateInput {
  account_id: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  transaction_type: TransactionType;
  status?: TransactionStatus;
  transaction_date?: string;
  metadata?: Record<string, any>;
}

export interface TransactionUpdateInput {
  amount?: number;
  currency?: string;
  description?: string;
  category?: string;
  transaction_type?: TransactionType;
  status?: TransactionStatus;
  transaction_date?: string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  account_id?: string;
  category?: string;
  transaction_type?: TransactionType;
  status?: TransactionStatus;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface TransactionListQuery extends TransactionFilters {
  page?: number;
  limit?: number;
  sort_by?: 'transaction_date' | 'amount' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface TransactionStats {
  total_debit: number;
  total_credit: number;
  net_amount: number;
  transaction_count: number;
  by_category: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
