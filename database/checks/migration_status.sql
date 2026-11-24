-- migration_status.sql
-- READ-ONLY. Reports whether migrations 002–017 have been applied to the CURRENT database (USE <db> first).
-- Only SELECTs on information_schema: no table data is read, nothing is written.
--
-- Each migration is detected by the tables/columns/ENUM values it creates:
--   'có'                 every object of that migration exists
--   'không'              none exist
--   'một phần (x/y)'     only some exist (a migration stopped half-way — check before re-running it)
--   'không xác định'     007 only changes rows (roles), which information_schema cannot see
--
-- Usage: mysql ... <db_name> < database/checks/migration_status.sql

SELECT
  migration,
  CASE
    WHEN expected = 0 THEN 'không xác định (chỉ đổi dữ liệu roles, xem truy vấn tùy chọn bên dưới)'
    WHEN found = expected THEN 'có'
    WHEN found = 0 THEN 'không'
    ELSE CONCAT('một phần (', found, '/', expected, ')')
  END AS da_ap_dung
FROM (
  SELECT '002_email_verification' AS migration, 2 AS sort_order, 1 AS expected,
    (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_verification_tokens') AS found

  UNION ALL
  SELECT '003_otp_and_google_sign_in', 3, 2,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME, COLUMN_NAME) IN (('email_verification_tokens', 'failed_attempts'),
                                          ('users', 'google_subject')))

  UNION ALL
  SELECT '004_branch_contact_and_location', 4, 4,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches'
        AND COLUMN_NAME IN ('latitude', 'longitude', 'phone', 'opening_hours'))

  UNION ALL
  SELECT '005_hotel_amenities_and_policies', 5, 5,
    (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('amenities', 'hotel_amenities', 'hotel_policies'))
    + (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels'
        AND COLUMN_NAME IN ('check_in_from', 'check_out_until'))

  UNION ALL
  SELECT '006_tour_collections', 6, 2,
    (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('tour_collections', 'tour_collection_items'))

  UNION ALL
  SELECT '007_three_roles', 7, 0, 0

  UNION ALL
  SELECT '008_simulated_payment', 8, 2,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'hold_expires_at')
    + (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_items' AND COLUMN_NAME = 'status'
        AND COLUMN_TYPE LIKE '%''awaiting_payment''%')

  UNION ALL
  SELECT '009_flight_deals_and_price_alerts', 9, 4,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'flight_offers'
        AND COLUMN_NAME IN ('is_featured', 'updated_at'))
    + (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('price_alerts', 'price_alert_notifications'))

  UNION ALL
  SELECT '010_flight_allotments', 10, 2,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'flight_offers'
        AND COLUMN_NAME IN ('allotment_seats', 'sold_seats'))

  UNION ALL
  SELECT '011_vnpay_payments', 11, 2,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'gateway_meta')
    + (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'status'
        AND COLUMN_TYPE LIKE '%''refund_needed''%')

  UNION ALL
  SELECT '012_service_requests', 12, 2,
    (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('service_requests', 'service_request_notes'))

  UNION ALL
  SELECT '013_cart_items', 13, 1,
    (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items')

  UNION ALL
  SELECT '014_terms_consent_and_password_reset', 14, 2,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME, COLUMN_NAME) IN (('users', 'terms_accepted_at'),
                                          ('email_verification_tokens', 'purpose')))

  UNION ALL
  SELECT '015_branch_operations_and_audit', 15, 3,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tour_departures'
        AND COLUMN_NAME IN ('operating_branch_id', 'min_guests'))
    + (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs')

  UNION ALL
  SELECT '016_departure_lifecycle_and_booking_notes', 16, 4,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME, COLUMN_NAME) IN (('tour_departures', 'cancel_reason'),
                                          ('tours', 'cancellation_policy'), ('tours', 'travel_notes')))
    + (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_notes')

  UNION ALL
  SELECT '017_tour_tickets_and_check_in', 17, 2,
    (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('tour_tickets', 'passenger_check_ins'))
) AS checks
ORDER BY sort_order;

-- Optional, NOT information_schema (reads the roles table, still read-only). 007 is applied when this returns
-- none of SUPER_ADMIN / REGIONAL_MANAGER. After seeds/001 is re-run it also returns BRANCH_MANAGER:
-- SELECT code FROM roles ORDER BY code;
