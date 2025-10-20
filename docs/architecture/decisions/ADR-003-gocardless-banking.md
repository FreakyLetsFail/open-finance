# ADR-003: GoCardless (Nordigen) for Open Banking Integration

## Status
**Accepted** - 2025-10-20

## Context

OpenFinance requires integration with European banks to:
- Fetch account balances
- Retrieve transaction history
- Support PSD2 compliance
- Cover major EU markets (Germany, France, UK, etc.)
- Provide secure OAuth-based connections

### Requirements

**Functional**:
- Support for 2,000+ European banks
- Real-time balance retrieval
- Historical transactions (90+ days)
- Multi-account support per user
- Automatic transaction syncing

**Non-Functional**:
- PSD2 compliant
- Secure OAuth 2.0 flow
- 99.9% API uptime
- Reasonable API rate limits
- Affordable pricing model

### Evaluated Alternatives

1. **GoCardless (Nordigen)** - Open banking aggregator
2. **Plaid** - US-focused, limited EU support
3. **TrueLayer** - UK-focused aggregator
4. **Tink** - European aggregator (Visa owned)
5. **Direct Bank APIs** - Individual bank integrations

## Decision

We will use **GoCardless (formerly Nordigen)** as our primary open banking provider.

## Rationale

### Technical Advantages

1. **Comprehensive Coverage**
   - 2,300+ banks across 31 countries
   - All major German banks (Deutsche Bank, Commerzbank, Sparkasse, etc.)
   - Full EU coverage (SEPA region)
   - UK banks included

2. **PSD2 Compliance**
   - Regulated as Account Information Service Provider (AISP)
   - Secure OAuth 2.0 authentication
   - Strong Customer Authentication (SCA) support
   - 90-day consent duration (renewable)

3. **Developer Experience**
   - RESTful API with OpenAPI spec
   - Comprehensive documentation
   - SDKs for JavaScript, Python, PHP
   - Sandbox environment for testing
   - Webhook support for events

4. **Data Quality**
   - Standardized transaction format
   - Categorized transactions (merchant info)
   - Multi-currency support
   - Real-time balance updates
   - Historical data (up to 730 days)

5. **Pricing**
   - **Free tier**: 100 bank connections/month
   - **Essential**: €0.30 per connection/90 days
   - **Scale**: €0.15 per connection/90 days
   - **Premium**: €0.10 per connection/90 days

### Provider Comparison

| Feature | GoCardless | Plaid | TrueLayer | Tink | Direct APIs |
|---------|------------|-------|-----------|------|-------------|
| EU Banks | ✅ 2,300+ | ⚠️ Limited | ✅ 1,500+ | ✅ 2,000+ | ⚠️ Manual |
| German Banks | ✅ Excellent | ❌ Poor | ⚠️ Limited | ✅ Good | ✅ Native |
| PSD2 Compliant | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Free Tier | ✅ 100/month | ❌ No | ⚠️ Limited | ❌ No | ✅ Free |
| Pricing | ✅ €0.10-0.30 | ⚠️ $0.25+ | ⚠️ £0.30+ | ⚠️ Custom | ❌ N/A |
| Webhooks | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Varies |
| Documentation | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Good | ⚠️ Varies |
| Sandbox | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Varies |
| Multi-Account | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

### Specific to OpenFinance

1. **Target Market Alignment**
   - Primary market: Germany, Austria, Switzerland
   - GoCardless has best coverage for DACH region
   - Supports all major German banks
   - Sparkasse integration (critical for Germany)

2. **Cost Efficiency**
   - Free tier covers MVP development
   - €0.10/connection at scale = €1/user/year (10 accounts)
   - Predictable pricing (no per-transaction fees)
   - No setup fees or monthly minimums

3. **Technical Simplicity**
   - Single API for all banks
   - Standardized data format
   - No need to maintain multiple integrations
   - Automatic bank updates

4. **Compliance**
   - GoCardless handles PSD2 compliance
   - Regulated entity (license in multiple EU countries)
   - Audit trail for regulatory reporting
   - GDPR-compliant data handling

## Architecture Integration

### Connection Flow

