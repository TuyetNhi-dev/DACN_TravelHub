# Cấu hình đăng ký: mã OTP qua Gmail và đăng nhập Google

## Luồng
- **Đăng ký bằng email:** điền form → tích đồng ý điều khoản → **Gửi mã OTP** → nhập mã 6 số trong email →
  tài khoản được kích hoạt và đăng nhập luôn. Mã có hiệu lực 10 phút, sai 5 lần thì mã bị hủy, gửi lại tối đa
  1 lần/60 giây. Đã đóng form? Nhập mã tại `/verify-email`.
- **Đăng nhập khi chưa nhập mã:** trang đăng nhập chuyển sang bước nhập mã kèm nút gửi lại.
- **Tiếp tục với Google:** đăng nhập/đăng ký bằng tài khoản Google. Nếu email đã có tài khoản SàiHành, hai tài
  khoản được liên kết (Google đã xác minh email). Nút chỉ hiện khi máy chủ có `Google:ClientId`.

Tất cả bí mật đặt bằng **user-secrets** trong `backend/src/TravelHub.Api`, không ghi vào file trong repo.

## 1. Gmail SMTP (gửi mã OTP)

Dùng một Gmail riêng của nhóm.

1. Bật **Xác minh 2 bước**: <https://myaccount.google.com/signinoptions/twosv>
2. Tạo **Mật khẩu ứng dụng**: <https://myaccount.google.com/apppasswords> → tên "SaiHanh" → Google hiện
   **16 chữ cái thường** (dạng `abcd efgh ijkl mnop`). Đây **không phải** mật khẩu Gmail.
3. Đặt:
   ```powershell
   dotnet user-secrets set "Email:Username" "gmail-cua-nhom@gmail.com"
   dotnet user-secrets set "Email:Password" "abcdefghijklmnop"
   ```

Lỗi thường gặp: `534 5.7.9 Application-specific password required` = đang dùng mật khẩu Gmail thường thay cho
Mật khẩu ứng dụng. `535 5.7.8 Username and Password not accepted` = sai tài khoản hoặc Mật khẩu ứng dụng.

Khóa tùy chọn: `Email:Host` (`smtp.gmail.com`), `Email:Port` (`587`), `Email:FromName` (`SàiHành`),
`Email:FrontendBaseUrl` (`http://localhost:3000`, đổi khi deploy).

## 2. Google Sign-In (OAuth Client ID)

1. Vào <https://console.cloud.google.com/> → tạo project (ví dụ "SaiHanh").
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding/Audience): User type **External**,
   tên ứng dụng "SàiHành", email hỗ trợ; ở **Audience** để trạng thái **Testing** và thêm Gmail của các thành viên
   vào **Test users** (chỉ những tài khoản này đăng nhập được khi đang Testing).
3. **Credentials → Create credentials → OAuth client ID** → loại **Web application**.
   - **Authorized JavaScript origins:** `http://localhost:3000` (thêm địa chỉ thật khi deploy).
   - Không cần Redirect URI (dùng popup của Google Identity Services).
4. Sao chép **Client ID** (dạng `xxxx.apps.googleusercontent.com`) rồi đặt:
   ```powershell
   dotnet user-secrets set "Google:ClientId" "xxxx.apps.googleusercontent.com"
   ```
   Không cần Client Secret: backend chỉ kiểm tra chữ ký Google ID token và `aud` = Client ID này.

Khởi động lại backend sau khi đặt secrets.

## 3. Database

- `002_email_verification.sql`: bảng `email_verification_tokens` (đã chạy trên `saihanh_db` 17/11/2026).
- `003_otp_and_google_sign_in.sql`: cột `failed_attempts`, cột `users.google_subject` + khóa UNIQUE
  (đã chạy trên `saihanh_db` 17/11/2026).

## API

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| POST | `/api/auth/register` | Cần `acceptTerms: true`; trả `{ message, emailSent }` |
| POST | `/api/auth/verify-email` | Body `{ email, code }`; đúng → đăng nhập, trả session; sai → 400 kèm số lần còn lại |
| POST | `/api/auth/resend-verification` | Body `{ email }`; luôn trả cùng thông báo (không lộ email đã đăng ký) |
| POST | `/api/auth/login` | 403 `code: "email_not_verified"` khi đúng mật khẩu nhưng chưa nhập mã |
| GET | `/api/auth/google/config` | `{ clientId }` hoặc `null` nếu chưa cấu hình |
| POST | `/api/auth/google` | Body `{ credential }` (Google ID token); trả session |

Mọi POST cần header `X-CSRF-Token` và bị giới hạn tần suất.
