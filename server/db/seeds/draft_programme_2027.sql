-- Draft Programme for AMC 2027 General Conference
-- Theme: Equipped to transform the socio-political and economic landscape of Africa
-- Venue: Rainbow Towers, 100 Rekai Tangwena Avenue, Milton Park, Harare, Zimbabwe
-- Dates: March 9-14, 2027
-- Insert these sessions into the schedule_sessions table

-- ============================================================================
-- TUESDAY 9 MARCH 2027 - Arrival of Delegates and Observers
-- ============================================================================
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-09', '17:00:00', '18:30:00', 'AMC Executive Meeting', 'Board Room', 'general', 'Led by Revd Dr Martin Mujinga, AMC General Secretary'),
('2027-03-09', '18:30:00', '19:30:00', 'Dinner for Delegates', 'Dining Hall', 'social', 'Welcome dinner'),
('2027-03-09', '19:30:00', '20:00:00', 'Presentation of Conference Emblems & Flags', 'Plenary Hall', 'general', 'Conference emblems and flags presentation');

-- ============================================================================
-- WEDNESDAY 10 MARCH 2027 - Opening Service and President's Address
-- ============================================================================
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-10', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', ''),
('2027-03-10', '08:30:00', '08:45:00', 'Procession', 'Plenary Hall', 'general', 'Led by Revd Likhai Molife, General Secretary - Methodist Church in Zimbabwe'),
('2027-03-10', '08:45:00', '11:00:00', 'Opening Service', 'Plenary Hall', 'worship', 'Bishop Simbarashe Sithole, Presiding Bishop of the Methodist Church in Zimbabwe'),
('2027-03-10', '11:00:00', '11:30:00', 'AMC President - Address and Official Opening', 'Plenary Hall', 'keynote', 'Most Revd Dr Paul K Boafo, AMC President'),
('2027-03-10', '11:30:00', '12:00:00', 'Welcome and Introductions', 'Plenary Hall', 'general', ''),
('2027-03-10', '12:00:00', '12:30:00', 'Photo Shooting', 'Plenary Hall', 'general', 'Ms Bongi Moyo-Bango and the Communication Team'),
('2027-03-10', '12:30:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', ''),
('2027-03-10', '14:00:00', '15:00:00', 'Keynote Address', 'Plenary Hall', 'keynote', 'Speaker TBA'),
('2027-03-10', '15:00:00', '15:15:00', 'Health Break', 'Foyer', 'break', ''),
('2027-03-10', '15:15:00', '16:00:00', 'Milestones of the Africa Methodist Council', 'Plenary Hall', 'general', ''),
('2027-03-10', '16:00:00', '17:30:00', 'Celebrating International Women - Day', 'Plenary Hall', 'keynote', ''),
('2027-03-10', '17:30:00', '18:30:00', 'Closing Worship', 'Plenary Hall', 'worship', 'East Africa region leading'),
('2027-03-10', '18:30:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '');

-- ============================================================================
-- THURSDAY 11 MARCH 2027 - Thursday in Black (WFM/UCW Women - Day)
-- ============================================================================
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-11', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', ''),
('2027-03-11', '08:30:00', '09:00:00', 'Theological Reflections', 'Plenary Hall', 'worship', 'Anglophone West Africa'),
('2027-03-11', '09:30:00', '10:30:00', 'Revisiting the Concept of Wesleyan Holiness and Its Impact in Africa', 'Plenary Hall', 'keynote', 'Speaker TBA'),
('2027-03-11', '10:00:00', '10:30:00', 'Health Break', 'Foyer', 'break', ''),
('2027-03-11', '10:30:00', '11:30:00', 'Democracy under Pressure - The African Church as Moral Compass in Times of Political Uncertainty', 'Conference Room A', 'keynote', 'Speaker TBA - AMC Business Session 1'),
('2027-03-11', '11:30:00', '12:30:00', 'Youthquake - The Church Role in Addressing Youth Migration through Investment, Opportunity, and Justice', 'Conference Room B', 'keynote', 'Speaker TBA - AMC Business Session 2'),
('2027-03-11', '12:30:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', ''),
('2027-03-11', '14:30:00', '16:00:00', 'Group Discussions - Youth, Women, Men', 'Various Rooms', 'general', 'AMC Business Session 3'),
('2027-03-11', '16:00:00', '17:00:00', 'Feedback from Group Discussions', 'Plenary Hall', 'general', 'AMC Business Session 4'),
('2027-03-11', '17:00:00', '18:30:00', 'Musical Presentations', 'Plenary Hall', 'social', 'Methodist Church in Zimbabwe Musical Groups'),
('2027-03-11', '18:30:00', '19:00:00', 'Closing Devotions', 'Plenary Hall', 'worship', 'Central Africa region'),
('2027-03-11', '19:00:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '');

-- ============================================================================
-- FRIDAY 12 MARCH 2027 - Themed Conference Day (Delegates in Church Material)
-- ============================================================================
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-12', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', ''),
('2027-03-12', '08:30:00', '09:00:00', 'Theological Reflections', 'Plenary Hall', 'worship', 'Speaker TBA'),
('2027-03-12', '09:00:00', '10:00:00', 'The Renewed Scramble for Africa - Minerals - A Prophetic Response to Extraction, Exploitation, and Neo-Colonial Power', 'Plenary Hall', 'keynote', 'Speaker TBA'),
('2027-03-12', '10:00:00', '10:30:00', 'Health Break', 'Foyer', 'break', ''),
('2027-03-12', '10:30:00', '11:30:00', 'Fraternal Greetings', 'Plenary Hall', 'general', 'Revd Dr Martin Mujinga, AMC General Secretary'),
('2027-03-12', '11:30:00', '12:30:00', 'The Impact of Methodism on World Christianity', 'Plenary Hall', 'keynote', 'Speaker TBA'),
('2027-03-12', '12:30:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', 'Francophone West Africa'),
('2027-03-12', '14:00:00', '15:00:00', 'Digital Transformation and Human Dignity in Africa - The Church - Responsibility in an Emerging Digital Society', 'Conference Room A', 'keynote', 'Speaker TBA - AMC Business Session 5'),
('2027-03-12', '15:00:00', '16:00:00', 'Discussion on the Roles of the Church in Drugs and Substance Abuse', 'Conference Room B', 'keynote', 'Speaker TBA'),
('2027-03-12', '16:00:00', '17:00:00', 'Presentation of Awards', 'Plenary Hall', 'general', 'Most Revd Dr Paul K Boafo, AMC President'),
('2027-03-12', '17:00:00', '18:00:00', 'Evening Service', 'Plenary Hall', 'worship', 'Vice President (TBA)'),
('2027-03-12', '18:00:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '');

-- ============================================================================
-- SATURDAY 13 MARCH 2027 - Cultural Day (Delegates in Cultural Clothing)
-- ============================================================================
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-13', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', ''),
('2027-03-13', '08:30:00', '09:30:00', 'Morning Worship', 'Plenary Hall', 'worship', 'Speaker TBA'),
('2027-03-13', '09:30:00', '11:30:00', 'General Conference Plenary Session - Resolutions', 'Plenary Hall', 'general', 'Resolutions Committee'),
('2027-03-13', '11:30:00', '12:00:00', 'Press Conference', 'Board Room', 'general', 'President, Vice Presidents and General Secretary'),
('2027-03-13', '12:00:00', '13:00:00', 'Lunch', 'Dining Hall', 'break', ''),
('2027-03-13', '13:00:00', '17:00:00', 'Excursion', 'Off-site', 'social', 'Local Organising Committee'),
('2027-03-13', '17:00:00', '19:00:00', 'Conference Night - Music Night', 'Grand Ballroom', 'social', 'Local Organising Committee'),
('2027-03-13', '19:00:00', '19:40:00', 'Closing Service', 'Plenary Hall', 'worship', 'AMC President'),
('2027-03-13', '19:40:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '');

-- ============================================================================
-- SUNDAY 14 MARCH 2027 - Holy Communion Sunday (Church Uniforms)
-- ============================================================================
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description) VALUES
('2027-03-14', '07:00:00', '08:00:00', 'Breakfast', 'Dining Hall', 'break', ''),
('2027-03-14', '08:00:00', '13:00:00', 'Church Services at Methodist Churches in Harare', 'Various Locations', 'worship', 'Lunch provided by local churches'),
('2027-03-14', '13:00:00', NULL, 'Delegate Departures', '', 'logistics', '');

-- ============================================================================
-- OPTIONAL: Update speakers for sessions where speaker names are confirmed
-- Uncomment and modify speaker IDs as needed
-- ============================================================================

-- Update Keynote Address (March 10, 14:00-15:00) - if speaker identified
-- INSERT INTO session_speakers (session_id, speaker_id, role)
-- SELECT s.id, 1, 'Keynote Speaker'
-- FROM schedule_sessions s
-- WHERE s.title LIKE '%Keynote Address%' AND s.session_date = '2027-03-10' LIMIT 1;

-- Note: Speaker assignments can be made once confirmed speakers are identified
-- Use INSERT INTO session_speakers (session_id, speaker_id, role) with the appropriate speaker_id
