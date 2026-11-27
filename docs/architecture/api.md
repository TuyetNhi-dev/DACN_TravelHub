# Danh sách API

Mọi đường dẫn bắt đầu bằng `/api`. Trình duyệt gọi qua proxy cùng origin của Next.js.
Danh sách được lấy từ các `*Endpoints.cs` trong `backend/src/TravelHub.Api/Features/`; khi thêm endpoint hãy
cập nhật bảng này.

Quy ước chung:

- Mọi `POST`/`DELETE` có cookie phiên cần header `X-CSRF-Token` (lấy từ `GET /api/auth/csrf`).
- Lỗi trả định dạng JSON chung, xem [overview.md](overview.md).
- Quyền: **Khách** = không cần đăng nhập; **CUSTOMER** = đã đăng nhập và đã đồng ý điều khoản;
  **STAFF/ADMIN** = nhân viên vận hành.

## Danh mục (công khai)

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| GET | `/api/health/database` | Kiểm tra kết nối, trả tên database |
| GET | `/api/tours` | Không tham số: toàn bộ tour đang bán (như trước). Lọc (tùy chọn): `q` (tên, mã, điểm đến; không phân biệt hoa thường, không dấu, kể cả đ/d; tối đa 100 ký tự), `destinationId`, `minDays`/`maxDays` (1–60), `dateFrom`/`dateTo` (có lịch còn đặt được trong khoảng), `maxPrice` (giá từ), `sort` (`price_asc`, `price_desc`; mặc định theo id), `region` (`NORTH`/`CENTRAL`/`SOUTH`, chỉ xếp tour của khu vực lên đầu, không lọc bỏ; `sort` theo giá được ưu tiên hơn), `departureRegion` (`hcm`/`north`/`central`/`highlands`/`southeast`/`southwest`: bộ lọc "Khởi hành từ", giữ tour có lịch khởi hành từ một thành phố của vùng; nhóm thành phố giống `frontend/src/lib/departure-region.ts`, xem `DepartureRegions.cs`). Phân trang offset `page`, `pageSize` (1–200); có phân trang thì `total` là số tour khớp bộ lọc. Sai tham số: 400 kèm lỗi theo trường |
| GET | `/api/tours/destinations` | Điểm đến có tour đang bán: `id`, `name`, `tourCount`, xếp theo tên |
| GET | `/api/tours/departure-days` | Lịch lọc ngày của `/tours`: `month` (`yyyy-MM`, bắt buộc, từ tháng trước tới 24 tháng tới; sai: 400) cùng mọi bộ lọc của `GET /api/tours` trừ `dateFrom`/`dateTo`, `sort`, `page`. Trả `{ data: [{ date, tourCount }] }`: số tour có lịch còn đặt được mỗi ngày, bằng đúng tổng danh sách sẽ hiện khi chọn ngày đó |
| GET | `/api/tours/suggest` | Gợi ý khi gõ (8.2): `q` (không dấu, đ = d; dưới 2 ký tự trả rỗng, không lỗi; quá 100 ký tự: 400). Trả `{ data: { destinations: [{ id, name, tourCount }], tours: [{ id, code, title, destination, basePrice }] } }`, tối đa 5 điểm đến và 6 tour, cái bắt đầu bằng từ khóa xếp trước |
| GET | `/api/tours/{id}` | Chi tiết, lịch khởi hành, ảnh, bao gồm/không bao gồm |
| GET | `/api/tours/departures/upcoming` | `days` (mặc định 14, 1–30), `limit` (mặc định 8, 1–20). Lịch còn đặt được (open, sau hôm nay, còn chỗ), sớm nhất trước; có `availableSeats`, `adultPrice`, `daysUntilDeparture` tính theo giờ Việt Nam |
| GET | `/api/tour-collections`, `/api/tour-collections/{slug}` | Bộ sưu tập tour theo mùa/chủ đề |
| GET | `/api/hotels`, `/api/hotels/{id}` | Giá hợp đồng, chờ xác nhận chỗ |
| GET | `/api/flights` | `from`, `to`, `date`, `cabin` |
| GET | `/api/flights/price-calendar` | `from`, `to`, `month`, `cabin` |
| GET | `/api/flights/flexible` | `from`, `to`, `date`, `returnDate` |
| GET | `/api/flights/deals` | Vé deal có quỹ ghế |
| GET | `/api/branches` | Văn phòng, tọa độ, giờ mở cửa |

