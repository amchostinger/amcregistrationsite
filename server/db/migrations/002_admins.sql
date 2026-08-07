-- Migration 002: Admin users table
-- Run: mysql -u root -p amc_conference_2027 < server/db/migrations/002_admins.sql

CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login    DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin: admin@amc2027.org / Admin@2027
-- Change this password immediately after first login!
-- Hash below is bcrypt of "Admin@2027" with 12 rounds
INSERT INTO admins (name, email, password_hash) VALUES (
  'AMC Administrator',
  'admin@amc2027.org',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFp8.ot7YnKmFMgqlC'
) ON DUPLICATE KEY UPDATE id = id;
