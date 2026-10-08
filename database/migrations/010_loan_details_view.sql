-- Existing databases may not have applied these additive migrations yet.
ALTER TABLE loans ADD COLUMN IF NOT EXISTS borrower_name VARCHAR(120);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS repaired_at TIMESTAMPTZ;

-- Readable loan history. Equipment and account details reflect their current
-- values; borrower_name preserves the name supplied when borrowing, if present.
CREATE OR REPLACE VIEW loan_details AS
SELECT
  l.id AS loan_id,
  l.equipment_id,
  e.code AS equipment_code,
  e.name AS equipment_name,
  e.category AS equipment_category,
  l.quantity,
  l.user_id,
  COALESCE(NULLIF(l.borrower_name, ''), u.full_name) AS borrower_name,
  u.username AS borrower_username,
  u.student_id AS borrower_student_id,
  l.borrowed_at,
  l.due_at,
  l.returned_at,
  l.status,
  l.return_condition,
  CASE WHEN l.borrow_remark IS NOT NULL AND l.borrow_remark <> ''
         OR l.return_remark IS NOT NULL AND l.return_remark <> ''
         OR l.return_condition IN ('damaged', 'abnormal', 'lost')
       THEN COALESCE(l.returned_at, l.borrowed_at)
  END AS issue_reported_at,
  l.repaired_at,
  CASE
    WHEN l.repaired_at IS NOT NULL THEN 'completed'
    WHEN l.return_condition IN ('damaged', 'abnormal') THEN 'pending'
    WHEN l.return_condition = 'lost' THEN 'lost'
    ELSE NULL
  END AS repair_status,
  l.borrow_remark,
  l.return_remark,
  (l.status = 'borrowed' AND l.due_at < NOW()) AS is_overdue,
  l.updated_at
FROM loans l
LEFT JOIN equipment e ON e.id = l.equipment_id
LEFT JOIN users u ON u.id = l.user_id;
