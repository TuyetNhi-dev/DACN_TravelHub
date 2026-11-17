-- 006_tour_collections.sql
-- Seasonal and themed tour collections ("Tour Tết 2027", "Mùa hoa dã quỳ", "Du thuyền"...).
-- A tour can belong to several collections, so this is a link table rather than tours.category_id.
-- Run AFTER 005 on the operator-selected database.

CREATE TABLE tour_collections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  tagline VARCHAR(255) NULL,
  -- Free text shown as-is, e.g. "Tháng 11 – 12"; seasons repeat yearly, so no date columns.
  season_label VARCHAR(80) NULL,
  -- The place whose photos represent the collection (frontend picks images by its name).
  cover_location_id BIGINT UNSIGNED NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (cover_location_id) REFERENCES locations(id),
  CONSTRAINT chk_tour_collections_slug CHECK (slug REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$')
) ENGINE=InnoDB;

CREATE TABLE tour_collection_items (
  collection_id BIGINT UNSIGNED NOT NULL,
  tour_id BIGINT UNSIGNED NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, tour_id),
  FOREIGN KEY (collection_id) REFERENCES tour_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  INDEX idx_tour_collection_items_tour (tour_id)
) ENGINE=InnoDB;