```typescript
// 1. Create bank requisition
const requisition = await nordigenClient.initSession({
  redirectUrl: 'https://openfinance.app/callback',
  institutionId: 'DEUTSCHE_BANK_DE',
  referenceId: userId
})

// 2. User completes OAuth at bank
// -> Redirected to callback URL with requisition_id

// 3. Retrieve accounts
const accounts = await nordigenClient.requisition(requisitionId).getAccounts()

// 4. Fetch account details
for (const accountId of accounts) {
  const details = await nordigenClient.account(accountId).getDetails()
  const balances = await nordigenClient.account(accountId).getBalances()
  const transactions = await nordigenClient.account(accountId).getTransactions()

  // Store in database
  await saveAccount(userId, details, balances)
  await saveTransactions(userId, accountId, transactions)
}
```

### Data Synchronization Strategy

```typescript
// Background job (runs every 4 hours)
async function syncBankAccounts(userId: string) {
  const accounts = await getActiveAccounts(userId)

  for (const account of accounts) {
    try {
      // Check if requisition is still valid
      const requisition = await nordigenClient
        .requisition(account.requisitionId)
        .getStatus()

      if (requisition.status !== 'LINKED') {
        // Notify user to reconnect
        await sendReconnectNotification(userId, account)
        continue
      }

      // Fetch new transactions
      const { transactions } = await nordigenClient
        .account(account.accountId)
        .getTransactions({
          dateFrom: account.lastSyncedAt || '2025-01-01'
        })

      // Process and categorize
      const categorized = await categorizeTransactions(transactions)

      // Store in database
      await bulkInsertTransactions(userId, categorized)

      // Update sync timestamp
      await updateAccountSyncStatus(account.id, new Date())

    } catch (error) {
      await logSyncError(account.id, error)
    }
  }
}
```

### Webhook Handler

```typescript
// /app/api/webhooks/nordigen/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('Nordigen-Signature')
  const body = await req.text()

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)

  switch (event.type) {
    case 'requisition.linked':
      await handleRequisitionLinked(event.data)
      break

    case 'requisition.expired':
      await handleRequisitionExpired(event.data)
      break

    case 'account.updated':
      await syncAccount(event.data.accountId)
      break
  }

  return new Response('OK')
}
```

## Consequences

### Positive

- ✅ Comprehensive EU bank coverage
- ✅ Free tier for development and testing
- ✅ Cost-effective at scale
- ✅ PSD2 compliance handled
- ✅ Single integration point
- ✅ Good documentation and support
- ✅ Active development and updates

### Negative

- ⚠️ Dependency on third-party service
- ⚠️ Bank connection failures outside our control
- ⚠️ 90-day consent renewal required
- ⚠️ Rate limits on API calls
- ⚠️ Limited US bank support (not needed)

### Risks & Mitigation

1. **Service Outage**
   - **Risk**: GoCardless API downtime
   - **Mitigation**: Implement graceful degradation, cache data, retry logic
   - **Monitoring**: Set up uptime monitoring, alerting

2. **Bank Connection Failures**
   - **Risk**: Individual banks may have issues
   - **Mitigation**: Clear error messaging, reconnection flow, support documentation
   - **User Impact**: 5-10% of connections may require attention

3. **Consent Expiration**
   - **Risk**: Users must re-authorize every 90 days
   - **Mitigation**: Proactive renewal notifications (7 days before), one-click renewal
   - **UX**: Clear explanation of PSD2 requirements

4. **Cost Scaling**
   - **Risk**: Costs increase with user growth
   - **Mitigation**: Tiered pricing negotiation, optimize refresh frequency
   - **Budget**: €0.10/connection/90 days = €40/year per 100 connections

5. **Data Quality**
   - **Risk**: Inconsistent data from some banks
   - **Mitigation**: Data validation, normalization layer, fallback categorization
   - **Testing**: Comprehensive testing across major banks

## Implementation Plan

### Phase 1: Integration (Week 1)
- Set up GoCardless account
- Implement OAuth flow
- Create bank connection UI
- Test with sandbox banks

### Phase 2: Data Pipeline (Week 2)
- Build transaction import system
- Implement categorization
- Set up background sync jobs
- Create webhook handlers

### Phase 3: User Experience (Week 3)
- Bank selection interface
- Connection status dashboard
- Reconnection flow
- Error handling and messaging

### Phase 4: Production (Week 4)
- Live bank testing (top 10 German banks)
- Performance optimization
- Monitoring and alerting
- User documentation

## Supported Banks

