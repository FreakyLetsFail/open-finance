# Transactions API Documentation

## Overview

The Transactions API provides endpoints for managing financial transactions in the Vereinsfinanzen system. All endpoints require authentication and enforce Row Level Security (RLS) policies.

## Base URL

```
/api/transactions
```

## Authentication

All endpoints require a valid authentication token in the request headers:

```
Authorization: Bearer <your-token>
```

## Endpoints

### 1. List Transactions

Retrieve a paginated list of transactions with optional filtering.

**Endpoint:** `GET /api/transactions`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account_id` | UUID | No | Filter by account ID |
| `category` | string | No | Filter by category |
| `transaction_type` | enum | No | Filter by type (`debit` or `credit`) |
| `status` | enum | No | Filter by status (`pending`, `completed`, `failed`) |
| `start_date` | ISO8601 | No | Filter transactions from this date |
| `end_date` | ISO8601 | No | Filter transactions until this date |
| `min_amount` | number | No | Minimum transaction amount |
| `max_amount` | number | No | Maximum transaction amount |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `sort_by` | enum | No | Sort field (`transaction_date`, `amount`, `created_at`) |
| `sort_order` | enum | No | Sort order (`asc` or `desc`, default: `desc`) |

**Example Request:**

```bash
curl -X GET \
  'https://your-domain.com/api/transactions?account_id=123e4567-e89b-12d3-a456-426614174000&page=1&limit=20' \
  -H 'Authorization: Bearer your-token'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "account_id": "123e4567-e89b-12d3-a456-426614174000",
        "amount": 150.50,
        "currency": "EUR",
        "description": "Monthly membership fee",
        "category": "membership",
        "transaction_type": "credit",
        "status": "completed",
        "transaction_date": "2025-10-15T10:30:00Z",
        "metadata": null,
        "created_at": "2025-10-15T10:30:00Z",
        "updated_at": "2025-10-15T10:30:00Z",
        "accounts": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "account_name": "Main Account",
          "account_type": "checking"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

---

### 2. Create Transaction

Create a new transaction.

**Endpoint:** `POST /api/transactions`

**Request Body:**

```json
{
  "account_id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 150.50,
  "currency": "EUR",
  "description": "Monthly membership fee",
  "category": "membership",
  "transaction_type": "credit",
  "status": "completed",
  "transaction_date": "2025-10-15T10:30:00Z",
  "metadata": {
    "member_id": "M123",
    "payment_method": "bank_transfer"
  }
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `account_id` | UUID | Yes | Must be a valid account owned by user |
| `amount` | number | Yes | Must be positive, max 999999999999.99 |
| `currency` | string | Yes | 3-character currency code (e.g., EUR, USD) |
| `description` | string | Yes | Min 1, max 500 characters |
| `category` | string | No | Max 50 characters |
| `transaction_type` | enum | Yes | `debit` or `credit` |
| `status` | enum | No | `pending`, `completed`, or `failed` (default: `completed`) |
| `transaction_date` | ISO8601 | No | Defaults to current time |
| `metadata` | object | No | Any valid JSON object |

**Example Request:**

```bash
curl -X POST \
  https://your-domain.com/api/transactions \
  -H 'Authorization: Bearer your-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "account_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 150.50,
    "currency": "EUR",
    "description": "Monthly membership fee",
    "category": "membership",
    "transaction_type": "credit"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "account_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 150.50,
    "currency": "EUR",
    "description": "Monthly membership fee",
    "category": "membership",
    "transaction_type": "credit",
    "status": "completed",
    "transaction_date": "2025-10-15T10:30:00Z",
    "metadata": null,
    "created_at": "2025-10-15T10:30:00Z",
    "updated_at": "2025-10-15T10:30:00Z"
  }
}
```

---

### 3. Get Transaction

Retrieve a single transaction by ID.

**Endpoint:** `GET /api/transactions/{id}`

**Example Request:**

```bash
curl -X GET \
  https://your-domain.com/api/transactions/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Authorization: Bearer your-token'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "account_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 150.50,
    "currency": "EUR",
    "description": "Monthly membership fee",
    "category": "membership",
    "transaction_type": "credit",
    "status": "completed",
    "transaction_date": "2025-10-15T10:30:00Z",
    "metadata": null,
    "created_at": "2025-10-15T10:30:00Z",
    "updated_at": "2025-10-15T10:30:00Z",
    "accounts": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "account_name": "Main Account",
      "account_type": "checking",
      "currency": "EUR"
    }
  }
}
```

---

### 4. Update Transaction

Update an existing transaction. Only pending or failed transactions can be modified.

**Endpoint:** `PATCH /api/transactions/{id}`

**Request Body:**

All fields are optional. Provide only the fields you want to update.

```json
{
  "amount": 175.00,
  "description": "Updated membership fee",
  "category": "membership_premium",
  "status": "completed"
}
```

**Example Request:**

```bash
curl -X PATCH \
  https://your-domain.com/api/transactions/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Authorization: Bearer your-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 175.00,
    "description": "Updated membership fee"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 175.00,
    "description": "Updated membership fee",
    "updated_at": "2025-10-15T11:00:00Z"
  }
}
```

---

### 5. Delete Transaction

Delete a transaction. Only pending or failed transactions can be deleted.

**Endpoint:** `DELETE /api/transactions/{id}`

**Example Request:**

```bash
curl -X DELETE \
  https://your-domain.com/api/transactions/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Authorization: Bearer your-token'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Transaction deleted successfully"
  }
}
```

---

### 6. Get Transaction Statistics

Get aggregated statistics for transactions.

**Endpoint:** `GET /api/transactions/stats`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account_id` | UUID | No | Filter by account (defaults to all user accounts) |
| `start_date` | ISO8601 | No | Start date for statistics |
| `end_date` | ISO8601 | No | End date for statistics |
| `group_by` | enum | No | Grouping (`category`, `month`, `week`, `day`) |

