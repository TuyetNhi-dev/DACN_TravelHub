# Quyết định 003: Phạm vi chi nhánh và khu vực cho trang quản trị

Trạng thái: **đã duyệt** (24/11/2026). Thay phần phân quyền của [quyết định 002](002-three-roles.md).

## Bối cảnh

SàiHành mô phỏng một công ty lữ hành có 4 chi nhánh (Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ) thuộc 3 khu vực Bắc, Trung,
Nam. Trang quản trị cần cho quản lý chi nhánh sửa tour và lịch khởi hành của chi nhánh mình mà không đụng tới chi
nhánh khác. Ba vai trò `global` của quyết định 002 không làm được điều đó.

## Quyết định

Theo [đặc tả admin](../admin-spec.md):

| Vai trò | Phạm vi | Quyền chính |
|---|---|---|
| `CUSTOMER` | `self` | Như trước |
| `STAFF` | `branch`, `region` hoặc `global` | Xem dữ liệu trong phạm vi, xử lý đơn, danh sách đoàn, yêu cầu dịch vụ |
| `BRANCH_MANAGER` | `branch`, `region` hoặc `global` | Như STAFF, thêm sửa tour, lịch khởi hành và xem nhật ký thao tác trong phạm vi |
| `ADMIN` | luôn `global` | Toàn bộ, thêm Nhân viên & phân quyền |

- Phạm vi được đọc lại từ database ở mỗi request. Ngoài phạm vi trả 404, tham số `scope` vượt quyền trả 403.
- Mọi thao tác ghi trong trang quản trị ghi `audit_logs` trong cùng transaction.
- Đơn khách sạn và vé (không có chi nhánh) chỉ phạm vi toàn quốc thấy. Yêu cầu dịch vụ là hàng đợi chung.
- Xuất danh sách đoàn dùng ClosedXML (.xlsx).
- Migration 015 (chi nhánh điều hành của lịch, `audit_logs`) và 016 (vòng đời chuyến, chính sách tour, ghi chú
  nội bộ của đơn). Seed 001 thêm lại mã `BRANCH_MANAGER`.

## Hệ quả

- `AGENTS.md` bỏ câu "không thêm vai trò hay phạm vi chi nhánh/khu vực".
- Không chạy lại migration 007 sau 015 (007 gộp `BRANCH_MANAGER` về STAFF toàn quốc).
- Thêm vai trò hoặc loại phạm vi mới vẫn cần một quyết định mới.