### Germany (Top 10)
1. Deutsche Bank
2. Commerzbank
3. Sparkasse (all regional)
4. Volksbanken Raiffeisenbanken
5. HypoVereinsbank (UniCredit)
6. Postbank
7. ING-DiBa
8. DKB (Deutsche Kreditbank)
9. Comdirect
10. N26

### Austria
- Erste Bank, Raiffeisen, BAWAG, Bank Austria

### Switzerland
- UBS, Credit Suisse, PostFinance, Raiffeisen

### Other EU
- Full coverage across all 27 EU countries

## Technical Specifications

### API Configuration
- **Base URL**: https://ob.nordigen.com/api/v2
- **Authentication**: JWT token (24-hour expiration)
- **Rate Limits**: 500 requests/minute (Essential tier)
- **Consent Duration**: 90 days (PSD2 standard)
- **Historical Data**: Up to 730 days

### Data Model
```typescript
interface NordigenAccount {
  id: string
  iban: string
  name: string
  currency: string
  ownerName: string
  product: string // "Checking", "Savings", etc.
}

interface NordigenTransaction {
  transactionId: string
  bookingDate: string
  valueDate: string
  transactionAmount: {
    amount: string
    currency: string
  }
  creditorName?: string
  creditorAccount?: { iban: string }
  debtorName?: string
  debtorAccount?: { iban: string }
  remittanceInformationUnstructured: string
  proprietaryBankTransactionCode?: string
}
```

### Error Handling
```typescript
try {
  const transactions = await nordigenClient
    .account(accountId)
    .getTransactions()
} catch (error) {
  if (error.status === 401) {
    // Token expired, refresh
    await refreshAccessToken()
  } else if (error.status === 403) {
    // Consent expired, notify user
    await notifyConsentExpired(userId)
  } else if (error.status === 429) {
    // Rate limit, retry with backoff
    await retryWithBackoff(syncAccount, accountId)
  } else {
    // Log and alert
    Sentry.captureException(error)
  }
}
```

## Cost Projection

### Year 1 (100 users, avg 2 accounts)
- Free tier: 100 connections/month
- Months 1-6: €0 (free tier)
- Months 7-12: €60 (200 connections × €0.30)
- **Total Year 1**: €60

### Year 2 (1,000 users, avg 2 accounts)
- 2,000 connections × 4 renewals/year = 8,000 connection-months
- Scale tier: €0.15/connection
- **Total Year 2**: €1,200

### Year 3 (10,000 users, avg 2 accounts)
- 20,000 connections × 4 renewals/year = 80,000 connection-months
- Premium tier: €0.10/connection (custom pricing likely)
- **Total Year 3**: €8,000 (or negotiated rate)

## Success Metrics

- ✅ 95% successful bank connections
- ✅ < 2% connection failure rate
- ✅ < 1s average connection latency
- ✅ 90% consent renewal rate
- ✅ < 5% support tickets for bank issues
- ✅ Coverage of top 20 German banks

## Alternatives Considered

### Plaid
**Pros**: Strong in US, good developer tools
**Cons**: Limited EU coverage, expensive
**Why not chosen**: Poor German bank support, higher cost

### TrueLayer
**Pros**: UK-focused, good documentation
**Cons**: Limited German coverage
**Why not chosen**: Not suitable for DACH region focus

### Tink (Visa)
**Pros**: Good EU coverage, Visa backing
**Cons**: No free tier, complex pricing
**Why not chosen**: Higher cost, no free development tier

### Direct Bank APIs
**Pros**: No middleman, potentially cheaper
**Cons**: Maintain 2,000+ integrations, complexity
**Why not chosen**: Infeasible to maintain, slow development

## Review Schedule

- **Next Review**: Q3 2026 (or at 1,000 users)
- **Triggers for Re-evaluation**:
  - > 10% connection failure rate
  - Better alternative with lower cost
  - GoCardless service degradation
  - Regulatory changes affecting pricing

## References

- [GoCardless Open Banking Docs](https://nordigen.com/en/docs/)
- [PSD2 Regulation](https://ec.europa.eu/info/law/payment-services-psd-2-directive-eu-2015-2366_en)
- [GoCardless Pricing](https://gocardless.com/open-banking/pricing/)
- [Bank Coverage List](https://nordigen.com/en/coverage/)

---

**Decision Maker**: Architecture Team, CTO
**Stakeholders**: Engineering, Product, Legal
**Document Owner**: System Architect
**Legal Approval**: Legal Counsel (PSD2 compliance)
