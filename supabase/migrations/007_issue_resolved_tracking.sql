-- Track when issues are resolved instead of losing history
ALTER TABLE department_comments
  ADD COLUMN IF NOT EXISTS issue_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS issue_created_at timestamptz;

-- Set issue_created_at for existing open issues
UPDATE department_comments
  SET issue_created_at = now()
  WHERE has_issue = true AND issue_created_at IS NULL;
