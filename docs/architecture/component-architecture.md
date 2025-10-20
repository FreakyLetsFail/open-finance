# OpenFinance Component Architecture (C4 Level 2)

## Component Diagram Overview

This document details the internal structure of the OpenFinance application, breaking down the system into logical components and their interactions.

## Frontend Components

### 1. Presentation Layer (`/app` directory)

#### Route Components
```
/app
├── (auth)                    # Authentication routes
│   ├── login                 # Login page
│   ├── register              # Registration page
│   ├── forgot-password       # Password reset
│   └── verify-email          # Email verification
├── (dashboard)               # Protected dashboard routes
│   ├── overview              # Main dashboard
│   ├── accounts              # Bank accounts view
│   ├── transactions          # Transaction history
│   ├── budgets               # Budget management
│   ├── insights              # AI-powered insights
│   ├── goals                 # Financial goals
│   └── settings              # User settings
└── (marketing)               # Public marketing pages
    ├── page.tsx              # Landing page
    ├── pricing              # Pricing page
    ├── features             # Features page
    └── about                # About page
```

### 2. UI Components Library (`/components`)

#### Atomic Components (`/components/ui`)
- Shadcn/ui base components
- Custom themed components
- Accessible form controls
- Data visualization primitives

#### Composite Components (`/components`)
```
/components
├── auth
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── OAuthButtons.tsx
│   └── PasswordResetForm.tsx
├── dashboard
│   ├── DashboardHeader.tsx
│   ├── QuickStats.tsx
│   ├── RecentTransactions.tsx
│   └── SpendingChart.tsx
├── accounts
│   ├── AccountCard.tsx
│   ├── AccountList.tsx
│   ├── ConnectBankButton.tsx
│   └── BankConnectionStatus.tsx
├── transactions
│   ├── TransactionList.tsx
│   ├── TransactionRow.tsx
│   ├── TransactionFilters.tsx
│   └── CategoryBadge.tsx
├── budgets
│   ├── BudgetCard.tsx
│   ├── BudgetProgress.tsx
│   ├── CreateBudgetDialog.tsx
│   └── BudgetAlerts.tsx
├── insights
│   ├── InsightCard.tsx
│   ├── SpendingAnalysis.tsx
│   ├── AIAssistant.tsx
│   └── RecommendationsList.tsx
└── shared
    ├── LoadingStates.tsx
    ├── ErrorBoundary.tsx
    ├── EmptyStates.tsx
    └── ConfirmDialog.tsx
```

### 3. State Management (`/lib/store`)

#### Zustand Stores
```typescript
/lib/store
├── authStore.ts              # Authentication state
├── accountsStore.ts          # Bank accounts state
├── transactionsStore.ts      # Transactions state
├── budgetsStore.ts           # Budgets state
├── insightsStore.ts          # AI insights state
└── uiStore.ts                # UI state (modals, toasts)
```

#### React Context Providers
```typescript
/lib/contexts
├── SupabaseContext.tsx       # Supabase client
├── AuthContext.tsx           # Auth state provider
├── ThemeContext.tsx          # Theme provider
└── FeatureFlagsContext.tsx   # Feature flags
```

### 4. Custom Hooks (`/hooks`)

```typescript
/hooks
├── useAuth.ts                # Authentication hook
├── useAccounts.ts            # Bank accounts operations
├── useTransactions.ts        # Transaction queries
├── useBudgets.ts             # Budget management
├── useInsights.ts            # AI insights fetching
├── useRealtime.ts            # Supabase realtime subscriptions
├── useLocalStorage.ts        # Local storage persistence
└── useMediaQuery.ts          # Responsive design
```

## Backend Components

### 1. API Routes (`/app/api`)

