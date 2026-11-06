# Phân hệ B — Vé máy bay SàiHành

## Các màn hình

- `/flights`: tìm kiếm nội địa, một chiều/khứ hồi, ngày, 1–9 hành khách và hạng vé.
- `/flights/results`: bộ lọc hãng/giá/khung giờ, sắp xếp giá/giờ/thời lượng, so sánh tối đa 3 chuyến, chọn lần lượt hai chặng.
- `/flights/detail`: hành trình và sân bay, hạng vé, thông tin còn thiếu, tổng dự kiến.
- `/flights/booking`: nhập hành khách/liên hệ, xem lại, quay lại chỉnh sửa và kết quả mô phỏng.

Các route chia sẻ một luồng trong `FlightPage`; query chỉ mang thông tin tìm kiếm, nguồn và ID chuyến. Thông tin cá nhân chỉ nằm trong React state, không đưa vào URL, storage hoặc gửi đến backend. Tải lại/rời trang đặt vé sẽ mất thông tin đã nhập.

## Nguồn dữ liệu

Mặc định gọi GET `/api/flights` qua API client hiện có, kiểm tra envelope `{ data, count }`, kiểu dữ liệu, giá/số ghế và mã trùng. Không thêm API/backend. Lỗi API hiển thị lỗi và nút thử lại, không chuyển sang demo. API danh mục được lọc tại frontend, giữ nguyên ngày và giá gốc.

Người dùng phải chủ động chọn **Trải nghiệm dữ liệu demo** (`source=demo`). Fixture tách trong `src/data/flights-demo.ts`, sinh các chuyến mô phỏng theo hành trình/ngày/hạng vé được chọn, có trường hợp hết ghế. Cả API và demo đều là dữ liệu tham khảo, không tuyên bố giá/tồn chỗ thời gian thực.

Hợp đồng hiện tại không có hành lý, điều kiện đổi/hủy hoặc chi tiết thuế/phí: UI ghi chưa có dữ liệu, không thêm phí hoặc chính sách giả. Tổng là tổng giá từng chặng × hành khách, chưa xác nhận đã bao gồm thuế/phí. Demo chưa phân biệt giá người lớn/trẻ em/em bé. Không xuất vé, giữ chỗ hoặc thanh toán thật.

Các trường hợp thiếu giá, vượt số ghế tham khảo, hành trình sai, thiếu chặng hoặc chuyến về cùng ngày khởi hành trước giờ đến đều bị chặn trước bước nhập thông tin.

## Kiểm tra

Chạy trong `frontend`:

```text
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
node --test tests/*.test.cjs
```

Đã đạt lint, TypeScript, build production và 29 kiểm thử (9 kiểm thử mới cho flights). HTTP production kiểm tra bốn route trả 200; route không hợp lệ trả 404.

Giới hạn kiểm chứng trong phiên triển khai: backend tại localhost:5108 không kết nối được; công cụ trình duyệt lỗi môi trường (`sandboxPolicy`) nên chưa kiểm thử tương tác trực tiếp hoặc xác minh trực quan các kích thước màn hình. Responsive và Light/Dark dùng CSS scoped cùng theme tokens hiện có; cần kiểm tra trực quan tiếp khi trình duyệt hoạt động.

Chỉ cập nhật đích liên kết Vé máy bay ở điều hướng và footer để vào `/flights`; không làm lại Home/Tour/Khách sạn. Dừng phạm vi ở phân hệ B.
