# Đặc tả admin lõi (nhiều chi nhánh)

Trạng thái: **đã duyệt** (24/11/2026, [quyết định 003](decisions/003-branch-scopes.md)). Thay phần phân quyền của
[quyết định 002](decisions/002-three-roles.md); `AGENTS.md` đã cập nhật. Q1 chọn ClosedXML.

Bổ sung khi duyệt (migration 016): vòng đời chuyến mở bán → chốt đoàn → đang đi → hoàn thành / hủy (hủy cần lý do),
tab "Chính sách" của tour, ghi chú nội bộ và lịch sử trạng thái của đơn, nhân viên hủy đơn chưa thanh toán, khóa/mở
tài khoản nhân viên, dashboard doanh thu 6 tháng và tỉ lệ lấp đầy 30 ngày.

## 1. Hiện trạng dùng lại được

| Đã có | Ghi chú |
|---|---|
| `regions` NORTH/CENTRAL/SOUTH, `branches.region_id` (HN, DN, HCM, CT) | Dùng nguyên, đây là cây khu vực → chi nhánh |
| `user_role_assignments.scope` = global/region/branch/self, kèm `region_id`/`branch_id` và CHECK | Đủ để gán phạm vi, không cần bảng mới |
| `tours.operating_branch_id`, `tours.status` (draft/published/paused/archived) | "Ẩn tour" = `paused` |
| `bookings.selling_branch_id` | Đơn tour đang lấy chi nhánh của tour; sẽ đổi sang chi nhánh của lịch khởi hành |
| `tour_images.sort_order`, `tour_itinerary_days`, `tour_inclusions`, `booking_passengers` | Đủ cho ảnh, lịch trình, giá bao gồm, danh sách đoàn |

## 2. Thay đổi database

**Migration `015_branch_operations_and_audit.sql`** (chỉ viết file):

| Thay đổi | Chi tiết |
|---|---|
| `tour_departures.operating_branch_id` | BIGINT UNSIGNED, FK `branches`. Thêm NULL → gán bằng `tours.operating_branch_id` → NOT NULL. Index `(operating_branch_id, departure_date)` |
| `tour_departures.min_guests` | SMALLINT UNSIGNED NOT NULL DEFAULT 10, CHECK `min_guests <= capacity`. Dùng cảnh báo "chưa đủ khách" |
| Bảng `audit_logs` | Xem dưới |
| Index `bookings (selling_branch_id, created_at)` | Cho dashboard |

```sql
CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NOT NULL,       -- FK users
  action VARCHAR(60) NOT NULL,                  -- vd 'tour.update', 'departure.bulk_create'
  entity_type VARCHAR(40) NOT NULL,             -- tour | departure | booking | service_request | staff_assignment
  entity_id VARCHAR(64) NOT NULL,
  branch_id BIGINT UNSIGNED NULL,               -- chi nhánh của đối tượng, để lọc theo phạm vi
  region_id BIGINT UNSIGNED NULL,
  summary VARCHAR(500) NOT NULL,                -- câu tiếng Việt hiển thị
  changes JSON NULL,                            -- {field: [cũ, mới]}, không chứa mật khẩu/token
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX ix_audit_created (created_at), INDEX ix_audit_entity (entity_type, entity_id),
  INDEX ix_audit_branch (branch_id, created_at), INDEX ix_audit_region (region_id, created_at)
);
```

Chỉ thêm (append-only), không có API sửa/xóa. Ghi **trong cùng transaction** với thao tác, thao tác lỗi thì
không có dòng log. Không lưu IP (giống quyết định ở migration 012).

**Seed:** `seeds/001_reference_data.sql` thêm mã vai trò `BRANCH_MANAGER` (chạy lại an toàn). Không seed tài khoản
(không đưa mật khẩu vào repo); gán vai trò cho tài khoản có sẵn qua trang Nhân viên.

## 3. Vai trò, phạm vi và ma trận quyền

Phạm vi của nhân viên: **chi nhánh** (`branch`), **khu vực** (`region`, gồm mọi chi nhánh trong khu vực) hoặc
**toàn quốc** (`global`). ADMIN luôn `global`. Một người có thể có nhiều dòng phân quyền; phạm vi hiệu lực là hợp
của các dòng.

Một đối tượng thuộc phạm vi khi:
- Tour: `tours.operating_branch_id` trong phạm vi.
- Lịch khởi hành, danh sách đoàn: `tour_departures.operating_branch_id` trong phạm vi.
- Đơn: `bookings.selling_branch_id` trong phạm vi. Đơn khách sạn/vé (`selling_branch_id` NULL) chỉ phạm vi
  toàn quốc thấy (xem quyết định Q2).
- Yêu cầu dịch vụ: không gắn chi nhánh, mọi nhân viên đều thấy như hiện nay (Q3).

