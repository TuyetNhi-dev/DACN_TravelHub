# Thứ tự migration và seed

Mọi thay đổi schema là file đánh số trong `database/migrations/`; dữ liệu mẫu nằm trong `database/seeds/`.
**Người dùng tự chạy** các file này (MySQL Workbench hoặc `mysql` CLI); AI và script trong repo không ghi vào
database. Chọn đúng database trước khi chạy (`USE <tên_db>;`), vì các file không gắn cứng tên database.

## Database mới (rỗng)

Chạy **tất cả migration theo số tăng dần, rồi tất cả seed theo số tăng dần**:

```
migrations/001 → 002 → … → 016
seeds/001 → 002 → … → 010
```

Với `mysql` CLI (PowerShell, thay `<...>` bằng giá trị của bạn, mật khẩu sẽ được hỏi):

```powershell
Get-ChildItem database/migrations/*.sql, database/seeds/*.sql | ForEach-Object {
  Write-Host "Chạy $($_.Name)"
  Get-Content $_.FullName -Raw -Encoding utf8 | mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p --ssl-ca=<CA_PATH> <DB_NAME>
  if ($LASTEXITCODE -ne 0) { throw "Dừng ở $($_.Name)" }
}
```

Dừng ngay khi một file lỗi, sửa nguyên nhân rồi chạy tiếp từ file đó (xem cột "Chạy lại" bên dưới).

Trong MySQL Workbench, seed 007 và 009 cần `SET SQL_SAFE_UPDATES = 0;` trước khi chạy.

## Database đang có

Chạy `database/checks/migration_status.sql` (xem mục cuối) để biết migration nào đã có, rồi chỉ chạy các file
còn thiếu, theo đúng thứ tự số.

## Migration

| File | Nội dung | Cần chạy trước | Chạy lại? |
|---|---|---|---|
| 001_initial_schema | 42 bảng nền (tổ chức, phân quyền, danh mục, đặt chỗ, thanh toán) | Database rỗng | Không |
| 002_email_verification | Bảng `email_verification_tokens` | 001 | Có (`IF NOT EXISTS`) |
| 003_otp_and_google_sign_in | `failed_attempts` cho mã OTP; `users.google_subject` | 002 | Không |
| 004_branch_contact_and_location | `branches`: tọa độ, điện thoại, giờ mở cửa | 003 | Không |
| 005_hotel_amenities_and_policies | Bảng `amenities`, `hotel_amenities`, `hotel_policies`; giờ nhận/trả phòng | 004 | Không |
| 006_tour_collections | Bảng `tour_collections`, `tour_collection_items` | 005 | Không |
| 007_three_roles | Gộp về 3 vai trò, chỉ đổi dữ liệu `roles`/phân quyền ([quyết định 002](../architecture/decisions/002-three-roles.md)) | 006 | Chỉ trước 015 (xem dưới) |
| 008_simulated_payment | `bookings.hold_expires_at`, `booking_items.status` | 007 | Không |
| 009_flight_deals_and_price_alerts | `flight_offers.is_featured`, `updated_at`; bảng `price_alerts`, `price_alert_notifications` | 008 | Không |
| 010_flight_allotments | `flight_offers.allotment_seats`, `sold_seats` (vé deal) | 009 | Không |
| 011_vnpay_payments | `payments.gateway_meta`, trạng thái `refund_needed` | 010 | Không |
| 012_service_requests | Bảng `service_requests`, `service_request_notes` | 011 | Không |
| 013_cart_items | Bảng `cart_items` (cần MySQL 8.0.19+) | 012 | Không |
| 014_terms_consent_and_password_reset | `users.terms_accepted_at`; `email_verification_tokens.purpose` | 013 | Không |
| 015_branch_operations_and_audit | `tour_departures.operating_branch_id`, `min_guests`; bảng `audit_logs`; index đơn theo chi nhánh ([đặc tả admin](../architecture/admin-spec.md)) | 014 | Không |
| 016_departure_lifecycle_and_booking_notes | Trạng thái chuyến `guaranteed`/`in_progress`/`completed`, `tour_departures.cancel_reason`, `cancelled_at`; `tours.cancellation_policy`, `travel_notes`; bảng `booking_notes` | 015 | Không |

