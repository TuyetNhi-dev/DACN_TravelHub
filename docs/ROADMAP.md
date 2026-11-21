# Lộ trình phát triển SàiHành (TravelHub)

> Ưu tiên số 1: phân hệ **TOUR** (mô hình Saigontourist) phải chạy hoàn chỉnh trước khi mở rộng sang khách sạn và chuyến bay.
> Phần **vé deal** (commit c84bb70 wip) tạm dừng cho đến Tuần 9.

---

## Trạng thái hiện tại

| Việc | Trạng thái |
|---|---|
| Schema nền + seed tour (20 tour seasonal) | ✅ Xong |
| Giữ chỗ tour 10 phút — atomic UPDATE chống oversell | ✅ Xong |
| TourHoldExpiryJob — trả ghế đúng 1 lần có FOR UPDATE | ✅ Xong |
| Thanh toán mô phỏng — idempotency key, 409 hold_expired | ✅ Xong |
| Countdown frontend, trang chi tiết đơn, hủy đơn | ✅ Xong |
| Auth OTP email, phân quyền 3 vai trò | ✅ Xong |
| VNPAY Part A — VnPayPaymentGateway, chữ ký HMAC-SHA512, 17 tests | ✅ Xong |
| VNPAY Part B — InitiateVnPayAsync, ConfirmVnPayAsync, VnPayConfirmDecision, 10 tests | ✅ Xong |
| Migration 011 — gateway_meta, refund_needed | ✅ Viết file (chưa chạy) |
| Lọc tour phía backend + phân trang | ✅ Xong |
| Dọn validateStay | ✅ Xong |

---

## Tuần 6 — 16–22/11/2026

**Chủ đề:** Hoàn thiện trang chi tiết tour · VNPAY hoàn chỉnh · Email xác nhận

| # | Việc | File chính | Trạng thái |
|---|---|---|---|
| 6.1 | Trả ảnh thực từ `tour_images` trong `GET /api/tours/{id}` | `TourRepository`, `TourDtos`, `TourService` | ⬜ |
| 6.2 | Trả danh sách bao gồm/không bao gồm từ `tour_inclusions` | `TourRepository`, `TourDtos`, `TourService` | ⬜ |
| 6.3 | Frontend hiển thị ảnh thực + section bao gồm/không bao gồm | `TourDetail.tsx`, `services/tours.ts`, `types/tour.ts` | ⬜ |
| 6.4 | VNPAY Part C — endpoint IPN + verify-return + tests | `VnPayEndpoints.cs`, `ServiceRegistration.cs` | ⬜ |
| 6.5 | VNPAY Part D — nút VNPAY trong PaymentPanel, trang `/payment/result` | `PaymentPanel.tsx`, `payment/result/page.tsx` | ⬜ |
| 6.6 | Email xác nhận sau khi tạo đơn tour (hold) | `BookingService.cs`, `BookingConfirmationEmail.cs` | ⬜ |
| 6.7 | Email xác nhận sau khi thanh toán (confirmed) | `BookingPaymentService.cs`, `BookingReceiptEmail.cs` | ⬜ |
| 6.8 | Dịch vụ cộng thêm (vé tham quan, thuê xe, visa, tour đoàn): menu, trang `/dich-vu/<slug>`, form yêu cầu tư vấn không cần đăng nhập, quản trị `/admin/service-requests`. Migration 012 (viết file, chưa chạy) | `Features/ServiceRequests/`, `012_service_requests.sql`, `components/services/` | 🔄 A (backend) xong; B–D đang làm |

---

## Tuần 7 — 23–29/11/2026

**Chủ đề:** Nghiệp vụ nâng cao cho tour

| # | Việc | File chính |
|---|---|---|
| 7.1 | Giá em bé (infant): thêm `baby_price` vào `tour_departures`, DTO, pricing | migration, `TourDtos`, `BookingPricing`, `TourBookingPanel.tsx` |
| 7.1b | **Nhớ khi làm 7.1:** giỏ hàng cũng phải có em bé. Migration mới thêm `infant_count` (và `infant_price_seen`) vào `cart_items` (bảng tạo ở migration 013); cập nhật CHECK tổng khách; `CartChoice`/`CartItemDto`/`GuestCartItem`, `CartRules.Status` (so giá em bé) và `Subtotal`; frontend `types/cart.ts`, `cart-rules.ts` (kiểm tra dòng localStorage, link "Đặt ngay" thêm `infants=`), `TourChoiceFields`, `CartItemCard`; dòng giỏ cũ trong localStorage không có trường này → coi là 0 | migration mới, `Features/Cart/*`, `components/cart/*`, `lib/cart-rules.ts` |
| 7.2 | Chính sách hủy tính phí thật — sửa R1: logic `CloseAsync` tính refund theo ngày (thay hardcoded text) | `BookingLifecycle.cs`, `TourDetail.tsx` |
| 7.3 | Thông tin liên hệ khi đặt hộ — form nhập tên/SĐT/email riêng thay vì đọc từ session | `TourBookingPanel.tsx`, `BookingDtos`, validator |
| 7.4 | Lịch chọn ngày khởi hành: hiển thị ngày lễ VN (âm/dương) | `DepartureCalendar.tsx`, file dữ liệu ngày lễ |
| 7.5 | Quên mật khẩu — OTP email đặt lại mật khẩu. **Đã code (21/11/2026), chờ chạy migration 014:** `/quen-mat-khau`, mã OTP theo mục đích `reset_password` (10 phút, sai 5 lần hủy, 60 giây/lần, tối đa 5 mã/giờ), cùng một thông báo dù email có tồn tại hay không, đổi mật khẩu xong đăng xuất các phiên cũ; kèm lưu `terms_accepted_at` và màn hình "Hoàn tất đăng ký" | `AuthEndpoints.cs`, `PasswordResetService.cs`, `TermsAcceptedAuthorization.cs`, frontend |

