-- Returned portions retain their original loan ID; existing history is preserved.
ALTER TABLE loans ADD COLUMN IF NOT EXISTS original_quantity INTEGER;
UPDATE loans SET original_quantity=quantity WHERE original_quantity IS NULL;
ALTER TABLE loans ALTER COLUMN original_quantity SET NOT NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS parent_loan_id BIGINT REFERENCES loans(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS returned_by BIGINT REFERENCES users(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS repaired_by BIGINT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS loans_parent_idx ON loans(parent_loan_id);

CREATE TABLE IF NOT EXISTS loan_return_requests (
  request_id UUID PRIMARY KEY,
  loan_id BIGINT NOT NULL REFERENCES loans(id),
  actor_id BIGINT NOT NULL REFERENCES users(id),
  payload JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id BIGINT,
  actor_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_recent_idx ON audit_logs(id DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type,entity_id);

CREATE OR REPLACE FUNCTION record_inventory_audit() RETURNS TRIGGER AS $$
DECLARE
  previous JSONB;
  current_data JSONB;
  actor BIGINT;
  actor_label TEXT;
  operation TEXT;
BEGIN
  previous := CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  current_data := CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  -- Exclude credentials, OTPs and image contents, retaining image-change evidence only.
  IF TG_TABLE_NAME='users' THEN
    previous := previous - ARRAY['password_hash','google_sub','avatar_data'];
    current_data := current_data - ARRAY['password_hash','google_sub','avatar_data'];
    IF TG_OP='UPDATE' AND OLD.avatar_data IS DISTINCT FROM NEW.avatar_data THEN
      previous := previous || jsonb_build_object('avatar_changed',false);
      current_data := current_data || jsonb_build_object('avatar_changed',true);
    END IF;
  ELSIF TG_TABLE_NAME='equipment' THEN
    previous := previous - 'image_data';
    current_data := current_data - 'image_data';
    IF TG_OP='UPDATE' AND OLD.image_data IS DISTINCT FROM NEW.image_data THEN
      previous := previous || jsonb_build_object('image_changed',false);
      current_data := current_data || jsonb_build_object('image_changed',true);
    END IF;
  END IF;
  IF TG_OP='UPDATE' AND (previous - 'updated_at') IS NOT DISTINCT FROM (current_data - 'updated_at') THEN RETURN NEW; END IF;
  actor := NULLIF(current_setting('app.actor_id',true),'')::BIGINT;
  SELECT COALESCE(NULLIF(full_name,''),username) INTO actor_label FROM users WHERE id=actor;
  operation := lower(TG_OP);
  IF TG_TABLE_NAME='loans' THEN
    IF current_data->>'repaired_at' IS NOT NULL AND previous->>'repaired_at' IS NULL THEN operation:='repair';
    ELSIF current_data->>'status'='returned' AND (TG_OP='INSERT' OR previous->>'status'='borrowed') THEN operation:='return';
    ELSIF TG_OP='UPDATE' AND (current_data->>'quantity')::INT < (previous->>'quantity')::INT THEN operation:='partial_return';
    ELSIF TG_OP='INSERT' THEN operation:='borrow'; END IF;
  END IF;
  INSERT INTO audit_logs(actor_id,actor_name,entity_type,entity_id,action,before_data,after_data)
  VALUES(actor,COALESCE(actor_label,'ระบบ / ไม่ระบุผู้ทำรายการ'),TG_TABLE_NAME,COALESCE((current_data->>'id')::BIGINT,(previous->>'id')::BIGINT),operation,previous,current_data);
  RETURN COALESCE(NEW,OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loans_audit AFTER INSERT OR UPDATE OR DELETE ON loans FOR EACH ROW EXECUTE FUNCTION record_inventory_audit();
CREATE TRIGGER equipment_audit AFTER INSERT OR UPDATE OR DELETE ON equipment FOR EACH ROW EXECUTE FUNCTION record_inventory_audit();
CREATE TRIGGER users_audit AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION record_inventory_audit();
