-- ============================================================================
-- Migration: 001_initial_setup
-- ============================================================================
-- Description: Initial database setup with schema and RLS policies
-- Date: 2025-10-20
-- Author: Backend API Developer Agent
-- ============================================================================

BEGIN;

-- Execute initial schema
\i '/Users/justuswaechter/Documents/Projekte/open-finance/database/schemas/initial-schema.sql'

-- Execute RLS policies
\i '/Users/justuswaechter/Documents/Projekte/open-finance/database/policies/rls-policies.sql'

-- ============================================================================
-- Seed Data: Default Roles
-- ============================================================================

INSERT INTO roles (name, role_type, description, permissions) VALUES
    (
        'System Administrator',
        'admin',
        'Full system access with all permissions',
        '{
            "members": {"read": true, "write": true, "delete": true},
            "transactions": {"read": true, "write": true, "delete": true},
            "users": {"read": true, "write": true, "delete": true},
            "roles": {"read": true, "write": true, "delete": true},
            "settings": {"read": true, "write": true}
        }'::jsonb
    ),
    (
        'Kassenwart (Treasurer)',
        'treasurer',
        'Financial management and transaction handling',
        '{
            "members": {"read": true, "write": true, "delete": false},
            "transactions": {"read": true, "write": true, "delete": false},
            "contributions": {"read": true, "write": true, "delete": false},
            "categories": {"read": true, "write": true, "delete": false},
            "reports": {"read": true, "write": false}
        }'::jsonb
    ),
    (
        'Vorstand (Board Member)',
        'board_member',
        'Board member with read access to financial data',
        '{
            "members": {"read": true, "write": false, "delete": false},
            "transactions": {"read": true, "write": false, "delete": false},
            "reports": {"read": true, "write": false}
        }'::jsonb
    ),
    (
        'Kassenprüfer (Auditor)',
        'auditor',
        'Audit and compliance review access',
        '{
            "members": {"read": true, "write": false, "delete": false},
            "transactions": {"read": true, "write": false, "delete": false},
            "audit_log": {"read": true, "write": false},
            "reports": {"read": true, "write": false}
        }'::jsonb
    ),
    (
        'Mitglied (Member)',
        'member',
        'Basic member access',
        '{
            "members": {"read": "limited", "write": false, "delete": false},
            "own_profile": {"read": true, "write": "limited"}
        }'::jsonb
    ),
    (
        'Nur Lesezugriff (Read Only)',
        'read_only',
        'Read-only access for reporting',
        '{
            "members": {"read": "limited", "write": false, "delete": false},
            "reports": {"read": true, "write": false}
        }'::jsonb
    );

-- ============================================================================
-- Seed Data: Default Categories
-- ============================================================================

-- Income Categories
INSERT INTO categories (name, code, description, category_type, is_active) VALUES
    ('Mitgliedsbeiträge', 'INC-001', 'Regular member contributions', 'income', true),
    ('Spenden', 'INC-002', 'Donations received', 'income', true),
    ('Veranstaltungseinnahmen', 'INC-003', 'Event ticket sales and revenues', 'income', true),
    ('Zuschüsse', 'INC-004', 'Grants and subsidies', 'income', true),
    ('Sonstige Einnahmen', 'INC-999', 'Other income', 'income', true);

-- Expense Categories
INSERT INTO categories (name, code, description, category_type, is_active) VALUES
    ('Miete', 'EXP-001', 'Rent and facilities', 'expense', true),
    ('Versicherungen', 'EXP-002', 'Insurance premiums', 'expense', true),
    ('Büromaterial', 'EXP-003', 'Office supplies and materials', 'expense', true),
    ('Veranstaltungskosten', 'EXP-004', 'Event organization costs', 'expense', true),
    ('Marketing', 'EXP-005', 'Marketing and advertising', 'expense', true),
    ('IT & Software', 'EXP-006', 'Technology and software licenses', 'expense', true),
    ('Reisekosten', 'EXP-007', 'Travel expenses', 'expense', true),
    ('Honorare', 'EXP-008', 'Professional fees and honorariums', 'expense', true),
    ('Bankgebühren', 'EXP-009', 'Bank fees and charges', 'expense', true),
    ('Sonstige Ausgaben', 'EXP-999', 'Other expenses', 'expense', true);

-- Transfer Category
INSERT INTO categories (name, code, description, category_type, is_active) VALUES
    ('Interne Umbuchung', 'TRF-001', 'Internal transfers between accounts', 'transfer', true);

-- ============================================================================
-- Seed Data: Current Fiscal Year
-- ============================================================================

INSERT INTO fiscal_years (year_name, start_date, end_date, is_closed)
VALUES
    ('2024', '2024-01-01', '2024-12-31', false),
    ('2025', '2025-01-01', '2025-12-31', false);

-- ============================================================================
-- Validation & Verification
-- ============================================================================

-- Verify all tables exist
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'users', 'roles', 'user_roles', 'members', 'categories',
        'contributions', 'transactions', 'audit_log', 'fiscal_years'
    ];
    missing_tables TEXT[];
BEGIN
    SELECT ARRAY_AGG(table_name)
    INTO missing_tables
    FROM UNNEST(expected_tables) AS table_name
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = table_name
    );

    IF missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'Missing tables: %', missing_tables;
    END IF;

    RAISE NOTICE 'All tables created successfully';
END $$;

-- Verify RLS is enabled
DO $$
DECLARE
    tables_without_rls TEXT[];
BEGIN
    SELECT ARRAY_AGG(tablename)
    INTO tables_without_rls
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('users', 'roles', 'user_roles', 'members', 'categories', 'contributions', 'transactions', 'audit_log', 'fiscal_years')
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = pg_tables.tablename
    );

    IF tables_without_rls IS NOT NULL THEN
        RAISE WARNING 'Tables without RLS policies: %', tables_without_rls;
    ELSE
        RAISE NOTICE 'RLS enabled on all critical tables';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT
    'Migration 001_initial_setup completed successfully' as status,
    NOW() as completed_at;
