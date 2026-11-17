-- 009_flight_deals_and_price_alerts.sql
-- "Săn vé rẻ": featured flight deals, quote freshness and customer price alerts.
-- Prices stay partner REFERENCE quotes (flight_offers), never live fares or seat guarantees.
-- Run AFTER 008 on the operator-selected database.

-- Staff pin a quote to the top of /flights/deals; updated_at tells customers how fresh a quote is.
ALTER TABLE flight_offers
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  ADD INDEX idx_flight_offers_featured (is_featured, status);

-- A signed-in customer watching one route over a range of Vietnamese departure dates.
CREATE TABLE price_alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  origin_location_id BIGINT UNSIGNED NOT NULL,
  destination_location_id BIGINT UNSIGNED NOT NULL,
  -- Vietnamese calendar dates (inclusive); the alert expires once depart_to has passed.
  depart_from DATE NOT NULL,
  depart_to DATE NOT NULL,
  cabin_class ENUM('economy','premium_economy','business','first') NOT NULL DEFAULT 'economy',
  target_price DECIMAL(15,2) NOT NULL,
  status ENUM('active','paused','expired','cancelled') NOT NULL DEFAULT 'active',
  -- Random capability for the one-click "hủy theo dõi" link in e-mails; it can only cancel this alert.
  unsubscribe_token CHAR(43) NOT NULL,
  last_notified_at DATETIME(6) NULL,
  last_notified_price DECIMAL(15,2) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (origin_location_id) REFERENCES locations(id),
  FOREIGN KEY (destination_location_id) REFERENCES locations(id),
  UNIQUE KEY uq_price_alerts_unsubscribe (unsubscribe_token),
  CONSTRAINT chk_price_alerts_route CHECK (origin_location_id <> destination_location_id),
  CONSTRAINT chk_price_alerts_dates CHECK (depart_to >= depart_from),
  CONSTRAINT chk_price_alerts_target CHECK (target_price > 0),
  INDEX idx_price_alerts_user (user_id, status),
  INDEX idx_price_alerts_route (origin_location_id, destination_location_id, status)
) ENGINE=InnoDB;

-- One row per (alert, quote, price) ever e-mailed: the unique key is what stops the same quote from being
-- sent twice, even when two sweeps overlap. A later price drop on the same quote is a new quote to the customer.
CREATE TABLE price_alert_notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  price_alert_id BIGINT UNSIGNED NOT NULL,
  flight_offer_id BIGINT UNSIGNED NOT NULL,
  quoted_price DECIMAL(15,2) NOT NULL,
  notified_at DATETIME(6) NOT NULL,
  FOREIGN KEY (price_alert_id) REFERENCES price_alerts(id),
  FOREIGN KEY (flight_offer_id) REFERENCES flight_offers(id),
  UNIQUE KEY uq_price_alert_quote (price_alert_id, flight_offer_id, quoted_price)
) ENGINE=InnoDB;
