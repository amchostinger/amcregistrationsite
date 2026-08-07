-- ============================================================
-- 001_init.sql — AMC 2027 Conference Database Schema
-- Run: mysql -u root -p amc_conference_2027 < server/db/migrations/001_init.sql
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Registrants ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrants (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  registration_ref      VARCHAR(20) UNIQUE NOT NULL COMMENT 'e.g. AMC2027-00042',
  designation           ENUM(
                          'Archbishop','Bishop','Dr','His Eminence',
                          'Most Revd Dr','Most Revd Prof','Mr','Mrs','Ms',
                          'Presiding Prelate','Revd','Revd Dr','Rt Revd','Very Revd'
                        ) NOT NULL,
  first_name            VARCHAR(100) NOT NULL,
  last_name             VARCHAR(100) NOT NULL,
  email                 VARCHAR(255) NOT NULL,
  phone                 VARCHAR(30),
  office                ENUM(
                          'Administrative Assistant','AMC Executive Member','Bishop',
                          'Conference Secretary','General Secretary','Prelate',
                          'Presiding Bishop','Secretary of Conference'
                        ) NOT NULL,
  category              ENUM('Delegate','Invited Guest','Observer') NOT NULL,
  church                VARCHAR(255),
  country               VARCHAR(100),
  accommodation         BOOLEAN DEFAULT FALSE,
  accommodation_nights  INT DEFAULT 0,
  num_people            INT DEFAULT 1,
  delegate_details      JSON NULL,
  dietary_requirements  TEXT,
  special_requests      TEXT,
  payment_status        ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  registration_status   ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email            (email),
  INDEX idx_payment_status   (payment_status),
  INDEX idx_registration_status (registration_status),
  INDEX idx_category         (category),
  INDEX idx_country          (country),
  INDEX idx_created_at       (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Payments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  registrant_id       INT NOT NULL,
  paynow_poll_url     VARCHAR(500),
  paynow_reference    VARCHAR(100),
  amount              DECIMAL(10,2) NOT NULL,
  currency            ENUM('USD','ZWL') DEFAULT 'USD',
  payment_method      ENUM('ecocash','visa','mastercard','telecash','paynow','bank') DEFAULT 'ecocash',
  status              ENUM(
                        'pending','awaiting_delivery','delivered','created',
                        'sent','cancelled','disputed','refunded','paid'
                      ) DEFAULT 'pending',
  paynow_status_raw   VARCHAR(50),
  paid_at             TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_registrant_id  (registrant_id),
  INDEX idx_status         (status),
  INDEX idx_created_at     (created_at),

  FOREIGN KEY (registrant_id)
    REFERENCES registrants(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Admin Audit Log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  admin_clerk_id  VARCHAR(100) NOT NULL,
  action          VARCHAR(100) NOT NULL,
  target_table    VARCHAR(50),
  target_id       INT,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_admin_clerk_id (admin_clerk_id),
  INDEX idx_created_at     (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Conference Settings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conference_settings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed Default Settings ────────────────────────────────────────────────────
INSERT INTO conference_settings (setting_key, setting_value) VALUES
  ('conference_name',                    '3rd General Conference 2027'),
  ('conference_dates',                   'March 9–14, 2027'),
  ('conference_location',                'Harare, Zimbabwe'),
  ('conference_start_date',             '2027-03-09'),
  ('registration_fee_delegate_usd',      '400'),
  ('registration_fee_observer_usd',      '400'),
  ('registration_fee_guest_usd',         '400'),
  ('accommodation_fee_per_night_usd',    '80'),
  ('registration_open',                  'true'),
  ('max_registrations',                  '500'),
  ('conference_theme',                   'Equipped to transform Africa's sociopolitical and economic landscape'),
  ('conference_theme_scripture',         'Isaiah 61:1'),
  ('venue_name',                         'Rainbow Towers Hotel & Conference Centre'),
  ('venue_address',                      'Pennefather Avenue, Harare, Zimbabwe')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
