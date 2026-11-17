-- 001_initial_schema.sql
-- SàiHành (TravelHub) baseline schema for MySQL 8.0.16+ (CHECK constraints enforced).
-- Source: D:\DACN\SAIHANH_SCHEMA_MYSQL8.sql (design dated 2026-10-19), matching the 42 tables
-- that backend/Data queries were verified against on saihanh_db.
-- Run inside an EMPTY database selected by the operator (e.g. `mysql ... saihanh_db < this file`).
-- The database name is intentionally not hardcoded.
-- Money: DECIMAL(15,2) VND. Timestamps: UTC.

-- ORGANIZATION AND RBAC
CREATE TABLE regions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE branches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  region_id BIGINT UNSIGNED NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  address VARCHAR(300) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (region_id) REFERENCES regions(id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NULL,
  status ENUM('active','disabled','pending') NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB;

CREATE TABLE user_role_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  scope ENUM('global','region','branch','self') NOT NULL,
  region_id BIGINT UNSIGNED NULL,
  branch_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  INDEX idx_user_roles_user (user_id, is_active),
  CHECK ((scope = 'global' AND region_id IS NULL AND branch_id IS NULL)
      OR (scope = 'self' AND region_id IS NULL AND branch_id IS NULL)
      OR (scope = 'region' AND region_id IS NOT NULL AND branch_id IS NULL)
      OR (scope = 'branch' AND branch_id IS NOT NULL AND region_id IS NULL))
) ENGINE=InnoDB;

-- CATALOGS, LOCATIONS AND SUPPLIERS
CREATE TABLE locations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT UNSIGNED NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  location_type ENUM('province','city','district','place','airport') NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES locations(id),
  INDEX idx_locations_parent (parent_id)
) ENGINE=InnoDB;

CREATE TABLE tour_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE transport_types (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE partners (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partner_type ENUM('hotel','flight_supplier','tour_supplier','other') NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(254) NULL,
  contact_phone VARCHAR(30) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB;

-- TOUR: SAIHANH OPERATES PACKAGED TOURS
CREATE TABLE tours (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  destination_id BIGINT UNSIGNED NOT NULL,
  operating_branch_id BIGINT UNSIGNED NOT NULL,
  duration_days SMALLINT UNSIGNED NOT NULL,
  duration_nights SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  description TEXT NULL,
  base_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  status ENUM('draft','published','paused','archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (category_id) REFERENCES tour_categories(id),
  FOREIGN KEY (destination_id) REFERENCES locations(id),
  FOREIGN KEY (operating_branch_id) REFERENCES branches(id),
  CHECK (duration_days > 0),
  CHECK (base_price >= 0),
  INDEX idx_tours_search (status, destination_id)
) ENGINE=InnoDB;

CREATE TABLE tour_transport_types (
  tour_id BIGINT UNSIGNED NOT NULL,
  transport_type_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (tour_id, transport_type_id),
  FOREIGN KEY (tour_id) REFERENCES tours(id),
  FOREIGN KEY (transport_type_id) REFERENCES transport_types(id)
) ENGINE=InnoDB;

CREATE TABLE tour_departures (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tour_id BIGINT UNSIGNED NOT NULL,
  departure_location_id BIGINT UNSIGNED NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  reserved_seats INT UNSIGNED NOT NULL DEFAULT 0,
  adult_price DECIMAL(15,2) NOT NULL,
  child_price DECIMAL(15,2) NULL,
  status ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open',
  FOREIGN KEY (tour_id) REFERENCES tours(id),
  FOREIGN KEY (departure_location_id) REFERENCES locations(id),
  UNIQUE KEY uq_tour_departure (tour_id, departure_location_id, departure_date),
  CHECK (return_date >= departure_date),
  CHECK (capacity > 0 AND reserved_seats <= capacity),
  CHECK (adult_price >= 0 AND (child_price IS NULL OR child_price >= 0)),
  INDEX idx_departures_date (departure_date, status)
) ENGINE=InnoDB;

CREATE TABLE tour_itinerary_days (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tour_id BIGINT UNSIGNED NOT NULL,
  day_number SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  FOREIGN KEY (tour_id) REFERENCES tours(id),
  UNIQUE KEY uq_tour_day (tour_id, day_number),
  CHECK (day_number > 0)
) ENGINE=InnoDB;

CREATE TABLE tour_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tour_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (tour_id) REFERENCES tours(id),
  INDEX idx_tour_images_order (tour_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE tour_inclusions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tour_id BIGINT UNSIGNED NOT NULL,
  service_type ENUM('hotel','flight','transport','meal','guide','ticket','other') NOT NULL,
  description VARCHAR(500) NOT NULL,
  is_included BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (tour_id) REFERENCES tours(id)
) ENGINE=InnoDB;

CREATE TABLE tour_departure_suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  departure_id BIGINT UNSIGNED NOT NULL,
  partner_id BIGINT UNSIGNED NOT NULL,
  service_type ENUM('hotel','flight','transport','meal','guide','other') NOT NULL,
  description VARCHAR(255) NULL,
  estimated_cost DECIMAL(15,2) NULL,
  FOREIGN KEY (departure_id) REFERENCES tour_departures(id),
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  CHECK (estimated_cost IS NULL OR estimated_cost >= 0)
) ENGINE=InnoDB;

-- HOTELS: PARTNER OFFERS, NOT SAIHANH-OWNED ROOM STOCK
CREATE TABLE hotels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partner_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  address VARCHAR(400) NULL,
  description TEXT NULL,
  star_rating TINYINT UNSIGNED NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  CHECK (star_rating IS NULL OR star_rating BETWEEN 1 AND 5),
  INDEX idx_hotels_location (location_id, status)
) ENGINE=InnoDB;

CREATE TABLE room_types (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  max_guests SMALLINT UNSIGNED NOT NULL,
  description TEXT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id),
  CHECK (max_guests > 0),
  UNIQUE KEY uq_hotel_room_name (hotel_id, name)
) ENGINE=InnoDB;

