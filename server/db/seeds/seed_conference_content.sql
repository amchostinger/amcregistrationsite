-- seed_conference_content.sql
-- Speakers, Hotels, Schedule sessions for AMC 2027

-- ── Clear existing seed data (idempotent) ────────────────────────────────────
DELETE FROM session_speakers;
DELETE FROM schedule_sessions;
DELETE FROM speakers;
DELETE FROM hotel_bookings WHERE status = 'reserved';
DELETE FROM hotels;

-- Reset auto-increment
ALTER TABLE speakers        AUTO_INCREMENT = 1;
ALTER TABLE schedule_sessions AUTO_INCREMENT = 1;
ALTER TABLE hotels          AUTO_INCREMENT = 1;

-- ── Speakers ─────────────────────────────────────────────────────────────────
INSERT INTO speakers (name, designation, church, country, bio, keynote, display_order) VALUES
  ('Bishop Ivan Abrahams',        'Bishop',   'World Methodist Council',                    'South Africa',  'Former General Secretary of the World Methodist Council and a leading voice for African Methodism. Bishop Abrahams brings decades of ecumenical leadership and a prophetic vision for the Church in Africa.',                                                            1, 1),
  ('Bishop Joaquim Nhanala',      'Bishop',   'United Methodist Church, Mozambique',        'Mozambique',    'Bishop of the Mozambique Area of the United Methodist Church and a respected voice for peace and reconciliation in Southern Africa.',                                                                                                                              0, 2),
  ('Bishop Gabriel Boni',         'Bishop',   'United Methodist Church, Côte d\'Ivoire',    'Côte d\'Ivoire','Bishop of the Côte d\'Ivoire Area with extensive experience in cross-cultural ministry and theological education across West Africa.',                                                                                                                          0, 3),
  ('Bishop Eben Nhiwatiwa',       'Bishop',   'United Methodist Church, Zimbabwe',          'Zimbabwe',      'Bishop of the Zimbabwe Area and host-country prelate for AMC 2027. Bishop Nhiwatiwa has championed community transformation and social justice throughout his episcopate.',                                                                                       0, 4),
  ('Dr Priscilla Mwana wa Baya',  'Dr',       'Africa University',                          'Zimbabwe',      'Dean of Theology at Africa University in Mutare. A leading scholar of African feminist theology and contextual hermeneutics, and a keynote speaker on the conference theme.',                                                                                    1, 5),
  ('Rev Dr Emmanuel Kwesi Amoah', 'Rev Dr',   'Ghana Methodist Church',                     'Ghana',         'Executive Director of the Methodist Church Ghana Department of Mission and Evangelism, and a theologian specialising in pneumatology and African Christianity.',                                                                                                0, 6),
  ('Bishop Moses Chikane',        'Bishop',   'Methodist Church of Southern Africa',        'South Africa',  'A prominent bishop with a ministry rooted in reconciliation, youth development, and pan-African solidarity.',                                                                                                                                                   0, 7),
  ('Rev Dr Grace Wanjiru Maina',  'Rev Dr',   'Methodist Church in Kenya',                  'Kenya',         'General Secretary of the Methodist Church in Kenya and a passionate advocate for women\'s leadership and interfaith dialogue.',                                                                                                                                 0, 8),
  ('Archbishop Bernadine Ndzimba','Archbishop','African Methodist Episcopal Church, Zimbabwe','Zimbabwe',     'Archbishop of the AME Church Zimbabwe Conference, and a powerful preacher known for prophetic ministry and mission across sub-Saharan Africa.',                                                                                                                  0, 9),
  ('Dr Ruth Eni Ababio',          'Dr',       'Trinity Theological Seminary',               'Ghana',         'Professor of Church History and Ecumenics at Trinity Theological Seminary, Legon. An internationally recognised scholar of African Church history and an advisor to the World Council of Churches.',                                                            0, 10);

