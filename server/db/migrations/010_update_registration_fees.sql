-- 010_update_registration_fees.sql
-- Updates conference registration fee settings to the current USD 400 per-person standard.

UPDATE conference_settings
SET setting_value = '400'
WHERE setting_key IN (
  'registration_fee_delegate_usd',
  'registration_fee_observer_usd',
  'registration_fee_guest_usd'
);
