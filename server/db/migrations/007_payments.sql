-- 007_payments.sql
-- Create payments table for PayByLink integration

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(191) NOT NULL,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  amount DECIMAL(13,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  customer_name VARCHAR(255) DEFAULT NULL,
  customer_email VARCHAR(255) DEFAULT NULL,
  payment_url TEXT DEFAULT NULL,
  payment_reference VARCHAR(255) DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  provider VARCHAR(50) DEFAULT NULL,
  provider_response JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_order_id (order_id),
  KEY idx_payment_reference (payment_reference)
);