**Example Request:**

```bash
curl -X GET \
  'https://your-domain.com/api/transactions/stats?start_date=2025-10-01T00:00:00Z&end_date=2025-10-31T23:59:59Z' \
  -H 'Authorization: Bearer your-token'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total_debit": 2500.00,
    "total_credit": 5000.00,
    "net_amount": 2500.00,
    "transaction_count": 45,
    "by_category": [
      {
        "category": "membership",
        "amount": 3000.00,
        "count": 20
      },
      {
        "category": "donations",
        "amount": 1500.00,
        "count": 15
      },
      {
        "category": "expenses",
        "amount": 2500.00,
        "count": 10
      }
    ]
  }
}
```

---

### 7. Bulk Create Transactions

Create multiple transactions in a single request.

**Endpoint:** `POST /api/transactions/bulk`

**Request Body:**

```json
{
  "transactions": [
    {
      "account_id": "123e4567-e89b-12d3-a456-426614174000",
      "amount": 150.50,
      "currency": "EUR",
      "description": "Membership fee - Member A",
      "category": "membership",
      "transaction_type": "credit"
    },
    {
      "account_id": "123e4567-e89b-12d3-a456-426614174000",
      "amount": 150.50,
      "currency": "EUR",
      "description": "Membership fee - Member B",
      "category": "membership",
      "transaction_type": "credit"
    }
  ]
}
```

**Constraints:**
- Minimum 1 transaction
- Maximum 100 transactions per request

**Example Request:**

```bash
curl -X POST \
  https://your-domain.com/api/transactions/bulk \
  -H 'Authorization: Bearer your-token' \
  -H 'Content-Type: application/json' \
  -d @bulk-transactions.json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "created": 2,
    "transactions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 150.50,
        "description": "Membership fee - Member A"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "amount": 150.50,
        "description": "Membership fee - Member B"
      }
    ]
  }
}
```

---

### 8. Get Transaction Categories

Get all unique transaction categories for the authenticated user.

**Endpoint:** `GET /api/transactions/categories`

**Example Request:**

```bash
curl -X GET \
  https://your-domain.com/api/transactions/categories \
  -H 'Authorization: Bearer your-token'
```

**Response:**

```json
{
  "success": true,
  "data": [
    "donations",
    "expenses",
    "membership",
    "sponsorship",
    "utilities"
  ]
}
```

---

## Error Responses

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied to resource |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `BUSINESS_LOGIC_ERROR` | 422 | Business rule violation |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be positive"
      },
      {
        "field": "currency",
        "message": "Currency must be 3 characters"
      }
    ]
  }
}
```

---

## Row Level Security (RLS)

All endpoints enforce RLS policies:

- Users can only view, create, update, and delete transactions for accounts they own
- Transaction modification is restricted to pending/failed transactions
- Admin users have read-only access to all transactions

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- 100 requests per minute per user for read operations
- 50 requests per minute per user for write operations
- 10 requests per minute for bulk operations

## Best Practices

1. **Always use pagination** for list endpoints to avoid large response payloads
2. **Filter by account_id** when possible to improve query performance
3. **Use bulk operations** for creating multiple transactions efficiently
4. **Handle errors gracefully** and check the error code for proper handling
5. **Cache categories** locally to reduce API calls
6. **Validate data client-side** before sending to reduce validation errors
7. **Use ISO8601 format** for all date/time fields
8. **Store metadata** for additional context without schema changes

## Examples

### Complete Transaction Workflow

```typescript
// 1. Fetch user's accounts
const accounts = await fetch('/api/accounts', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Create transaction
const transaction = await fetch('/api/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account_id: accounts.data[0].id,
    amount: 100.00,
    currency: 'EUR',
    description: 'Member payment',
    category: 'membership',
    transaction_type: 'credit'
  })
});

// 3. Get statistics
const stats = await fetch('/api/transactions/stats?start_date=2025-10-01T00:00:00Z', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. List transactions with filters
const transactions = await fetch(
  '/api/transactions?category=membership&page=1&limit=20',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```
