-- All loans with equipment names, borrowers, quantities and return/repair history.
SELECT * FROM public.loan_details ORDER BY borrowed_at DESC, loan_id DESC;

-- Only equipment currently on loan.
SELECT * FROM public.loan_details
WHERE status = 'borrowed'
ORDER BY due_at ASC NULLS LAST, loan_id DESC;

-- Repair/issue history, including completed repairs.
SELECT * FROM public.loan_details
WHERE issue_reported_at IS NOT NULL
ORDER BY issue_reported_at DESC, loan_id DESC;
