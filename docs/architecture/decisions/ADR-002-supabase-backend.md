# ADR-002: Supabase as Backend-as-a-Service Platform

## Status
**Accepted** - 2025-10-20

## Context

OpenFinance requires a robust backend infrastructure for:
- User authentication and authorization
- PostgreSQL database with real-time capabilities
- File storage for documents
- Row-level security for data isolation
- Scalable infrastructure without DevOps overhead

### Requirements

**Functional**:
- Multi-user authentication with OAuth support
- Real-time data synchronization
- Secure file storage
- Database with strong ACID guarantees
- RESTful and real-time APIs

**Non-Functional**:
- GDPR compliance capabilities
- 99.9% uptime SLA
- European data residency
- Automatic backups
- Horizontal scalability

### Evaluated Alternatives

1. **Supabase** (PostgreSQL BaaS)
2. **Firebase** (Google)
3. **AWS Amplify** (Amazon)
4. **Appwrite** (Self-hosted)
5. **Custom Backend** (Node.js + PostgreSQL)

## Decision

We will use **Supabase** as our Backend-as-a-Service platform.

## Rationale

### Technical Advantages

1. **PostgreSQL Foundation**
   - Industry-standard relational database
   - Full SQL capabilities (joins, transactions, triggers)
   - ACID compliance for financial data
   - Proven at scale
   - Extensions (pg_cron, pgvector for AI)

2. **Authentication System**
   - Built-in JWT authentication
   - OAuth providers (Google, GitHub, etc.)
   - Row Level Security (RLS) integration
   - Magic link support
   - MFA capabilities

3. **Real-time Capabilities**
   - PostgreSQL replication for real-time updates
   - WebSocket subscriptions
   - Presence features
   - Broadcast messaging

4. **Developer Experience**
   - Auto-generated TypeScript types
   - Comprehensive SDK for JavaScript/TypeScript
   - Local development with Docker
   - Database migrations via CLI
   - Built-in API documentation

5. **Storage Solution**
   - S3-compatible object storage
   - Image transformation
   - Resumable uploads
   - CDN integration
   - RLS policies for access control

### Framework Comparison

| Feature | Supabase | Firebase | AWS Amplify | Appwrite | Custom |
|---------|----------|----------|-------------|----------|--------|
| Database | PostgreSQL | NoSQL | DynamoDB | MariaDB | PostgreSQL |
| SQL Support | ✅ Full | ❌ No | ⚠️ Limited | ✅ Full | ✅ Full |
| Real-time | ✅ Native | ✅ Native | ⚠️ AppSync | ✅ Native | ❌ Manual |
| Auth | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in | ❌ Manual |
| RLS | ✅ Native | ❌ Rules | ❌ No | ⚠️ Limited | ✅ Manual |
| EU Hosting | ✅ Yes | ⚠️ Limited | ✅ Yes | ✅ Self-host | ✅ Manual |
| Open Source | ✅ Yes | ❌ No | ❌ No | ✅ Yes | N/A |
| Pricing | ✅ Good | ✅ Good | ⚠️ Complex | ✅ Free | ⚠️ Variable |
| TypeScript | ✅ Excellent | ✅ Good | ⚠️ Generated | ⚠️ Limited | ✅ Custom |

### Specific to OpenFinance

1. **Financial Data Requirements**
   - PostgreSQL's ACID compliance critical for transactions
   - Complex queries for budget calculations
   - Joins for transaction aggregation
   - Triggers for automated calculations

2. **Security & Compliance**
   - Row Level Security for user data isolation
   - EU data residency (Frankfurt region)
   - SOC 2 Type 2 certified
   - GDPR-compliant by design
   - Audit logging capabilities

3. **Cost Efficiency**
   - Free tier: 500MB database, 1GB storage
   - Pro tier: $25/month (2 databases, 8GB storage)
   - No surprise costs (unlike AWS)
   - Predictable pricing model

4. **Development Velocity**
   - Instant API generation from schema
   - Automatic TypeScript types
   - Local development environment
   - No backend code needed initially

## Architecture Integration

### Authentication Flow
```typescript
// Supabase handles auth completely
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// JWT automatically included in subsequent requests
const { data: accounts } = await supabase
  .from('accounts')
  .select('*')
  // RLS automatically filters to user's data
```

### Real-time Subscriptions
```typescript
// Subscribe to transaction updates
const channel = supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions'
  }, (payload) => {
    // Update UI in real-time
    addTransaction(payload.new)
  })
  .subscribe()
```

### Row Level Security Example
```sql
-- Users can only access their own transactions
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Enforced at database level (not application)
```

## Consequences

### Positive

- ✅ Rapid development with instant APIs
- ✅ Strong data consistency (PostgreSQL)
- ✅ Built-in real-time capabilities
- ✅ Excellent TypeScript support
- ✅ EU data residency
- ✅ Open-source (can self-host if needed)
- ✅ Active community and support