CREATE TABLE hotel_offers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_type_id BIGINT UNSIGNED NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  nightly_price DECIMAL(15,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  terms TEXT NULL,
  last_verified_at DATETIME(6) NULL,
  status ENUM('active','expired','disabled') NOT NULL DEFAULT 'active',
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  CHECK (valid_to >= valid_from AND nightly_price >= 0),
  INDEX idx_hotel_offer_validity (room_type_id, valid_from, valid_to)
) ENGINE=InnoDB;

-- FLIGHTS: PARTNER QUOTES, NOT AIRCRAFT INVENTORY
CREATE TABLE airlines (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  iata_code CHAR(2) NULL UNIQUE,
  name VARCHAR(160) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE flights (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  airline_id BIGINT UNSIGNED NOT NULL,
  flight_number VARCHAR(20) NOT NULL,
  origin_location_id BIGINT UNSIGNED NOT NULL,
  destination_location_id BIGINT UNSIGNED NOT NULL,
  depart_at DATETIME(6) NOT NULL,
  arrive_at DATETIME(6) NOT NULL,
  FOREIGN KEY (airline_id) REFERENCES airlines(id),
  FOREIGN KEY (origin_location_id) REFERENCES locations(id),
  FOREIGN KEY (destination_location_id) REFERENCES locations(id),
  CHECK (arrive_at > depart_at AND origin_location_id <> destination_location_id),
  UNIQUE KEY uq_flight_instance (airline_id, flight_number, depart_at),
  INDEX idx_flight_route (origin_location_id, destination_location_id, depart_at)
) ENGINE=InnoDB;

CREATE TABLE flight_offers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  flight_id BIGINT UNSIGNED NOT NULL,
  partner_id BIGINT UNSIGNED NOT NULL,
  cabin_class ENUM('economy','premium_economy','business','first') NOT NULL,
  quoted_price DECIMAL(15,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  baggage_terms TEXT NULL,
  change_cancel_terms TEXT NULL,
  expires_at DATETIME(6) NULL,
  status ENUM('active','expired','disabled') NOT NULL DEFAULT 'active',
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  CHECK (quoted_price >= 0),
  INDEX idx_flight_offers (flight_id, status, expires_at)
) ENGINE=InnoDB;

-- MULTI-SERVICE ORDER: PACKAGE COMPONENTS ARE NOT RETAIL ITEMS
CREATE TABLE bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(50) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  selling_branch_id BIGINT UNSIGNED NULL,
  status ENUM('pending','partially_confirmed','confirmed','partially_cancelled','cancelled','completed') NOT NULL DEFAULT 'pending',
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (selling_branch_id) REFERENCES branches(id),
  CHECK (subtotal >= 0 AND discount_total >= 0 AND total >= 0),
  INDEX idx_bookings_customer (customer_id, created_at),
  INDEX idx_bookings_branch (selling_branch_id, status)
) ENGINE=InnoDB;

