# Kiểm thử

Chạy đủ các lệnh dưới đây trước khi báo xong một thay đổi. Lỗi lint, kiểu hoặc test do thay đổi của mình gây ra
phải sửa trước. Không sửa test cũ chỉ để cho qua; nếu test cũ fail vì thay đổi đúng đắn, ghi rõ lý do.

## Backend (trong `backend/`)

```powershell
dotnet build
dotnet test
```

Test nằm ở `backend/tests/TravelHub.Api.Tests/` (xUnit), kiểm tra logic thuần không cần database: giá đặt chỗ,
vòng đời đơn, kiểm tra request, giỏ hàng, số điện thoại, chữ ký và quyết định VNPAY, phân quyền nhân viên,
OTP, đặt lại mật khẩu, và đăng ký DI (`DependencyInjectionTests` bắt lỗi thiếu service khi khởi động).

## Frontend (trong `frontend/`)

```powershell
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # node --test tests/*.test.cjs
npm run build       # khi đổi cấu hình hoặc route
```

Test frontend là file `tests/*.test.cjs` chạy bằng `node --test`, nạp module TypeScript qua `tests/load-ts.cjs`.
Logic thuần (lọc, tính tiền, định dạng, lịch âm, ngày lễ) phải tách khỏi component và có test ở đây.

Lint báo cảnh báo theo quy tắc của `AGENTS.md` (hàm khoảng 40 dòng, file dưới 200 dòng, dòng tối đa 120 ký tự).
Đây là cảnh báo (`warn`), chưa chặn build; không thêm cảnh báo mới ở file mình sửa.

## Kiểm thử tích hợp xác thực (lỗi thời)

`backend/tests/scripts/Auth.Integration.ps1` gọi API auth qua frontend đang chạy. Script đặt trong `scripts/`
để tách khỏi project xUnit, và **không** chạy trong `dotnet test`:

```powershell
powershell -File backend/tests/scripts/Auth.Integration.ps1 -BaseUrl http://localhost:3000
```

Lưu ý:

- **Lỗi thời**: script viết trước khi có OTP email (17/11/2026). Luồng hiện tại phải xác minh OTP sau khi đăng
  ký, nên bước đăng ký rồi đăng nhập ngay có thể fail. Chưa được chạy lại sau thay đổi đó; cần viết lại trước khi
  dùng làm bằng chứng kiểm thử.
- Script **ghi vào database**: mỗi lần chạy tạo một tài khoản `auth-test-…@example.invalid` và không tự xóa.
  Chỉ chạy trên database thử (ví dụ `saihanh_test`, xem [sao lưu và khôi phục](../database/backup-restore.md)).

## Kiểm tra giao diện

Mọi thay đổi giao diện kiểm tra ở **390px** (điện thoại), **768px** (tablet) và **1440px** (desktop), cả chế độ
sáng và tối ([theme](../design/theme.md)). Với mỗi trang:

- Không tràn ngang, chữ không bị cắt, nút bấm được bằng bàn phím (Tab, Enter, Esc) và có focus nhìn thấy.
- Có đủ trạng thái đang tải, rỗng và lỗi (thử dừng backend rồi bấm "Thử lại").
- Khách sạn và chuyến bay hiển thị "giá hợp đồng, chờ xác nhận chỗ".

## Luồng đầu-cuối cần thử bằng tay

1. Đăng ký → nhận OTP → xác minh → đồng ý điều khoản.
2. Đặt tour → đếm ngược giữ chỗ → thanh toán mô phỏng trong hạn → đơn `confirmed`.
3. Đặt tour rồi để quá hạn → tác vụ nền hủy đơn, số chỗ trả lại đúng một lần.
4. Đặt khách sạn/vé → nhân viên xác nhận trong `/admin/bookings` → khách thanh toán.
5. Gửi yêu cầu dịch vụ không đăng nhập → nhân viên xử lý trong `/admin/service-requests`.
