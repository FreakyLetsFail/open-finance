# OpenFinance Data Architecture

## Database Schema Design

### Entity-Relationship Overview

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │───────│   accounts   │───────│ transactions │
└──────────────┘  1:N  └──────────────┘  1:N  └──────────────┘
       │                      │
       │ 1:N                  │ 1:N
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│   budgets    │       │  requisitions│
└──────────────┘       └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│budget_alerts │
└──────────────┘
```

## Core Schema Definitions

### 1. Users Table

```sql
CREATE TABLE users (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Profile
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'de',
  timezone TEXT DEFAULT 'Europe/Berlin',

  -- Settings
  currency TEXT DEFAULT 'EUR',
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "budget_alerts": true,
    "weekly_summary": true
  }'::jsonb,

  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (
    subscription_tier IN ('free', 'pro', 'enterprise')
  ),
  subscription_status TEXT CHECK (
    subscription_status IN ('active', 'canceled', 'past_due')
  ),
  subscription_current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,

  -- Security
  last_login_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### 2. Bank Requisitions Table

```sql
CREATE TABLE bank_requisitions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Nordigen/GoCardless data
  requisition_id TEXT UNIQUE NOT NULL,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_logo TEXT,

  -- OAuth flow
  redirect_url TEXT NOT NULL,
  agreement_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'linked', 'active', 'expired', 'revoked')
  ),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  linked_at TIMESTAMPTZ,

  -- Metadata
  country TEXT NOT NULL,
  max_historical_days INTEGER DEFAULT 90,
  access_valid_for_days INTEGER DEFAULT 90,

  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_requisitions_user ON bank_requisitions(user_id);
CREATE INDEX idx_requisitions_status ON bank_requisitions(status);
CREATE INDEX idx_requisitions_institution ON bank_requisitions(institution_id);

-- RLS
ALTER TABLE bank_requisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own requisitions"
  ON bank_requisitions FOR ALL
  USING (auth.uid() = user_id);
```

### 3. Bank Accounts Table

```sql
CREATE TABLE accounts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requisition_id UUID NOT NULL REFERENCES bank_requisitions(id) ON DELETE CASCADE,

  -- Nordigen account ID
  account_id TEXT UNIQUE NOT NULL,

  -- Account details
  iban TEXT,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  account_type TEXT CHECK (
    account_type IN ('checking', 'savings', 'credit_card', 'loan', 'investment')
  ),

  -- Balance
  balance_amount DECIMAL(15, 2),
  balance_date TIMESTAMPTZ,
  available_amount DECIMAL(15, 2),

  -- Status
  status TEXT DEFAULT 'active' CHECK (
    status IN ('active', 'inactive', 'closed', 'error')
  ),

  -- Sync tracking
  last_synced_at TIMESTAMPTZ,
  sync_frequency_hours INTEGER DEFAULT 4,

  -- User customization
  nickname TEXT,
  color TEXT,
  icon TEXT,
  is_hidden BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Error tracking
  sync_error TEXT,
  sync_error_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_requisition ON accounts(requisition_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_sync ON accounts(last_synced_at);

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id);
```

### 4. Transactions Table

```sql
CREATE TABLE transactions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Nordigen transaction ID
  transaction_id TEXT,

  -- Transaction details
  date DATE NOT NULL,
  booking_date DATE,
  value_date DATE,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Counterparty
  creditor_name TEXT,
  creditor_account TEXT,
  debtor_name TEXT,
  debtor_account TEXT,

  -- Description
  remittance_information TEXT,
  additional_information TEXT,

  -- Categorization
  category TEXT,
  subcategory TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_group_id UUID,

  -- AI enrichment
  ai_category TEXT,
  ai_confidence DECIMAL(3, 2),
  ai_merchant TEXT,
  ai_tags TEXT[],

  -- User customization
  user_category TEXT,
  user_notes TEXT,
  is_excluded_from_budget BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'posted' CHECK (
    status IN ('pending', 'posted', 'reconciled')
  ),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(remittance_information, '') || ' ' ||
      COALESCE(creditor_name, '') || ' ' ||
      COALESCE(debtor_name, '') || ' ' ||
      COALESCE(user_notes, '')
    )
  ) STORED,

  -- Unique constraint
  UNIQUE(account_id, transaction_id, date, amount)
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category, user_id);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_recurring ON transactions(recurring_group_id);
CREATE INDEX idx_transactions_search ON transactions USING GIN(search_vector);

-- Composite indexes for common queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date DESC);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);
```

### 5. Budgets Table

