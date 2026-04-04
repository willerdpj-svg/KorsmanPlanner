-- Create quotations table for multiple quotes per project
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quotation_number text,
  amount numeric(12,2) NOT NULL,
  date_issued date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'declined')),
  date_accepted date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotations_project_id ON quotations(project_id);
CREATE INDEX idx_quotations_status ON quotations(status);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Staff can do everything
CREATE POLICY "Staff full access to quotations"
  ON quotations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Migrate existing quotation data from projects table
INSERT INTO quotations (project_id, quotation_number, amount, date_issued, status, date_accepted)
SELECT
  id,
  quotation_number,
  COALESCE(quotation_amount, 0),
  quotation_date,
  COALESCE(quote_status, 'draft'),
  date_accepting
FROM projects
WHERE quotation_amount IS NOT NULL OR quotation_number IS NOT NULL;
