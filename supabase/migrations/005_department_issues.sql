-- Department issue tracking
ALTER TABLE department_comments
  ADD COLUMN IF NOT EXISTS has_issue boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS issue_notes text,
  ADD COLUMN IF NOT EXISTS issue_assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for fast "projects with open issues" queries
CREATE INDEX IF NOT EXISTS idx_dept_comments_issues
  ON department_comments(project_id)
  WHERE has_issue = true;
