-- ============================================================================
-- Vereinsfinanzverwaltungssystem - Initial Database Schema
-- ============================================================================
-- Version: 1.0.0
-- Database: PostgreSQL (Supabase)
-- Description: Comprehensive schema for club financial management
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS - Type Definitions
-- ============================================================================

-- Transaction types
CREATE TYPE transaction_type AS ENUM (
    'income',           -- Einnahme
    'expense',          -- Ausgabe
    'transfer'          -- Umbuchung
);

-- Transaction status
CREATE TYPE transaction_status AS ENUM (
    'draft',            -- Entwurf
    'pending',          -- Ausstehend
    'completed',        -- Abgeschlossen
    'cancelled'         -- Storniert
);

-- Payment methods
CREATE TYPE payment_method AS ENUM (
    'cash',             -- Bar
    'bank_transfer',    -- Überweisung
    'direct_debit',     -- Lastschrift
    'card',             -- Karte
    'paypal',           -- PayPal
    'other'             -- Sonstiges
);

-- Member status
CREATE TYPE member_status AS ENUM (
    'active',           -- Aktiv
    'inactive',         -- Inaktiv
    'honorary',         -- Ehrenmitglied
    'suspended'         -- Suspendiert
);

-- Contribution frequency
CREATE TYPE contribution_frequency AS ENUM (
    'monthly',          -- Monatlich
    'quarterly',        -- Vierteljährlich
    'semi_annual',      -- Halbjährlich
    'annual',           -- Jährlich
    'one_time'          -- Einmalig
);

-- User role types
CREATE TYPE user_role_type AS ENUM (
    'admin',            -- Administrator
    'treasurer',        -- Kassenwart
    'board_member',     -- Vorstand
    'auditor',          -- Kassenprüfer
    'member',           -- Mitglied
    'read_only'         -- Nur Lesezugriff
);

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Users Table (Benutzer)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication (linked to Supabase Auth)
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Personal Information
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Comments
COMMENT ON TABLE users IS 'System users with authentication and profile information';
COMMENT ON COLUMN users.auth_user_id IS 'Link to Supabase Auth user';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';

-- ----------------------------------------------------------------------------
-- 2.2 Roles Table (Rollen)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Role Information
    name VARCHAR(100) UNIQUE NOT NULL,
    role_type user_role_type NOT NULL,
    description TEXT,

    -- Permissions (JSON for flexibility)
    permissions JSONB DEFAULT '{}'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_roles_type ON roles(role_type);
CREATE INDEX idx_roles_is_active ON roles(is_active);

COMMENT ON TABLE roles IS 'User roles and permissions';
COMMENT ON COLUMN roles.permissions IS 'JSON object containing detailed permissions';

-- ----------------------------------------------------------------------------
-- 2.3 User Roles Junction Table
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

    -- Validity period
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(user_id, role_id),
    CONSTRAINT valid_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_valid ON user_roles(valid_from, valid_until);

COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles';

-- ----------------------------------------------------------------------------
-- 2.4 Members Table (Mitglieder)
-- ----------------------------------------------------------------------------
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Member Number (unique identifier)
    member_number VARCHAR(20) UNIQUE NOT NULL,

    -- Personal Information (GDPR compliant)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,

    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),

    -- Address
    street VARCHAR(200),
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(2) DEFAULT 'DE', -- ISO 3166-1 alpha-2

    -- Membership Information
    member_status member_status DEFAULT 'active',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,

    -- Financial
    iban VARCHAR(34), -- Encrypted in practice
    bic VARCHAR(11),
    sepa_mandate_date DATE,
    sepa_mandate_reference VARCHAR(35),

    -- Privacy & Consent
    data_processing_consent BOOLEAN DEFAULT false,
    data_processing_consent_date TIMESTAMPTZ,
    newsletter_consent BOOLEAN DEFAULT false,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT email_format_members CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT exit_after_join CHECK (exit_date IS NULL OR exit_date >= join_date),
    CONSTRAINT iban_format CHECK (iban IS NULL OR LENGTH(iban) >= 15),
    CONSTRAINT consent_required CHECK (data_processing_consent = true OR (iban IS NULL AND sepa_mandate_date IS NULL))
);

-- Indexes
CREATE INDEX idx_members_number ON members(member_number);
CREATE INDEX idx_members_status ON members(member_status);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_name ON members(last_name, first_name);
CREATE INDEX idx_members_join_date ON members(join_date);

COMMENT ON TABLE members IS 'Club members with personal and financial information (GDPR compliant)';
COMMENT ON COLUMN members.member_number IS 'Unique member identifier';
COMMENT ON COLUMN members.iban IS 'Bank account for SEPA direct debit (should be encrypted)';
COMMENT ON COLUMN members.data_processing_consent IS 'GDPR consent for data processing';

-- ----------------------------------------------------------------------------
-- 2.5 Categories Table (Kategorien)
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Category Information
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- For accounting
    description TEXT,

    -- Category Type
    category_type transaction_type NOT NULL,

    -- Hierarchy (for sub-categories)
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    -- Budget
    budget_amount DECIMAL(10,2),
    budget_period VARCHAR(20), -- 'monthly', 'quarterly', 'annual'

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT budget_positive CHECK (budget_amount IS NULL OR budget_amount >= 0),
    CONSTRAINT no_self_reference CHECK (parent_id != id)
);

-- Indexes
CREATE INDEX idx_categories_type ON categories(category_type);
CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

