# Systemarchitektur: Finanzverwaltungssystem für Vereine

## Architektur-Übersicht

### High-Level Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web Client  │  │ Mobile PWA   │  │  Admin UI    │          │
│  │  (React)     │  │  (React)     │  │  (React)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS/TLS 1.3 (REST API)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     API Gateway (Next.js)                 │  │
│  │  • Authentication/Authorization • Rate Limiting           │  │
│  │  • Request Validation • Logging                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │ Member      │ Accounting  │ Donation    │ Reporting   │    │
│  │ Service     │ Service     │ Service     │ Service     │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
│                              │                                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │ Auth        │ Audit       │ Notification│ PDF         │    │
│  │ Service     │ Service     │ Service     │ Service     │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │  PostgreSQL (Supabase)│  │  Object Storage      │            │
│  │  • Row-Level Security │  │  • Encrypted Backups │            │
│  │  • Encryption at Rest │  │  • Document Archive  │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │  Redis Cache          │  │  Message Queue       │            │
│  │  • Session Store      │  │  • Async Processing  │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technologie-Stack

### Frontend

**Framework**: Next.js 15+ (App Router)
- **Vorteile**: SSR, SEO, Performance, TypeScript-Support
- **Komponenten**: shadcn/ui (accessible, themeable)
- **Styling**: Tailwind CSS
- **Formulare**: React Hook Form + Zod Validation
- **State Management**: Zustand (lightweight, TypeScript-first)
- **Charts**: Recharts (responsive, declarative)

**PWA Support**:
- Service Worker für Offline-Nutzung
- Installierbar auf Mobile/Desktop
- Push-Benachrichtigungen

### Backend

**Runtime**: Node.js 20+ LTS
**Framework**: Next.js API Routes
- **Vorteile**: Type-safe API, Edge Runtime, Middleware

**Authentication**: Supabase Auth
- JWT-based
- 2FA Support
- Session Management
- Password Policies

**Database**: PostgreSQL 15+ (via Supabase)
- **Vorteile**: ACID-compliant, JSON support, Full-text search
- **Extensions**: pgcrypto, uuid-ossp, pg_stat_statements

**ORM**: Prisma
- Type-safe queries
- Migrations
- Schema documentation

**Storage**: Supabase Storage
- S3-compatible
- Row-Level Security
- Automatic image optimization

**Caching**: Redis
- Session storage
- Query caching
- Rate limiting

**Queue**: BullMQ (Redis-based)
- SEPA file generation
- Report generation
- Email sending
- Backup jobs

### DevOps

**Hosting**: Vercel (Frontend) + Supabase (Backend)
- EU-Region (DSGVO)
- Auto-scaling
- CDN
- DDoS protection

**CI/CD**: GitHub Actions
- Automated testing
- Linting
- Type checking
- Deployment

**Monitoring**:
- Sentry (Error tracking)
- Vercel Analytics (Performance)
- Supabase Logs (Database)
- Uptime Robot (Availability)

**Backup**:
- Supabase automated daily backups
- Weekly full database dumps to S3
- Retention: 30 days

---

## Datenbankschema (PostgreSQL)

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### members
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  street VARCHAR(255),
  postal_code VARCHAR(10),
  city VARCHAR(100),
  country VARCHAR(2) DEFAULT 'DE',
  date_of_birth DATE,
  joined_at DATE NOT NULL,
  left_at DATE,
  membership_type VARCHAR(50) NOT NULL, -- regular, reduced, family, honorary
  payment_interval VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
  sepa_mandate_id VARCHAR(100),
  sepa_mandate_date DATE,
  iban VARCHAR(34),
  bic VARCHAR(11),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_members_member_number ON members(member_number);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_joined_at ON members(joined_at);
```

#### membership_fees
```sql
CREATE TABLE membership_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  interval VARCHAR(20) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date DATE NOT NULL,
  posting_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- income, expense
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  account_id UUID REFERENCES accounts(id),
  member_id UUID REFERENCES members(id),
  donation_id UUID REFERENCES donations(id),
  description TEXT NOT NULL,
  receipt_id UUID REFERENCES receipts(id),
  project_id UUID REFERENCES projects(id),
  vat_rate DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancelled_by_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  version INT DEFAULT 1,

  CONSTRAINT positive_amount CHECK (amount >= 0),
  CONSTRAINT valid_dates CHECK (posting_date >= transaction_date)
);

CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
```

#### receipts
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  ocr_text TEXT, -- optional OCR extracted text
  encrypted BOOLEAN DEFAULT TRUE,
  checksum VARCHAR(64) NOT NULL -- SHA-256
);
```

#### accounts
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- cash, bank, project
  iban VARCHAR(34),
  bic VARCHAR(11),
  opening_balance DECIMAL(10,2) DEFAULT 0,
  opening_date DATE NOT NULL,
  closed_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### donations
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donation_number VARCHAR(50) UNIQUE NOT NULL,
  donation_date DATE NOT NULL,
  donor_first_name VARCHAR(100),
  donor_last_name VARCHAR(100),
  donor_company VARCHAR(255),
  donor_street VARCHAR(255),
  donor_postal_code VARCHAR(10),
  donor_city VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  purpose VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,
  receipt_issued BOOLEAN DEFAULT FALSE,
  receipt_number VARCHAR(50),
  receipt_date DATE,
  member_id UUID REFERENCES members(id), -- if donor is member
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_donation CHECK (amount > 0)
);

CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_member ON donations(member_id);
```

#### donation_receipts
```sql
CREATE TABLE donation_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  donation_id UUID REFERENCES donations(id),
  issue_date DATE NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_street VARCHAR(255) NOT NULL,
  recipient_postal_code VARCHAR(10) NOT NULL,
  recipient_city VARCHAR(100) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  pdf_path VARCHAR(500),
  generated_at TIMESTAMPTZ,
  generated_by UUID REFERENCES users(id),
  voided BOOLEAN DEFAULT FALSE,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES users(id)
);
```

#### budgets
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fiscal_year INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  planned_amount DECIMAL(10,2) NOT NULL,
  project_id UUID REFERENCES projects(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  CONSTRAINT unique_budget_category UNIQUE(fiscal_year, category, subcategory, project_id)
);
```

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(10,2),
  responsible_user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- login, create, update, delete, export
  entity_type VARCHAR(100) NOT NULL, -- transaction, member, donation
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

#### gdpr_deletion_requests
```sql
CREATE TABLE gdpr_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id),
  request_date TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES users(id),
  scheduled_deletion_date DATE NOT NULL, -- considering retention periods
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, executed, rejected
  notes TEXT
);
```

---

## API-Design (REST)

### Authentication

**POST /api/auth/login**
```json
Request:
{
  "email": "string",
  "password": "string",
  "twoFactorToken": "string?" // optional
}

Response:
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "string",
    "requiresTwoFactor": boolean
  }
}
```

**POST /api/auth/2fa/setup**
**POST /api/auth/refresh**
**POST /api/auth/logout**

### Members

**GET /api/members**
```json
Query params: ?page=1&limit=20&search=string&status=active

Response:
{
  "data": [
    {
      "id": "uuid",
      "memberNumber": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "membershipType": "string",
      "joinedAt": "date",
      "status": "active|left"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**POST /api/members**
**GET /api/members/:id**
**PUT /api/members/:id**
**DELETE /api/members/:id** (soft delete, GDPR-compliant)

### Transactions

**GET /api/transactions**
```json
Query: ?from=date&to=date&category=string&account=uuid&page=1&limit=50

Response:
{
  "data": [
    {
      "id": "uuid",
      "transactionNumber": "string",
      "transactionDate": "date",
      "type": "income|expense",
      "category": "string",
      "amount": number,
      "description": "string",
      "accountId": "uuid",
      "receiptId": "uuid?"
    }
  ],
  "summary": {
    "totalIncome": number,
    "totalExpenses": number,
    "balance": number
  },
  "pagination": {...}
}
```

**POST /api/transactions**
**GET /api/transactions/:id**
**POST /api/transactions/:id/cancel** (storno, not delete)
**GET /api/transactions/:id/receipt** (download receipt)

### Donations

**GET /api/donations**
**POST /api/donations**
**POST /api/donations/:id/receipt** (generate Zuwendungsbestätigung)
**GET /api/donations/receipts/:receiptNumber** (download PDF)

### Reports

**GET /api/reports/cashbook**
```json
Query: ?from=date&to=date&account=uuid&format=json|pdf|csv

