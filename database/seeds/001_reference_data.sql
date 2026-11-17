-- 001_reference_data.sql
-- Fixed role codes used by backend authorization (TravelHub.Api.Features.Auth.RoleCodes).
-- Three roles: CUSTOMER (scope self), STAFF and ADMIN (scope global). See migrations/007.
-- Safe to re-run: existing codes keep their id and only refresh the display name.
SET NAMES utf8mb4;
INSERT INTO roles (code, name) VALUES
  ('CUSTOMER', 'Khách hàng'),
  ('STAFF', 'Nhân viên'),
  ('ADMIN', 'Quản trị viên')
AS incoming
ON DUPLICATE KEY UPDATE name = incoming.name;