-- ── Hotels ────────────────────────────────────────────────────────────────────
INSERT INTO hotels (name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, amenities, description, display_order) VALUES
  ('Rainbow Towers Hotel & Conference Centre', 5, 'Pennefather Ave, Harare, Zimbabwe',  0.0,  180.00, 'Superior Room',     60, 60, JSON_ARRAY('WiFi','Pool','Gym','Restaurant','Conference Halls','Shuttle'), 'The official conference venue hotel. Situated at the heart of the conference, Rainbow Towers offers superior comfort with direct access to all plenary and committee rooms.', 1),
  ('Meikles Hotel',                            5, 'Jason Moyo Ave, Harare, Zimbabwe',   1.2,  160.00, 'Classic Room',      40, 40, JSON_ARRAY('WiFi','Pool','Spa','Restaurant','Business Centre','Shuttle'),  'Harare\'s iconic five-star landmark hotel. Meikles blends colonial grandeur with modern luxury, offering elegant rooms and world-class dining steps from the conference venue.',  2),
  ('Monomotapa Hotel',                         4, 'Julius Nyerere Way, Harare',          0.8,  130.00, 'Standard Room',     50, 50, JSON_ARRAY('WiFi','Pool','Restaurant','Parking','Shuttle'),                'A centrally located four-star hotel with comfortable rooms, a rooftop pool, and stunning views over Harare Gardens — a short walk from Rainbow Towers.',                           3),
  ('Holiday Inn Harare',                       4, 'Samora Machel Ave, Harare',           1.5,   95.00, 'Standard Room',     70, 70, JSON_ARRAY('WiFi','Pool','Restaurant','Gym','Parking'),                    'Consistent four-star comfort at an accessible price. Holiday Inn Harare is ideal for delegates seeking reliability and value, with a free shuttle to the conference venue.',        4),
  ('The Bronte Hotel',                         3, '132 Baines Ave, Harare',              2.0,   75.00, 'Standard Room',     30, 30, JSON_ARRAY('WiFi','Restaurant','Garden','Parking'),                        'A charming three-star hotel set in leafy grounds, offering a peaceful garden retreat and warm Zimbabwean hospitality at an affordable rate.',                                      5),
  ('Cresta Lodge',                             3, 'Msasa, Harare',                       8.0,   60.00, 'Standard Room',     80, 80, JSON_ARRAY('WiFi','Pool','Restaurant','Parking','Free Shuttle'),            'Spacious and affordable accommodation in the Msasa district of Harare, with complimentary shuttle service to the conference venue twice daily.',                                   6),
  ('Same Nyanga Lodges',                       3, 'Borrowdale, Harare',                  5.5,   55.00, 'Self-Catering Unit',25, 25, JSON_ARRAY('WiFi','Kitchen','Garden','Parking'),                           'Self-catering lodges in the leafy Borrowdale suburb, ideal for families or delegates desiring a home-away-from-home experience during the conference week.',                         7),
  ('Island Lodge Hotel',                       4, '1.5 km from the venue, Harare',         1.5,  100.00, 'Standard Room',     50, 50, JSON_ARRAY('WiFi','Breakfast','Shuttle'),                                            'Conference accommodation option close to the venue.',                                                                         8),
  ('Jameson Hotel',                            3, '3 km from the venue, Harare',           3.0,   85.00, 'Standard Room',     40, 40, JSON_ARRAY('WiFi','Breakfast','Parking'),                                            'Affordable accommodation option for AMC 2027 delegates.',                                                                    9);

-- ── Schedule ──────────────────────────────────────────────────────────────────
-- Day 1: Monday 9 March 2027 - Arrival & Opening
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type) VALUES
  ('2027-03-09','10:00:00','14:00:00','Delegate Registration & Accreditation',       'Main Lobby',        'logistics'),
  ('2027-03-09','14:00:00','16:00:00','Orientation for First-Time Delegates',         'Conference Room A', 'general'),
  ('2027-03-09','16:00:00','17:00:00','Council Executive Briefing',                   'Board Room',        'general'),
  ('2027-03-09','18:00:00','19:00:00','Welcome Dinner',                               'Grand Ballroom',    'social'),
  ('2027-03-09','19:30:00','21:00:00','Opening Worship Service',                      'Plenary Hall',      'worship');

-- Day 2: Tuesday 10 March 2027 - Business Day I
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type) VALUES
  ('2027-03-10','07:00:00','08:00:00','Morning Devotions',                            'Chapel',            'worship'),
  ('2027-03-10','09:00:00','10:30:00','Official Opening Ceremony',                    'Plenary Hall',      'general'),
  ('2027-03-10','10:30:00','11:00:00','Tea / Coffee Break',                           'Foyer',             'break'),
  ('2027-03-10','11:00:00','13:00:00','Presidential Address',                         'Plenary Hall',      'keynote'),
  ('2027-03-10','13:00:00','14:00:00','Lunch',                                        'Dining Hall',       'break'),
  ('2027-03-10','14:00:00','17:00:00','Council Business - Reports I',                 'Plenary Hall',      'general'),
  ('2027-03-10','17:00:00','17:30:00','Afternoon Tea',                                'Foyer',             'break'),
  ('2027-03-10','19:00:00','21:00:00','Evening Worship & Praise',                     'Plenary Hall',      'worship');

-- Day 3: Wednesday 11 March 2027 - Business Day II
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type) VALUES
  ('2027-03-11','07:00:00','08:00:00','Morning Devotions',                            'Chapel',            'worship'),
  ('2027-03-11','09:00:00','10:30:00','Council Business - Reports II',                'Plenary Hall',      'general'),
  ('2027-03-11','10:30:00','11:00:00','Tea / Coffee Break',                           'Foyer',             'break'),
  ('2027-03-11','11:00:00','13:00:00','Council Business - Reports III',               'Plenary Hall',      'general'),
  ('2027-03-11','13:00:00','14:00:00','Lunch',                                        'Dining Hall',       'break'),
  ('2027-03-11','14:00:00','15:30:00','Council Business - Reports IV',                'Plenary Hall',      'general'),
  ('2027-03-11','15:30:00','17:00:00','AMC General Secretariat Report',               'Plenary Hall',      'general'),
  ('2027-03-11','19:00:00','21:00:00','Holy Communion Service',                       'Plenary Hall',      'worship');