CREATE TABLE booking_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  service_type ENUM('tour','hotel','flight') NOT NULL,
  status ENUM('pending','awaiting_supplier','confirmed','cancelled','completed','failed') NOT NULL DEFAULT 'pending',
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  price_snapshot JSON NULL,
  supplier_confirmation_code VARCHAR(120) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CHECK (quantity > 0 AND unit_price >= 0 AND total_price >= 0),
  INDEX idx_booking_items_order (booking_id, status)
) ENGINE=InnoDB;

CREATE TABLE tour_booking_details (
  booking_item_id BIGINT UNSIGNED PRIMARY KEY,
  tour_departure_id BIGINT UNSIGNED NOT NULL,
  adult_count SMALLINT UNSIGNED NOT NULL,
  child_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (booking_item_id) REFERENCES booking_items(id),
  FOREIGN KEY (tour_departure_id) REFERENCES tour_departures(id),
  CHECK (adult_count + child_count > 0)
) ENGINE=InnoDB;

CREATE TABLE hotel_booking_details (
  booking_item_id BIGINT UNSIGNED PRIMARY KEY,
  room_type_id BIGINT UNSIGNED NOT NULL,
  hotel_offer_id BIGINT UNSIGNED NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  room_count SMALLINT UNSIGNED NOT NULL,
  guest_count SMALLINT UNSIGNED NOT NULL,
  partner_reference VARCHAR(120) NULL,
  FOREIGN KEY (booking_item_id) REFERENCES booking_items(id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (hotel_offer_id) REFERENCES hotel_offers(id),
  CHECK (check_out > check_in AND room_count > 0 AND guest_count > 0)
) ENGINE=InnoDB;

CREATE TABLE flight_booking_details (
  booking_item_id BIGINT UNSIGNED PRIMARY KEY,
  flight_id BIGINT UNSIGNED NOT NULL,
  flight_offer_id BIGINT UNSIGNED NULL,
  cabin_class ENUM('economy','premium_economy','business','first') NOT NULL,
  journey_group_code VARCHAR(60) NULL,
  partner_pnr VARCHAR(120) NULL,
  ticket_status ENUM('not_issued','issued','voided','refunded') NOT NULL DEFAULT 'not_issued',
  FOREIGN KEY (booking_item_id) REFERENCES booking_items(id),
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (flight_offer_id) REFERENCES flight_offers(id),
  INDEX idx_flight_booking_group (journey_group_code)
) ENGINE=InnoDB;

CREATE TABLE booking_passengers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_item_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  passenger_type ENUM('adult','child','infant') NOT NULL DEFAULT 'adult',
  birth_date DATE NULL,
  FOREIGN KEY (booking_item_id) REFERENCES booking_items(id)
) ENGINE=InnoDB;

-- PAYMENT AND ITEM-LEVEL REFUNDS
CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(80) NOT NULL,
  provider_transaction_id VARCHAR(160) NULL UNIQUE,
  idempotency_key VARCHAR(160) NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  status ENUM('pending','succeeded','failed','cancelled') NOT NULL DEFAULT 'pending',
  paid_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CHECK (amount > 0),
  INDEX idx_payments_booking (booking_id, status)
) ENGINE=InnoDB;

