# Chọn khu vực khởi hành — TravelHub nội địa

Popup thiết kế riêng, dùng màu/token và typography TravelHub, không lấy giao diện
hoặc tài nguyên của Saigontourist.

## Hành vi

- Lần đầu mở website: hiện câu hỏi Bạn muốn khởi hành từ đâu?.
- Sáu khu vực theo yêu cầu; Bỏ qua lưu all.
- Đóng hoặc Escape ở lần đầu cũng lưu all, không hỏi lại khi refresh.
- Khi mở lại từ Header, đóng/Escape giữ lựa chọn hiện tại.
- Chọn khu vực áp dụng cho tour trang chủ và /tours; trang chi tiết mở trực tiếp
  vẫn giữ nguyên nội dung tour đã chọn.
- Header luôn có nút đổi khu vực; màn hình hẹp chỉ hiện icon với tooltip/aria-label.
- Popup dùng dialog.showModal: focus nội bộ, background inert, Escape và trả focus
  theo hành vi native. Khóa cuộn nền khi mở, khôi phục khi đóng.
- Storage bị chặn: vẫn dùng được trong phiên, có cảnh báo không lưu được;
  không thể bảo đảm nhớ sau refresh nếu trình duyệt chặn localStorage.
- Theme được kế thừa; không đổi ảnh, API, booking hoặc dữ liệu.

## Dữ liệu đã kiểm tra từ API

GET /api/tours hiện có 50 tour, bốn giá trị diemKhoiHanh:

| Giá trị | Số tour | Nhóm UX |
| --- | --- | --- |
| TP. Hồ Chí Minh | 14 | TP.HCM và Đông Nam Bộ |
| Hà Nội | 12 | Miền Bắc |
| Đà Nẵng | 12 | Miền Trung |
| Cần Thơ | 12 | Miền Tây Nam Bộ |

Tây Nguyên hiện không có tour phù hợp, hiển thị empty state và Xem tất cả.
TP.HCM là nhóm riêng theo yêu cầu, đồng thời thuộc nhóm Đông Nam Bộ.

Ánh xạ trong src/lib/departure-region.ts là quy ước địa lý phục vụ tìm kiếm UX,
nhận diện tên địa điểm literal, có alias tỉnh/thành cũ và một số thành phố.
Không phải danh mục đơn vị hành chính hiện hành, không suy rộng ranh giới tỉnh
sau sáp nhập từ tên điểm khởi hành. Tên mới/lạ hoặc NULL không bị đoán vùng:
vẫn có trong all, và trang danh sách cảnh báo nếu phát hiện giá trị chưa ánh xạ.
Nếu dữ liệu sau này có điểm ghép nhiều địa danh hoặc tên hành chính mới,
cần xác minh rồi cập nhật ánh xạ, không dùng tìm chuỗi con.

## Giới hạn

Backend chưa có query lọc vùng. Frontend tải danh sách hiện có rồi lọc trước
khi chọn ba tour trang chủ / phân trang. Không lọc trên ba card đã cắt sẵn.
Giới hạn này phù hợp 50 tour hiện tại; cần lọc phía API khi có phân trang server.
Đổi khu vực ở /tours reset các bộ lọc/pagination của trang.
Ngày khởi hành vẫn dùng logic API chi tiết đã có, không tạo lịch hoặc tồn chỗ.

## Thử lại lần truy cập đầu

Mở DevTools Console tại http://localhost:3000:

```javascript
localStorage.removeItem("travelhub-departure-region-v1");
location.reload();
```

Chỉ xóa key này, không xóa key theme travelhub-theme.
Có thể dùng DevTools Application > Local Storage để xóa cùng key.

## Kiểm thử

1. Xóa key và refresh: popup hiện; chọn Hà Nội qua Miền Bắc, thấy 12 tour trong
   danh sách, trang chủ tối đa 3 tour có điểm đi Hà Nội.
2. Refresh, chuyển route: không tự hiện lại.
3. Đổi vùng qua Header; chọn Tây Nguyên: empty state; chọn Xem tất cả: 50 tour.
4. Thử Bỏ qua, nút đóng, Escape; refresh không hỏi lại.
5. Kiểm tra Tab/Shift+Tab nằm trong popup, focus trở về nút Header sau khi đóng.
6. Thử Light/Dark và viewport 1440, 1024, 768, 390, 320px.
7. Dừng API: vẫn có lỗi/thử lại đã có, không chuyển sang tour mock.

Đã qua TypeScript, lint, production build và kiểm thử logic bằng API thật:
50 tour, số lượng từng khu vực, alias, giá trị unknown/NULL, validator lựa chọn.
Không có điểm đi chưa ánh xạ trong dữ liệu hiện tại.
Chưa kiểm chứng popup/focus/refresh/responsive trực tiếp bằng trình duyệt do
công cụ trình duyệt báo missing sandboxPolicy.
