-- 008_add_registration_totals.sql
-- Adds registration fee, hotel booking and summary columns to registrants.

ALTER TABLE registrants
  ADD COLUMN hotel_id INT NULL AFTER country,
  ADD COLUMN hotel_booking_id INT NULL AFTER hotel_id,
  ADD COLUMN hotel_name VARCHAR(300) NULL AFTER hotel_booking_id,
  ADD COLUMN hotel_room_type VARCHAR(200) NULL AFTER hotel_name,
  ADD COLUMN hotel_price_usd DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER hotel_room_type,
  ADD COLUMN hotel_rooms INT NOT NULL DEFAULT 0 AFTER hotel_price_usd,
  ADD COLUMN conference_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER num_people,
  ADD COLUMN hotel_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER conference_total,
  ADD COLUMN grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER hotel_total,
  ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER grand_total,
  ADD COLUMN balance_due DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER amount_paid,
  ADD INDEX idx_hotel_id (hotel_id),
  ADD INDEX idx_hotel_booking_id (hotel_booking_id);

ALTER TABLE registrants
  ADD CONSTRAINT fk_registrants_hotel_id FOREIGN KEY (hotel_id)
    REFERENCES hotels(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_registrants_hotel_booking_id FOREIGN KEY (hotel_booking_id)
    REFERENCES hotel_bookings(id) ON DELETE SET NULL;
