-- 009_add_delegate_details.sql
-- Adds delegate_details JSON column to existing registrants records.

ALTER TABLE registrants
  ADD COLUMN IF NOT EXISTS delegate_details JSON NULL AFTER num_people;
