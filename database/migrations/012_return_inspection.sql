-- Pending returns remain borrowed until staff inspect and accept them.
ALTER TABLE loans ADD COLUMN IF NOT EXISTS pending_return JSONB;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS return_rejection TEXT;
ALTER TABLE loans ADD CONSTRAINT pending_return_only_borrowed CHECK (pending_return IS NULL OR status='borrowed');
