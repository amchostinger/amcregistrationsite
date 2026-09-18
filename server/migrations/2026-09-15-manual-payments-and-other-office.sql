-- Migration: 2026-09-15
-- 1. Bank transfers settled outside Paynow: proof-of-payment files and an
--    admin confirmation trail on the payments ledger.
-- 2. A free-typed office/role for registrants who pick "Other".
--
-- Apply with:
--   mysql amc_conference_2027 < server/migrations/2026-09-15-manual-payments-and-other-office.sql
-- Every statement is written to be safe to re-run.

-- ── 1. Registrants: the role behind "Other" ─────────────────────────────────
-- The ENUM already carries 'Other'; this column holds what the registrant
-- actually typed (e.g. "Communications Officer"). Display everywhere goes
-- through officeLabel() so 'Other' is never shown on its own.
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrants' AND COLUMN_NAME = 'office_other');
SET @sql := IF(@col = 0,
  'ALTER TABLE registrants ADD COLUMN office_other VARCHAR(150) NULL AFTER office',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. Payments: proof of payment + admin confirmation trail ────────────────
-- Paynow cannot collect a direct bank transfer, so those payments are settled
-- by hand: the delegate uploads their proof, an admin checks it and flips the
-- record to 'paid', which is what the revenue figures count.
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'proof_url');
SET @sql := IF(@col = 0,
  'ALTER TABLE payments
     ADD COLUMN proof_url         VARCHAR(500) NULL AFTER paynow_status_raw,
     ADD COLUMN proof_filename    VARCHAR(255) NULL AFTER proof_url,
     ADD COLUMN proof_uploaded_at TIMESTAMP    NULL AFTER proof_filename,
     ADD COLUMN confirmed_by      VARCHAR(255) NULL AFTER proof_uploaded_at,
     ADD COLUMN confirmed_at      TIMESTAMP    NULL AFTER confirmed_by,
     ADD COLUMN admin_note        VARCHAR(500) NULL AFTER confirmed_at',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 'failed' was added on 2026-08-15; repeated here so a database that skipped
-- that migration still ends up with the full set the application writes.
ALTER TABLE payments MODIFY COLUMN status
  ENUM('pending','awaiting_delivery','delivered','created','sent','cancelled',
       'disputed','refunded','paid','failed') DEFAULT 'pending';
