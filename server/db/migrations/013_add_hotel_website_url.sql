-- 013_add_hotel_website_url.sql
-- Adds a website URL field for hotels so admins can link public hotel pages.

ALTER TABLE hotels
  ADD COLUMN website_url VARCHAR(500) NULL AFTER photo_url;
