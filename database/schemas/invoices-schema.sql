-- Invoices Module Schema
-- Rechnungsmodul für OpenFinance

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  -- Invoice details
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  tax_rate DECIMAL(5, 2) DEFAULT 19.00,
  tax_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL,

  -- Status and dates
  status invoice_status DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,

  -- Payment info
  payment_method TEXT,
  payment_reference TEXT,

  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,

  -- PDF
  pdf_url TEXT,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  tax_rate DECIMAL(5, 2) DEFAULT 19.00,
  amount DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  seq TEXT;
BEGIN
  year := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq := LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE))::TEXT, 4, '0');
  NEW.invoice_number := 'INV-' || year || '-' || seq;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

-- Auto-update updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tax_amount := NEW.amount * (NEW.tax_rate / 100);
  NEW.total_amount := NEW.amount + NEW.tax_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_invoice_totals_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_totals();

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Admin and treasurer can see all invoices
CREATE POLICY "Admin and treasurer can view all invoices"
ON invoices FOR SELECT
USING (
  auth.has_role('admin') OR
  auth.has_role('treasurer')
);

-- Members can view their own invoices
CREATE POLICY "Members can view own invoices"
ON invoices FOR SELECT
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Admin and treasurer can manage invoices
CREATE POLICY "Admin and treasurer can manage invoices"
ON invoices FOR ALL
USING (
  auth.has_role('admin') OR
  auth.has_role('treasurer')
);

-- Invoice items follow invoice permissions
CREATE POLICY "View invoice items with invoice permission"
ON invoice_items FOR SELECT
USING (
  invoice_id IN (SELECT id FROM invoices)
);

CREATE POLICY "Manage invoice items with invoice permission"
ON invoice_items FOR ALL
USING (
  auth.has_role('admin') OR
  auth.has_role('treasurer')
);

-- Indexes for performance
CREATE INDEX idx_invoices_member ON invoices(member_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
