-- 013_cart_items.sql
-- Giỏ hàng: a signed-in customer's saved choices (tour + departure + head count). Run AFTER 012.
--
-- A cart item is ONLY a choice. It holds no seats (tour_departures.reserved_seats is untouched) and locks no
-- price: every read joins the live departure. adult_price_seen / child_price_seen are the prices the customer
-- saw when adding the item, kept only to warn "giá đã thay đổi"; the booking API always prices on the server.
-- Guests keep their cart in the browser (localStorage) and it is merged into this table when they sign in.
--
-- * One row per (user, departure): adding the same departure again updates the head count (UNIQUE key).
--   The API upserts with the MySQL 8.0.19+ row alias (INSERT ... AS new ON DUPLICATE KEY UPDATE col = new.col).
-- * At most 10 items per user, enforced by the API (CartLimits.MaxItems), not by the schema.
-- * No passenger names are stored here: they are only collected when the customer actually books.
-- * Deleting a user or a departure removes the matching cart rows (ON DELETE CASCADE): a cart line has no
--   value without either of them.
-- * item_type is 'tour' only for now; hotels and flights will need their own columns in a later migration.
-- * Infants (week 7, "giá em bé") will add an infant_count column here, see docs/ROADMAP.md.
--
-- Key types: user_id and tour_departure_id are BIGINT UNSIGNED, exactly like users.id and tour_departures.id.

CREATE TABLE cart_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  item_type ENUM('tour') NOT NULL DEFAULT 'tour',
  tour_departure_id BIGINT UNSIGNED NOT NULL,
  adult_count SMALLINT UNSIGNED NOT NULL,
  child_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  adult_price_seen DECIMAL(15,2) NOT NULL,
  child_price_seen DECIMAL(15,2) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_departure FOREIGN KEY (tour_departure_id) REFERENCES tour_departures(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_cart_items_user_departure UNIQUE (user_id, tour_departure_id),
  CONSTRAINT chk_cart_items_travelers CHECK (adult_count >= 1 AND adult_count + child_count <= 20),
  CONSTRAINT chk_cart_items_prices CHECK (adult_price_seen >= 0 AND (child_price_seen IS NULL OR child_price_seen >= 0))
) ENGINE=InnoDB;

-- Newest first on the cart page; also serves the per-user count used by the 10-item limit.
CREATE INDEX idx_cart_items_user_updated ON cart_items (user_id, updated_at);
