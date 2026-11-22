# Sao lưu và khôi phục database

Dùng khi cần chụp lại dữ liệu trước thay đổi lớn, hoặc chuyển database khỏi Aiven free tier
([ROADMAP](../ROADMAP.md) 10.4). Thông tin kết nối lấy từ user-secrets của bạn, **không** ghi vào file trong repo.
File dump chứa dữ liệu người dùng (email, hash mật khẩu, số điện thoại): **không commit file dump**, lưu ngoài
thư mục dự án và xóa khi không cần nữa.

## Sao lưu bằng MySQL Workbench

1. Mở kết nối tới database nguồn (ví dụ `saihanh_db`).
2. **Server → Data Export**.
3. Tích chọn schema cần sao lưu. Bên phải chọn **Dump Structure and Data**.
4. Ở **Objects to Export**, tích **Dump Stored Procedures and Functions**, **Dump Events**, **Dump Triggers**.
5. **Export Options**: chọn **Export to Self-Contained File**, đặt đường dẫn ngoài repo, ví dụ
   `D:\backup\saihanh_db_2026-11-22.sql`. Tích **Include Create Schema** chỉ khi muốn khôi phục về đúng tên cũ;
   để khôi phục vào database khác (như `saihanh_test`) thì **bỏ tích**.
6. Bấm **Advanced Options…** và đặt:
   - `set-gtid-purged`: **OFF**. Aiven bật GTID; nếu để mặc định, file dump có lệnh `SET @@GLOBAL.GTID_PURGED`
     và khôi phục sang máy khác sẽ lỗi hoặc cần quyền SUPER.
   - `single-transaction`: **bật**. Dump trong một transaction nhất quán của InnoDB mà không khóa bảng, nên
     ứng dụng vẫn chạy được trong lúc sao lưu.
   - Bỏ `lock-tables` (không cần khi đã có single-transaction).
7. Bấm **Start Export**. Mở file kiểm tra: đầu file không có dòng `GTID_PURGED`, có `CREATE TABLE` cho 42+ bảng.

Lệnh tương đương bằng `mysqldump` (mật khẩu sẽ được hỏi):

```powershell
mysqldump -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p --ssl-ca=<CA_PATH> `
  --single-transaction --set-gtid-purged=OFF --routines --triggers --events `
  --default-character-set=utf8mb4 <DB_NAME> > D:\backup\<DB_NAME>_<YYYY-MM-DD>.sql
```

## Khôi phục vào `saihanh_test`

Luôn khôi phục thử vào một database riêng (`saihanh_test`) trước, không ghi đè `saihanh_db`.

1. Tạo database trống: trong Workbench chạy
   `CREATE DATABASE saihanh_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
   (hoặc nhấp chuột phải vùng Schemas → Create Schema).
2. **Server → Data Import**.
3. Chọn **Import from Self-Contained File** và trỏ tới file dump.
4. **Default Target Schema**: chọn `saihanh_test`. File dump không có `CREATE SCHEMA`/`USE` (bước 5 ở trên) nên
   mọi bảng vào đúng database này.
5. Chọn **Dump Structure and Data**, bấm **Start Import**.

Bằng `mysql` CLI:

```powershell
Get-Content D:\backup\<FILE>.sql -Raw -Encoding utf8 |
  mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p --ssl-ca=<CA_PATH> saihanh_test
```

## Kiểm tra sau khôi phục

1. Chạy `database/checks/migration_status.sql` trên `saihanh_test` (xem [thứ tự migration](migrations.md)):
   mọi dòng phải giống database nguồn.
2. So số dòng một vài bảng chính giữa nguồn và bản khôi phục:
   `SELECT COUNT(*) FROM tours;`, `users`, `bookings`, `tour_departures`.
3. Chạy thử backend với bản khôi phục mà không đổi secrets: dùng biến môi trường ghi đè tên database cho một
   lần chạy:

   ```powershell
   $env:Database__Name = "saihanh_test"
   dotnet run --project backend/src/TravelHub.Api --launch-profile http
   ```

   Mở `http://localhost:5108/api/health/database`, phải thấy `"database":"saihanh_test"`.
   Đóng terminal (hoặc `Remove-Item Env:Database__Name`) để quay về database thường.
