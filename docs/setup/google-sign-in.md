# Đăng nhập bằng Google

Nút "Tiếp tục với Google" chỉ hiện khi backend có `Google:ClientId`. Nếu email Google đã có tài khoản SàiHành,
hai tài khoản được liên kết (Google đã xác minh email). Tài khoản tạo qua Google không có mật khẩu và phải
đồng ý điều khoản ở màn hình "Hoàn tất đăng ký" trước khi dùng các chức năng cần đăng nhập.

## 1. Tạo OAuth Client ID

1. Vào <https://console.cloud.google.com/>, tạo project (ví dụ "SaiHanh").
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding/Audience): User type **External**,
   tên ứng dụng "SàiHành", email hỗ trợ. Ở **Audience** để trạng thái **Testing** và thêm Gmail của các thành
   viên vào **Test users** (chỉ những tài khoản này đăng nhập được khi đang Testing).
3. **Credentials → Create credentials → OAuth client ID**, loại **Web application**.
   - **Authorized JavaScript origins:** `http://localhost:3000` (thêm địa chỉ thật khi deploy).
   - Không cần Redirect URI (dùng popup của Google Identity Services).

## 2. Đặt user-secrets

Chạy trong `backend/src/TravelHub.Api`:

```powershell
dotnet user-secrets set "Google:ClientId" "<GOOGLE_CLIENT_ID>"
```

Không cần Client Secret: backend chỉ kiểm tra chữ ký Google ID token và `aud` bằng Client ID này.
Khởi động lại backend sau khi đặt.

## Database

Cột `users.google_subject` do migration 003 tạo; xem [thứ tự migration](../database/migrations.md).