CREATE TABLE refunds (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  booking_item_id BIGINT UNSIGNED NULL,
  amount DECIMAL(15,2) NOT NULL,
  reason VARCHAR(500) NULL,
  provider_refund_id VARCHAR(160) NULL UNIQUE,
  status ENUM('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (booking_item_id) REFERENCES booking_items(id),
  CHECK (amount > 0)
) ENGINE=InnoDB;

-- PROMOTIONS, REVIEWS AND HOMEPAGE CONTENT
CREATE TABLE promotions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  promotion_type ENUM('coupon','flash_sale','campaign') NOT NULL,
  discount_type ENUM('fixed','percent') NOT NULL,
  discount_value DECIMAL(15,2) NOT NULL,
  start_at DATETIME(6) NOT NULL,
  end_at DATETIME(6) NOT NULL,
  quota INT UNSIGNED NULL,
  used_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft','active','paused','ended') NOT NULL DEFAULT 'draft',
  CHECK (end_at > start_at AND discount_value >= 0),
  CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CHECK (quota IS NULL OR used_count <= quota)
) ENGINE=InnoDB;

CREATE TABLE promotion_targets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  promotion_id BIGINT UNSIGNED NOT NULL,
  service_type ENUM('tour','hotel','flight') NOT NULL,
  target_id BIGINT UNSIGNED NULL,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  INDEX idx_promotion_targets (service_type, target_id)
) ENGINE=InnoDB;

CREATE TABLE promotion_redemptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  promotion_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  discount_amount DECIMAL(15,2) NOT NULL,
  redeemed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  UNIQUE KEY uq_promotion_booking (promotion_id, booking_id),
  CHECK (discount_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  booking_item_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  content TEXT NULL,
  moderation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (booking_item_id) REFERENCES booking_items(id),
  UNIQUE KEY uq_review_per_item (customer_id, booking_item_id),
  CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE home_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_key VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  section_type ENUM('banner','featured_tours','featured_hotels','featured_flights','deals','custom') NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE home_section_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_id BIGINT UNSIGNED NOT NULL,
  content_type ENUM('tour','hotel','flight','promotion','banner') NOT NULL,
  content_id BIGINT UNSIGNED NULL,
  title VARCHAR(200) NULL,
  image_url VARCHAR(1000) NULL,
  link_url VARCHAR(1000) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (section_id) REFERENCES home_sections(id),
  INDEX idx_home_section_items (section_id, sort_order)
) ENGINE=InnoDB;

-- OPTIONAL PERSONALIZATION AND AI (NO CLAIM OF LIVE AI INTEGRATION)
CREATE TABLE favorites (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  service_type ENUM('tour','hotel','flight') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_user_favorite (user_id, service_type, target_id)
) ENGINE=InnoDB;

CREATE TABLE ai_itineraries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  itinerary_json JSON NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE chat_conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender ENUM('user','assistant','system') NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
  INDEX idx_chat_messages_order (conversation_id, created_at)
) ENGINE=InnoDB;

-- IMPORTANT APPLICATION-LEVEL INVARIANTS / TRANSACTIONS:
-- 1. Exactly ONE subtype row for each booking_item, matching service_type.
--    MySQL FKs alone do not enforce this XOR across three subtype tables.
-- 2. For tour seats: lock departure row and atomically update reserved_seats
--    only when reserved_seats + requested_seats <= capacity; release on cancellation.
-- 3. Hotel/flight offers are quotations, NOT proof of available inventory.
--    Revalidate with supplier before confirmation; retain supplier reference.
-- 4. Booking subtotal, discounts, total and payment/refund balances must be
--    computed and updated transactionally; never trust frontend totals.
-- 5. For a round trip, use two flight booking_items with same journey_group_code.
-- 6. Validate hotel_offer.room_type_id matches hotel_booking_details.room_type_id;
--    validate flight_offer.flight_id matches flight_booking_details.flight_id.
-- 7. Validate refund booking_item belongs to payment.booking_id and refunds
--    do not exceed successful payment amount.
-- 8. Validate user_role_assignments scope against actual role and branch/region.
-- 9. promotion_targets, favorites and home_section_items use typed target IDs;
--    resolve and validate referenced records in application service layer.
-- 10. Only independently purchased hotel/flight services create retail booking_items.
--     Tour inclusions/supplier costs are NOT extra billable booking_items.
-- 11. Store UTC timestamps consistently; interpret date-only stays/departures
--     in the supplier/local destination timezone.
-- 12. Do not store card numbers or plaintext passwords. Protect passenger PII.
