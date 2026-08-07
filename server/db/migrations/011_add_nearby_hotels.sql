-- 011_add_nearby_hotels.sql
-- Adds two nearby hotel options to the hotels table.

INSERT INTO hotels (name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, amenities, description, display_order, active) VALUES
  ('Island Hotel', 4, '2.3 km from Rainbow Towers, Harare', 2.30, 45.00, 'Standard Room', 40, 40, JSON_ARRAY('WiFi','Breakfast','Parking'), 'A four-star hotel located 6 minutes from Rainbow Towers, offering bed and breakfast accommodation at USD 45 per night.', 8, 1),
  ('Jameson Hotel', 5, '1.0 km from Rainbow Towers, Harare', 1.00, 0.00, 'Standard Room', 30, 30, JSON_ARRAY('WiFi','Restaurant','Parking'), 'A five-star hotel in the city centre, 1 km from Rainbow Towers. Room prices are TBA.', 9, 1);
