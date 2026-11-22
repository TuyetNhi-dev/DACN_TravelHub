# Chọn khu vực khởi hành

Popup thiết kế riêng, dùng màu, token và font của SàiHành.
Code: `frontend/src/lib/departure-region.ts` (ánh xạ, lọc), `frontend/src/components/departure/` (popup, provider).

## Hành vi

- Lần đầu mở website: hiện câu hỏi "Bạn muốn khởi hành từ đâu?".
- Sáu khu vực; "Bỏ qua" lưu lựa chọn `all` (tất cả).
- Đóng hoặc Escape ở lần đầu cũng lưu `all`, không hỏi lại khi tải lại trang.
- Khi mở lại từ Header, đóng/Escape giữ lựa chọn hiện tại.
- Khu vực áp dụng cho tour nổi bật ở trang chủ và trang `/tours`. Trang chi tiết tour mở trực tiếp giữ nguyên nội
  dung tour đã chọn.
- Header luôn có nút đổi khu vực; màn hình hẹp chỉ hiện icon kèm tooltip và `aria-label`.
- Popup dùng `dialog.showModal`: focus nằm trong popup, nền không tương tác được, Escape và trả focus theo hành vi
  gốc của trình duyệt. Khóa cuộn nền khi mở, khôi phục khi đóng.
- Trình duyệt chặn localStorage: vẫn dùng được trong phiên, có cảnh báo không lưu được.

## Ánh xạ địa điểm

Điểm khởi hành của tour (`departureFrom` trong API tour) được ánh xạ sang khu vực bằng danh sách tên cụ thể, có
alias tỉnh/thành cũ. TP.HCM là nhóm riêng, đồng thời thuộc nhóm Đông Nam Bộ.

Đây là quy ước địa lý phục vụ tìm kiếm, không phải danh mục đơn vị hành chính hiện hành. Tên mới/lạ hoặc `null`
không bị đoán vùng: tour đó vẫn có trong `all`, và trang danh sách cảnh báo khi có giá trị chưa ánh xạ. Khi dữ
liệu có tên hành chính mới, xác minh rồi cập nhật ánh xạ; không dùng tìm chuỗi con.

Khu vực chưa có tour nào (ví dụ Tây Nguyên với dữ liệu demo hiện tại) hiển thị trạng thái rỗng và nút
"Xem tất cả".

## Giới hạn

Backend chưa có tham số lọc theo khu vực. Frontend lọc danh sách tour đã tải trước khi chọn tour nổi bật hoặc
phân trang (không lọc trên mấy card đã cắt sẵn). Cách này đủ cho số tour demo hiện tại; khi danh mục lớn hơn cần
chuyển việc lọc sang API. Đổi khu vực ở `/tours` sẽ đặt lại bộ lọc và trang.

## Thử lại lần truy cập đầu

Trong DevTools Console tại `http://localhost:3000`:

```javascript
localStorage.removeItem("travelhub-departure-region-v1");
location.reload();
```

Chỉ xóa key này, không xóa key theme `travelhub-theme`.

## Kiểm thử bằng tay

1. Xóa key và tải lại: popup hiện; chọn Miền Bắc, danh sách chỉ còn tour khởi hành từ miền Bắc.
2. Tải lại, chuyển trang: popup không tự hiện lại.
3. Đổi vùng qua Header; chọn vùng không có tour: trạng thái rỗng; bấm "Xem tất cả": đủ danh sách.
4. Thử "Bỏ qua", nút đóng, Escape; tải lại không hỏi lại.
5. Tab/Shift+Tab nằm trong popup; focus trở về nút Header sau khi đóng.
6. Chế độ sáng/tối và các kích thước 1440, 768, 390px.
7. Dừng backend: hiện lỗi và nút thử lại, không chuyển sang dữ liệu giả.
