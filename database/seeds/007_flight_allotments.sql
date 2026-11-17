-- 007_flight_allotments.sql
-- DEMO seat allotments ("quỹ ghế") that turn the best-priced quotes of seeds/006 into flight deals.
-- Requires migrations/009 and 010, and seeds/006. Allotment sizes and sold seats are SIMULATED for the demo:
-- they are not real contracts, and sold_seats stands for seats sold through other channels.
--
-- * Deals: the cheapest 15% of the future economy quotes on each route (seeds/006 rows only, id >= 10000000).
-- * allotment_seats: 5 to 30 seats, fixed per quote id. About 1 deal in 7 is left with 1-2 seats ("sắp hết").
-- * is_featured: the cheapest deal in the next 30 days on SGN-HAN, SGN-PQC, SGN-DAD and HAN-DAD, set only when
--   no seed deal is featured yet.
--
-- Safe to re-run: only quotes with no allotment yet are changed, so real sales (sold_seats) are never overwritten.
-- MySQL Workbench: run SET SQL_SAFE_UPDATES = 0; first, as these UPDATEs filter through a join.
SET NAMES utf8mb4;
START TRANSACTION;

-- The derived tables use window functions, so MySQL materialises them before updating flight_offers.
UPDATE flight_offers o
JOIN (
  SELECT fo.id,
    PERCENT_RANK() OVER (PARTITION BY f.origin_location_id, f.destination_location_id
                         ORDER BY fo.quoted_price, f.depart_at) AS price_rank
  FROM flight_offers fo
  JOIN flights f ON f.id = fo.flight_id
  WHERE fo.id >= 10000000 AND fo.cabin_class = 'economy' AND fo.status = 'active'
    AND f.depart_at > UTC_TIMESTAMP()
) best ON best.id = o.id
SET o.allotment_seats = 5 + MOD(o.id, 26),
    o.sold_seats = CASE
      WHEN MOD(o.id, 7) = 0 THEN 5 + MOD(o.id, 26) - 1 - MOD(o.id, 2)
      ELSE FLOOR((5 + MOD(o.id, 26)) * MOD(o.id, 5) / 10)
    END
WHERE o.allotment_seats IS NULL AND best.price_rank <= 0.15;

UPDATE flight_offers o
JOIN (
  SELECT fo.id, origin.code AS origin_code, destination.code AS destination_code,
    ROW_NUMBER() OVER (PARTITION BY f.origin_location_id, f.destination_location_id
                       ORDER BY fo.quoted_price, f.depart_at, fo.id) AS route_rank,
    (SELECT COUNT(*) FROM flight_offers x WHERE x.id >= 10000000 AND x.is_featured) AS already_featured
  FROM flight_offers fo
  JOIN flights f ON f.id = fo.flight_id
  JOIN locations origin ON origin.id = f.origin_location_id
  JOIN locations destination ON destination.id = f.destination_location_id
  WHERE fo.id >= 10000000 AND fo.allotment_seats IS NOT NULL AND fo.sold_seats < fo.allotment_seats
    AND f.depart_at > UTC_TIMESTAMP() + INTERVAL 1 DAY AND f.depart_at < UTC_TIMESTAMP() + INTERVAL 30 DAY
) pick ON pick.id = o.id
SET o.is_featured = TRUE
WHERE pick.route_rank = 1 AND pick.already_featured = 0
  AND (pick.origin_code, pick.destination_code) IN (('SGN', 'HAN'), ('SGN', 'PQC'), ('SGN', 'DAD'), ('HAN', 'DAD'));

COMMIT;
