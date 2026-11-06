# Phân hệ A — Khách sạn SàiHành

Triển khai ngày 19/10/2026. Kiểm tra nhanh route cho thấy chỉ Trang chủ và Tour đã tồn tại; khách sạn là phân hệ còn thiếu đầu tiên theo A → G. Không làm lại Trang chủ/Tour, không dùng Figma, không sửa backend/database/configuration/secrets.

## Mở thử

- Danh mục API: http://localhost:3000/hotels
- Danh mục demo chủ động chọn: http://localhost:3000/hotels?source=demo
- Chi tiết demo: http://localhost:3000/hotels/DEMO-H01?source=demo
- Đặt demo: từ chi tiết, chọn ngày trong tương lai và bấm **Chọn phòng · Demo**. Có thể mở trực tiếp `/hotels/DEMO-H01/booking?source=demo&room=DEMO-R01` rồi chọn ngày.

Không tự bật demo khi API lỗi. Header/Footer đã dẫn đến `/hotels`; trạng thái menu được đánh dấu trên các route con. Trang chủ và mã Tour giữ nguyên.

## Trang và tương tác

1. `/hotels`: tìm theo tên/thành phố/địa chỉ có hoặc không dấu; lọc giá tối đa, hạng sao demo, tiện nghi; sắp xếp giá hoặc tên; xóa bộ lọc; xem thêm kết quả. Ngày và số khách/phòng truyền qua URL tới trang chi tiết. Các điều kiện này chưa truy vấn tồn phòng theo ngày vì API chưa hỗ trợ.
2. `/hotels/[id]`: thông tin API, album ảnh minh họa có chọn thumbnail, loại phòng và đơn giá, sức chứa, số lượng tham khảo, tiện nghi, chính sách/đánh giá với trạng thái thiếu dữ liệu; chọn ngày nhận/trả phòng và số khách/phòng; chuyển tới đặt demo.
3. `/hotels/[id]/booking`: bốn bước: lịch/phòng → thông tin liên hệ → kiểm tra/đồng ý → hoàn tất demo. Có quay lại/chỉnh sửa, tổng tiền cập nhật, thử lại từ đầu và quay về danh sách.
4. Loading, error có thử lại và trang không tìm thấy nằm trong route khách sạn. ID hợp lệ nhưng API trả 404 hiển thị trạng thái không tìm thấy; ID quá dài dùng `notFound()`. HTTP status của fallback có thể là 200 khi Next.js đã stream loading; không coi kiểm tra fallback UI là kiểm tra HTTP 404.

## Dữ liệu và giới hạn demo

- `src/services/hotels.ts` dùng GET `/api/hotels`, `/api/hotels/{id}` đang có; kiểm tra schema, ID, phòng thuộc đúng khách sạn, giá không âm/nguyên, trùng ID, null và count. Giữ AbortSignal và timeout qua client hiện tại.
- `src/data/hotels-demo.ts` là fixture độc lập: 4 khách sạn hư cấu, 7 loại phòng, gồm phòng hết số lượng. Chỉ nạp khi `source=demo`.
- API chưa có ảnh: toàn bộ ảnh ghi rõ minh họa, không giả danh ảnh của cơ sở lưu trú. Hạng sao API là `hangSaoDemo`, hiển thị rõ demo. Số phòng trong danh mục không phải tồn phòng theo ngày.
- API không có chính sách lưu trú/thuế/phí/đánh giá: không tự tạo. Chỉ nguồn demo có giờ nhận/trả minh họa và ghi rõ điều kiện mô phỏng.
- Luồng đặt phòng luôn demo, kể cả khi dùng danh mục API: không POST tạo đơn, thanh toán, giữ phòng, gửi email hoặc giảm tồn. Không tạo mã đơn thật hoặc giả định đã xác nhận từ khách sạn.
- Thông tin liên hệ chỉ nằm trong React state, không ghi localStorage/sessionStorage/cookie hoặc URL, không gửi tới API. Tải lại sẽ mất thông tin.
- Tính tổng = đơn giá loại phòng × số đêm × số phòng. Không tự thêm thuế/phí chưa có dữ liệu.
- Ngày hiện tại theo múi giờ Việt Nam; kiểm tra ngày hợp lệ, ngày quá khứ, trả sau nhận, tối đa 30 đêm; 1–20 khách, 1–10 phòng, không vượt sức chứa hoặc số lượng danh mục đã biết. Dữ liệu sức chứa/giá chưa có sẽ chặn đặt demo.

## File mới

- `src/app/hotels/`: layout, danh sách, chi tiết, booking, loading, error, not-found.
- `src/components/hotels/`: HotelListPage, HotelDetailPage, HotelBookingPage và hotel-shared.
- `src/types/hotel.ts`, `src/services/hotels.ts`, `src/lib/hotel-stay.ts`, `src/data/hotels-demo.ts`, `src/styles/hotels.css`.
- `tests/hotels.test.cjs`.

File hiện có sửa để nối navigation: `src/data/home.ts` (chỉ href khách sạn), `src/components/layout/Navigation.tsx` (active route), `src/components/layout/Footer.tsx` (href khách sạn). CSS mới chỉ được import tại layout khách sạn và dùng tiền tố `.sh-hotel*` cùng token sáng/tối hiện có.

## Kiểm tra

- `node --test tests/hotels.test.cjs tests/home-catalog.test.cjs`: 18/18 đạt, gồm 13 kiểm thử khách sạn và 5 kiểm thử danh mục cũ.
- `npm.cmd run lint`: đạt, không warning/error.
- `npm.cmd run build`: đạt, bao gồm TypeScript và các route khách sạn mới.
- HTTP smoke: danh sách API/demo, chi tiết demo và đặt demo trả 200; HTML có nội dung khung khách sạn, thông báo demo tương ứng và link navigation mới.
- Backend localhost:5108 chưa kết nối được trong phiên; API adapter được kiểm thử với fixture, chưa xác nhận end-to-end API thực tế.
- Browser skill không khởi tạo được do lỗi công cụ `missing field sandboxPolicy`; chưa kiểm thử tương tác wizard, keyboard và ảnh chụp viewport bằng trình duyệt. Responsive/dark mode được triển khai theo CSS/token và cần kiểm tra trực quan khi công cụ hoạt động.

Phân hệ tiếp theo: **B — Vé máy bay**. Dừng sau Khách sạn theo yêu cầu.
