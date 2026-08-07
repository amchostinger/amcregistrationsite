-- 012_add_venue_room_type_hotels.sql
-- Adds Rainbow Towers venue room-type accommodation options to the hotels table.

INSERT INTO hotels (name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, amenities, description, display_order, active) VALUES
  ('Rainbow Towers Hotel & Conference Centre', 5, 'Pennefather Ave, Harare, Zimbabwe', 0.00,  95.00, 'Standard single Room', 118, 118, JSON_ARRAY('WiFi','Breakfast','Gym','Restaurant','Conference Halls','Shuttle'), 'Official venue standard single rooms at Rainbow Towers, available on a bed and breakfast basis.', 1, 1),
  ('Rainbow Towers Hotel & Conference Centre', 5, 'Pennefather Ave, Harare, Zimbabwe', 0.00, 125.00, 'Double Room',          83,  83, JSON_ARRAY('WiFi','Breakfast','Gym','Restaurant','Conference Halls','Shuttle'), 'Official venue double rooms at Rainbow Towers, available on a bed and breakfast basis.', 1, 1),
  ('Rainbow Towers Hotel & Conference Centre', 5, 'Pennefather Ave, Harare, Zimbabwe', 0.00, 350.00, 'Executive Suite',      16,  16, JSON_ARRAY('WiFi','Breakfast','Gym','Restaurant','Conference Halls','Shuttle'), 'Official venue executive suites at Rainbow Towers, available on a bed and breakfast basis.', 1, 1),
  ('Rainbow Towers Hotel & Conference Centre', 5, 'Pennefather Ave, Harare, Zimbabwe', 0.00, 550.00, 'Diplomatic Suite',     11,  11, JSON_ARRAY('WiFi','Breakfast','Gym','Restaurant','Conference Halls','Shuttle'), 'Official venue diplomatic suites at Rainbow Towers, available on a bed and breakfast basis.', 1, 1);