Response (JSON):
{
  "period": {
    "from": "date",
    "to": "date"
  },
  "openingBalance": number,
  "transactions": [...],
  "closingBalance": number,
  "summary": {
    "totalIncome": number,
    "totalExpenses": number,
    "netChange": number
  }
}
```

**GET /api/reports/budget-comparison**
**GET /api/reports/annual-statement**
**GET /api/reports/membership-statistics**
**GET /api/reports/donation-statistics**

### GDPR

**GET /api/gdpr/data-export/:memberId** (Art. 15 DSGVO)
```json
Response:
{
  "member": {...},
  "transactions": [...],
  "donations": [...],
  "documents": [...],
  "auditLogs": [...]
}
```

**POST /api/gdpr/deletion-request** (Art. 17 DSGVO)
**GET /api/gdpr/processing-activities** (Art. 30 DSGVO)

---

## Sicherheitsarchitektur

### Authentifizierung und Autorisierung

**Multi-Layer Security**:
1. **API Gateway**: Rate limiting, request validation
2. **JWT Tokens**: Short-lived access tokens (15 min), refresh tokens (7 days)
3. **2FA**: TOTP-based (RFC 6238)
4. **Row-Level Security**: PostgreSQL RLS policies
5. **RBAC**: Role-based access control

**Password Policy**:
- Minimum 12 characters
- Complexity: uppercase, lowercase, digits, special chars
- Password history (last 5)
- Bcrypt hashing (cost factor 12)
- Account lockout after 5 failed attempts

### Verschlüsselung

**Data at Rest**:
- PostgreSQL Transparent Data Encryption (TDE)
- AES-256 encryption for backups
- Encrypted file storage (Supabase Storage)

**Data in Transit**:
- TLS 1.3 only
- HSTS enabled
- Certificate pinning (mobile apps)

**Sensitive Data**:
- PII encrypted at column level (pgcrypto)
- Encryption keys in Hardware Security Module (HSM) or Key Management Service

### Audit Logging

**All actions logged**:
- User authentication (success/failure)
- Data modifications (CREATE, UPDATE, DELETE)
- GDPR requests (export, deletion)
- Admin actions
- Failed authorization attempts

**Log retention**: 6 months (GDPR Art. 5)

**Log fields**:
- Timestamp
- User ID
- Action type
- Entity affected
- IP address
- User agent
- Old/new values (for updates)

### Network Security

**Firewall Rules**:
- Whitelist only necessary ports (443)
- Database accessible only from application server
- Admin UI from restricted IPs (optional)

**DDoS Protection**:
- Vercel Edge Network
- Rate limiting (100 requests/minute per IP)
- Challenge for suspicious activity

---

## Deployment-Architektur

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                            │
│  • DDoS Protection • WAF • CDN • DNS                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  • Auto-scaling • SSL/TLS • Edge Functions                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js Application                       │  │
│  │  • API Routes • SSR • Static Assets                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (EU Region)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │ Auth Service │  │ Storage      │     │
│  │ (Primary)    │  │ (JWT/2FA)    │  │ (Encrypted)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ PostgreSQL   │  │ Redis        │                        │
│  │ (Replica)    │  │ (Cache)      │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     AWS S3 (EU-Central-1)                    │
│  • Encrypted Backups • Document Archive                      │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: snyk/actions/node@master
        with:
          command: test

  deploy:
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/actions/cli@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Monitoring und Alerting

**Application Monitoring**:
- Sentry (Error tracking, performance)
- Vercel Analytics (Core Web Vitals)
- Supabase Logs (Database queries)

**Infrastructure Monitoring**:
- Uptime Robot (Availability checks every 5 min)
- Pingdom (Performance from multiple locations)

**Alerts**:
- Email/SMS for critical errors
- Slack integration for warnings
- PagerDuty for on-call rotation

**Metrics**:
- Response times (p50, p95, p99)
- Error rates
- Database query performance
- Cache hit rates
- Active users
- Failed login attempts

---

## Skalierungskonzept

### Horizontal Scaling

**Application Layer**:
- Vercel auto-scales based on traffic
- Serverless functions scale to zero
- Edge runtime for global distribution

**Database Layer**:
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Database partitioning for large tables (transactions by year)

**Caching Strategy**:
- Redis for session data
- CDN for static assets
- API response caching (stale-while-revalidate)

### Performance Optimization

**Database Optimization**:
- Proper indexing on frequently queried columns
- Materialized views for complex reports
- Query optimization with EXPLAIN ANALYZE
- Regular VACUUM and ANALYZE

**Frontend Optimization**:
- Code splitting (route-based)
- Lazy loading of components
- Image optimization (Next.js Image)
- Font optimization (next/font)
- Preloading critical resources

**API Optimization**:
- Pagination for large datasets
- GraphQL for flexible queries (optional)
- Request batching
- Compression (gzip/brotli)

---

## Backup und Disaster Recovery

### Backup-Strategie (3-2-1 Regel)

**3 Kopien der Daten**:
1. Production database
2. Daily automated Supabase backup
3. Weekly full dump to S3

**2 verschiedene Medien**:
1. Supabase storage (database)
2. AWS S3 (external)

**1 Kopie off-site**:
- S3 in different region (eu-west-1)

### Recovery Procedures

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 24 hours

**Incident Response Plan**:
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Determine severity and impact
3. **Containment**: Isolate affected systems
4. **Recovery**: Restore from backup
5. **Communication**: Notify stakeholders
6. **Post-mortem**: Document and improve

**Disaster Recovery Testing**: Quarterly

---

## Compliance-Architektur

### DSGVO-Compliance

**Privacy by Design**:
- Minimal data collection
- Pseudonymization where possible
- Automatic deletion after retention periods
- Consent management

**Data Processing Agreement (DPA)**:
- Signed with all processors (Vercel, Supabase, AWS)
- EU-based data centers
- Standard contractual clauses

**Data Breach Response**:
- Detection within 72 hours (automated monitoring)
- Notification process (authority + affected persons)
- Incident log and documentation

### GoBD-Compliance

**Unveränderbarkeit**:
- Append-only transaction log
- Stornobuchungen instead of deletions
- Versionierung mit Zeitstempeln

**Nachvollziehbarkeit**:
- Audit trail for all changes
- Original receipts linked to transactions
- User attribution for all actions

**Aufbewahrung**:
- Automated archiving
- Legal hold for relevant documents
- Retention policy enforcement (10 years)

### Zertifizierungen (Roadmap)

- **GoBD-Zertifizierung**: Nach Produktivstart
- **ISO 27001**: IT-Sicherheit
- **TISAX** (optional): Automotive-Zulieferer
- **SOC 2 Type II** (optional): US-Markt

---

## Integration-Architektur

### Banking-Integration (optional)

**HBCI/FinTS**:
- AqBanking library
- Secure key storage (HSM)
- Automated transaction import

**SEPA**:
- XML generation (ISO 20022)
- Batch processing for Lastschriften
- Validation before submission

### Third-Party Integrations

**Accounting Software** (DATEV):
- CSV export in DATEV format
- Account mapping
- Periodic sync

**Email Service** (SendGrid):
- Transactional emails (receipts, notifications)
- Templates with i18n
- Delivery tracking

**PDF Generation** (Puppeteer):
- Server-side rendering
- Legal-compliant templates
- Digital signatures (optional)

**Analytics** (Privacy-friendly):
- Plausible Analytics (DSGVO-konform)
- No cookies required
- Aggregated data only

---

## Migration-Strategie

### Datenübernahme

**Phase 1: Assessment**
- Analyse bestehender Daten
- Datenqualität prüfen
- Mapping definieren

**Phase 2: Preparation**
- Bereinigung der Altdaten
- Validierung
- Test-Migration in Staging

**Phase 3: Migration**
- Import mit Fortschrittsanzeige
- Validierung nach Import
- Parallelbetrieb (2 Wochen)

**Phase 4: Cutover**
- Finale Datenmigration
- System-Umstellung
- Altsystem deaktivieren

### Rollback-Plan

- Snapshots vor Migration
- Rollback innerhalb 24h möglich
- Dokumentierte Rollback-Prozedur

---

## Testing-Strategie

### Test-Pyramide

```
     ┌─────────────┐
     │    E2E      │  10% (Critical User Journeys)
     │  (Playwright)│
     └─────────────┘
    ┌───────────────┐
    │  Integration  │  20% (API, Database)
    │  (Jest)       │
    └───────────────┘
   ┌─────────────────┐
   │   Unit Tests    │  70% (Business Logic)
   │   (Jest/Vitest) │
   └─────────────────┘