```
/app/api
├── auth
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── logout/route.ts
│   └── refresh/route.ts
├── accounts
│   ├── route.ts              # List accounts
│   ├── [id]/route.ts         # Account details
│   ├── connect/route.ts      # Connect new bank
│   └── sync/route.ts         # Sync account data
├── transactions
│   ├── route.ts              # List/filter transactions
│   ├── [id]/route.ts         # Transaction details
│   ├── categorize/route.ts   # AI categorization
│   └── export/route.ts       # Export transactions
├── budgets
│   ├── route.ts              # CRUD budgets
│   ├── [id]/route.ts         # Budget details
│   └── alerts/route.ts       # Budget alerts
├── insights
│   ├── route.ts              # Get insights
│   ├── chat/route.ts         # AI chat endpoint
│   └── recommendations/route.ts
├── subscriptions
│   ├── route.ts              # Manage subscriptions
│   ├── checkout/route.ts     # Stripe checkout
│   ├── webhook/route.ts      # Stripe webhooks
│   └── portal/route.ts       # Customer portal
└── webhooks
    ├── nordigen/route.ts     # Bank webhook
    └── stripe/route.ts       # Payment webhook
```

### 2. Business Logic Layer (`/lib`)

#### Service Modules
```typescript
/lib/services
├── authService.ts            # Authentication logic
├── bankService.ts            # Bank integration
├── transactionService.ts     # Transaction processing
├── budgetService.ts          # Budget calculations
├── insightService.ts         # AI insights generation
├── notificationService.ts    # Email/push notifications
└── analyticsService.ts       # Analytics tracking
```

#### Repository Pattern
```typescript
/lib/repositories
├── userRepository.ts         # User CRUD operations
├── accountRepository.ts      # Account data access
├── transactionRepository.ts  # Transaction queries
├── budgetRepository.ts       # Budget data access
└── auditRepository.ts        # Audit log access
```

### 3. External Integrations (`/lib/integrations`)

```typescript
/lib/integrations
├── nordigen
│   ├── client.ts             # API client
│   ├── auth.ts               # OAuth flow
│   ├── accounts.ts           # Account fetching
│   └── transactions.ts       # Transaction sync
├── openai
│   ├── client.ts             # OpenAI client
│   ├── categorization.ts     # Transaction categorization
│   ├── insights.ts           # Insight generation
│   └── chat.ts               # Chat completions
├── stripe
│   ├── client.ts             # Stripe client
│   ├── subscriptions.ts      # Subscription management
│   ├── webhooks.ts           # Webhook handlers
│   └── invoices.ts           # Invoice generation
└── supabase
    ├── client.ts             # Supabase client factory
    ├── serverClient.ts       # Server-side client
    └── middleware.ts         # Auth middleware
```

### 4. Database Layer (`/database`)

#### Schema Files
```sql
/database/migrations
├── 001_initial_schema.sql
├── 002_add_accounts.sql
├── 003_add_transactions.sql
├── 004_add_budgets.sql
├── 005_add_insights.sql
└── 006_add_rls_policies.sql
```

#### Database Functions
```sql
/database/functions
├── categorize_transaction.sql
├── calculate_budget_progress.sql
├── aggregate_spending.sql
└── generate_insights_data.sql
```

## Data Flow Architecture

### 1. Authentication Flow

```
User Login Request
    ↓
LoginForm Component
    ↓
authService.login()
    ↓
Supabase Auth API
    ↓
JWT Token Generated
    ↓
authStore.setUser()
    ↓
Redirect to Dashboard
```

### 2. Bank Connection Flow

```
User Clicks "Connect Bank"
    ↓
ConnectBankButton
    ↓
API: /api/accounts/connect
    ↓
bankService.initiateConnection()
    ↓
Nordigen OAuth Flow
    ↓
Callback: Bank Authorization
    ↓
API: /api/webhooks/nordigen
    ↓
accountRepository.create()
    ↓
Background Job: Sync Transactions
    ↓
Realtime Update to Frontend
    ↓
accountsStore.addAccount()
```

### 3. Transaction Sync Flow

```
Scheduled Job (every 4 hours)
    ↓
bankService.syncTransactions()
    ↓
Nordigen API: Fetch transactions
    ↓
transactionService.process()
    ↓
AI Categorization (OpenAI)
    ↓
transactionRepository.bulkInsert()
    ↓
Supabase Realtime Broadcast
    ↓
Frontend: useRealtime hook
    ↓
transactionsStore.update()
```

### 4. AI Insights Generation Flow