-- Day 4: Thursday 12 March 2027 - Committee Day
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type) VALUES
  ('2027-03-12','07:00:00','08:00:00','Morning Devotions',                            'Chapel',            'worship'),
  ('2027-03-12','09:00:00','12:30:00','Committee Sessions - Track A (Governance)',    'Conference Room A', 'general'),
  ('2027-03-12','09:00:00','12:30:00','Committee Sessions - Track B (Mission)',       'Conference Room B', 'general'),
  ('2027-03-12','09:00:00','12:30:00','Committee Sessions - Track C (Finance)',       'Board Room',        'general'),
  ('2027-03-12','13:00:00','14:00:00','Lunch',                                        'Dining Hall',       'break'),
  ('2027-03-12','14:00:00','17:00:00','Committee Sessions - Continued',               'Various Rooms',     'general'),
  ('2027-03-12','19:00:00','21:30:00','Cultural Evening - Zimbabwe Night',            'Grand Ballroom',    'social');

-- Day 5: Friday 13 March 2027 - Keynote Day
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type) VALUES
  ('2027-03-13','07:00:00','08:00:00','Morning Devotions',                            'Chapel',            'worship'),
  ('2027-03-13','09:00:00','10:30:00','Keynote: The Future of African Methodism',     'Plenary Hall',      'keynote'),
  ('2027-03-13','10:30:00','11:00:00','Tea / Coffee Break',                           'Foyer',             'break'),
  ('2027-03-13','11:00:00','12:30:00','Keynote: Women in Ministry',                   'Plenary Hall',      'keynote'),
  ('2027-03-13','13:00:00','14:00:00','Lunch',                                        'Dining Hall',       'break'),
  ('2027-03-13','14:00:00','15:30:00','Panel: Youth Leadership in the AMC',           'Plenary Hall',      'keynote'),
  ('2027-03-13','15:30:00','17:00:00','Panel: Contextual Theology in Africa Today',   'Plenary Hall',      'keynote'),
  ('2027-03-13','19:00:00','21:30:00','Awards & Recognition Banquet',                 'Grand Ballroom',    'social');

-- Day 6: Saturday 14 March 2027 - Elections Day
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type) VALUES
  ('2027-03-14','07:00:00','08:00:00','Morning Devotions',                            'Chapel',            'worship'),
  ('2027-03-14','09:00:00','10:30:00','Constitutional Amendments - First Reading',    'Plenary Hall',      'general'),
  ('2027-03-14','10:30:00','11:00:00','Tea / Coffee Break',                           'Foyer',             'break'),
  ('2027-03-14','11:00:00','13:00:00','Constitutional Amendments - Debate & Vote',    'Plenary Hall',      'general'),
  ('2027-03-14','13:00:00','14:00:00','Lunch',                                        'Dining Hall',       'break'),
  ('2027-03-14','14:00:00','17:00:00','Elections - Council Officers & Committees',    'Plenary Hall',      'general'),
  ('2027-03-14','19:00:00','21:00:00','Consecration & Ordination Service',            'Plenary Hall',      'worship');

-- Day 7: Sunday 15 March 2027 - Closing Service
INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type) VALUES
  ('2027-03-15','07:00:00','08:00:00','Morning Devotions',                            'Chapel',            'worship'),
  ('2027-03-15','09:00:00','12:00:00','Closing Worship Service & Communion',          'Plenary Hall',      'worship'),
  ('2027-03-15','12:00:00','14:00:00','Farewell Luncheon',                            'Grand Ballroom',    'social'),
  ('2027-03-15','14:00:00', NULL,     'Delegate Departures',                          '',                  'logistics');

-- ── Session ↔ Speaker assignments ───────────────────────────────────────────
-- Keynote: Future of African Methodism → Bishop Abrahams (id=1)
INSERT INTO session_speakers (session_id, speaker_id, role)
SELECT s.id, 1, 'Keynote Speaker'
FROM schedule_sessions s
WHERE s.title LIKE '%Future of African Methodism%' LIMIT 1;

-- Presidential Address → Bishop Nhiwatiwa (id=4) as host-country
INSERT INTO session_speakers (session_id, speaker_id, role)
SELECT s.id, 4, 'Presiding'
FROM schedule_sessions s
WHERE s.title LIKE '%Presidential Address%' LIMIT 1;

-- Keynote: Women in Ministry → Dr Mwana wa Baya (id=5)
INSERT INTO session_speakers (session_id, speaker_id, role)
SELECT s.id, 5, 'Keynote Speaker'
FROM schedule_sessions s
WHERE s.title LIKE '%Women in Ministry%' LIMIT 1;

-- Panel: Contextual Theology → Dr Ababio (id=10)
INSERT INTO session_speakers (session_id, speaker_id, role)
SELECT s.id, 10, 'Panellist'
FROM schedule_sessions s
WHERE s.title LIKE '%Contextual Theology%' LIMIT 1;

-- Holy Communion → Archbishop Ndzimba (id=9)
INSERT INTO session_speakers (session_id, speaker_id, role)
SELECT s.id, 9, 'Celebrant'
FROM schedule_sessions s
WHERE s.title LIKE '%Holy Communion%' LIMIT 1;
