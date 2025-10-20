-- Receipts Module Schema
-- Belegverwaltung für OpenFinance

-- Receipt status enum
CREATE TYPE receipt_status AS ENUM ('submitted', 'pending', 'approved', 'rejected', 'paid');

-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number TEXT UNIQUE NOT NULL,

  -- Submitter info
  submitted_by UUID REFERENCES users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id),

  -- Receipt details
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  receipt_date DATE NOT NULL,

  -- Category
  category_id UUID REFERENCES categories(id),

  -- File upload
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,

  -- Status and workflow
  status receipt_status DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,

  -- Payment
  paid_by UUID REFERENCES users(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  payment_reference TEXT,
  transaction_id UUID REFERENCES transactions(id),

  -- Rejection
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  seq TEXT;
BEGIN
  year := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq := LPAD((SELECT COUNT(*) + 1 FROM receipts WHERE EXTRACT(YEAR FROM receipt_date) = EXTRACT(YEAR FROM CURRENT_DATE))::TEXT, 4, '0');
  NEW.receipt_number := 'REC-' || year || '-' || seq;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipt_number
BEFORE INSERT ON receipts
FOR EACH ROW
WHEN (NEW.receipt_number IS NULL)
EXECUTE FUNCTION generate_receipt_number();

-- Auto-update updated_at
CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON receipts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
ON receipts FOR SELECT
USING (
  submitted_by = auth.uid() OR
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

-- Admin and treasurer can view all receipts
CREATE POLICY "Admin and treasurer can view all receipts"
ON receipts FOR SELECT
USING (
  auth.has_role('admin') OR
  auth.has_role('treasurer')
);

-- Users can submit receipts
CREATE POLICY "Users can submit receipts"
ON receipts FOR INSERT
WITH CHECK (
  submitted_by = auth.uid()
);

-- Users can update their pending receipts
CREATE POLICY "Users can update pending receipts"
ON receipts FOR UPDATE
USING (
  submitted_by = auth.uid() AND
  status = 'submitted'
);

-- Admin and treasurer can manage all receipts
CREATE POLICY "Admin and treasurer can manage receipts"
ON receipts FOR ALL
USING (
  auth.has_role('admin') OR
  auth.has_role('treasurer')
);

-- Indexes for performance
CREATE INDEX idx_receipts_submitter ON receipts(submitted_by);
CREATE INDEX idx_receipts_member ON receipts(member_id);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_dates ON receipts(receipt_date, submitted_at);
CREATE INDEX idx_receipts_category ON receipts(category_id);