Mỗi migration ghi "Run AFTER" migration liền trước, nên luôn chạy đúng thứ tự số.

**Không chạy lại 007 sau khi đã có 015.** 007 đổi mọi `BRANCH_MANAGER` thành STAFF toàn quốc rồi xóa mã vai trò
đó; từ [quyết định 003](../architecture/decisions/003-branch-scopes.md) vai trò này được dùng lại.

**Thứ tự cho database đang chạy:** migration 015 → chạy lại seed 001 (thêm `BRANCH_MANAGER`) → khởi động lại
backend. Backend mới đọc `tour_departures.operating_branch_id` nên phải chạy 015 **trước** khi dùng bản backend
này, kể cả trang tour công khai.

Sau đó chạy **016** trước khi dùng trang quản trị mới: màn hình tour, lịch khởi hành và chi tiết đơn trong admin đọc
`cancel_reason`, `cancellation_policy`, `travel_notes` và bảng `booking_notes`. Trang khách không cần 016.

## Seed (dữ liệu DEMO)

Mọi dữ liệu seed là **mô phỏng** (khách sạn, giá, chuyến bay, chi nhánh đều có nhãn DEMO), không phải dữ liệu
đối tác thật.

| File | Nội dung | Phụ thuộc | Chạy lại? |
|---|---|---|---|
| 001_reference_data | 4 mã vai trò: CUSTOMER, STAFF, BRANCH_MANAGER, ADMIN | Migration 001 (chạy sau 007) | Có |
| 002_demo_catalog | 50 tour, lịch khởi hành, 100 khách sạn, 300 loại phòng, 200 chuyến bay, khu vực/chi nhánh | Migration 001, seed 001; danh mục rỗng | Không (ID cố định) |
| 003_branch_locations | Tọa độ văn phòng của 4 chi nhánh demo | Seed 002, migration 004 | Có, nhưng đặt lại hotline cũ: chạy lại 009 sau đó |
| 004_hotel_amenities | Tiện nghi và nội quy khách sạn demo | Seed 002, migration 005 | Có (xóa và tạo lại liên kết demo) |
| 005_seasonal_tours | Bộ sưu tập và 20 tour theo mùa (SEA001–SEA020) | Seed 002, migration 006 | **Không** (dừng ở mã trùng) |
| 006_flight_price_calendar | Báo giá 8 tuyến × 2 chiều × 60 ngày tính từ ngày chạy | Seed 002 | Có (ID theo ngày) |
| 007_flight_allotments | Quỹ ghế vé deal cho 15% báo giá rẻ nhất | Seed 006, migration 009, 010 | Có (chỉ đổi báo giá chưa có quỹ) |
| 008_tour_images_and_inclusions | Ảnh tour và mục bao gồm/không bao gồm | Seed 002, 005 | Có (bỏ qua tour đã có ảnh/mục, giữ chỉnh sửa sau này) |
| 009_simulated_contact_phone | Đổi hotline chi nhánh sang số mô phỏng 0123 456 789 | Seed 003 | Có |
| 010_vietnam_package_tours | **Dữ liệu mô phỏng**: 60 tour SH-MB/MT/MN-001…020 (3 miền × 20, 4 chi nhánh × 15), dòng Tiết kiệm/Tiêu chuẩn/Cao cấp, 521 lịch 25/11/2026–21/02/2027 có phụ thu Tết Đinh Mùi, lịch trình, bao gồm/không bao gồm, ảnh; 7 địa điểm mới | Migration 015, seed 002 (MySQL 8.0.19+) | Có (bỏ qua tour đã có mã) |

Seed 006 tạo báo giá cho 60 ngày kể từ ngày chạy. Khi demo cách xa ngày seed, chạy lại 006 rồi 007 để có
báo giá mới.

Seed 010 có ngày khởi hành **cố định** (viết ngày 23/11/2026). Lịch đã qua ngày vẫn nằm trong bảng nhưng không còn
đặt được. `reserved_seats` của seed này là số chỗ đã bán giả lập, không có đơn đặt chỗ tương ứng, nên danh sách
hành khách của các lịch đó ít hơn số chỗ đã giữ. Lịch đầu tiên của mỗi ngày khởi hành chỉ còn 1–4 chỗ, để mục
"Sắp khởi hành" trên trang chủ luôn có thẻ "Còn N chỗ" khi demo (89 lịch, đã mô phỏng cho từng ngày 23/11/2026
– 20/02/2027 cùng dữ liệu seed 002 và 005).

