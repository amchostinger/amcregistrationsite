-- 004_seed_data.sql
-- Sample data for speakers, hotels, and schedule sessions for AMC 2027

-- ────────────────────────────────────────────────────────────────────────────────
-- SPEAKERS
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO speakers (name, designation, church, country, bio, keynote, display_order) VALUES
('Bishop Ivan Abrahams', 'Bishop', 'World Methodist Council', 'South Africa', 'Leading theologian and advocate for African Methodist unity with 30+ years of ecumenical service.', 1, 1),
('Dr. Patricia Otieno', 'Professor', 'Nairobi Methodist University', 'Kenya', 'Academic expert in African theology, women''s leadership, and contextual ministry practices.', 1, 2),
('Presiding Bishop James Mwale', 'Presiding Bishop', 'Methodist Church in Zimbabwe', 'Zimbabwe', 'Chief overseer of the host nation''s Methodist church, shepherd of pastoral formation.', 1, 3),
('Rev. Grace Mensah', 'Regional Secretary', 'West Africa Methodist District', 'Ghana', 'Passionate advocate for youth engagement and grassroots community development across the region.', 0, 4),
('Dr. Samuel Kimani', 'General Secretary', 'Africa Methodist Council', 'Kenya', 'Senior administrator overseeing AMC strategic initiatives and international partnerships.', 0, 5),
('Bishop Eliud Wabukala', 'Bishop', 'Methodist Church in Kenya', 'Kenya', 'Visionary leader focused on renewal, discipleship, and missional outreach in East Africa.', 1, 6),
('Rev. Namunkunda', 'Youth Director', 'Southern Africa Methodist District', 'Zambia', 'Dynamic mobilizer of youth participation, innovation, and entrepreneurial kingdom work.', 0, 7),
('Dr. Charity Mwale', 'Women Ministry Coordinator', 'Methodist Church in Zimbabwe', 'Zimbabwe', 'Advocate for gender equality, women''s empowerment, and inclusive spiritual formation.', 0, 8);

-- ────────────────────────────────────────────────────────────────────────────────
-- HOTELS
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO hotels (name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, amenities, description, display_order, active) VALUES
('Rainbow Towers Hotel & Conference Centre', 5, 'Pennefather Ave, Harare', 0.0, 180, 'Superior Room', 60, 60, '["WiFi","Pool","Gym","Restaurant","Conference Halls","Shuttle"]', 'The official conference venue hotel. Superior comfort with direct access to all plenary and committee rooms.', 1, 1),
('Meikles Hotel', 5, 'Union Ave, Harare', 1.5, 160, 'Luxury Suite', 45, 45, '["WiFi","Pool","Spa","Restaurant","Concierge","Parking"]', 'Historic luxury hotel with colonial elegance and modern amenities in the heart of Harare.', 2, 1),
('Cresta Lodge', 3, 'Msasa, Harare', 8.0, 60, 'Standard Room', 80, 80, '["WiFi","Pool","Restaurant","Parking","Free Shuttle"]', 'Spacious and affordable with complimentary shuttle service to the venue twice daily.', 3, 1),
('Holiday Inn Harare', 4, 'Samora Machel Ave, Harare', 1.5, 95, 'Standard Room', 70, 70, '["WiFi","Pool","Restaurant","Gym","Parking"]', 'Consistent four-star comfort at an accessible price with free shuttle to the conference.', 4, 1),
('The Bronte Hotel', 3, '132 Baines Ave, Harare', 2.0, 75, 'Standard Room', 30, 30, '["WiFi","Restaurant","Garden","Parking"]', 'Charming three-star hotel set in leafy grounds offering warm Zimbabwean hospitality.', 5, 1),
('Town House Hotel', 3, 'Fife Ave, Harare', 2.5, 55, 'Standard Room', 50, 50, '["WiFi","Restaurant","Bar","Parking"]', 'Intimate hotel in central Harare with personalized service and convenient access to conference.', 6, 1),
('Sama Nyanga Lodges', 3, 'Borrowdale, Harare', 5.5, 55, 'Self-Catering', 25, 25, '["WiFi","Kitchen","Garden","Parking"]', 'Self-catering lodges in leafy Borrowdale, ideal for families or extended stays.', 7, 1);

