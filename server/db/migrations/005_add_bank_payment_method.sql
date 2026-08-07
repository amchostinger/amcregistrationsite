-- ============================================================
-- 005_add_bank_payment_method.sql
-- Add 'bank' to the payment_method ENUM in payments table
-- ============================================================

ALTER TABLE payments
MODIFY payment_method ENUM('ecocash','visa','mastercard','telecash','paynow','bank') DEFAULT 'ecocash';
