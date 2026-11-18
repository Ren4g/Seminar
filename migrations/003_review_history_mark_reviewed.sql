ALTER TABLE review_history
  DROP CONSTRAINT IF EXISTS review_history_event_type_check;

ALTER TABLE review_history
  ADD CONSTRAINT review_history_event_type_check
  CHECK (event_type IN ('SUBMIT','WITHDRAW','APPROVE','REJECT','PUBLISH','UNPUBLISH','REPUBLISH','MARK_REVIEWED'));