| Chức năng | STAFF | BRANCH_MANAGER | ADMIN |
|---|---|---|---|
| Dashboard | Phạm vi mình | Phạm vi mình | Toàn quốc |
| Xem tour, lịch khởi hành | ✓ | ✓ | ✓ |
| Thêm/sửa/ẩn/nhân bản tour, ảnh, lịch trình, giá bao gồm | — | ✓ (tour thuộc phạm vi) | ✓ |
| Tạo/sửa lịch khởi hành, mở/đóng bán | — | ✓ (chi nhánh điều hành thuộc phạm vi) | ✓ |
| Xử lý đơn (xác nhận/từ chối/hoàn tất) | ✓ | ✓ | ✓ |
| Danh sách đoàn, xuất Excel | ✓ | ✓ | ✓ |
| Yêu cầu dịch vụ | ✓ | ✓ | ✓ |
| Nhật ký thao tác | — | Phạm vi mình | Toàn quốc |
| Nhân viên & phân quyền | — | — | ✓ |

Tạo tour mới hoặc chuyển chi nhánh điều hành: chi nhánh đích phải thuộc phạm vi người làm.

**Kiểm tra ở backend:** mọi endpoint `/api/admin/*` đi qua một `AdminScope` (thay `StaffScope`) dựng từ phân quyền
đọc lại từ database mỗi request. Repository nhận danh sách `branchId` được phép và lọc trong SQL (`WHERE ... IN`
tham số hóa). Mã lỗi: không phải nhân viên → 403; tham số `scope` vượt phạm vi → 403; đối tượng ngoài phạm vi → 404
(không lộ là có tồn tại); thiếu quyền chức năng → 403.

**Bộ chọn phạm vi:** tham số `scope` trên các API đọc (`all`, `region:NORTH`, `branch:HCM`), mặc định là toàn bộ phạm
vi được phép. Server kiểm tra `scope` ⊆ phạm vi được phép.

## 4. API

Tất cả cần đăng nhập + CSRF cho POST/PUT/DELETE, trả DTO camelCase, lỗi theo định dạng chung.

| Phương thức | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/admin/context` | Nhân viên: vai trò, phạm vi được chọn, danh sách khả năng (`canEditTours`…) |
| GET | `/api/admin/dashboard?scope=` | Nhân viên |
| GET | `/api/admin/lookups` | Nhân viên: điểm đến, điểm khởi hành, danh mục, chi nhánh trong phạm vi |
| GET | `/api/admin/tours?scope=&status=&q=&page=` | Nhân viên |
| GET | `/api/admin/tours/{id}` | Nhân viên |
| POST | `/api/admin/tours` | BM, ADMIN |
| PUT | `/api/admin/tours/{id}` | BM, ADMIN |
| POST | `/api/admin/tours/{id}/status` | BM, ADMIN (`published`/`paused`/`draft`) |
| POST | `/api/admin/tours/{id}/clone` | BM, ADMIN (bản sao `draft`, mã mới, không chép lịch khởi hành) |
| PUT | `/api/admin/tours/{id}/images` | BM, ADMIN (cả danh sách theo thứ tự) |
| PUT | `/api/admin/tours/{id}/itinerary` | BM, ADMIN |
| PUT | `/api/admin/tours/{id}/inclusions` | BM, ADMIN |
| GET | `/api/admin/departures?scope=&tourId=&from=&to=&status=&page=` | Nhân viên |
| POST | `/api/admin/tours/{id}/departures` | BM, ADMIN (một ngày) |
| POST | `/api/admin/tours/{id}/departures/bulk` | BM, ADMIN (từ ngày–đến ngày, các thứ trong tuần, tối đa 100 ngày; bỏ qua ngày trùng và báo lại) |
| PUT | `/api/admin/departures/{id}` | BM, ADMIN (giá, số chỗ ≥ đã đặt, số khách tối thiểu, chi nhánh) |
| POST | `/api/admin/departures/{id}/status` | BM, ADMIN (`open`/`closed`) |
| GET | `/api/admin/departures/{id}/manifest` | Nhân viên |
| GET | `/api/admin/departures/{id}/manifest.xlsx` | Nhân viên |
| GET | `/api/admin/audit-logs?scope=&entityType=&actorId=&from=&to=&page=` | BM, ADMIN |
| GET | `/api/admin/staff` | ADMIN |
| POST | `/api/admin/staff/assignments` | ADMIN (email tài khoản có sẵn + vai trò + phạm vi) |
| POST | `/api/admin/staff/assignments/{id}/deactivate` | ADMIN (không tự gỡ ADMIN cuối cùng) |

API hiện có `/api/admin/bookings*`, `/api/admin/service-requests*`: thêm lọc phạm vi và ghi audit, giữ nguyên
đường dẫn và DTO. API công khai `GET /api/tours` thêm tham số `region=NORTH|CENTRAL|SOUTH`: tour có lịch khởi hành
còn mở do chi nhánh thuộc khu vực đó điều hành được xếp lên đầu (không lọc bỏ tour khác).

Quy tắc dữ liệu: ngày về do server tính (`departure_date + duration_days - 1`); sửa số chỗ dùng một câu `UPDATE ...
WHERE reserved_seats <= @capacity`, không đạt trả 409; đổi giá lịch không ảnh hưởng đơn cũ (đơn có bản chụp giá);
đơn tour mới lấy `selling_branch_id` từ chi nhánh điều hành của lịch khởi hành. Ảnh chỉ nhận URL
`https://images.unsplash.com/photo-…` (khớp `next.config.ts` và chính sách nguồn ảnh); không có tải file lên.

