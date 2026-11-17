-- 005_hotel_amenities_and_policies.sql
-- Structured hotel facilities and house rules for the hotel detail page, replacing the free-text
-- "Tiện nghi: a, b" inside hotels.description. Category and policy codes are fixed lists the frontend
-- maps to Vietnamese labels. Run AFTER 004 on the operator-selected database.

CREATE TABLE amenities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(30) NOT NULL,
  is_highlight BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT chk_amenities_category CHECK (category IN ('internet', 'room', 'bathroom', 'food', 'service',
    'wellness', 'family', 'transport', 'safety', 'accessibility', 'business'))
) ENGINE=InnoDB;

CREATE TABLE hotel_amenities (
  hotel_id BIGINT UNSIGNED NOT NULL,
  amenity_id BIGINT UNSIGNED NOT NULL,
  -- Extra charge on top of the room price (e.g. airport transfer); FALSE means included.
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (hotel_id, amenity_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id)
) ENGINE=InnoDB;

CREATE TABLE hotel_policies (
  hotel_id BIGINT UNSIGNED NOT NULL,
  policy_type VARCHAR(30) NOT NULL,
  content VARCHAR(500) NOT NULL,
  PRIMARY KEY (hotel_id, policy_type),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  CONSTRAINT chk_hotel_policies_type CHECK (policy_type IN ('children', 'extra_bed', 'pets', 'smoking',
    'payment', 'deposit', 'cancellation'))
) ENGINE=InnoDB;

ALTER TABLE hotels
  ADD COLUMN check_in_from TIME NULL AFTER star_rating,
  ADD COLUMN check_out_until TIME NULL AFTER check_in_from;
