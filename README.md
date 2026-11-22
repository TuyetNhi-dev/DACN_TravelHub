# SàiHành (TravelHub)

Website đặt tour, khách sạn và vé máy bay theo mô hình đại lý lữ hành trực tuyến. Đồ án chuyên ngành, nhóm 3 người.

- **Tour** có tồn chỗ thật: đặt tour giữ chỗ trong 10 phút, thanh toán trong hạn thì đơn được xác nhận.
- **Khách sạn và vé máy bay** là báo giá tham khảo của đối tác: đơn chờ nhân viên xác nhận rồi khách mới thanh
  toán. Riêng **vé deal** có quỹ ghế nên được xác nhận ngay như tour.
- Tài khoản: đăng ký bằng mã OTP qua email hoặc đăng nhập Google; 3 vai trò CUSTOMER, STAFF, ADMIN.
- Thanh toán mô phỏng (chạy được không cần mạng); VNPAY sandbox đang làm.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | ASP.NET Core minimal API (.NET 10), MySqlConnector, SQL viết tay |
| Database | MySQL 8 |
| Kiểm thử | xUnit (backend), `node --test` (frontend), ESLint |

## Chạy nhanh

Cần Node.js, npm và .NET SDK 10. Cấu hình database bằng user-secrets trước
([hướng dẫn](docs/setup/database.md)).

```powershell
# Lần đầu: cài thư viện frontend và tạo file cấu hình frontend
npm --prefix frontend install
Copy-Item frontend/.env.example frontend/.env.local

# Chạy cả frontend và backend từ thư mục gốc
npm run dev
```

Mở <http://localhost:3000>. Backend chạy tại <http://localhost:5108>.
Nhấn Ctrl+C để dừng cả hai; nếu một tiến trình dừng, tiến trình còn lại cũng dừng theo.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [docs/ROADMAP.md](docs/ROADMAP.md) | Lộ trình và trạng thái công việc |
| **Cài đặt** | |
| [docs/setup/backend.md](docs/setup/backend.md) | .NET, user-secrets, chạy và kiểm tra backend |
| [docs/setup/database.md](docs/setup/database.md) | Kết nối MySQL (TLS VerifyFull) |
| [docs/setup/email.md](docs/setup/email.md) | Gmail SMTP gửi mã OTP |
| [docs/setup/google-sign-in.md](docs/setup/google-sign-in.md) | Đăng nhập bằng Google |
| [docs/setup/vnpay.md](docs/setup/vnpay.md) | Thanh toán VNPAY sandbox |
| **Kiến trúc** | |
| [docs/architecture/overview.md](docs/architecture/overview.md) | Cấu trúc frontend, backend và nghiệp vụ cốt lõi |
| [docs/architecture/api.md](docs/architecture/api.md) | Danh sách endpoint |
| [docs/architecture/decisions/](docs/architecture/decisions/) | Quyết định kỹ thuật (database ban đầu, 3 vai trò) |
| **Database** | |
| [docs/database/migrations.md](docs/database/migrations.md) | Thứ tự chạy migration, seed và cách kiểm tra |
| [docs/database/backup-restore.md](docs/database/backup-restore.md) | Sao lưu và khôi phục |
| **Kiểm thử** | |
| [docs/testing/README.md](docs/testing/README.md) | Lệnh kiểm tra, kiểm thử giao diện và luồng đầu-cuối |
| **Thiết kế** | |
| [docs/design/ui-references.md](docs/design/ui-references.md) | Nguồn thiết kế, ma trận kích thước màn hình |
| [docs/design/theme.md](docs/design/theme.md) | Sáng/tối và token màu |
| [docs/design/departure-region.md](docs/design/departure-region.md) | Chọn khu vực khởi hành |
| [docs/design/image-credits.md](docs/design/image-credits.md) | Nguồn ảnh |

Quy tắc làm việc cho người và AI: [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md).