## 5. Dashboard (theo phạm vi đang chọn, giờ Việt Nam)

| Ô | Cách tính |
|---|---|
| Đơn hôm nay | Số đơn `created_at` trong ngày hôm nay |
| Doanh thu tháng | Tổng `payments.amount` trạng thái `succeeded`, `paid_at` trong tháng này |
| Đơn chờ xử lý | Mục đơn `awaiting_supplier` (cần nhân viên liên hệ đối tác) |
| Chuyến sắp đi | Lịch `open` trong 14 ngày tới; cảnh báo khi `reserved_seats < min_guests` |
| Doanh thu theo khu vực | Doanh thu tháng nhóm theo khu vực của chi nhánh bán; đơn không chi nhánh vào nhóm "Trực tuyến". Biểu đồ cột vẽ bằng SVG, không thêm thư viện |

## 6. Giao diện admin

Khung chung `/admin/*`: thanh trên cùng (bộ chọn phạm vi, tên người dùng) + sidebar; ở 390px sidebar thành ngăn
kéo mở bằng nút menu.

| Nhóm | Trang |
|---|---|
| Tổng quan | Dashboard `/admin` |
| Sản phẩm | Tour `/admin/tours`, thêm/sửa `/admin/tours/new`, `/admin/tours/[id]`; Lịch khởi hành `/admin/departures` |
| Đơn & điều hành | Đơn đặt chỗ `/admin/bookings`; Danh sách đoàn `/admin/departures/[id]/manifest` |
| Yêu cầu dịch vụ | `/admin/service-requests` (giữ nguyên) |
| Hệ thống | Nhân viên `/admin/staff` (ADMIN); Nhật ký thao tác `/admin/audit-logs` |

Ẩn mục menu người dùng không có quyền (server vẫn chặn). Sắp xếp ảnh: kéo thả HTML5 gốc + nút lên/xuống cho bàn
phím, không thêm thư viện. Mọi trang có trạng thái đang tải, rỗng, lỗi; kiểm tra ở 390, 768, 1440px.

## 7. Kiểm thử

- Backend (xUnit, không cần DB): tính phạm vi từ phân quyền (gộp nhiều dòng, khu vực → chi nhánh), kiểm tra
  `scope` vượt quyền, ma trận quyền chức năng, sinh ngày lặp theo tuần (giới hạn, trùng ngày), tính ngày về, kiểm tra
  dữ liệu tour/lịch, URL ảnh, xếp hạng theo khu vực, nội dung file xlsx, tạo nội dung audit (`changes` chỉ gồm trường
  đổi, không có trường nhạy cảm).
- Frontend (`node --test`): bộ chọn phạm vi, form lịch hàng loạt, sắp xếp ảnh, định dạng dashboard.
- Chạy `dotnet build`, `dotnet test`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; chụp các trang
  admin ở 390/768/1440px (cần tài khoản nhân viên trên database của bạn).

## 8. Cần bạn quyết định

| # | Câu hỏi | Đề xuất |
|---|---|---|
| Q1 | Xuất Excel | **.xlsx thật**, tự ghi định dạng OpenXML tối giản bằng `System.IO.Compression` (không thêm thư viện). Phương án khác: CSV UTF-8 có BOM, hoặc thêm NuGet ClosedXML |
| Q2 | Đơn khách sạn/vé không có chi nhánh | Chỉ nhân viên phạm vi toàn quốc thấy và xử lý |
| Q3 | Yêu cầu dịch vụ | Giữ là hàng đợi chung, mọi nhân viên thấy |
| Q4 | Khách chọn khu vực | Popup giữ 6 lựa chọn, ánh xạ về 3 khu vực (Tây Nguyên → Trung; TP.HCM, Đông Nam Bộ, Tây Nam Bộ → Nam); `/tours` và trang chủ **xếp ưu tiên** thay vì lọc bỏ như hiện nay |
| Q5 | Số khách tối thiểu | Mặc định 10, sửa được từng lịch |
| Q6 | Trang Nhân viên & phân quyền | Làm (cần để gán phạm vi mà không phải sửa database tay) |
| Q7 | Nhân viên hiện có | Giữ nguyên STAFF/ADMIN `global` từ migration 007 |

## 9. Ngoài phạm vi lần này

Tải ảnh lên máy chủ, quản lý khách sạn/vé, khuyến mãi, phân quyền chi tiết theo từng permission (bảng `permissions`
có sẵn nhưng chưa dùng), xuất PDF, thông báo email cho nhân viên.
