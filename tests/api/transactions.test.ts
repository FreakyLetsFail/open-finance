import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const testApiUrl = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Transactions API', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testAccountId: string;
  let testTransactionId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create test user and authenticate
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });

    if (authError || !authData.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = authData.user.id;
    authToken = authData.session!.access_token;

    // Create test account
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: testUserId,
        account_type: 'checking',
        account_name: 'Test Account',
        account_number: `TEST${Date.now()}`,
        currency: 'EUR'
      })
      .select()
      .single();

    if (accountError || !accountData) {
      throw new Error('Failed to create test account');
    }

    testAccountId = accountData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
    }
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const response = await fetch(`${testApiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: testAccountId,
          amount: 150.50,
          currency: 'EUR',
          description: 'Test transaction',
          category: 'test',
          transaction_type: 'credit'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.amount).toBe(150.50);
      expect(data.data.currency).toBe('EUR');

      testTransactionId = data.data.id;
    });

    it('should reject transaction with invalid account_id', async () => {
      const response = await fetch(`${testApiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: '00000000-0000-0000-0000-000000000000',
          amount: 100.00,
          currency: 'EUR',
          description: 'Test',
          transaction_type: 'credit'
        })
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${testApiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: testAccountId,
          amount: 100.00
          // Missing required fields
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative amounts', async () => {
      const response = await fetch(`${testApiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: testAccountId,
          amount: -100.00,
          currency: 'EUR',
          description: 'Test',
          transaction_type: 'credit'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/transactions', () => {
    it('should list transactions with pagination', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions?page=1&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('data');
      expect(data.data).toHaveProperty('pagination');
      expect(Array.isArray(data.data.data)).toBe(true);
    });

    it('should filter by account_id', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions?account_id=${testAccountId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      data.data.data.forEach((transaction: any) => {
        expect(transaction.account_id).toBe(testAccountId);
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01').toISOString();
      const endDate = new Date('2025-12-31').toISOString();

      const response = await fetch(
        `${testApiUrl}/api/transactions?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should sort transactions', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions?sort_by=amount&sort_order=desc`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get transaction by id', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/${testTransactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testTransactionId);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('PATCH /api/transactions/:id', () => {
    it('should update transaction', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/${testTransactionId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: 'Updated description',
            category: 'updated'
          })
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.description).toBe('Updated description');
      expect(data.data.category).toBe('updated');
    });

    it('should reject empty update', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/${testTransactionId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/transactions/stats', () => {
    it('should get transaction statistics', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/stats`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('total_debit');
      expect(data.data).toHaveProperty('total_credit');
      expect(data.data).toHaveProperty('net_amount');
      expect(data.data).toHaveProperty('transaction_count');
      expect(data.data).toHaveProperty('by_category');
      expect(Array.isArray(data.data.by_category)).toBe(true);
    });
  });

  describe('POST /api/transactions/bulk', () => {
    it('should create multiple transactions', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/bulk`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transactions: [
              {
                account_id: testAccountId,
                amount: 50.00,
                currency: 'EUR',
                description: 'Bulk transaction 1',
                transaction_type: 'credit'
              },
              {
                account_id: testAccountId,
                amount: 75.00,
                currency: 'EUR',
                description: 'Bulk transaction 2',
                transaction_type: 'credit'
              }
            ]
          })
        }
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.created).toBe(2);
      expect(Array.isArray(data.data.transactions)).toBe(true);
    });

    it('should reject empty bulk request', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/bulk`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transactions: []
          })
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/transactions/categories', () => {
    it('should get unique categories', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/categories`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete transaction', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/${testTransactionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 404 after deletion', async () => {
      const response = await fetch(
        `${testApiUrl}/api/transactions/${testTransactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      const response = await fetch(`${testApiUrl}/api/transactions`);
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await fetch(`${testApiUrl}/api/transactions`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      expect(response.status).toBe(401);
    });
  });
});
