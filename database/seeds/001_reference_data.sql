-- 001_reference_data.sql
-- Fixed role codes used by backend authorization (TravelHub.Api.Auth.RoleCodes).
-- Safe to re-run: existing codes keep their id and only refresh the display name.
SET NAMES utf8mb4;
INSERT INTO roles (code, name) VALUES
  ('SUPER_ADMIN', 'Quản trị hệ thống'),
  ('REGIONAL_MANAGER', 'Quản lý khu vực'),
  ('BRANCH_MANAGER', 'Quản lý chi nhánh'),
  ('STAFF', 'Nhân viên điều hành'),
  ('CUSTOMER', 'Khách hàng')
AS incoming
ON DUPLICATE KEY UPDATE name = incoming.name;
