-- 007_three_roles.sql
-- Simplifies authorization to three roles (decision 2026-11-17):
--   CUSTOMER (scope self), STAFF (scope global), ADMIN (scope global).
-- Existing assignments of the old roles are mapped, never deleted:
--   SUPER_ADMIN -> ADMIN; REGIONAL_MANAGER, BRANCH_MANAGER, STAFF -> STAFF; all operators become global.
-- Run AFTER 006 on the operator-selected database. Re-runnable ONLY before 015: once BRANCH_MANAGER is back
-- (seeds/001 after migration 015, decision 003) running this again would turn branch managers into global STAFF.

INSERT INTO roles (code, name) VALUES
  ('CUSTOMER', 'Khách hàng'),
  ('STAFF', 'Nhân viên'),
  ('ADMIN', 'Quản trị viên')
AS incoming
ON DUPLICATE KEY UPDATE name = incoming.name;

UPDATE user_role_assignments a
JOIN roles old_role ON old_role.id = a.role_id
JOIN roles new_role ON new_role.code = CASE old_role.code
    WHEN 'SUPER_ADMIN' THEN 'ADMIN'
    WHEN 'REGIONAL_MANAGER' THEN 'STAFF'
    WHEN 'BRANCH_MANAGER' THEN 'STAFF'
    ELSE old_role.code
  END
SET a.role_id = new_role.id, a.scope = 'global', a.region_id = NULL, a.branch_id = NULL
WHERE old_role.code IN ('SUPER_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'STAFF');

-- Old role rows are removed only once nothing references them (permissions included).
DELETE rp FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
WHERE r.code IN ('SUPER_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER');

DELETE FROM roles WHERE code IN ('SUPER_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER');