### Sinh lại seed 010

Không sửa tay file SQL. Dữ liệu tour nằm trong `scripts/seeds/package-tours/data/tours-*.cjs`; giá, mùa, ngày và sức
chứa nằm trong `config.cjs` và `schedule.cjs`. Sửa ở đó rồi chạy từ thư mục gốc (cần `npm --prefix frontend install`
trước, vì script đọc `vn-holidays.ts` và `photo-library.ts` bằng TypeScript):

```powershell
node scripts/seeds/package-tours/generate.cjs
```

Script **chỉ ghi file** `database/seeds/010_vietnam_package_tours.sql`, không kết nối database. Nó kiểm tra mã tour,
số ngày lịch trình, số chỗ, rồi mô phỏng mục "Sắp khởi hành" cho từng ngày demo và **dừng với lỗi** nếu có ngày
không hiện thẻ "Còn N chỗ". Chạy nhiều lần vẫn ra cùng một file. Sau khi sinh lại, database đã có tour
cũ sẽ không nhận thay đổi (seed bỏ qua mã đã có): chạy trên database mới hoặc xóa tour SH-* cũ trước.

## Kiểm tra bằng `migration_status.sql`

`database/checks/migration_status.sql` **chỉ đọc** `information_schema`, không đọc dữ liệu bảng và không ghi gì.

```powershell
Get-Content database/checks/migration_status.sql -Raw -Encoding utf8 |
  mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p --ssl-ca=<CA_PATH> <DB_NAME>
```

Hoặc mở file trong Workbench, chọn database rồi chạy. Kết quả mỗi dòng:

| Giá trị | Ý nghĩa |
|---|---|
| `có` | Đủ mọi bảng/cột của migration đó |
| `không` | Chưa có gì |
| `một phần (x/y)` | Migration dừng giữa chừng. Kiểm tra kỹ trước khi chạy lại |
| `không xác định` | Riêng 007: chỉ đổi dữ liệu, xem truy vấn tùy chọn cuối file (`SELECT code FROM roles`) |

Script kiểm tra 002–016 (001 là nền, có thì mới chạy được các migration sau). Dấu hiệu dùng cho từng migration:

| Migration | Đối tượng được kiểm tra |
|---|---|
| 002 | Bảng `email_verification_tokens` |
| 003 | Cột `email_verification_tokens.failed_attempts`, `users.google_subject` |
| 004 | Cột `branches.latitude`, `longitude`, `phone`, `opening_hours` |
| 005 | Bảng `amenities`, `hotel_amenities`, `hotel_policies`; cột `hotels.check_in_from`, `check_out_until` |
| 006 | Bảng `tour_collections`, `tour_collection_items` |
| 007 | Không kiểm tra được qua `information_schema` (chỉ đổi dữ liệu) |
| 008 | Cột `bookings.hold_expires_at`; giá trị `awaiting_payment` trong `booking_items.status` |
| 009 | Cột `flight_offers.is_featured`, `updated_at`; bảng `price_alerts`, `price_alert_notifications` |
| 010 | Cột `flight_offers.allotment_seats`, `sold_seats` |
| 011 | Cột `payments.gateway_meta`; giá trị `refund_needed` trong `payments.status` |
| 012 | Bảng `service_requests`, `service_request_notes` |
| 013 | Bảng `cart_items` |
| 014 | Cột `users.terms_accepted_at`, `email_verification_tokens.purpose` |
| 015 | Cột `tour_departures.operating_branch_id`, `min_guests`; bảng `audit_logs` |
| 016 | Cột `tour_departures.cancel_reason`, `tours.cancellation_policy`, `tours.travel_notes`; bảng `booking_notes` |

Kiểm tra seed: `SELECT COUNT(*) FROM tours;` (seed 002 và 005 cho 70 tour) và
`SELECT code FROM roles ORDER BY code;` (seed 001 cho `ADMIN`, `CUSTOMER`, `STAFF`).
