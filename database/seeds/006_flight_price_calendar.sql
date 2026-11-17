-- 006_flight_price_calendar.sql
-- DEMO partner quotes for the price calendar and "Săn vé rẻ" (requires seeds/002; independent of 009).
-- Every flight and price here is SIMULATED: flight numbers start with DEMO and partners are the "(DEMO)" agents.
-- They are reference quotes awaiting partner confirmation, not live fares.
--
-- Covers 8 routes in both directions (SGN-HAN, SGN-DAD, HAN-DAD, SGN-PQC, HAN-PQC, SGN-CXR, HAN-CXR, SGN-HPH),
-- 3 flights per direction per day, for the 60 Vietnamese days after the day it is run.
-- Prices are deterministic and follow a believable pattern: Friday and Sunday dearest, Tue/Wed
-- cheaper, a few mid-week sale days far cheaper, and holiday peaks (Noel, Tết Dương lịch, Tết Nguyên Đán 2027,
-- Giỗ Tổ, 30/4 - 1/5).
--
-- Safe to re-run: ids come from the absolute date (10000000 + days since 2026-01-01 * 100 + slot), far above the
-- ids in seeds/002, and existing rows are left untouched. Running it on a later day only adds the new days.
SET NAMES utf8mb4;

DROP TEMPORARY TABLE IF EXISTS seed_flight_quotes;
CREATE TEMPORARY TABLE seed_flight_quotes (
  flight_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  airline_id BIGINT UNSIGNED NOT NULL,
  flight_number VARCHAR(20) NOT NULL,
  origin_location_id BIGINT UNSIGNED NOT NULL,
  destination_location_id BIGINT UNSIGNED NOT NULL,
  depart_at DATETIME(6) NOT NULL,
  arrive_at DATETIME(6) NOT NULL,
  economy_price DECIMAL(15,2) NOT NULL
) ENGINE=InnoDB;

INSERT INTO seed_flight_quotes
WITH RECURSIVE
  day_offsets (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM day_offsets WHERE n < 60),
  -- dir, origin airport, destination airport, base one-way economy fare (VND), block time (minutes).
  -- Airport location ids come from seeds/002: SGN 1010, HAN 1005, DAD 1003, PQC 1008, CXR 1002, HPH 1006.
  routes (dir, origin_id, destination_id, base_price, minutes) AS (
              SELECT  0, 1010, 1005, 1650000, 130 UNION ALL SELECT  1, 1005, 1010, 1650000, 130
    UNION ALL SELECT  2, 1010, 1003, 1150000,  80 UNION ALL SELECT  3, 1003, 1010, 1150000,  80
    UNION ALL SELECT  4, 1005, 1003, 1050000,  80 UNION ALL SELECT  5, 1003, 1005, 1050000,  80
    UNION ALL SELECT  6, 1010, 1008,  990000,  60 UNION ALL SELECT  7, 1008, 1010,  990000,  60
    UNION ALL SELECT  8, 1005, 1008, 1750000, 130 UNION ALL SELECT  9, 1008, 1005, 1750000, 130
    UNION ALL SELECT 10, 1010, 1002,  890000,  65 UNION ALL SELECT 11, 1002, 1010,  890000,  65
    UNION ALL SELECT 12, 1005, 1002, 1550000, 115 UNION ALL SELECT 13, 1002, 1005, 1550000, 115
    UNION ALL SELECT 14, 1010, 1006, 1600000, 125 UNION ALL SELECT 15, 1006, 1010, 1600000, 125),
  -- slot, Vietnam departure minute of the day, time-of-day factor (early morning dearest, midday cheapest).
  slots (slot, depart_minute, slot_factor) AS (
    SELECT 0, 365, 1.08 UNION ALL SELECT 1, 760, 0.92 UNION ALL SELECT 2, 1155, 1.00),
  -- Fare factor per airline id (seeds/002: 1 Bamboo, 2 Vietjet, 3 Vietnam Airlines, 4 Vietravel).
  airline_factors (airline_id, airline_factor) AS (
    SELECT 1, 1.00 UNION ALL SELECT 2, 0.88 UNION ALL SELECT 3, 1.12 UNION ALL SELECT 4, 0.92),
  days AS (
    SELECT DATE(UTC_TIMESTAMP() + INTERVAL 7 HOUR) + INTERVAL n DAY AS day FROM day_offsets),
  dated AS (
    SELECT d.day, DATEDIFF(d.day, '2026-01-01') AS day_no, DAYOFWEEK(d.day) AS weekday,
      CASE
        WHEN d.day BETWEEN '2026-12-24' AND '2026-12-25' THEN 1.20
        WHEN d.day BETWEEN '2026-12-30' AND '2027-01-03' THEN 1.45
        WHEN d.day BETWEEN '2027-01-28' AND '2027-02-14' THEN 1.80
        WHEN d.day BETWEEN '2027-04-15' AND '2027-04-18' THEN 1.35
        WHEN d.day BETWEEN '2027-04-29' AND '2027-05-03' THEN 1.55
        ELSE 1.00
      END AS holiday_factor
    FROM days d),
  legs AS (
    SELECT dt.day, dt.day_no, r.dir, r.origin_id, r.destination_id, r.minutes, s.slot, s.depart_minute,
      MOD(r.dir + s.slot, 4) + 1 AS airline_id,
      r.base_price * s.slot_factor * dt.holiday_factor
        -- DAYOFWEEK: 1 Sunday ... 7 Saturday.
        * CASE dt.weekday WHEN 1 THEN 1.30 WHEN 6 THEN 1.25 WHEN 7 THEN 1.12
                          WHEN 3 THEN 0.82 WHEN 4 THEN 0.80 ELSE 1.00 END
        -- A few mid-week sale days per route, never on a holiday.
        * CASE WHEN dt.weekday IN (3, 4, 5) AND dt.holiday_factor = 1.00
                    AND MOD(dt.day_no * 7 + r.dir * 5, 9) = 0 THEN 0.58 ELSE 1.00 END
        -- Deterministic +/-8% spread so neighbouring days differ.
        * (1 + (MOD(dt.day_no * 31 + r.dir * 17 + s.slot * 7, 9) - 4) * 0.02) AS raw_price
    FROM dated dt CROSS JOIN routes r CROSS JOIN slots s)
