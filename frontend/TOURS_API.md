# Tích hợp tour từ TravelHub API

Giai đoạn 2 đã có /tours và /tours/[id]. Xem TOURS_PHASE2.md để kiểm thử các
route, bộ lọc, phân trang và trạng thái demo của booking.

## Chạy đồng thời trên Windows

Terminal 1, tại thư mục gốc:

```powershell
cd backend
dotnet run --no-build --launch-profile http
```

Terminal 2, tại thư mục gốc:

```powershell
cd frontend
# Chỉ copy nếu chưa có .env.local:
Copy-Item .env.example .env.local
npm.cmd run dev
```

Mở http://localhost:3000. Backend phải chạy tại http://localhost:5108.
Nếu đã có .env.local, chỉ thêm/sửa NEXT_PUBLIC_API_BASE_URL, không ghi đè file.
Biến này chỉ chứa URL API công khai, không chứa thông tin MySQL.
Đổi biến NEXT_PUBLIC cần khởi động lại dev server; bản production cần build lại.
CORS backend hiện cho phép origin http://localhost:3000; dùng cổng/host khác có
thể bị trình duyệt chặn.

## Phạm vi hiện tại

- Trang chủ gọi GET /api/tours, hiển thị ba phần tử đầu tiên theo thứ tự backend.
  API không có cờ nổi bật; không tự xếp hạng tour.
- Gọi GET /api/tours/{id} cho ba tour đó để lấy lịch khởi hành.
- Card dùng tên, điểm đến, thời lượng, phương tiện, giá người lớn, phân loại
  dữ liệu và ngày lịch đầu tiên từ API. Ngày này không được suy diễn là lịch
  còn chỗ hoặc lịch tương lai.
- SQL NULL được giữ trong types; UI hiển thị thông báo thiếu dữ liệu.
- Kiểm tra hợp đồng JSON khi chạy, timeout 12 giây mỗi request, hủy khi unmount,
  loading, empty, lỗi và thử lại. Không thay bằng mock khi API lỗi.
- Lỗi tải một lịch khởi hành không làm mất toàn bộ danh sách.
- Có route danh sách /tours và chi tiết /tours/[id]. Card trang chủ mở đúng ID.
  Booking/thanh toán chưa khả dụng.

## Dữ liệu còn thiếu / minh họa

MySQL có nội dung lịch trình và điểm tham quan nhưng không có cột ảnh.
Card dùng cùng ảnh minh họa gốc prototype, ghi rõ nhãn. Đây không phải ảnh tour.
Đề xuất bổ sung nguồn ảnh được quản lý theo tour ở giai đoạn sau;
không tự gán ảnh địa điểm vào bản ghi hoặc thay schema trong lần này.
Không thêm đánh giá, ngày hoặc nội dung không có trong API.

Các bản ghi MySQL hiện có loaiDuLieu = Dữ liệu demo; UI giữ nhãn này,
không coi đó là sản phẩm thương mại đã xác thực.

Khách sạn, vé máy bay, điểm đến và hình ảnh banner vẫn từ src/data/home.ts.
Mảng tour mẫu cũ còn được giữ trong file này để tránh xóa nguồn thiết kế,
nhưng không được trang chủ import hoặc dùng làm fallback.
SearchTabs vẫn chỉ cuộn đến section tương ứng, chưa tìm/lọc bằng API.

## Kiểm tra

```powershell
npx.cmd --no-install tsc --noEmit --incremental false
npm.cmd run lint
npm.cmd run build
```

Trong phiên tích hợp: cả ba lệnh đã qua. Production server trả HTTP 200.
Đã chạy API client và bộ kiểm tra JSON trực tiếp với backend: 50 tour,
TOUR001 có 4 lịch khởi hành; kiểm tra lỗi 404, sai hợp đồng JSON và thiếu
biến môi trường đều qua.

Công cụ trình duyệt không khởi tạo được (missing sandboxPolicy), nên chưa
kiểm chứng hydration, loading/error/empty hoặc responsive bằng giao diện thật.
Kiểm tra thủ công tại 1440px, 768px và 390px: ba card giữ lưới gốc; giảm màn hình
không tràn chữ; dừng backend rồi bấm Thử lại để kiểm tra lỗi và phục hồi.