-- ────────────────────────────────────────────────────────────────────────────────
-- SCHEDULE SESSIONS - March 9 (Monday, Arrival & Opening)
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-09', '10:00:00', '14:00:00', 'Delegate Registration & Accreditation', 'Main Lobby', 'logistics', 'Welcome desk, credential distribution, badge pickup, hospitality briefing.'),
('2027-03-09', '14:00:00', '16:00:00', 'Orientation for First-Time Delegates', 'Conference Room A', 'general', 'Introduction to conference program, AMC governance, networking expectations.'),
('2027-03-09', '18:00:00', '19:00:00', 'Welcome Dinner', 'Grand Ballroom', 'social', 'Informal gathering to welcome all delegates with light refreshments.'),
('2027-03-09', '19:30:00', '21:00:00', 'Opening Worship Service', 'Plenary Hall', 'worship', 'Opening prayers, hymns, and spiritual setting for the conference.');

-- ────────────────────────────────────────────────────────────────────────────────
-- SCHEDULE SESSIONS - March 10 (Tuesday)
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-10', '07:00:00', '08:00:00', 'Morning Devotions', 'Chapel', 'worship', 'Daily devotional worship to center hearts and minds.'),
('2027-03-10', '09:00:00', '10:30:00', 'Official Opening Ceremony', 'Plenary Hall', 'general', 'Welcome by AMC leadership, national anthem, vision casting.'),
('2027-03-10', '10:30:00', '11:00:00', 'Tea / Coffee Break', 'Foyer', 'break', 'Networking and refreshment break.'),
('2027-03-10', '11:00:00', '13:00:00', 'Presidential Address', 'Plenary Hall', 'keynote', 'Keynote message from AMC President on conference theme and vision.'),
('2027-03-10', '13:00:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', 'Lunch service.'),
('2027-03-10', '14:00:00', '17:00:00', 'Council Business - Reports I', 'Plenary Hall', 'general', 'Financial, organizational, and strategic reports from leadership.'),
('2027-03-10', '19:00:00', '21:00:00', 'Holy Communion Service', 'Plenary Hall', 'worship', 'Sacrament of Holy Communion with pastoral reflection.');

-- ────────────────────────────────────────────────────────────────────────────────
-- SCHEDULE SESSIONS - March 11 (Wednesday)
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-11', '07:00:00', '08:00:00', 'Morning Devotions', 'Chapel', 'worship', 'Daily devotional worship.'),
('2027-03-11', '09:00:00', '12:30:00', 'Keynote: The Future of African Methodism', 'Plenary Hall', 'keynote', 'Visionary keynote on Methodist identity in 21st century Africa.'),
('2027-03-11', '13:00:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', 'Lunch service.'),
('2027-03-11', '14:00:00', '17:00:00', 'Panel: Youth & Women in Ministry', 'Plenary Hall', 'general', 'Interactive discussion on emerging leaders and inclusive ministry.'),
('2027-03-11', '19:00:00', '21:30:00', 'Awards & Recognition Banquet', 'Grand Ballroom', 'social', 'Celebration of faithful service and leadership recognition.');

-- ────────────────────────────────────────────────────────────────────────────────
-- SCHEDULE SESSIONS - March 12 (Thursday)
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-12', '07:00:00', '08:00:00', 'Morning Devotions', 'Chapel', 'worship', 'Daily devotional worship.'),
('2027-03-12', '09:00:00', '17:00:00', 'Committee Sessions (parallel tracks)', 'Various Rooms', 'general', 'In-depth committee work on strategy, doctrine, discipline, and missions.'),
('2027-03-12', '13:00:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', 'Lunch service.'),
('2027-03-12', '19:00:00', '21:00:00', 'Cultural Evening - Zimbabwe Night', 'Grand Ballroom', 'social', 'Celebration of Zimbabwean culture with traditional music and dance.');

