-- 001_reference_data.sql
-- Fixed role codes used by backend authorization (TravelHub.Api.Features.Auth.RoleCodes).
-- CUSTOMER (scope self); STAFF and BRANCH_MANAGER (scope branch, region or global); ADMIN (scope global).
-- See migrations/007 and docs/architecture/decisions/003-branch-scopes.md.
-- Safe to re-run: existing codes keep their id and only refresh the display name.
SET NAMES utf8mb4;
INSERT INTO roles (code, name) VALUES
  ('CUSTOMER', 'Khách hàng'),
  ('STAFF', 'Nhân viên'),
  ('BRANCH_MANAGER', 'Quản lý chi nhánh'),
  ('ADMIN', 'Quản trị viên')
AS incoming
ON DUPLICATE KEY UPDATE name = incoming.name;
