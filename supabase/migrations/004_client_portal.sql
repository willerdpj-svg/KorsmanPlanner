-- Client Portal: link Supabase auth users to client records
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id) WHERE user_id IS NOT NULL;

-- Quote lifecycle status on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quote_status text NOT NULL DEFAULT 'draft'
  CHECK (quote_status IN ('draft', 'sent', 'accepted', 'declined'));

-- ============================================================
-- RLS: clients can read their own data via portal
-- ============================================================

-- Clients table: user can read their own record
CREATE POLICY "Client can read own record"
  ON clients FOR SELECT
  USING (user_id = auth.uid());

-- Projects: client can read projects where they are the client
CREATE POLICY "Client can read own projects"
  ON projects FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Invoices: client can read invoices for their projects
CREATE POLICY "Client can read own invoices"
  ON invoices FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Payments: client can read payments for their invoices
CREATE POLICY "Client can read own payments"
  ON payments FOR SELECT
  USING (
    invoice_id IN (
      SELECT inv.id FROM invoices inv
      JOIN projects p ON p.id = inv.project_id
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can update quote_status on their projects (accept/decline)
CREATE POLICY "Client can update quote status"
  ON projects FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );
