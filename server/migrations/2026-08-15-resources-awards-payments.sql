-- Migration: 2026-08-15
-- Conference resources, award categories, speaker grouping, and the payments
-- columns that were too narrow to record a gateway failure.
--
-- Apply with:  mysql amc_conference_2027 < server/migrations/2026-08-15-resources-awards-payments.sql
-- Every statement is written to be safe to re-run.

-- ── 1. Registration Office/Role: add "Admin Bishop" and "Other" ──────────────
ALTER TABLE registrants MODIFY COLUMN office
  ENUM('Administrative Assistant','Admin Bishop','AMC Executive Member','Bishop',
       'Conference Secretary','General Secretary','Prelate','Presiding Bishop',
       'Secretary of Conference','Other') NOT NULL;

-- ── 2. Speakers grouped under Speakers / Host / Secretariat ──────────────────
-- The public page falls back to 'speaker' for anything unrecognised.
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'speakers' AND COLUMN_NAME = 'category');
SET @sql := IF(@col = 0,
  'ALTER TABLE speakers ADD COLUMN category ENUM(''speaker'',''host'',''secretary'') NOT NULL DEFAULT ''speaker'' AFTER keynote',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 3. Conference resources ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id            INT NOT NULL AUTO_INCREMENT,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  category      ENUM('Presentation','Keynote Material','Document','Report','Other')
                  NOT NULL DEFAULT 'Document',
  speaker_name  VARCHAR(200) NOT NULL DEFAULT '',
  file_url      VARCHAR(500) NOT NULL DEFAULT '',
  external_url  VARCHAR(500) NOT NULL DEFAULT '',
  file_size     INT NOT NULL DEFAULT 0,
  published     TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_published (published, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── 4. Award categories ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS award_categories (
  id            INT NOT NULL AUTO_INCREMENT,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  criteria      TEXT,
  published     TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_published (published, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── 5. Payments: let a failed gateway call actually be recorded ──────────────
-- The code writes status='failed' and stores the gateway message. Neither the
-- enum nor the 50-char column could hold that, so the error handler threw its
-- own error and the request surfaced as an opaque 500.
ALTER TABLE payments MODIFY COLUMN status
  ENUM('pending','awaiting_delivery','delivered','created','sent','cancelled',
       'disputed','refunded','paid','failed') DEFAULT 'pending';

ALTER TABLE payments MODIFY COLUMN paynow_status_raw TEXT NULL;