### Negative

- ⚠️ Vendor lock-in (mitigated: open-source)
- ⚠️ Limited database size on free tier
- ⚠️ Learning curve for RLS policies
- ⚠️ Real-time connections counted in limits
- ⚠️ Storage costs can scale with usage

### Risks & Mitigation

1. **Vendor Lock-in**
   - **Risk**: Dependency on Supabase infrastructure
   - **Mitigation**: Open-source allows self-hosting, standard PostgreSQL database
   - **Exit Strategy**: Can export PostgreSQL dump, migrate to any PostgreSQL host

2. **Scaling Limits**
   - **Risk**: Free tier limitations (500MB database)
   - **Mitigation**: Pro tier scales to 8GB, Enterprise for larger
   - **Monitoring**: Set up alerts for database size

3. **Real-time Connection Limits**
   - **Risk**: Limited concurrent real-time connections
   - **Mitigation**: Use pooling, implement graceful degradation
   - **Alternative**: Polling for non-critical updates

4. **Cost at Scale**
   - **Risk**: Costs increase with database size and bandwidth
   - **Mitigation**: Optimize queries, implement caching
   - **Budgeting**: Monitor usage, set up billing alerts

## Implementation Plan

### Phase 1: Setup (Week 1)
- Create Supabase project (EU region)
- Configure authentication providers
- Set up development environment
- Install Supabase CLI

### Phase 2: Schema (Week 2)
- Design database schema
- Implement RLS policies
- Create database functions
- Set up migrations

### Phase 3: Integration (Week 3)
- Integrate Supabase client in Next.js
- Implement auth flows
- Set up real-time subscriptions
- Configure storage buckets

### Phase 4: Production (Week 4)
- Configure backup strategy
- Set up monitoring and alerts
- Implement connection pooling
- Performance optimization

## Alternatives Considered

### Firebase
**Pros**: Mature platform, good real-time, large community
**Cons**: NoSQL limitations, complex security rules, vendor lock-in
**Why not chosen**: NoSQL inadequate for financial transactions, complex queries needed

### AWS Amplify
**Pros**: Full AWS ecosystem, scalable
**Cons**: Complex setup, steep learning curve, costly
**Why not chosen**: Overkill for MVP, complex pricing, slower development

### Appwrite
**Pros**: Open-source, self-hosted, cost-effective
**Cons**: Smaller community, more DevOps work, fewer features
**Why not chosen**: Requires infrastructure management, less mature

### Custom Backend
**Pros**: Full control, no vendor lock-in
**Cons**: Significant development time, ongoing maintenance
**Why not chosen**: Slower MVP development, distraction from core features

## Technical Specifications

### Database Configuration
- **Region**: EU Central (Frankfurt)
- **Instance**: Dedicated PostgreSQL 15
- **Connection Pooling**: PgBouncer (transaction mode)
- **Backup**: Daily automated, 7-day retention
- **Extensions**: pg_cron, pgvector, uuid-ossp

### Security Configuration
- **Auth**: JWT with 1-hour expiration
- **RLS**: Enabled on all user-facing tables
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **API Keys**: Separate anon/service keys
- **CORS**: Restricted to production domains

### Monitoring
- **Metrics**: Database size, connection count, query performance
- **Alerts**: 80% database capacity, high error rate
- **Logs**: Query logs, auth logs, error logs
- **Uptime**: UptimeRobot for status monitoring

## Cost Projection

### Year 1 Estimate
- **Months 1-3**: Free tier ($0)
- **Months 4-12**: Pro tier ($25/month = $225)
- **Bandwidth**: ~$10/month for API calls
- **Storage**: Included in Pro tier
- **Total Year 1**: ~$315

### Year 2 Projection (10,000 users)
- **Database**: Pro tier ($25/month)
- **Bandwidth**: ~$50/month
- **Storage**: ~$25/month (documents)
- **Total Year 2**: ~$1,200/year

## Success Metrics

- ✅ Authentication latency < 500ms
- ✅ API response time < 200ms (p95)
- ✅ Real-time update latency < 1s
- ✅ 99.9% uptime
- ✅ Zero data breaches
- ✅ < 5% cost overrun vs. budget

## Review Schedule

- **Next Review**: Q2 2026 (or at 10,000 users)
- **Triggers for Re-evaluation**:
  - Recurring performance issues
  - Cost exceeds 20% of budget
  - Major feature gaps identified
  - Better alternative emerges

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Security](https://supabase.com/security)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/index.html)

---

**Decision Maker**: Architecture Team
**Stakeholders**: Engineering, DevOps, Finance
**Document Owner**: System Architect
**Financial Approval**: CFO
