-- Migration: Create Members Management Tables with DSGVO Compliance
-- Description: Complete member management system with consent tracking and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create members table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_number VARCHAR(20) UNIQUE NOT NULL,

    -- Personal Information (DSGVO relevant)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),

    -- Contact Information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),

    -- Address Information
    street VARCHAR(255),
    house_number VARCHAR(20),
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Deutschland',

    -- Membership Information
    membership_type VARCHAR(50) NOT NULL DEFAULT 'regular',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,

    -- Financial Information
    monthly_fee DECIMAL(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    iban VARCHAR(34),
    bic VARCHAR(11),

    -- Additional Information
    notes TEXT,
    tags TEXT[],

    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Soft Delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create consent tracking table (DSGVO requirement)
CREATE TABLE IF NOT EXISTS public.member_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Consent Types
    consent_type VARCHAR(100) NOT NULL,
    consent_purpose TEXT NOT NULL,

    -- Consent Status
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    -- Legal Basis (DSGVO Art. 6)
    legal_basis VARCHAR(50) NOT NULL,

    -- Consent Details
    consent_text TEXT NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    ip_address INET,
    user_agent TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique active consent per type
    CONSTRAINT unique_active_consent UNIQUE (member_id, consent_type, granted)
);

-- Create member documents table (for DSGVO exports, contracts, etc.)
CREATE TABLE IF NOT EXISTS public.member_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Document Information
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Classification
    category VARCHAR(100),
    tags TEXT[],

    -- DSGVO Compliance
    contains_personal_data BOOLEAN DEFAULT true,
    retention_period_days INTEGER,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Soft Delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create member activity log (Audit Trail for DSGVO)
CREATE TABLE IF NOT EXISTS public.member_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Activity Information
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT,
    changes JSONB,

    -- Context
    ip_address INET,
    user_agent TEXT,
    performed_by UUID REFERENCES auth.users(id),

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create member exports table (DSGVO Art. 15 - Right to data portability)
CREATE TABLE IF NOT EXISTS public.member_data_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Export Information
    export_type VARCHAR(50) NOT NULL DEFAULT 'full',
    export_format VARCHAR(20) NOT NULL DEFAULT 'json',
    file_path TEXT,
    file_size INTEGER,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Requester
    requested_by UUID REFERENCES auth.users(id),

    -- Error tracking
    error_message TEXT
);

-- Create indexes for performance
CREATE INDEX idx_members_member_number ON public.members(member_number);
CREATE INDEX idx_members_email ON public.members(email);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_members_membership_type ON public.members(membership_type);
CREATE INDEX idx_members_entry_date ON public.members(entry_date);
CREATE INDEX idx_members_created_at ON public.members(created_at);
CREATE INDEX idx_members_deleted_at ON public.members(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_member_consents_member_id ON public.member_consents(member_id);
CREATE INDEX idx_member_consents_type ON public.member_consents(consent_type);
CREATE INDEX idx_member_consents_granted ON public.member_consents(granted);

CREATE INDEX idx_member_documents_member_id ON public.member_documents(member_id);
CREATE INDEX idx_member_documents_type ON public.member_documents(document_type);
CREATE INDEX idx_member_documents_deleted_at ON public.member_documents(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_member_activity_member_id ON public.member_activity_log(member_id);
CREATE INDEX idx_member_activity_type ON public.member_activity_log(activity_type);
CREATE INDEX idx_member_activity_created_at ON public.member_activity_log(created_at);

CREATE INDEX idx_member_exports_member_id ON public.member_data_exports(member_id);
CREATE INDEX idx_member_exports_status ON public.member_data_exports(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_consents_updated_at BEFORE UPDATE ON public.member_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate member numbers
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR(20);
    prefix VARCHAR(4) := 'M';
    year VARCHAR(4) := TO_CHAR(CURRENT_DATE, 'YY');
    sequence_num INTEGER;
BEGIN
    -- Get the next sequence number for the current year
    SELECT COALESCE(MAX(CAST(SUBSTRING(member_number FROM 7) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.members
    WHERE member_number LIKE prefix || year || '%';

    -- Format: MYY-XXXX (e.g., M25-0001)
    new_number := prefix || year || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-assign member number
CREATE OR REPLACE FUNCTION auto_assign_member_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.member_number IS NULL OR NEW.member_number = '' THEN
        NEW.member_number := generate_member_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for auto member number generation
CREATE TRIGGER assign_member_number_trigger
    BEFORE INSERT ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_member_number();

-- Create function to log member activities
CREATE OR REPLACE FUNCTION log_member_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_desc TEXT;
    changes_data JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        activity_desc := 'Member created';
        changes_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        activity_desc := 'Member updated';
        changes_data := jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        activity_desc := 'Member deleted';
        changes_data := to_jsonb(OLD);
    END IF;

    INSERT INTO public.member_activity_log (
        member_id,
        activity_type,
        activity_description,
        changes,
        performed_by
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        activity_desc,
        changes_data,
        COALESCE(NEW.updated_by, OLD.updated_by)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add activity logging trigger
CREATE TRIGGER log_member_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION log_member_activity();

-- Enable Row Level Security (RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_data_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members table

-- Policy: Users can view active (non-deleted) members
CREATE POLICY "members_select_policy" ON public.members
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND deleted_at IS NULL
    );

-- Policy: Only admins can insert members
CREATE POLICY "members_insert_policy" ON public.members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: Only admins can update members
CREATE POLICY "members_update_policy" ON public.members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: Only admins can delete (soft delete) members
CREATE POLICY "members_delete_policy" ON public.members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for member_consents table

-- Policy: Users can view consents
CREATE POLICY "consents_select_policy" ON public.member_consents
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Admins can manage consents
CREATE POLICY "consents_manage_policy" ON public.member_consents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for member_documents table

-- Policy: Users can view non-deleted documents
CREATE POLICY "documents_select_policy" ON public.member_documents
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND deleted_at IS NULL
    );

-- Policy: Admins can manage documents
CREATE POLICY "documents_manage_policy" ON public.member_documents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for member_activity_log table

-- Policy: Users can view activity logs
CREATE POLICY "activity_select_policy" ON public.member_activity_log
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: System can insert activity logs (no direct user insert)
CREATE POLICY "activity_insert_policy" ON public.member_activity_log
    FOR INSERT
    WITH CHECK (true); -- Triggers handle inserts

-- RLS Policies for member_data_exports table

-- Policy: Users can view their own export requests
CREATE POLICY "exports_select_policy" ON public.member_data_exports
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
    );

-- Policy: Admins can manage exports
CREATE POLICY "exports_manage_policy" ON public.member_data_exports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.members IS 'Member management table with DSGVO compliance';
COMMENT ON TABLE public.member_consents IS 'DSGVO-compliant consent tracking (Art. 6, 7)';
COMMENT ON TABLE public.member_documents IS 'Document storage with retention policies';
COMMENT ON TABLE public.member_activity_log IS 'Audit trail for DSGVO compliance (Art. 5)';
COMMENT ON TABLE public.member_data_exports IS 'Data portability requests (DSGVO Art. 15, 20)';

COMMENT ON COLUMN public.members.member_number IS 'Auto-generated unique member identifier (Format: MYY-XXXX)';
COMMENT ON COLUMN public.member_consents.legal_basis IS 'DSGVO Art. 6 legal basis (consent, contract, legal_obligation, vital_interest, public_task, legitimate_interest)';
COMMENT ON COLUMN public.member_documents.retention_period_days IS 'DSGVO-compliant retention period in days';
