# Quyết định 002: Ba vai trò và băm mật khẩu PBKDF2

Trạng thái: **đã áp dụng** (17/11/2026, migration 007). Phần phân quyền được thay bằng
[quyết định 003](003-branch-scopes.md) (24/11/2026); phần băm mật khẩu vẫn giữ nguyên.

## Bối cảnh

Schema ban đầu ([quyết định 001](001-database-phase1.md)) có 5 vai trò: `SUPER_ADMIN`, `REGIONAL_MANAGER`,
`BRANCH_MANAGER`, `STAFF`, `CUSTOMER`, kèm phạm vi dữ liệu theo khu vực và chi nhánh. Trong code, bốn vai trò vận
hành có cùng quyền thao tác đơn và chỉ khác phạm vi. Đồ án chỉ có một "công ty" mô phỏng, không có nghiệp vụ
nào thật sự cần tách theo khu vực, nên phạm vi chi nhánh làm code và kiểm thử phức tạp mà không đem lại gì.

## Quyết định

Chỉ dùng 3 vai trò:

| Vai trò | Phạm vi | Quyền |
|---|---|---|
| `CUSTOMER` | `self` | Đặt chỗ, giỏ hàng, xem và hủy đơn của chính mình |
| `STAFF` | `global` | Xử lý mọi đơn và yêu cầu dịch vụ |
| `ADMIN` | `global` | Như STAFF. `StaffScope.IsAdmin` để dành cho chức năng chỉ ADMIN được làm (hiện chưa có) |

- Migration `007_three_roles.sql` chuyển vai trò cũ, không xóa bản ghi phân quyền:
  `SUPER_ADMIN` → `ADMIN`; `REGIONAL_MANAGER`, `BRANCH_MANAGER`, `STAFF` → `STAFF`; mọi nhân viên thành `global`.
- Seed `001_reference_data.sql` chỉ tạo 3 mã vai trò.
- Đăng ký công khai chỉ cấp `CUSTOMER/self`; vai trò và phạm vi không bao giờ lấy từ request.
- **Không thêm vai trò hay phạm vi chi nhánh/khu vực khi chưa được duyệt** (ghi trong `AGENTS.md`).

## Băm mật khẩu

Giữ `PasswordHasher` của ASP.NET Core Identity (PBKDF2, salt riêng cho từng mật khẩu). Không chuyển sang BCrypt:
PasswordHasher có sẵn trong framework, không cần thêm thư viện, và hash có ghi phiên bản thuật toán nên đổi tham số
về sau vẫn đọc được hash cũ.

## Hệ quả

- Code phân quyền đơn giản: `StaffScope` chỉ phân biệt khách (chính mình) và nhân viên (toàn cục, `RoleCodes.Operators`).
- Muốn phân quyền theo chi nhánh sau này sẽ cần migration và quyết định mới.
