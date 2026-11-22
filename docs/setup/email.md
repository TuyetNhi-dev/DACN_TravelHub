# Gửi email OTP qua Gmail SMTP

Email dùng cho mã OTP đăng ký (6 số, hiệu lực 10 phút, sai 5 lần thì mã bị hủy, gửi lại tối đa 1 lần/60 giây)
và mã đặt lại mật khẩu. Đã đóng form đăng ký thì nhập mã tại `/verify-email`.
Nếu chưa cấu hình email, backend vẫn chạy nhưng không gửi được mã.

## 1. Tạo Mật khẩu ứng dụng Gmail

Dùng một Gmail riêng của nhóm.

1. Bật **Xác minh 2 bước**: <https://myaccount.google.com/signinoptions/twosv>
2. Tạo **Mật khẩu ứng dụng**: <https://myaccount.google.com/apppasswords>, đặt tên "SaiHanh".
   Google hiện 16 chữ cái thường. Đây **không phải** mật khẩu Gmail.

## 2. Đặt user-secrets

Chạy trong `backend/src/TravelHub.Api`:

```powershell
dotnet user-secrets set "Email:Username" "<GMAIL_CUA_NHOM>"
dotnet user-secrets set "Email:Password" "<APP_PASSWORD>"
```

Khóa tùy chọn (đã có mặc định):

| Khóa | Mặc định |
|---|---|
| `Email:Host` | `smtp.gmail.com` |
| `Email:Port` | `587` |
| `Email:FromAddress` | bằng `Email:Username` |
| `Email:FromName` | `SàiHành` |
| `Email:FrontendBaseUrl` | `http://localhost:3000` (đổi khi deploy) |

Khởi động lại backend sau khi đặt secrets.

## Lỗi thường gặp

| Lỗi SMTP | Nguyên nhân |
|---|---|
| `534 5.7.9 Application-specific password required` | Đang dùng mật khẩu Gmail thường thay cho Mật khẩu ứng dụng |
| `535 5.7.8 Username and Password not accepted` | Sai tài khoản hoặc sai Mật khẩu ứng dụng |

## Database

Bảng mã OTP do migration 002, 003 và 014 tạo; xem [thứ tự migration](../database/migrations.md).
