-- ============================================================
-- 006_remove_email_unique_constraint.sql
-- Temporarily remove UNIQUE constraint on email for testing
-- ============================================================

ALTER TABLE registrants DROP INDEX email;
