# Database Schema Documentation

## Overview

This directory contains the complete database schema for the Vereinsfinanzverwaltungssystem (Club Financial Management System), designed for Supabase PostgreSQL.

## Directory Structure

```
database/
├── schemas/           # Database schema definitions
│   └── initial-schema.sql
├── policies/          # Row Level Security policies
│   └── rls-policies.sql
├── migrations/        # Migration scripts
│   └── 001_initial_setup.sql
└── README.md         # This file
```

## Schema Components

### Core Tables

1. **users** - System users with authentication
2. **roles** - User roles and permissions
3. **user_roles** - User-role assignments (many-to-many)
4. **members** - Club members (GDPR compliant)
5. **categories** - Transaction categories with hierarchy
6. **contributions** - Member contribution definitions
7. **transactions** - Financial transactions
8. **audit_log** - Complete audit trail
9. **fiscal_years** - Fiscal year definitions

### Key Features

#### 🔒 Security & Privacy
- **Row Level Security (RLS)** on all tables
- **GDPR-compliant** member data handling
- **Audit trail** for all modifications
- **Role-based access control** with granular permissions
- **Data anonymization** function for GDPR compliance

#### 💾 Data Integrity
- **Referential integrity** via foreign keys
- **Check constraints** for data validation
- **Triggers** for automatic field updates
- **Sequences** for unique identifiers
- **Enums** for type safety

#### ⚡ Performance
- **Comprehensive indexes** on frequently queried columns
- **Optimized queries** via proper indexing
- **Efficient RLS policies** with security definer functions
- **Views** for common queries

## Database Relationships

```
users ←→ user_roles ←→ roles
  ↓
members → contributions → transactions
             ↓              ↓
         categories ← categories
```

## Installation

### Prerequisites
- Supabase project
- PostgreSQL 14+
- Supabase CLI (optional, for local development)

### Deployment to Supabase

#### Option 1: Via Supabase Dashboard
1. Go to SQL Editor in your Supabase project
2. Create a new query
3. Copy content from `migrations/001_initial_setup.sql`
4. Execute the migration

#### Option 2: Via Supabase CLI (Recommended)
```bash
# Initialize Supabase (if not done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Create migration
supabase migration new initial_setup

# Copy migration content
cp database/migrations/001_initial_setup.sql supabase/migrations/[timestamp]_initial_setup.sql

# Apply migration
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/database.ts
```

## Enums

### transaction_type
- `income` - Einnahme
- `expense` - Ausgabe
- `transfer` - Umbuchung

### transaction_status
- `draft` - Entwurf
- `pending` - Ausstehend
- `completed` - Abgeschlossen
- `cancelled` - Storniert

### payment_method
- `cash` - Bar
- `bank_transfer` - Überweisung
- `direct_debit` - Lastschrift
- `card` - Karte
- `paypal` - PayPal
- `other` - Sonstiges

### member_status
- `active` - Aktiv
- `inactive` - Inaktiv
- `honorary` - Ehrenmitglied
- `suspended` - Suspendiert

### contribution_frequency
- `monthly` - Monatlich
- `quarterly` - Vierteljährlich
- `semi_annual` - Halbjährlich
- `annual` - Jährlich
- `one_time` - Einmalig

### user_role_type
- `admin` - Administrator
- `treasurer` - Kassenwart
- `board_member` - Vorstand
- `auditor` - Kassenprüfer
- `member` - Mitglied
- `read_only` - Nur Lesezugriff

## Row Level Security (RLS) Policies

### Access Levels

#### Admin
- Full access to all tables
- Can manage users and roles
- Can delete records

#### Treasurer
- Full access to financial data (read/write)
- Can manage members
- Cannot delete reconciled transactions

#### Board Member
- Read access to members and transactions
- Can view reports
- Cannot modify financial data

#### Auditor
- Read access to all financial data
- Access to audit logs
- Cannot modify data

#### Member
- Limited read access to member directory
- Can view own profile
- No access to financial data

### Key RLS Functions

```sql
-- Check if user has specific role
auth.has_role(role_type)

-- Check if user is admin
auth.is_admin()

-- Check if user is treasurer
auth.is_treasurer()

-- Check if user can read financial data
auth.can_read_financial()

-- Check if user can write financial data
auth.can_write_financial()
```

## Triggers & Automation

