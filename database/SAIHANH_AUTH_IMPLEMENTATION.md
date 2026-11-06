# SàiHành — Đăng ký và đăng nhập

Ngày: 19/10/2026. Database sử dụng: saihanh_db.

## Hiện trạng đã kiểm tra

Header desktop/mobile có nút đăng nhập/đăng ký nhưng disabled. Không có form, API xác thực, phiên hoặc trang tài khoản. Backend chỉ có API danh mục. Metadata Aiven xác nhận users, roles, user_role_assignments đã đủ cho triển khai; users.email và roles.code có UNIQUE. users.password_hash VARCHAR(255) phù hợp hash Identity. Các ID auto_increment, ngày tạo/cập nhật có default. users.status hỗ trợ active/disabled/pending; assignment có scope và is_active.

Trước triển khai, users và roles đều rỗng. Không tạo/sửa bảng, cột, index hoặc migration.

## Phần đã triển khai

- /register: họ tên, email, điện thoại, mật khẩu, xác nhận; validation cả frontend và backend; báo thành công/lỗi.
- /login: email/mật khẩu, thông báo lỗi chung không phân biệt email không tồn tại hay mật khẩu sai.
- /account: kiểm tra phiên ở server trước render; guard client khi phiên kết thúc; hiển thị hồ sơ và các vai trò/phạm vi hiện hành.
- Header dùng lại giao diện và các class hiện hữu; liên kết đăng ký/đăng nhập hoạt động ở desktop/mobile; khi đăng nhập hiện tên, trang tài khoản và đăng xuất.
- POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout; GET /api/auth/me, GET /api/auth/csrf.
- Frontend proxy cùng origin chỉ cho /api/auth/*; các dịch vụ Tour/Hotel/Flight và CORS GET hiện hữu không thay đổi.
- Email trim/lowercase; họ tên 2–160 ký tự; email tối đa 254; điện thoại 9–15 chữ số và dấu + tùy chọn; mật khẩu 12–128 ký tự, không trim mật khẩu; xác nhận phải khớp.
- SQL có parameter và transaction. Đăng ký tạo users cùng assignment CUSTOMER/self nguyên tử. Nếu vai trò CUSTOMER chưa có, thêm bản ghi tham chiếu vào roles; không tạo role quản trị, không nhận role/scope từ request. Đây là thêm dữ liệu cho chức năng đăng ký, không đổi schema.
- Mật khẩu dùng PasswordHasher của ASP.NET Core Identity, PBKDF2 có salt riêng và 210.000 vòng. Không lưu hoặc log mật khẩu thuần; API không trả password_hash.
- Cookie HttpOnly, SameSite=Strict; Secure bắt buộc ngoài Development, Development hỗ trợ HTTP localhost. Không lưu access token trong localStorage/sessionStorage.
- Phiên server giữ trong memory, tối đa 8 giờ, không sliding; logout xóa ticket nên phát lại cookie cũ không đăng nhập được. Mỗi request xác thực kiểm tra lại trạng thái tài khoản và dấu vân tay hash; tài khoản disabled/đổi hash sẽ mất phiên.
- CSRF token kiểm tra mọi POST xác thực. Không dùng GET để logout. Rate limit đăng ký/đăng nhập chung 20 request/phút/IP.
- /me đọc lại assignment active từ database, trả code/scope/region/branch. Không chuyển role theo khu vực/chi nhánh thành quyền admin toàn cục và không tạo API quản trị mới. Endpoint đăng ký công khai chỉ cấp CUSTOMER/self.
- JSON sai định dạng trả 400 qua middleware, không trả exception/SQL/connection string cho client.

Thiết kế cookie và antiforgery tham chiếu [tài liệu ASP.NET Core](https://learn.microsoft.com/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0).

## File thay đổi

- backend/Auth/AuthRepository.cs, AuthEndpoints.cs, MemoryTicketStore.cs: dữ liệu, API, phiên.
- backend/Program.cs: DI, cookie authentication, authorization, antiforgery, limiter.
- backend/Api/ApiErrorMiddleware.cs: phân loại malformed HTTP/JSON thành 400.
- backend/tests/Auth.Integration.ps1: kiểm thử tích hợp qua frontend proxy, mật khẩu ngẫu nhiên không in ra.
- frontend/next.config.ts: rewrite auth cùng origin.
- frontend/src/lib/auth.ts, components/auth/*: request, provider, form, Header actions, account panel.
- frontend/src/app/login/page.tsx, register/page.tsx, account/page.tsx: trang mới.
- frontend/src/app/layout.tsx, components/layout/Navigation.tsx: nối provider và nút Header.
- frontend/src/styles/auth.css, app/globals.css: style riêng cho form, tái sử dụng theme hiện tại.
- backend/README.md và báo cáo này: hướng dẫn.

Không thay đổi code Tour, Khách sạn, Vé máy bay; các trang demo hiện hữu giữ nguyên. Trang yêu cầu đăng nhập mới là /account; chưa áp thêm quy tắc bắt đăng nhập cho quy trình demo dịch vụ.

## Kiểm thử thực tế

Backend localhost:5108 kết nối Aiven VerifyFull. Frontend production test localhost:3001 do cổng 3000 đang có tiến trình khác; proxy cùng origin hoạt động tương tự. Không dừng tiến trình frontend sẵn có của người dùng.

| Tình huống | Kết quả |
|---|---|
| Chưa đăng nhập gọi me | 401 |
| POST thiếu CSRF | 400 |
| Đăng ký dữ liệu không hợp lệ | 400 |
| Đăng ký hợp lệ, có gửi thêm role=SUPER_ADMIN và scope=global | 200; chỉ được CUSTOMER/self |
| Email trùng | 409 |
| Mật khẩu sai | 401 |
| Đăng nhập đúng, email viết hoa | 200 |
| me sau đăng nhập | 200, một assignment CUSTOMER/self |
| Cookie phiên HttpOnly | Đạt |
| /account đã đăng nhập | 200 |
| Logout | 200 |
| me sau logout | 401 |
| Phát lại cookie trước logout | 401 |
| /account không còn phiên | Chuyển /login |
| GET /login và /register | 200 |
| Xác nhận mật khẩu sai | 400 |
| JSON sai định dạng, bản build cuối | 400 |
| Vượt limiter, bản build cuối | 429 |
| Health database | ok / saihanh_db |
| dotnet build --no-restore | Thành công, 0 warning/error |
| npm.cmd run build | Thành công |
| ESLint các file frontend thay đổi | Thành công |

Script tích hợp lưu tại backend/tests/Auth.Integration.ps1; tham số BaseUrl mặc định http://localhost:3000, có thể đổi sang http://localhost:3001. Mỗi lần chạy tạo một Customer kiểm thử với mật khẩu ngẫu nhiên và giữ bản ghi để đối chiếu; không seed admin hoặc xóa dữ liệu. Tài khoản đã tạo trong phiên: auth-test-6d119ddf7add49cb86db35b3787e4dfb@example.invalid. Mật khẩu không được lưu trong mã hoặc báo cáo.

## Giới hạn và bước tiếp theo

- Công cụ Browser không khởi tạo được do lỗi môi trường sandboxPolicy. Đã kiểm thử HTTP/build/lint; chưa xác minh click, responsive và tương tác trực tiếp trong trình duyệt.
- Thời hạn 8 giờ và kiểm tra tài khoản bị khóa được triển khai, chưa chờ đủ 8 giờ hoặc sửa trạng thái người dùng thật để kiểm thử. Cookie không hợp lệ/đã thu hồi đã được kiểm thử.
- Phiên trong memory dành cho một backend instance: restart làm đăng xuất tất cả; chưa hỗ trợ nhiều instance/durable sessions. Không cần thay schema cho phiên bản hiện tại.
- Chạy Production cần HTTPS cho frontend và auth upstream (API_BASE_URL) hoặc cấu hình trusted reverse proxy HTTPS phù hợp; không dùng HTTP Development để triển khai công khai. Secure cookie/antiforgery giữ bắt buộc ngoài Development.
- Chưa có tài khoản quản trị trong database, không tạo tài khoản/mật khẩu Admin. Admin có thể dùng cùng luồng đăng nhập khi được cấp tài khoản/assignment hợp lệ bằng quy trình quản trị; dashboard và enforcement quyền nghiệp vụ theo scope là hạng mục riêng, chưa có endpoint quản trị để kiểm thử.
- Chưa làm xác minh email, quên mật khẩu, MFA hoặc chỉnh hồ sơ vì ngoài phạm vi yêu cầu. Không có thay đổi schema cần xin duyệt trong phần đã hoàn thành.
- Cần khởi động lại frontend đang chạy ở cổng 3000 để áp dụng rewrite/config mới. Kiểm tra trực tiếp giao diện tại /register, /login, /account sau restart.
