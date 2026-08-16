-- 2026-08-15-speaker-sections.sql
-- Re-sections the Speakers page and locks in the conference running order.
--
-- The old category ENUM only knew speaker/host/secretary. The programme now
-- groups people under eight headings, so the column becomes a VARCHAR and the
-- application (client + server) owns the list of valid values.
--
-- display_order is assigned globally in section order (10, 20, … 900) so the
-- flat admin list reads in exactly the same order as the public page.

ALTER TABLE speakers
  MODIFY COLUMN category VARCHAR(32) NOT NULL DEFAULT 'speaker';

-- ── People not yet profiled ──────────────────────────────────────────────────
-- Names only, in caps, no biography — these are placeholders until the full
-- details arrive. Guarded on name so re-running the migration is a no-op.

INSERT INTO speakers (name, designation, church, country, bio, photo_url, keynote, category, display_order)
SELECT * FROM (
  SELECT 'BISHOP SITHOLE'                    AS name, 'HOST BISHOP' AS designation, '' AS church, '' AS country, '<p>Coming soon.</p>' AS bio, '' AS photo_url, 0 AS keynote, 'speaker'        AS category,  40 AS display_order UNION ALL
  SELECT 'REVD KAUNDA',                            '', '', '', '', '', 1, 'keynote',        250 UNION ALL
  SELECT 'UMC ZIM',                                 '', '', '', '', '', 1, 'keynote',        260 UNION ALL
  SELECT 'METHODIST CHURCH GHANA',                  '', '', '', '', '', 1, 'keynote',        270 UNION ALL
  SELECT 'UMC MOZAMBIQUE',                          '', '', '', '', '', 1, 'keynote',        300 UNION ALL
  SELECT 'TANZANIA METHODIST',                      '', '', '', '', '', 1, 'keynote',        330 UNION ALL
  SELECT 'AFRICAN METHODIST EPISCOPAL ZION',        '', '', '', '', '', 1, 'keynote',        340 UNION ALL
  SELECT 'FR DR FADI DIAB',                         '', '', '', '', '', 0, 'workshop',       410 UNION ALL
  SELECT 'MRS ABENA DUMA AIDOO ESQ',                '', '', '', '', '', 0, 'constitutional', 530 UNION ALL
  SELECT 'BISHOP BOSSMAN',                          '', '', '', '', '', 0, 'strategic',      600 UNION ALL
  SELECT 'MRS S TEMBEDZA',                          '', '', '', '', '', 0, 'strategic',      610 UNION ALL
  SELECT 'MRS MASHIRI',                             '', '', '', '', '', 0, 'host',           700 UNION ALL
  SELECT 'JONATHAN BANZA',                          '', '', '', '', '', 0, 'secretary',      800 UNION ALL
  SELECT 'NANA YAW AMPOFO',                         '', '', '', '', '', 0, 'secretary',      810 UNION ALL
  SELECT 'REVD MPASO',                              '', '', '', '', '', 0, 'secretary',      820
) AS incoming
WHERE NOT EXISTS (SELECT 1 FROM speakers s WHERE s.name = incoming.name);

-- ── Section + running order for everyone already profiled ────────────────────
-- Matched on the distinctive part of the stored name so the statements survive
-- small edits to titles and honorifics.

-- Speakers
UPDATE speakers SET category='speaker',        display_order= 10 WHERE name LIKE '%BOAFO%';
UPDATE speakers SET category='speaker',        display_order= 20 WHERE name LIKE '%MUJINGA%';
UPDATE speakers SET category='speaker',        display_order= 30 WHERE name LIKE '%COBBAH%';
UPDATE speakers SET category='speaker',        display_order= 50 WHERE name LIKE '%ALI ABA%';
UPDATE speakers SET category='speaker',        display_order= 60 WHERE name LIKE '%LAWSON%';
UPDATE speakers SET category='speaker',        display_order= 70 WHERE name LIKE '%MAWIRE%';
UPDATE speakers SET category='speaker',        display_order= 80 WHERE name LIKE '%KAYINAMURA%';
UPDATE speakers SET category='speaker',        display_order= 90 WHERE name LIKE '%LUNGE%';
UPDATE speakers SET category='speaker',        display_order=100 WHERE name LIKE '%NESHANGWE%';
UPDATE speakers SET category='speaker',        display_order=110 WHERE name LIKE '%LE_O NETO%' OR name LIKE '%LEAO NETO%';
UPDATE speakers SET category='speaker',        display_order=120 WHERE name LIKE '%NZIMANDE%';

-- Keynote
UPDATE speakers SET category='keynote',        display_order=200 WHERE name LIKE '%ABRAHAMS%';
UPDATE speakers SET category='keynote',        display_order=210 WHERE name LIKE '%DIMING%';
UPDATE speakers SET category='keynote',        display_order=220 WHERE name LIKE '%MALINGA%';
UPDATE speakers SET category='keynote',        display_order=230 WHERE name LIKE '%MURIUKI%';
UPDATE speakers SET category='keynote',        display_order=240 WHERE name LIKE '%MAGETO%';
UPDATE speakers SET category='keynote',        display_order=280 WHERE name LIKE '%MOYO-BANGO%';
UPDATE speakers SET category='keynote',        display_order=290 WHERE name LIKE '%CHIWARA%';
UPDATE speakers SET category='keynote',        display_order=310 WHERE name LIKE '%MACAULEY%';
UPDATE speakers SET category='keynote',        display_order=320 WHERE name LIKE '%MUTHURI%' OR name LIKE '%MUKOMUNENE%';

-- Workshops
UPDATE speakers SET category='workshop',       display_order=400 WHERE name LIKE '%THOMSON%' OR name LIKE '%THOMPSON%';

-- Constitutional Review
UPDATE speakers SET category='constitutional', display_order=500 WHERE name LIKE '%TAIWO%';
UPDATE speakers SET category='constitutional', display_order=510 WHERE name LIKE '%MANGA';
UPDATE speakers SET category='constitutional', display_order=520 WHERE name LIKE '%LOSABA%';

-- Hosts
UPDATE speakers SET category='host',           display_order=710 WHERE name LIKE '%MOLIFE%';
UPDATE speakers SET category='host',           display_order=720 WHERE name LIKE '%MAVANKENI%';
UPDATE speakers SET category='host',           display_order=730 WHERE name LIKE '%MANGIZA%';

-- Secretariat
UPDATE speakers SET category='secretary',      display_order=830 WHERE name LIKE '%MABASA%';
UPDATE speakers SET category='secretary',      display_order=840 WHERE name LIKE '%GOVHA%';
UPDATE speakers SET category='secretary',      display_order=850 WHERE name LIKE '%CHIMWALA%';

-- Awards
UPDATE speakers SET category='awards',         display_order=900 WHERE name LIKE '%OPEYEMI%' OR name LIKE '% AWE';

-- The gold "Keynote" star is now a property of the Keynote section, so keep the
-- flag and the section in step with one another.
UPDATE speakers SET keynote = (category = 'keynote');