### Updated At Triggers
Automatically updates `updated_at` timestamp on record modification for all tables.

### Audit Triggers
Automatically logs all INSERT, UPDATE, DELETE operations to `audit_log` table for:
- members
- transactions
- users

### Auto-Generated Numbers
- **Transaction numbers**: `TX-YYYYMMDD-XXXXXX` format
- **Member numbers**: `M-XXXXXX` format

## GDPR Compliance

### Data Protection
1. **Consent tracking**: `data_processing_consent` and `newsletter_consent` fields
2. **Consent dates**: Timestamp of when consent was given
3. **Data minimization**: Only necessary fields are stored
4. **Access control**: RLS ensures users can only access authorized data

### Right to be Forgotten
```sql
-- Anonymize member data
SELECT anonymize_member('member-uuid-here');
```

This function:
- Replaces personal data with "ANONYMIZED"
- Removes contact information
- Removes financial data (IBAN, etc.)
- Maintains transaction history (anonymized)
- Logs the anonymization in audit_log

### Data Retention
- Financial transactions: Keep for 10 years (German law)
- Audit logs: Keep indefinitely for compliance
- Member data: Remove upon request (with anonymization)

## Default Seed Data

### Roles
- System Administrator
- Kassenwart (Treasurer)
- Vorstand (Board Member)
- Kassenprüfer (Auditor)
- Mitglied (Member)
- Nur Lesezugriff (Read Only)

### Categories
**Income:**
- Mitgliedsbeiträge (INC-001)
- Spenden (INC-002)
- Veranstaltungseinnahmen (INC-003)
- Zuschüsse (INC-004)
- Sonstige Einnahmen (INC-999)

**Expense:**
- Miete (EXP-001)
- Versicherungen (EXP-002)
- Büromaterial (EXP-003)
- Veranstaltungskosten (EXP-004)
- Marketing (EXP-005)
- IT & Software (EXP-006)
- Reisekosten (EXP-007)
- Honorare (EXP-008)
- Bankgebühren (EXP-009)
- Sonstige Ausgaben (EXP-999)

**Transfer:**
- Interne Umbuchung (TRF-001)

### Fiscal Years
- 2024 (Jan 1 - Dec 31)
- 2025 (Jan 1 - Dec 31)

## Views

### members_public
Limited member information for regular members (GDPR compliant):
- id, member_number, first_name, last_name, email, member_status, join_date

### financial_summary
Aggregated financial data for reporting:
- Monthly summaries by transaction type and category
- Count, total, and average amounts

## Best Practices

### Security
1. Always use RLS policies
2. Never expose raw member data to unauthorized users
3. Use views for limited data access
4. Validate input data with CHECK constraints
5. Encrypt sensitive fields (IBAN) at application level

### Performance
1. Use indexes on foreign keys
2. Use covering indexes for common queries
3. Partition large tables (transactions) by date if needed
4. Use connection pooling via Supabase

### Data Quality
1. Always set `created_by` and `updated_by`
2. Use transactions for multi-table operations
3. Validate data before insert/update
4. Use enums for type safety

### Audit Trail
1. All financial operations are logged
2. Review audit_log regularly
3. Use audit trail for compliance reporting
4. Never delete audit records

## Maintenance

### Regular Tasks
1. **Monthly**: Review audit logs
2. **Quarterly**: Verify RLS policies
3. **Annually**:
   - Create new fiscal year
   - Close previous fiscal year
   - Archive old data
   - Review and optimize indexes

### Backup Strategy
1. Supabase automatic daily backups
2. Export critical data weekly
3. Test restore procedures monthly
4. Keep offline backups for compliance

## Troubleshooting

### Common Issues

#### RLS Policy Errors
```sql
-- Check if user has required role
SELECT auth.has_role('treasurer'::user_role_type);

-- View current user's roles
SELECT r.*
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = auth.current_user_id();
```

#### Missing Permissions
```sql
-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

#### Audit Trail Not Working
```sql
-- Set current user ID before operations
SET app.current_user_id = 'user-uuid-here';
```

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 001 | 2025-10-20 | Initial schema with all core tables, RLS policies, and seed data |

## Support

For questions or issues with the database schema:
1. Check this README
2. Review schema comments in SQL files
3. Check Supabase documentation
4. Create an issue in the project repository

## License

This schema is part of the Vereinsfinanzverwaltungssystem project.
