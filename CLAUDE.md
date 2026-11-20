@AGENTS.md

## Ngôn ngữ

Luôn trả lời bằng **tiếng Việt**.

## Phạm vi công việc

- CHỈ làm theo **docs/ROADMAP.md** và yêu cầu trực tiếp của người dùng.
- KHÔNG tự lập kế hoạch sprint khác, không tự chuyển sang việc chưa được duyệt.
- Làm xong **1 phần** thì dừng, báo kết quả, chờ duyệt trước khi làm tiếp.

## Database

- KHÔNG chạy lệnh ghi vào database: `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `CREATE`, `DROP`.
- Migration và seed chỉ **viết file** vào `database/migrations/` hoặc `database/seeds/`. Người dùng tự chạy.

## Git

- Không tự chạy `git add`, `git commit`, `git push`.
- Làm xong thì đề xuất lệnh `git add` theo nhóm file và commit message bằng **tiếng Anh** theo dạng `feat:`, `fix:`, `chore:`, `docs:`.

## Thay đổi cần duyệt trước

Lập kế hoạch và chờ duyệt trước khi viết code cho:
- Thay đổi schema database (bảng mới, cột mới, đổi kiểu)
- Thay đổi hợp đồng API (endpoint mới, đổi tên trường, đổi mã HTTP)
- Luồng đăng nhập / xác thực
- Luồng thanh toán

## Kiểm tra sau khi sửa code

```bash
# Backend (trong backend/)
dotnet build
dotnet test

# Frontend (trong frontend/)
npm run typecheck
npm run lint
npm test          # nếu có test liên quan
```

Không sửa test cũ chỉ để cho qua. Nếu test cũ fail do thay đổi đúng đắn, báo rõ lý do.

## Bảo mật

Không đưa mật khẩu, khóa API, chuỗi kết nối, file `.env` vào bất kỳ file nào trong repo.