```sql
CREATE TABLE budgets (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Budget details
  name TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Period
  period_type TEXT NOT NULL CHECK (
    period_type IN ('monthly', 'yearly', 'custom')
  ),
  start_date DATE NOT NULL,
  end_date DATE,

  -- Rollover settings
  rollover_enabled BOOLEAN DEFAULT false,
  rollover_amount DECIMAL(15, 2) DEFAULT 0,

  -- Alerts
  alert_threshold_percent INTEGER DEFAULT 80,
  alert_enabled BOOLEAN DEFAULT true,

  -- Current period tracking
  current_period_spent DECIMAL(15, 2) DEFAULT 0,
  current_period_start DATE,
  current_period_end DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category, user_id);
CREATE INDEX idx_budgets_active ON budgets(is_active);
CREATE INDEX idx_budgets_period ON budgets(current_period_start, current_period_end);

-- RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id);
```

### 6. Budget Alerts Table

```sql
CREATE TABLE budget_alerts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Alert details
  alert_type TEXT NOT NULL CHECK (
    alert_type IN ('threshold_reached', 'threshold_exceeded', 'budget_exceeded')
  ),
  threshold_percent INTEGER,
  amount_spent DECIMAL(15, 2),
  budget_amount DECIMAL(15, 2),

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_budget_alerts_user ON budget_alerts(user_id);
CREATE INDEX idx_budget_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX idx_budget_alerts_read ON budget_alerts(is_read);
CREATE INDEX idx_budget_alerts_created ON budget_alerts(created_at DESC);

-- RLS
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budget alerts"
  ON budget_alerts FOR ALL
  USING (auth.uid() = user_id);
```

### 7. Financial Insights Table

```sql
CREATE TABLE insights (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Insight details
  insight_type TEXT NOT NULL CHECK (
    insight_type IN (
      'spending_spike', 'unusual_transaction', 'saving_opportunity',
      'recurring_payment', 'budget_forecast', 'category_analysis'
    )
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- AI generation
  ai_model TEXT,
  ai_prompt_tokens INTEGER,
  ai_completion_tokens INTEGER,

  -- Data
  metadata JSONB,
  related_transactions UUID[],
  related_budgets UUID[],

  -- Visualization
  chart_type TEXT CHECK (
    chart_type IN ('line', 'bar', 'pie', 'area', 'scatter')
  ),
  chart_data JSONB,

  -- User interaction
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  user_feedback TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_insights_user ON insights(user_id);
CREATE INDEX idx_insights_type ON insights(insight_type);
CREATE INDEX idx_insights_created ON insights(created_at DESC);
CREATE INDEX idx_insights_read ON insights(is_read);
CREATE INDEX idx_insights_valid ON insights(valid_until);

-- RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own insights"
  ON insights FOR ALL
  USING (auth.uid() = user_id);
```

### 8. AI Chat History Table

```sql
CREATE TABLE ai_chat_history (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,

  -- Message
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI metadata
  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,

  -- Context
  context_transactions UUID[],
  context_budgets UUID[],
  context_accounts UUID[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_user ON ai_chat_history(user_id);
CREATE INDEX idx_chat_session ON ai_chat_history(session_id);
CREATE INDEX idx_chat_created ON ai_chat_history(created_at DESC);

-- RLS
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat history"
  ON ai_chat_history FOR ALL
  USING (auth.uid() = user_id);
```

### 9. Audit Log Table

```sql
CREATE TABLE audit_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,

  -- Action
  action TEXT NOT NULL CHECK (
    action IN ('create', 'read', 'update', 'delete')
  ),

  -- Data
  old_values JSONB,
  new_values JSONB,

  -- Request context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Retention (GDPR: 10 years for financial data)
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 years'
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_expires ON audit_logs(expires_at);

-- No RLS - admin access only
```

## Database Functions

### 1. Calculate Budget Progress

```sql
CREATE OR REPLACE FUNCTION calculate_budget_progress(
  budget_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  budget_record budgets%ROWTYPE;
  spent DECIMAL;
BEGIN
  SELECT * INTO budget_record FROM budgets WHERE id = budget_id;

  SELECT COALESCE(SUM(ABS(amount)), 0)
  INTO spent
  FROM transactions
  WHERE user_id = budget_record.user_id
    AND category = budget_record.category
    AND date BETWEEN budget_record.current_period_start
                 AND budget_record.current_period_end
    AND amount < 0
    AND is_excluded_from_budget = false;

  UPDATE budgets
  SET current_period_spent = spent
  WHERE id = budget_id;

  RETURN (spent / budget_record.amount) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Categorize Transaction with AI

```sql
CREATE OR REPLACE FUNCTION categorize_transaction(
  transaction_id UUID,
  ai_category TEXT,
  ai_confidence DECIMAL
) RETURNS void AS $$
BEGIN
  UPDATE transactions
  SET
    ai_category = categorize_transaction.ai_category,
    ai_confidence = categorize_transaction.ai_confidence,
    category = CASE
      WHEN ai_confidence > 0.8 THEN ai_category
      ELSE category
    END,
    updated_at = NOW()
  WHERE id = transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Detect Recurring Transactions