COMMENT ON TABLE categories IS 'Transaction categories with hierarchical structure and budgets';
COMMENT ON COLUMN categories.code IS 'Accounting code for categorization';
COMMENT ON COLUMN categories.parent_id IS 'Parent category for hierarchical structure';

-- ----------------------------------------------------------------------------
-- 2.6 Contributions Table (Beiträge)
-- ----------------------------------------------------------------------------
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Member Reference
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

    -- Contribution Details
    name VARCHAR(200) NOT NULL, -- e.g., "Monatsbeitrag", "Sonderbeitrag"
    amount DECIMAL(10,2) NOT NULL,
    frequency contribution_frequency NOT NULL,

    -- Validity Period
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,

    -- Payment Information
    payment_method payment_method DEFAULT 'direct_debit',
    payment_day_of_month INTEGER, -- 1-28 for monthly payments

    -- Category
    category_id UUID REFERENCES categories(id),

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT amount_positive CHECK (amount > 0),
    CONSTRAINT valid_period_contributions CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_payment_day CHECK (payment_day_of_month IS NULL OR (payment_day_of_month >= 1 AND payment_day_of_month <= 28))
);

-- Indexes
CREATE INDEX idx_contributions_member ON contributions(member_id);
CREATE INDEX idx_contributions_frequency ON contributions(frequency);
CREATE INDEX idx_contributions_active ON contributions(is_active);
CREATE INDEX idx_contributions_dates ON contributions(start_date, end_date);

COMMENT ON TABLE contributions IS 'Member contribution definitions (recurring or one-time)';
COMMENT ON COLUMN contributions.frequency IS 'How often the contribution is due';
COMMENT ON COLUMN contributions.payment_day_of_month IS 'Day of month for recurring payments';

-- ----------------------------------------------------------------------------
-- 2.7 Transactions Table (Buchungen)
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Transaction Number (unique for auditing)
    transaction_number VARCHAR(50) UNIQUE NOT NULL,

    -- Transaction Details
    transaction_type transaction_type NOT NULL,
    transaction_status transaction_status DEFAULT 'pending',

    -- Amount and Currency
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Dates
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    value_date DATE,
    booking_date DATE DEFAULT CURRENT_DATE,

    -- References
    member_id UUID REFERENCES members(id),
    contribution_id UUID REFERENCES contributions(id),
    category_id UUID NOT NULL REFERENCES categories(id),

    -- Payment Information
    payment_method payment_method NOT NULL,
    reference VARCHAR(200), -- Bank reference, receipt number, etc.

    -- Description
    description TEXT NOT NULL,
    notes TEXT,

    -- Supporting Documents
    receipt_url TEXT, -- Link to stored receipt/invoice
    attachment_urls JSONB DEFAULT '[]'::jsonb,

    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID REFERENCES users(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT amount_positive_transactions CHECK (amount > 0),
    CONSTRAINT valid_dates CHECK (value_date IS NULL OR value_date >= transaction_date),
    CONSTRAINT reconciled_consistency CHECK (
        (is_reconciled = false AND reconciled_at IS NULL) OR
        (is_reconciled = true AND reconciled_at IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(transaction_status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_reconciled ON transactions(is_reconciled);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

COMMENT ON TABLE transactions IS 'All financial transactions (income, expenses, transfers)';
COMMENT ON COLUMN transactions.transaction_number IS 'Unique transaction identifier for auditing';
COMMENT ON COLUMN transactions.value_date IS 'Bank value date (Wertstellung)';
COMMENT ON COLUMN transactions.is_reconciled IS 'Whether transaction has been reconciled with bank statement';

-- ============================================================================
-- 3. AUDIT & HISTORY TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Audit Log Table
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Audit Information
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'

    -- Changes
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],

    -- Context
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all table modifications';

-- ============================================================================
-- 4. HELPER TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Fiscal Years Table
-- ----------------------------------------------------------------------------
CREATE TABLE fiscal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Fiscal Year Information
    year_name VARCHAR(50) NOT NULL UNIQUE, -- e.g., "2024"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Status
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES users(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT valid_fiscal_year CHECK (end_date > start_date)
);

CREATE INDEX idx_fiscal_years_dates ON fiscal_years(start_date, end_date);

COMMENT ON TABLE fiscal_years IS 'Fiscal year definitions for accounting periods';

-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 Updated At Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5.2 Audit Log Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), current_setting('app.current_user_id', true)::UUID);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_members AFTER INSERT OR UPDATE OR DELETE ON members
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ----------------------------------------------------------------------------
-- 5.3 Transaction Number Generator
-- ----------------------------------------------------------------------------
CREATE SEQUENCE transaction_number_seq;

CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_number IS NULL THEN
        NEW.transaction_number := 'TX' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                                 LPAD(nextval('transaction_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_transaction_number_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION generate_transaction_number();

-- ----------------------------------------------------------------------------
-- 5.4 Member Number Generator
-- ----------------------------------------------------------------------------
CREATE SEQUENCE member_number_seq;

CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.member_number IS NULL THEN
        NEW.member_number := 'M' || LPAD(nextval('member_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_member_number_trigger
    BEFORE INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION generate_member_number();

COMMENT ON FUNCTION generate_transaction_number() IS 'Auto-generates unique transaction numbers';
COMMENT ON FUNCTION generate_member_number() IS 'Auto-generates unique member numbers';
