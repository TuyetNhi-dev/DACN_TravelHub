# TravelHub — danh sách và chi tiết tour

## Chạy

Giữ backend ở http://localhost:5108:

```powershell
cd backend
dotnet run --no-build --launch-profile http
```

Terminal thứ hai:

```powershell
cd frontend
npm.cmd run dev
```

Mở http://localhost:3000/tours. Kiểm tra NEXT_PUBLIC_API_BASE_URL trong
.env.local trỏ tới API. Không đưa credentials MySQL vào frontend.
Nếu cổng 3000 đang được dùng, ưu tiên dùng frontend đang chạy đúng cổng này:
CORS backend chỉ cho phép origin http://localhost:3000.

## Dữ liệu và tương tác

- Danh sách lấy toàn bộ GET /api/tours, hiện có 50 bản ghi; phân trang 6 tour.
- Tìm theo tên, điểm đi, điểm đến hoặc mã, hỗ trợ chữ Việt không dấu.
- Lọc điểm đến lấy từ API, giá người lớn cơ bản tối thiểu/tối đa,
  thời lượng tối đa 3 ngày / 4–5 ngày / trên 5 ngày.
- Sắp xếp giá tăng/giảm; tour thiếu giá nằm cuối khi sắp xếp,
  không được xem là giá 0.
- Khi chọn ngày, tải GET /api/tours/{id} cho các tour, tối đa 5 yêu cầu đồng thời.
  Không tự suy ra ngày từ dữ liệu mẫu. Nếu thiếu một lịch do lỗi, báo lỗi và
  cho thử lại; không trả tập kết quả ngày không đầy đủ.
- Bộ lọc và phân trang hiện ở state trình duyệt, chưa lưu trong URL.
- Chi tiết /tours/TOUR001 và /tours/TOUR002 dùng ID varchar thực tế,
  hiển thị nội dung khác nhau từ API. ID không tồn tại có trạng thái không tìm thấy.
- Giá theo lịch và số chỗ lấy nguyên giá trị API; SQL NULL ghi chưa có thông tin.
- Loading, rỗng, lỗi/thử lại có cho danh sách và chi tiết.
- Header/Footer dùng chung; navigation tour và card trang chủ đã nối route thật.

## Giới hạn có chủ đích

Hình ảnh từ prototype là ảnh minh họa, có ghi nhãn; database chưa có ảnh riêng.
Các bản ghi MySQL vẫn được phân loại Dữ liệu demo, không thay nhãn đó.
Không tạo đánh giá, chính sách hủy, quyền lợi bao gồm hoặc quy định em bé giả.
Lịch trình hiển thị nguyên nội dung tóm tắt API, không dựng lại lịch ngày giả.
Nút Đặt tour vô hiệu hóa và ghi rõ demo/chưa có API booking. Chọn lịch chỉ
thay đổi thông tin đang xem; không POST, không giữ/trừ số chỗ.
Khách sạn, vé máy bay và SearchTabs trang chủ vẫn giữ phạm vi giai đoạn trước.
Không sửa backend hoặc database.

## Kiểm thử

1. Mở /tours: 50 tour chia thành 9 trang; trang cuối có 2 tour.
2. Thử tìm da nang, lọc điểm đến, giá và thời lượng; đổi bộ lọc về trang đầu.
3. Lọc ngày 2026-11-01; chờ tải đủ lịch. Thử ngày không có lịch để xem empty state.
4. Xóa bộ lọc; thử sắp giá thấp/cao, chuyển trang trước/sau.
5. Bấm Xem chi tiết ở hai tour khác nhau, đối chiếu ID/tên/giá với API.
6. Chọn từng lịch trong trang chi tiết và đối chiếu giá, số chỗ, trạng thái.
7. /tours/__missing__ hiển thị không tìm thấy; dừng backend để thử lỗi và Thử lại.
8. Kiểm tra trên desktop 1440px, tablet 768px, mobile 390px; filter vẫn hiện
   ở mobile, bảng lịch có cuộn ngang, không mất Header/Footer.

TypeScript, lint, build đã qua trong phiên triển khai. Kiểm thử logic bằng dữ liệu
API thật đã qua: 50 tour, hai ID khác nhau, tìm kiếm/lọc/giá/ngày/sắp xếp,
kết quả rỗng và API 404. Công cụ trình duyệt lỗi missing sandboxPolicy nên chưa
kiểm chứng tương tác và responsive bằng trình duyệt.
