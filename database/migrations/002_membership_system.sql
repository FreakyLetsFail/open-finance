-- Beitragsverwaltungs-System Migration
-- Version: 002
-- Beschreibung: Vollständiges System für Mitgliederverwaltung, Beiträge, Zahlungen und Mahnwesen

-- ============================================
-- TABLES
-- ============================================

-- Mitglieder-Tabelle
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    member_number VARCHAR(50) UNIQUE NOT NULL,
    salutation VARCHAR(20) CHECK (salutation IN ('Herr', 'Frau', 'Divers')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,

    -- Adresse
    street VARCHAR(200),
    house_number VARCHAR(10),
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(2) DEFAULT 'DE',

    -- Mitgliedschaftsinformationen
    membership_start DATE NOT NULL,
    membership_end DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'cancelled')),

    -- SEPA-Informationen
    iban VARCHAR(34),
    bic VARCHAR(11),
    account_holder VARCHAR(200),
    sepa_mandate_reference VARCHAR(35) UNIQUE,
    sepa_mandate_date DATE,
    sepa_mandate_status VARCHAR(20) CHECK (sepa_mandate_status IN ('pending', 'active', 'revoked', 'expired')),

    -- Metadaten
    notes TEXT,
    tags TEXT[],
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Beitragsdefinitionen
CREATE TABLE IF NOT EXISTS contribution_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Beitragstyp
    contribution_type VARCHAR(30) NOT NULL CHECK (contribution_type IN ('membership_fee', 'entrance_fee', 'special_fee', 'donation', 'other')),

    -- Betragsberechnung
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Wiederkehrende Beiträge
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_interval VARCHAR(20) CHECK (recurrence_interval IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'one_time')),

    -- Gültigkeitszeitraum
    valid_from DATE NOT NULL,
    valid_until DATE,

    -- Kategorisierung
    category VARCHAR(50),
    is_tax_deductible BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadaten
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mitgliedschafts-Beitragszuweisungen
CREATE TABLE IF NOT EXISTS member_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    contribution_definition_id UUID NOT NULL REFERENCES contribution_definitions(id) ON DELETE RESTRICT,

    -- Individuelle Anpassungen
    custom_amount DECIMAL(10, 2),
    custom_interval VARCHAR(20) CHECK (custom_interval IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'one_time')),

    -- Zeitraum
    start_date DATE NOT NULL,
    end_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Automatisierung
    auto_generate_invoices BOOLEAN DEFAULT TRUE,
    auto_process_payment BOOLEAN DEFAULT FALSE,

    -- Metadaten
    notes TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_member_contribution UNIQUE (member_id, contribution_definition_id, start_date)
);

-- Beitragsrechnungen
CREATE TABLE IF NOT EXISTS contribution_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,

    -- Verknüpfungen
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    member_contribution_id UUID REFERENCES member_contributions(id) ON DELETE SET NULL,

    -- Rechnungsinformationen
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,

    -- Beträge
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Zahlungsinformationen
    payment_method VARCHAR(30) CHECK (payment_method IN ('sepa_debit', 'bank_transfer', 'cash', 'card', 'other')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded')),
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    paid_date DATE,

    -- Mahnwesen
    reminder_level INTEGER DEFAULT 0,
    last_reminder_date DATE,
    next_reminder_date DATE,

    -- Beschreibung
    description TEXT,
    line_items JSONB,

    -- Metadaten
    notes TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zahlungen
CREATE TABLE IF NOT EXISTS contribution_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,

    -- Verknüpfungen
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES contribution_invoices(id) ON DELETE SET NULL,

    -- Zahlungsinformationen
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Zahlungsmethode
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('sepa_debit', 'bank_transfer', 'cash', 'card', 'other')),
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),

    -- SEPA-spezifisch
    sepa_transaction_id VARCHAR(100),
    sepa_execution_date DATE,
    sepa_mandate_reference VARCHAR(35),

    -- Bankdaten
    bank_reference VARCHAR(100),
    transaction_reference VARCHAR(200),

    -- Beschreibung
    description TEXT,

    -- Metadaten
    notes TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mahnungen
CREATE TABLE IF NOT EXISTS contribution_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_number VARCHAR(50) UNIQUE NOT NULL,

    -- Verknüpfungen
    invoice_id UUID NOT NULL REFERENCES contribution_invoices(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,

    -- Mahninformationen
    reminder_level INTEGER NOT NULL CHECK (reminder_level >= 1 AND reminder_level <= 3),
    reminder_date DATE NOT NULL,

    -- Beträge
    original_amount DECIMAL(10, 2) NOT NULL,
    reminder_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Frist
    payment_deadline DATE NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'paid', 'escalated', 'cancelled')),

    -- Kommunikation
    sent_via VARCHAR(20) CHECK (sent_via IN ('email', 'post', 'both')),
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Beschreibung
    description TEXT,

    -- Metadaten
    notes TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEPA-Lastschrift-Batches