```
User Views Insights Page
    ↓
InsightsComponent
    ↓
useInsights() hook
    ↓
API: /api/insights
    ↓
insightService.generate()
    ↓
Aggregate spending data
    ↓
OpenAI GPT-4 Analysis
    ↓
Store insights in database
    ↓
Return to frontend
    ↓
InsightCard components render
```

## Component Interaction Patterns

### 1. Client-Server Communication

```typescript
// Pattern 1: Server Components (default)
async function DashboardPage() {
  const data = await fetchDashboardData() // Server-side
  return <Dashboard data={data} />
}

// Pattern 2: Client Components with API routes
'use client'
function TransactionList() {
  const { data, isLoading } = useTransactions() // API route call
  return <List data={data} loading={isLoading} />
}

// Pattern 3: Server Actions
'use server'
async function createBudget(formData: FormData) {
  const budget = await budgetRepository.create(formData)
  revalidatePath('/budgets')
  return budget
}
```

### 2. Real-time Updates

```typescript
// Supabase Realtime subscription
function useRealtimeTransactions(accountId: string) {
  useEffect(() => {
    const channel = supabase
      .channel('transactions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `account_id=eq.${accountId}`
      }, (payload) => {
        transactionsStore.addTransaction(payload.new)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [accountId])
}
```

### 3. Error Handling

```typescript
// Error boundary for component trees
<ErrorBoundary fallback={<ErrorFallback />}>
  <Dashboard />
</ErrorBoundary>

// API error handling
try {
  const response = await fetch('/api/accounts')
  if (!response.ok) {
    throw new APIError(response.status, await response.json())
  }
} catch (error) {
  if (error instanceof APIError) {
    toast.error(error.message)
  } else {
    Sentry.captureException(error)
  }
}
```

## Security Components

### 1. Authentication Middleware

```typescript
// /lib/middleware/auth.ts
export async function requireAuth(req: Request) {
  const token = req.headers.get('Authorization')
  const user = await verifyToken(token)
  if (!user) throw new UnauthorizedError()
  return user
}
```

### 2. RLS Policy Enforcement

```sql
-- Automatic enforcement via Supabase
CREATE POLICY "Users can only access their own data"
ON transactions
FOR ALL
USING (auth.uid() = user_id);
```

### 3. Input Validation

```typescript
// Using Zod schemas
const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  category: z.enum(['groceries', 'transport', 'entertainment']),
  period: z.enum(['monthly', 'yearly'])
})

// Validation in API route
const body = createBudgetSchema.parse(await req.json())
```

## Performance Components

### 1. Caching Layer

```typescript
// React Query for client-side caching
const { data } = useQuery({
  queryKey: ['transactions', filters],
  queryFn: () => fetchTransactions(filters),
  staleTime: 5 * 60 * 1000 // 5 minutes
})

// Edge caching for static data
export const revalidate = 3600 // 1 hour
```

### 2. Lazy Loading

```typescript
// Dynamic imports for code splitting
const InsightsChart = dynamic(
  () => import('@/components/insights/InsightsChart'),
  { loading: () => <Skeleton /> }
)
```

### 3. Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_transactions_user_date
ON transactions(user_id, date DESC);

CREATE INDEX idx_transactions_category
ON transactions(category, user_id);
```

## Testing Components

### 1. Unit Tests

```typescript
// /tests/unit/services/budgetService.test.ts
describe('BudgetService', () => {
  it('should calculate budget progress correctly', () => {
    const progress = budgetService.calculateProgress(
      { amount: 1000, spent: 750 }
    )
    expect(progress).toBe(75)
  })
})
```

### 2. Integration Tests

```typescript
// /tests/integration/api/accounts.test.ts
describe('POST /api/accounts/connect', () => {
  it('should initiate bank connection', async () => {
    const response = await fetch('/api/accounts/connect', {
      method: 'POST',
      body: JSON.stringify({ institutionId: 'BANK_XYZ' })
    })
    expect(response.status).toBe(200)
  })
})
```

### 3. E2E Tests

```typescript
// /tests/e2e/dashboard.spec.ts
test('user can view dashboard after login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password123')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard/overview')
})
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-20
**Status**: Draft
