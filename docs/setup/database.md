# Cài đặt database (MySQL 8)

Backend dùng MySQL 8.0.19 trở lên (cần CHECK constraint và cú pháp `INSERT ... AS new` của migration 013).
Tên database không gắn cứng trong code; database đang dùng của nhóm là `saihanh_db`.

## Khóa cấu hình (user-secrets)

Chạy trong `backend/src/TravelHub.Api`:

```powershell
dotnet user-secrets set "Database:Host" "<DB_HOST>"
dotnet user-secrets set "Database:Port" "<DB_PORT>"
dotnet user-secrets set "Database:Username" "<DB_USER>"
dotnet user-secrets set "Database:Password" "<DB_PASSWORD>"
dotnet user-secrets set "Database:Name" "<DB_NAME>"
dotnet user-secrets set "Database:SslCa" "<ĐƯỜNG_DẪN_TUYỆT_ĐỐI_TỚI_ca.pem>"
```

- Kết nối luôn dùng TLS `VerifyFull` (kiểm tra chứng chỉ và hostname). Không có khóa nào để hạ mức TLS.
- `SslCa` là đường dẫn tuyệt đối tới file CA đọc được trên máy. **Không** đặt file CA trong repo.
- Thiếu khóa hoặc sai cấu hình: API trả 503 theo định dạng lỗi chung, không lộ thông tin kết nối.

## Tạo database mới

1. Tạo một database rỗng (người vận hành tự tạo, tên tùy chọn).
2. Chạy migration và seed theo đúng thứ tự trong [thứ tự migration và seed](../database/migrations.md).
3. Kiểm tra bằng `database/checks/migration_status.sql` (hướng dẫn trong cùng tài liệu).

## Sao lưu và khôi phục

Xem [sao lưu và khôi phục](../database/backup-restore.md).