CREATE TABLE IF NOT EXISTS sepa_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(50) UNIQUE NOT NULL,

    -- Batch-Informationen
    batch_date DATE NOT NULL,
    execution_date DATE NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'prepared', 'submitted', 'executed', 'failed', 'cancelled')),

    -- Statistiken
    total_transactions INTEGER DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- SEPA-XML
    sepa_xml_file TEXT,
    sepa_xml_generated_at TIMESTAMP WITH TIME ZONE,

    -- Metadaten
    notes TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEPA-Lastschrift-Transaktionen
CREATE TABLE IF NOT EXISTS sepa_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Verknüpfungen
    batch_id UUID REFERENCES sepa_batches(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES contribution_invoices(id) ON DELETE SET NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,

    -- Transaktionsinformationen
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    mandate_reference VARCHAR(35) NOT NULL,

    -- Beträge
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Kontodaten
    debtor_name VARCHAR(200) NOT NULL,
    debtor_iban VARCHAR(34) NOT NULL,
    debtor_bic VARCHAR(11),

    -- Ausführung
    execution_date DATE NOT NULL,
    collection_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'executed', 'returned', 'failed', 'cancelled')),

    -- Fehlerbehandlung
    error_code VARCHAR(50),
    error_message TEXT,
    return_reason VARCHAR(200),

    -- Beschreibung
    description TEXT,

    -- Metadaten
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Members
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_member_number ON members(member_number);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_membership_start ON members(membership_start);
CREATE INDEX idx_members_sepa_mandate ON members(sepa_mandate_reference);

-- Contribution Definitions
CREATE INDEX idx_contribution_definitions_type ON contribution_definitions(contribution_type);
CREATE INDEX idx_contribution_definitions_active ON contribution_definitions(is_active);
CREATE INDEX idx_contribution_definitions_valid_from ON contribution_definitions(valid_from);

-- Member Contributions
CREATE INDEX idx_member_contributions_member_id ON member_contributions(member_id);
CREATE INDEX idx_member_contributions_definition_id ON member_contributions(contribution_definition_id);
CREATE INDEX idx_member_contributions_active ON member_contributions(is_active);
CREATE INDEX idx_member_contributions_dates ON member_contributions(start_date, end_date);

-- Invoices
CREATE INDEX idx_contribution_invoices_member_id ON contribution_invoices(member_id);
CREATE INDEX idx_contribution_invoices_invoice_number ON contribution_invoices(invoice_number);
CREATE INDEX idx_contribution_invoices_payment_status ON contribution_invoices(payment_status);
CREATE INDEX idx_contribution_invoices_due_date ON contribution_invoices(due_date);
CREATE INDEX idx_contribution_invoices_invoice_date ON contribution_invoices(invoice_date);

-- Payments
CREATE INDEX idx_contribution_payments_member_id ON contribution_payments(member_id);
CREATE INDEX idx_contribution_payments_invoice_id ON contribution_payments(invoice_id);
CREATE INDEX idx_contribution_payments_payment_date ON contribution_payments(payment_date);
CREATE INDEX idx_contribution_payments_status ON contribution_payments(payment_status);

-- Reminders
CREATE INDEX idx_contribution_reminders_invoice_id ON contribution_reminders(invoice_id);
CREATE INDEX idx_contribution_reminders_member_id ON contribution_reminders(member_id);
CREATE INDEX idx_contribution_reminders_level ON contribution_reminders(reminder_level);
CREATE INDEX idx_contribution_reminders_status ON contribution_reminders(status);

