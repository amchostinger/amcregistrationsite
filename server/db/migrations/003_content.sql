-- 003_content.sql
-- Creates speakers, schedule_sessions, session_speakers, hotels, hotel_bookings

-- ── Speakers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS speakers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200)   NOT NULL,
  designation   VARCHAR(100)   NOT NULL DEFAULT '',
  church        VARCHAR(300)   NOT NULL DEFAULT '',
  country       VARCHAR(100)   NOT NULL DEFAULT '',
  bio           TEXT,
  photo_url     VARCHAR(500),
  keynote       TINYINT(1)     NOT NULL DEFAULT 0,
  display_order INT            NOT NULL DEFAULT 0,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Schedule sessions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  session_date DATE           NOT NULL,
  start_time  TIME           NOT NULL,
  end_time    TIME,
  title       VARCHAR(500)   NOT NULL,
  room        VARCHAR(200),
  type        ENUM('worship','keynote','general','social','break','logistics') NOT NULL DEFAULT 'general',
  description TEXT,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Session ↔ Speaker junction ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_speakers (
  session_id  INT NOT NULL,
  speaker_id  INT NOT NULL,
  role        VARCHAR(200),
  PRIMARY KEY (session_id, speaker_id),
  FOREIGN KEY (session_id) REFERENCES schedule_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (speaker_id) REFERENCES speakers(id)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Hotels ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotels (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(300)   NOT NULL,
  stars           TINYINT        NOT NULL DEFAULT 3,
  address         VARCHAR(500),
  distance_km     DECIMAL(5,2),
  price_usd       DECIMAL(8,2)   NOT NULL,
  room_type       VARCHAR(200)   NOT NULL DEFAULT 'Standard Room',
  total_rooms     INT            NOT NULL DEFAULT 0,
  available_rooms INT            NOT NULL DEFAULT 0,
  amenities       JSON,
  description     TEXT,
  photo_url       VARCHAR(500),
  display_order   INT            NOT NULL DEFAULT 0,
  active          TINYINT(1)     NOT NULL DEFAULT 1,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Hotel bookings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  hotel_id        INT            NOT NULL,
  registration_id INT,
  guest_name      VARCHAR(300)   NOT NULL,
  guest_email     VARCHAR(300)   NOT NULL,
  check_in        DATE           NOT NULL DEFAULT '2027-03-09',
  check_out       DATE           NOT NULL DEFAULT '2027-03-15',
  nights          INT            NOT NULL DEFAULT 6,
  rooms           INT            NOT NULL DEFAULT 1,
  total_usd       DECIMAL(10,2)  NOT NULL,
  status          ENUM('reserved','confirmed','cancelled') NOT NULL DEFAULT 'reserved',
  expires_at      TIMESTAMP      NULL,
  confirmed_at    TIMESTAMP      NULL,
  notes           TEXT,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT,
  INDEX idx_hotel (hotel_id),
  INDEX idx_status (status),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
