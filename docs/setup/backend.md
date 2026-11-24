# Cài đặt backend (ASP.NET Core)

Backend là ASP.NET Core minimal API trên .NET 10, truy cập MySQL bằng MySqlConnector với SQL viết tay.
Project nằm ở `backend/src/TravelHub.Api/`, test ở `backend/tests/TravelHub.Api.Tests/`.

## Yêu cầu

- .NET SDK 10
- MySQL 8.0.19 trở lên (xem [cài đặt database](database.md))

## Bí mật: dùng user-secrets

Không ghi mật khẩu, khóa hay chuỗi kết nối vào `appsettings*.json` hoặc bất kỳ file nào trong repo.
Mọi bí mật đặt bằng user-secrets, chạy trong `backend/src/TravelHub.Api`:

```powershell
cd backend/src/TravelHub.Api
dotnet user-secrets list          # xem các khóa đang có
dotnet user-secrets set "<Khóa>" "<giá trị>"
```

| Nhóm khóa | Hướng dẫn |
|---|---|
| `Database:*` | [database.md](database.md) |
| `Email:*` | [email.md](email.md) |
| `Google:ClientId` | [google-sign-in.md](google-sign-in.md) |
| `Vnpay:*` | [vnpay.md](vnpay.md) |
| `Ai:GeminiApiKey` | [ai-assistant.md](ai-assistant.md) |
| `Ticket:SigningKey` | Khóa ký mã QR vé điện tử (HMAC-SHA256), tối thiểu 32 ký tự ngẫu nhiên, xem bên dưới |

Tạo `Ticket:SigningKey` một lần cho mỗi môi trường (PowerShell) rồi đặt bằng user-secrets:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$key = [Convert]::ToBase64String($bytes)
dotnet user-secrets set "Ticket:SigningKey" $key
```

Thiếu khóa thì backend vẫn chạy: trang vé của khách trả 503 và màn check-in tắt quét QR (vẫn check-in theo danh
sách được). **Đổi khóa làm mọi mã QR đã phát mất hiệu lực**, khách chỉ cần mở lại trang vé để có mã mới.

Khóa không bí mật, có giá trị mặc định (chỉ đặt khi cần đổi):

| Khóa | Mặc định | Ý nghĩa |
|---|---|---|
| `Booking:TourHoldMinutes` | `10` | Thời gian giữ chỗ tour trước khi đơn chưa thanh toán bị hủy |
| `Booking:DealHoldMinutes` | `10` | Thời gian giữ ghế vé deal |
| `Booking:HoldSweepSeconds` | `30` | Chu kỳ tác vụ nền quét đơn quá hạn |
| `Cors:AllowedOrigins` | `http://localhost:3000` | Origin được phép gọi API trực tiếp |

Thứ tự nạp cấu hình (sau ghi đè trước): `appsettings.json` → `appsettings.{Environment}.json` → user-secrets
(chỉ khi Development) → biến môi trường (ví dụ `Database__Name`) → tham số dòng lệnh.
Cấu hình đọc một lần khi khởi động: **đổi secrets thì phải khởi động lại backend**.

## Chạy

Từ thư mục gốc, cách nhanh nhất là `npm run dev` (chạy cả frontend và backend, xem [README](../../README.md)).
Chạy riêng backend:

```powershell
dotnet run --project backend/src/TravelHub.Api --launch-profile http
```

Backend nghe ở `http://localhost:5108`. Kiểm tra kết nối database:

```powershell
curl http://localhost:5108/api/health/database
# {"status":"ok","database":"<tên database>"}
```

Frontend gọi backend qua proxy cùng origin `/api/*` (biến `API_BASE_URL` trong `frontend/.env.local`, xem
`frontend/.env.example`), nên cookie phiên và CSRF luôn là first-party.

## Kiểm tra

```powershell
cd backend
dotnet build
dotnet test
```

Xem thêm [hướng dẫn kiểm thử](../testing/README.md).
