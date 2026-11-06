# SàiHành API

.NET 10 + MySqlConnector 2.6.2: đọc danh mục dịch vụ và xác thực tài khoản qua MySQL.

Cấu hình qua User Secrets: Database:Host, Port, Username, Password, Name, SslCa (mỗi khóa có tiền tố Database:). Name hiện tại saihanh_db; không hardcode tên database. TLS luôn VerifyFull, không dùng khóa SslMode cũ. CA là đường dẫn tuyệt đối tới file đọc được.

CreateBuilder nạp theo ưu tiên tăng dần: appsettings.json, appsettings.{Environment}.json, User Secrets khi Development, environment, command line. Database__Name ghi đè Database:Name. Profile http đặt Development. Khởi động lại backend sau thay secrets.

Từ project root chạy dotnet build backend/TravelHub.Api.csproj, sau đó dotnet run --project backend/TravelHub.Api.csproj --no-build --launch-profile http. Backend localhost:5108, CORS GET từ localhost:3000.

GET /api/health/database chạy SELECT 1 và SELECT DATABASE(). Các GET /api/tours, /api/tours/{id}, /api/hotels, /api/hotels/{id}, /api/flights dùng schema mới và giữ tên JSON cũ. ID trả dạng chuỗi, ID chi tiết nhận số nguyên dương UInt64. Tiền dùng decimal để giữ phần lẻ DECIMAL(15,2). Các trường thiếu nguồn tương ứng trả null, không giả định tồn phòng/ghế.

Giá hotel/phòng tham khảo: MIN offer VND active có hiệu lực chứa ngày hiện tại của MySQL. Flight: offer VND active chưa hết hạn rẻ nhất, hòa giá chọn id nhỏ nhất; cabin và giá lấy cùng offer. Giờ bay tách trực tiếp từ depart_at/arrive_at, chưa chuyển múi giờ.

Kiểm thử 19/10/2026: build 0 warning/error; health và ba danh sách HTTP 200; database thực saihanh_db. 42 bảng đang rỗng nên chưa kiểm thử mapper với dòng thật; không seed dữ liệu.

Chi tiết: [báo cáo sửa kết nối](../database/SAIHANH_DATABASE_CONNECTION_FIX.md).

## Xác thực tài khoản

API mới: GET /api/auth/csrf, POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout. POST cần X-CSRF-Token lấy từ csrf cùng cookie jar. Frontend proxy cùng origin các API này; không bật CORS credentials tùy ý.

Đăng ký chỉ tạo CUSTOMER/self trên các bảng hiện có. PasswordHasher PBKDF2, cookie HttpOnly/Strict, phiên server tối đa 8 giờ, logout thu hồi ticket. Phiên lưu memory cho một instance; restart làm mất phiên. Production cần HTTPS, Secure cookie bắt buộc. Không có seed tài khoản quản trị.

Kiểm thử tích hợp: backend/tests/Auth.Integration.ps1 với tham số BaseUrl trỏ tới frontend đang chạy; mỗi lần chạy tạo một tài khoản kiểm thử riêng, không in mật khẩu và không tự xóa bản ghi. Xem [báo cáo xác thực](../database/SAIHANH_AUTH_IMPLEMENTATION.md) để biết kết quả và giới hạn kiểm thử.