```sql
CREATE OR REPLACE FUNCTION detect_recurring_transactions(
  user_id UUID
) RETURNS TABLE(
  group_id UUID,
  merchant TEXT,
  amount DECIMAL,
  frequency TEXT,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH recurring_patterns AS (
    SELECT
      uuid_generate_v4() as group_id,
      COALESCE(ai_merchant, creditor_name) as merchant,
      amount,
      COUNT(*) as transaction_count,
      CASE
        WHEN MAX(date) - MIN(date) <= 35 THEN 'monthly'
        WHEN MAX(date) - MIN(date) <= 95 THEN 'quarterly'
        WHEN MAX(date) - MIN(date) <= 370 THEN 'yearly'
        ELSE 'irregular'
      END as frequency
    FROM transactions
    WHERE transactions.user_id = detect_recurring_transactions.user_id
      AND amount < 0
      AND date >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY COALESCE(ai_merchant, creditor_name), amount
    HAVING COUNT(*) >= 3
  )
  SELECT * FROM recurring_patterns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Data Encryption Strategy

### 1. Field-Level Encryption

```sql
-- Sensitive fields encrypted at application layer
CREATE TABLE encrypted_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Encrypted fields (AES-256-GCM)
  encrypted_data BYTEA NOT NULL,
  encryption_iv BYTEA NOT NULL,
  encryption_tag BYTEA NOT NULL,

  -- Key management
  key_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ
);
```

### 2. Application-Layer Encryption

```typescript
// /lib/crypto/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = process.env.ENCRYPTION_KEY! // 32 bytes

export function encrypt(data: string): {
  encrypted: string
  iv: string
  tag: string
} {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  }
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(tag, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

## Database Optimization

### 1. Partitioning Strategy

```sql
-- Partition transactions by month for performance
CREATE TABLE transactions_partitioned (
  LIKE transactions INCLUDING ALL
) PARTITION BY RANGE (date);

-- Create partitions for each month
CREATE TABLE transactions_2025_01 PARTITION OF transactions_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE transactions_2025_02 PARTITION OF transactions_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Add default partition for future data
CREATE TABLE transactions_default PARTITION OF transactions_partitioned
  DEFAULT;
```

### 2. Materialized Views

```sql
-- Monthly spending summary
CREATE MATERIALIZED VIEW monthly_spending_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', date) as month,
  category,
  COUNT(*) as transaction_count,
  SUM(ABS(amount)) as total_spent,
  AVG(ABS(amount)) as avg_transaction
FROM transactions
WHERE amount < 0
GROUP BY user_id, DATE_TRUNC('month', date), category;

-- Refresh strategy
CREATE INDEX idx_monthly_spending ON monthly_spending_summary(user_id, month);

-- Refresh on schedule
CREATE OR REPLACE FUNCTION refresh_monthly_spending()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_spending_summary;
END;
$$ LANGUAGE plpgsql;
```

### 3. Query Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE user_id = 'user-uuid'
  AND date BETWEEN '2025-01-01' AND '2025-12-31'
  AND category = 'groceries'
ORDER BY date DESC
LIMIT 50;

-- Add covering index
CREATE INDEX idx_transactions_user_category_date
ON transactions(user_id, category, date DESC)
INCLUDE (amount, creditor_name);
```

## Data Retention & Compliance

### 1. GDPR Data Export

```sql
CREATE OR REPLACE FUNCTION export_user_data(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user', (SELECT row_to_json(u) FROM users u WHERE u.id = user_id),
    'accounts', (SELECT jsonb_agg(row_to_json(a)) FROM accounts a WHERE a.user_id = user_id),
    'transactions', (SELECT jsonb_agg(row_to_json(t)) FROM transactions t WHERE t.user_id = user_id),
    'budgets', (SELECT jsonb_agg(row_to_json(b)) FROM budgets b WHERE b.user_id = user_id)
  ) INTO user_data;

  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Data Deletion (Right to Erasure)

```sql
CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Soft delete user
  UPDATE users SET deleted_at = NOW() WHERE id = user_id;

  -- Anonymize transactions (keep for financial records)
  UPDATE transactions
  SET creditor_name = 'DELETED',
      debtor_name = 'DELETED',
      user_notes = NULL
  WHERE user_id = user_id;

  -- Schedule hard delete after retention period (10 years)
  INSERT INTO scheduled_deletions (user_id, delete_after)
  VALUES (user_id, NOW() + INTERVAL '10 years');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-20
**Status**: Draft
