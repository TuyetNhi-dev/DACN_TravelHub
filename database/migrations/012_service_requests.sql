-- 012_service_requests.sql
-- "Dịch vụ cộng thêm": consultation requests for attraction tickets, car rental, visa and group tours.
-- Anyone can send one (no sign-in); STAFF/ADMIN follow them up in /admin/service-requests.
-- Run AFTER 011 on the operator-selected database.
--
-- Privacy: no passport or national ID number is stored. `details` holds only the fields the backend validated
-- for that service type (unknown fields are dropped before saving). The client IP is NOT stored; rate limiting
-- is in memory.
--
-- Key types: every column referencing users(id) is BIGINT UNSIGNED, exactly like users.id in 001.
-- 3NF: internal notes live in their own append-only table instead of a text column on the request.

CREATE TABLE service_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- Shown to the customer after sending, e.g. YC261120K7Q2MX.
  request_code VARCHAR(20) NOT NULL,
  service_type ENUM('attraction_tickets','car_rental','visa','group_tour') NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(254) NULL,
  customer_note VARCHAR(1000) NULL,
  -- Validated, service-specific fields (dates, head counts, places...). Shape depends on service_type.
  details JSON NOT NULL,
  -- When the customer ticked "đồng ý được liên hệ" (UTC). Required to store the request at all.
  consent_at DATETIME(6) NOT NULL,
  status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
  assigned_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_service_requests_code UNIQUE (request_code),
  CONSTRAINT fk_service_requests_assignee FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_service_requests_status (status, created_at),
  INDEX idx_service_requests_type (service_type, status, created_at),
  INDEX idx_service_requests_phone (phone)
) ENGINE=InnoDB;

-- Internal follow-up notes. Append-only: the application never updates or deletes a row.
CREATE TABLE service_request_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_request_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  note VARCHAR(2000) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_service_request_notes_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id),
  CONSTRAINT fk_service_request_notes_author FOREIGN KEY (author_user_id) REFERENCES users(id),
  INDEX idx_service_request_notes_request (service_request_id, created_at)
) ENGINE=InnoDB;