## Xác thực và tài khoản

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| GET | `/api/auth/csrf` | Lấy CSRF token |
| POST | `/api/auth/register` | Cần `acceptTerms: true`; gửi mã OTP qua email |
| POST | `/api/auth/verify-email` | `{ email, code }`; đúng thì đăng nhập luôn |
| POST | `/api/auth/resend-verification` | Luôn trả cùng thông báo (không lộ email đã đăng ký) |
| POST | `/api/auth/login` | 403 `email_not_verified` khi đúng mật khẩu nhưng chưa nhập mã |
| POST | `/api/auth/password-reset/request`, `/confirm` | Quên mật khẩu bằng OTP |
| GET | `/api/auth/google/config` | `{ clientId }` hoặc `null` |
| POST | `/api/auth/google` | `{ credential }` (Google ID token) |
| POST | `/api/auth/accept-terms` | Màn hình "Hoàn tất đăng ký" |
| GET | `/api/auth/me` | Phiên hiện tại |
| POST | `/api/auth/logout` | Thu hồi phiên |
| POST | `/api/account/phone` | Lưu số điện thoại liên hệ (số Việt Nam) |

## Đặt chỗ, giỏ hàng (CUSTOMER)

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| POST | `/api/bookings/tours` | Giữ chỗ; hết chỗ trả 409 |
| POST | `/api/bookings/hotels`, `/api/bookings/flights` | Báo giá, đơn chờ đối tác (vé deal thì giữ ghế) |
| GET | `/api/bookings/me`, `/api/bookings/{id}` | Đơn của chính khách |
| POST | `/api/bookings/{id}/pay` | Thanh toán mô phỏng; hết hạn giữ chỗ trả 409 |
| POST | `/api/bookings/{id}/cancel` | Hủy đơn |
| GET | `/api/bookings/{id}/ticket` | Vé điện tử của đơn tour đã thanh toán (QR không chứa thông tin cá nhân); đơn chưa thanh toán trả 409, đơn của người khác hoặc không phải tour trả 404, chưa cấu hình `Ticket:SigningKey` trả 503 |
| GET | `/api/cart` | Giỏ hàng của tài khoản |
| POST | `/api/cart/items`; DELETE `/api/cart/items/{id}` | Thêm/sửa, xóa dòng |
| POST | `/api/cart/merge` | Gộp giỏ của khách vãng lai khi đăng nhập |
| POST | `/api/cart/quote` | Khách: báo giá giỏ lưu ở trình duyệt |

## Yêu cầu dịch vụ cộng thêm

| Phương thức | Đường dẫn | Quyền |
|---|---|---|
| POST | `/api/service-requests` | Khách |
| GET | `/api/admin/service-requests` | STAFF/ADMIN; `q`, `serviceType`, `status`, `page`, `pageSize` |
| GET | `/api/admin/service-requests/new-count` | STAFF/ADMIN; số yêu cầu chưa liên hệ |
| GET | `/api/admin/service-requests/{id}` | STAFF/ADMIN |
| POST | `/api/admin/service-requests/{id}/status`, `/notes`, `/assign-to-me`, `/unassign` | STAFF/ADMIN |

## Quản trị đơn (STAFF/ADMIN)

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| GET | `/api/admin/bookings` | `status`, `serviceType` |
| GET | `/api/admin/bookings/{id}` | |
| POST | `/api/admin/bookings/{id}/confirm`, `/reject`, `/complete` | Xác nhận cần mã xác nhận của đối tác |

## Trợ lý AI

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| POST | `/api/assistant/chat` | `{ message, history }`; khách vãng lai dùng được, cần header CSRF. Trả `{ reply, tours, sources }`: `tours` là `TourSummaryDto` từ tìm kiếm tour, `sources` là liên kết trang FAQ/chính sách/cẩm nang. Câu hỏi rỗng hoặc quá 500 ký tự trả 400, quá 6 câu/phút trả 429, chưa có khóa Gemini/Gemini lỗi/quá 15 giây trả 503 (`code: assistant_unavailable`). Xem [cài đặt](../setup/ai-assistant.md). |

## Check-in đoàn (migration 017)

Mọi nhân viên có phạm vi xem chi nhánh điều hành lịch được check-in; chỉ BRANCH_MANAGER/ADMIN của chi nhánh đó được hoàn tác. Check-in mở từ 1 ngày trước ngày đi tới ngày về, lịch không bị hủy hay đã kết thúc (ngoài khoảng đó trả 409). Mọi thao tác ghi đều ghi `audit_logs` trong cùng transaction, không ghi tên khách hay mã vé.

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| GET | `/api/admin/departures/{id}/check-in` | Đơn đã thanh toán của lịch, từng hành khách và trạng thái check-in |
| POST | `/api/admin/departures/{id}/check-in/scan` | `{ payload }` từ mã QR; kiểm tra chữ ký, version, lịch, đơn đã thanh toán; chỉ đọc, trả đơn của vé. Chữ ký sai 400, vé không có 404, sai lịch/đã cấp lại/chưa thanh toán 409 |
| POST | `/api/admin/departures/{id}/check-ins` | `{ passengerIds }`; khách đã check-in trả 409 và không ghi gì |
| DELETE | `/api/admin/departures/{id}/check-ins/{passengerId}` | Hoàn tác (quản lý); khách chưa check-in trả 404 |