---

## Tuần 8 — 30/11–6/12/2026

**Chủ đề:** Tìm kiếm · Admin tour

| # | Việc | File chính |
|---|---|---|
| 8.1 | Lọc tour phía backend: `destination`, `minDays`, `maxDays`, `from`, `maxPrice` + phân trang cursor | `TourRepository`, `TourEndpoints`, `services/tours.ts` |
| 8.2 | Tìm kiếm nhanh: không dấu, gợi ý khi gõ (`/api/tours/suggest?q=`) | `TourRepository`, `SuggestEndpoint`, `SearchBar.tsx` |
| 8.3 | Admin: tạo/sửa tour, quản lý lịch khởi hành (departures) | `AdminTourService.cs`, `/admin/tours/` pages |
| 8.4 | Admin: quản lý ảnh tour (upload URL hoặc gắn link) | `AdminTourService.cs`, `/admin/tours/[id]/images` |
| 8.5 | Trang danh sách đơn cho staff: lọc theo status, loại dịch vụ | `/admin/bookings/page.tsx`, `AdminBookingList.tsx` |

---

## Tuần 9 — 7–13/12/2026

**Chủ đề:** Vé máy bay deal · Khách sạn

| # | Việc | File chính |
|---|---|---|
| 9.1 | Hoàn thiện vé deal (tiếp từ commit c84bb70 wip): allotment, giữ ghế, giá theo hạng vé | `FlightEndpoints`, `BookingService`, deal seed |
| 9.2 | Trang khách sạn: lọc theo thành phố, ngày check-in/out, loại phòng | `HotelEndpoints`, `hotels/page.tsx` |
| 9.3 | Gợi ý tour/KS/vé kèm câu giải thích (không dùng AI — dựa trên tag, điểm đến, mùa) | `SuggestionService.cs`, `RecommendedSection.tsx` |

---

## Tuần 10 — 14–20/12/2026

**Chủ đề:** AI · Infrastructure

| # | Việc | Ghi chú |
|---|---|---|
| 10.1 | Chatbot AI: tìm tour bằng câu tự nhiên, tư vấn chính sách, lên lịch trình từ dữ liệu thật | Dùng Claude API, tool_use gọi `GET /api/tours` |
| 10.2 | AI tóm tắt đánh giá tour (nếu có rating) | Claude API, 1 prompt, cache |
| 10.3 | docker-compose: MySQL 8 local thay cho Aiven | `docker-compose.yml`, `.env.example` |
| 10.4 | **Chuyển DB khỏi Aiven free tier trước 21/12** | Export → import MySQL local/cloud khác |
| 10.5 | **Deploy: cấu hình lại `KnownProxies`** — backend chỉ tin `X-Forwarded-For` từ loopback (Next.js cùng máy). Nếu proxy/Next.js/load balancer nằm ở máy khác, thêm IP của nó vào `ForwardedHeadersOptions.KnownProxies`; nếu không, rate limit theo IP sẽ gộp mọi khách thành một IP | `SecurityRegistration.cs` (`ConfigureForwardedHeaders`) |

---

## Tuần 11 — 21–27/12/2026

**Chủ đề:** Kiểm thử · Dọn code · Merge

| Việc |
|---|
| Kiểm thử end-to-end luồng đặt tour (booking → VNPAY → confirmed → email) |
| Sửa lỗi còn lại, dọn `console.log`, TODO vô chủ, dead code |
| Chạy `dotnet test` và `npm run lint` xanh hoàn toàn |
| Merge tất cả nhánh vào `main` |
| Vẽ sơ đồ kiến trúc (endpoint → service → repository → DB) |

---

## Tuần 12 — 28/12/2026–3/1/2027

**Chủ đề:** Báo cáo · Demo

| Việc |
|---|
| Viết báo cáo đồ án (phần tour, VNPAY, kiến trúc) |
| Làm slide thuyết trình |
| Chuẩn bị kịch bản demo — **demo bằng luồng đặt tour trọn vẹn** |
| Chạy thử demo trên máy không có mạng (thanh toán mô phỏng) |

---

## Quy tắc cắt khi trễ tiến độ

Nếu không đủ thời gian, cắt **từ dưới lên** theo thứ tự sau. **KHÔNG cắt bất kỳ phần nào của tour.**

1. AI tóm tắt đánh giá (10.2)
2. Lịch trình AI từ câu tự nhiên — chỉ giữ tìm tour (10.1)
3. Trang `/lich` (lịch tháng hiển thị departure calendar)
4. Vé khứ hồi
5. Theo dõi giá
6. Gợi ý tour/KS/vé không dùng AI (9.3) — thay bằng "tour nổi bật" tĩnh