SELECT
  10000000 + l.day_no * 100 + l.dir * 3 + l.slot,
  l.airline_id,
  CONCAT('DEMO', 100 + l.dir * 3 + l.slot),
  l.origin_id,
  l.destination_id,
  -- Vietnam local time minus 7 hours = UTC.
  TIMESTAMP(l.day) + INTERVAL (l.depart_minute + l.dir * 5 - 420) MINUTE,
  TIMESTAMP(l.day) + INTERVAL (l.depart_minute + l.dir * 5 - 420 + l.minutes) MINUTE,
  GREATEST(390000, ROUND(l.raw_price * a.airline_factor / 10000) * 10000)
FROM legs l
JOIN airline_factors a ON a.airline_id = l.airline_id;

START TRANSACTION;

INSERT INTO flights (id, airline_id, flight_number, origin_location_id, destination_location_id, depart_at, arrive_at)
SELECT q.flight_id, q.airline_id, q.flight_number, q.origin_location_id, q.destination_location_id,
  q.depart_at, q.arrive_at
FROM seed_flight_quotes q
ON DUPLICATE KEY UPDATE flight_number = flights.flight_number;

-- Economy quote for every flight, from the airline's DEMO agent (partner id = 500 + airline id in seeds/002).
-- Quotes expire 3 hours before departure, like the partners' ticketing cut-off.
INSERT INTO flight_offers (id, flight_id, partner_id, cabin_class, quoted_price, currency, baggage_terms,
  change_cancel_terms, expires_at, status)
SELECT q.flight_id, q.flight_id, 500 + q.airline_id, 'economy', q.economy_price, 'VND',
  'Hành lý xách tay 7kg; ký gửi theo điều kiện hãng, cần xác nhận khi xuất vé.',
  'Đổi/hủy theo điều kiện giá vé của hãng.', q.depart_at - INTERVAL 3 HOUR, 'active'
FROM seed_flight_quotes q
ON DUPLICATE KEY UPDATE flight_id = flight_offers.flight_id;

-- Business quotes on Vietnam Airlines and Bamboo Airways only; id = flight id + 50 stays inside the day block.
INSERT INTO flight_offers (id, flight_id, partner_id, cabin_class, quoted_price, currency, baggage_terms,
  change_cancel_terms, expires_at, status)
SELECT q.flight_id + 50, q.flight_id, 500 + q.airline_id, 'business',
  ROUND(q.economy_price * 2.7 / 10000) * 10000, 'VND',
  'Hành lý xách tay 2 kiện; ký gửi 32kg theo điều kiện hãng, cần xác nhận khi xuất vé.',
  'Được đổi/hủy theo điều kiện hạng Thương gia của hãng.', q.depart_at - INTERVAL 3 HOUR, 'active'
FROM seed_flight_quotes q
WHERE q.airline_id IN (1, 3)
ON DUPLICATE KEY UPDATE flight_id = flight_offers.flight_id;

COMMIT;

DROP TEMPORARY TABLE seed_flight_quotes;