-- SEPA
CREATE INDEX idx_sepa_batches_status ON sepa_batches(status);
CREATE INDEX idx_sepa_batches_execution_date ON sepa_batches(execution_date);
CREATE INDEX idx_sepa_transactions_batch_id ON sepa_transactions(batch_id);
CREATE INDEX idx_sepa_transactions_member_id ON sepa_transactions(member_id);
CREATE INDEX idx_sepa_transactions_status ON sepa_transactions(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Mitgliedsnummer generieren
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    year_prefix VARCHAR(4);
BEGIN
    year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    new_number := year_prefix || LPAD((
        SELECT COUNT(*) + 1
        FROM members
        WHERE member_number LIKE year_prefix || '%'
    )::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Rechnungsnummer generieren
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    year_prefix VARCHAR(4);
BEGIN
    year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    new_number := 'INV-' || year_prefix || '-' || LPAD((
        SELECT COUNT(*) + 1
        FROM contribution_invoices
        WHERE invoice_number LIKE 'INV-' || year_prefix || '%'
    )::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Zahlungsnummer generieren
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    year_prefix VARCHAR(4);
BEGIN
    year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    new_number := 'PAY-' || year_prefix || '-' || LPAD((
        SELECT COUNT(*) + 1
        FROM contribution_payments
        WHERE payment_number LIKE 'PAY-' || year_prefix || '%'
    )::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Mahnnummer generieren
CREATE OR REPLACE FUNCTION generate_reminder_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    year_prefix VARCHAR(4);
BEGIN
    year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    new_number := 'REM-' || year_prefix || '-' || LPAD((
        SELECT COUNT(*) + 1
        FROM contribution_reminders
        WHERE reminder_number LIKE 'REM-' || year_prefix || '%'
    )::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- SEPA Batch-Nummer generieren
CREATE OR REPLACE FUNCTION generate_sepa_batch_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    year_prefix VARCHAR(4);
BEGIN
    year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    new_number := 'SEPA-' || year_prefix || '-' || LPAD((
        SELECT COUNT(*) + 1
        FROM sepa_batches
        WHERE batch_number LIKE 'SEPA-' || year_prefix || '%'
    )::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Rechnungsstatus automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contribution_invoices
    SET
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM contribution_payments
            WHERE invoice_id = NEW.invoice_id
            AND payment_status = 'completed'
        ),
        payment_status = CASE
            WHEN (SELECT SUM(amount) FROM contribution_payments
                  WHERE invoice_id = NEW.invoice_id AND payment_status = 'completed') >= total_amount
            THEN 'paid'
            WHEN (SELECT SUM(amount) FROM contribution_payments
                  WHERE invoice_id = NEW.invoice_id AND payment_status = 'completed') > 0
            THEN 'partial'
            ELSE payment_status
        END,
        paid_date = CASE
            WHEN (SELECT SUM(amount) FROM contribution_payments
                  WHERE invoice_id = NEW.invoice_id AND payment_status = 'completed') >= total_amount
            THEN NEW.payment_date
            ELSE paid_date
        END
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Überfällige Rechnungen markieren
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE contribution_invoices
    SET payment_status = 'overdue'
    WHERE payment_status = 'pending'
    AND due_date < CURRENT_DATE;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Wiederkehrende Beiträge generieren
CREATE OR REPLACE FUNCTION generate_recurring_invoices(p_period_start DATE, p_period_end DATE)
RETURNS TABLE (
    member_id UUID,
    invoice_id UUID,
    amount DECIMAL,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO contribution_invoices (
        invoice_number,
        member_id,
        member_contribution_id,
        invoice_date,
        due_date,
        period_start,
        period_end,
        amount,
        total_amount,
        payment_method
    )
    SELECT
        generate_invoice_number(),
        mc.member_id,
        mc.id,
        p_period_start,
        p_period_start + INTERVAL '14 days',
        p_period_start,
        p_period_end,
        COALESCE(mc.custom_amount, cd.amount),
        COALESCE(mc.custom_amount, cd.amount),
        CASE WHEN m.sepa_mandate_status = 'active' THEN 'sepa_debit' ELSE 'bank_transfer' END
    FROM member_contributions mc
    JOIN contribution_definitions cd ON mc.contribution_definition_id = cd.id
    JOIN members m ON mc.member_id = m.id
    WHERE mc.is_active = TRUE
    AND mc.auto_generate_invoices = TRUE
    AND cd.is_recurring = TRUE
    AND cd.is_active = TRUE
    AND mc.start_date <= p_period_end
    AND (mc.end_date IS NULL OR mc.end_date >= p_period_start)
    AND m.status = 'active'
    RETURNING member_id, id AS invoice_id, amount, 'created'::VARCHAR AS status;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-generate member number
CREATE TRIGGER set_member_number_trigger
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION (
    CASE
        WHEN NEW.member_number IS NULL OR NEW.member_number = '' THEN
            generate_member_number()
        ELSE
            NEW.member_number
    END
);

-- Update timestamps
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contribution_definitions_updated_at
BEFORE UPDATE ON contribution_definitions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_contributions_updated_at
BEFORE UPDATE ON member_contributions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contribution_invoices_updated_at
BEFORE UPDATE ON contribution_invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contribution_payments_updated_at
BEFORE UPDATE ON contribution_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contribution_reminders_updated_at
BEFORE UPDATE ON contribution_reminders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sepa_batches_updated_at
BEFORE UPDATE ON sepa_batches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sepa_transactions_updated_at
BEFORE UPDATE ON sepa_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update invoice status on payment
CREATE TRIGGER update_invoice_status_on_payment
AFTER INSERT OR UPDATE ON contribution_payments
FOR EACH ROW
WHEN (NEW.invoice_id IS NOT NULL AND NEW.payment_status = 'completed')
EXECUTE FUNCTION update_invoice_payment_status();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Standard Beitragsdefinitionen
INSERT INTO contribution_definitions (name, description, contribution_type, amount, is_recurring, recurrence_interval, valid_from, is_active)
VALUES
    ('Jahresbeitrag Standard', 'Regulärer Mitgliedsbeitrag pro Jahr', 'membership_fee', 120.00, TRUE, 'annual', '2025-01-01', TRUE),
    ('Jahresbeitrag Ermäßigt', 'Ermäßigter Beitrag für Studenten, Rentner, etc.', 'membership_fee', 60.00, TRUE, 'annual', '2025-01-01', TRUE),
    ('Monatsbeitrag Standard', 'Regulärer Mitgliedsbeitrag pro Monat', 'membership_fee', 10.00, TRUE, 'monthly', '2025-01-01', TRUE),
    ('Aufnahmegebühr', 'Einmalige Gebühr bei Beitritt', 'entrance_fee', 25.00, FALSE, 'one_time', '2025-01-01', TRUE)
ON CONFLICT DO NOTHING;