```

### Test-Coverage-Ziele

- Unit Tests: > 80%
- Integration Tests: Critical paths
- E2E Tests: Happy paths + error cases
- Security Tests: Penetration testing (annually)
- Performance Tests: Load testing before release

### Test-Environments

1. **Local**: Developer machines
2. **CI**: GitHub Actions
3. **Staging**: Preview deployments (Vercel)
4. **Production**: Live system

---

## Dokumentation

### Technische Dokumentation

- **Architecture Decision Records (ADR)**: Design decisions
- **API Documentation**: OpenAPI/Swagger
- **Database Schema**: ER-Diagramm, Tabellenbeschreibungen
- **Deployment Guide**: Setup-Anleitung
- **Runbook**: Incident response, troubleshooting

### Benutzer-Dokumentation

- **User Manual**: Schritt-für-Schritt-Anleitungen
- **Video Tutorials**: Screencast für Hauptfunktionen
- **FAQ**: Häufige Fragen
- **Release Notes**: Änderungen pro Version

### Admin-Dokumentation

- **Installation Guide**
- **Configuration Reference**
- **Backup/Restore Procedures**
- **Security Hardening**
- **Monitoring Setup**

---

## Zusammenfassung

### Architektur-Highlights

✅ **Modern**: Next.js 15, React, TypeScript, Supabase
✅ **Secure**: Multi-layer security, encryption, 2FA, RLS
✅ **Compliant**: DSGVO, GoBD, Steuerrecht
✅ **Scalable**: Serverless, edge computing, caching
✅ **Maintainable**: Clean architecture, testing, documentation
✅ **Cost-effective**: Vercel + Supabase (€50-200/month für kleinen Verein)

### Technologie-Begründung

**Next.js**:
- SSR für SEO und Performance
- API Routes für Backend
- TypeScript-first
- Große Community

**Supabase**:
- PostgreSQL (robust, ACID)
- Built-in Auth (JWT, 2FA)
- Row-Level Security (DSGVO)
- EU-Hosting verfügbar
- Kosteneffizient

**Vercel**:
- Auto-scaling
- Edge Network
- Preview-Deployments
- DDoS-Schutz
- EU-Compliance

### Alternativen (Erwägungen)

**Backend**:
- ❌ Django/FastAPI: Mehr Overhead, separates Hosting
- ❌ Ruby on Rails: Weniger TypeScript-Integration
- ✅ Next.js: Full-stack TypeScript, Vercel-Integration

**Database**:
- ❌ MongoDB: Nicht ACID-compliant, weniger GoBD-geeignet
- ❌ MySQL: Weniger Features als PostgreSQL
- ✅ PostgreSQL: ACID, JSON, RLS, Replication

**Hosting**:
- ❌ Self-hosted: Mehr Aufwand, Sicherheitsrisiken
- ❌ AWS/GCP: Komplexität, höhere Kosten
- ✅ Vercel + Supabase: Managed, skalierbar, EU-Compliance

---

## Nächste Schritte (Implementierung)

1. ✅ Anforderungsanalyse (abgeschlossen)
2. ✅ Systemarchitektur (abgeschlossen)
3. ⏭️ Prototyping (UI-Design, DB-Schema)
4. ⏭️ MVP-Entwicklung (Kern-Features)
5. ⏭️ Testing und QA
6. ⏭️ DSGVO-Audit
7. ⏭️ GoBD-Zertifizierung
8. ⏭️ Pilotierung mit Testverein
9. ⏭️ Produktivstart

---

## Anhang

### Referenzen

- Next.js: https://nextjs.org
- Supabase: https://supabase.com
- Prisma: https://www.prisma.io
- Vercel: https://vercel.com
- GoBD: BMF-Schreiben 28.11.2019
- DSGVO: https://dsgvo-gesetz.de

### Änderungshistorie

| Version | Datum | Autor | Änderungen |
|---------|-------|-------|------------|
| 1.0 | 2025-10-20 | Research Agent | Initiale Erstellung |