-- ────────────────────────────────────────────────────────────────────────────────
-- SCHEDULE SESSIONS - March 13 (Friday)
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-13', '07:00:00', '08:00:00', 'Morning Devotions', 'Chapel', 'worship', 'Daily devotional worship.'),
('2027-03-13', '09:00:00', '12:00:00', 'Council Business - Constitutional Amendments', 'Plenary Hall', 'general', 'Legislative and governance matters requiring full council action.'),
('2027-03-13', '13:00:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', 'Lunch service.'),
('2027-03-13', '14:00:00', '17:00:00', 'Elections - Council Officers & Committees', 'Plenary Hall', 'general', 'Democratic election of new leadership and committee members.'),
('2027-03-13', '19:00:00', '21:00:00', 'Consecration Service', 'Plenary Hall', 'worship', 'Prayer for newly elected leaders and dedication to service.');

-- ────────────────────────────────────────────────────────────────────────────────
-- SCHEDULE SESSIONS - March 14 (Saturday)
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-14', '07:00:00', '08:00:00', 'Morning Devotions', 'Chapel', 'worship', 'Daily devotional worship.'),
('2027-03-14', '09:00:00', '12:00:00', 'Final Business & Closing Remarks', 'Plenary Hall', 'general', 'Last-minute motions, announcements, thanks, and closing remarks from leadership.'),
('2027-03-14', '13:00:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', 'Lunch service.'),
('2027-03-14', '14:00:00', '17:00:00', 'Marketplace & Reflection', 'Exhibition Hall', 'general', 'Optional vendors and personal reflection time.'),
('2027-03-14', '19:00:00', '21:00:00', 'Farewell Reception', 'Grand Ballroom', 'social', 'Final evening for delegates to connect and say goodbye.');

-- ────────────────────────────────────────────────────────────────────────────────
-- SCHEDULE SESSIONS - March 15 (Sunday, Departure & Closing)
-- ────────────────────────────────────────────────────────────────────────────────
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-15', '07:00:00', '08:00:00', 'Morning Devotions', 'Chapel', 'worship', 'Final devotional before departure.'),
('2027-03-15', '09:00:00', '12:00:00', 'Closing Worship Service & Communion', 'Plenary Hall', 'worship', 'Final sacrament of communion and blessing for departing delegates.'),
('2027-03-15', '12:00:00', '14:00:00', 'Farewell Luncheon', 'Grand Ballroom', 'social', 'Final meal and fellowship.'),
('2027-03-15', '14:00:00', NULL, 'Delegate Departures', 'Lobby', 'logistics', 'Safe travels home.');

-- ────────────────────────────────────────────────────────────────────────────────
-- LINK SPEAKERS TO SESSIONS (session_speakers junction table)
-- ────────────────────────────────────────────────────────────────────────────────

-- Opening Worship Service (Bishop James Mwale)
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (4, 3, 'Presiding Bishop');

-- Presidential Address (Bishop Ivan Abrahams)
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (8, 1, 'Keynote Speaker');

-- Holy Communion Service (Dr. Samuel Kimani)
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (11, 5, 'Celebrant');

-- Keynote: The Future of African Methodism (Bishop Eliud Wabukala)
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (13, 6, 'Keynote Speaker');

-- Panel: Youth & Women in Ministry (Rev. Namunkunda & Dr. Charity Mwale)
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (15, 7, 'Panel Facilitator');
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (15, 8, 'Panel Speaker');

-- Consecration Service (Presiding Bishop James Mwale)
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (25, 3, 'Presiding Bishop');

-- Closing Worship Service & Communion (Dr. Patricia Otieno)
INSERT IGNORE INTO session_speakers (session_id, speaker_id, role) VALUES (32, 2, 'Liturgist');
