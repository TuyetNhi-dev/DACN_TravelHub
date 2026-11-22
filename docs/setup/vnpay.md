# Thanh toán VNPAY (sandbox)

Thanh toán mặc định của dự án là **mô phỏng** (`SimulatedPaymentGateway`), chạy được không cần mạng.
VNPAY sandbox là cổng thứ hai, đang làm dở:

| Phần | Nội dung | Trạng thái |
|---|---|---|
| A | `VnPayPaymentGateway`: tạo URL thanh toán, ký và kiểm chữ ký HMAC-SHA512 | Xong, có test |
| B | `InitiateVnPayAsync`, `ConfirmVnPayAsync`, `VnPayConfirmDecision` | Xong, có test |
| C | Endpoint IPN và verify-return | Chưa làm ([ROADMAP](../ROADMAP.md) 6.4) |
| D | Nút VNPAY trong `PaymentPanel`, trang `/payment/result` | Chưa làm ([ROADMAP](../ROADMAP.md) 6.5) |

Vì phần C và D chưa có, hiện **chưa thể thanh toán VNPAY từ giao diện**. Cấu hình dưới đây chuẩn bị sẵn cho khi
hai phần đó xong.

## 1. Lấy thông tin sandbox

Đăng ký tài khoản merchant sandbox tại <https://sandbox.vnpayment.vn/devreg/>. VNPAY gửi email gồm
**mã website (TMN code)** và **chuỗi bí mật (HashSecret)**. HashSecret là bí mật: không dán vào chat, issue,
tài liệu hay commit.

## 2. Đặt user-secrets

Chạy trong `backend/src/TravelHub.Api`. Tên section là `Vnpay`:

```powershell
dotnet user-secrets set "Vnpay:TmnCode" "<TMN_CODE>"
dotnet user-secrets set "Vnpay:HashSecret" "<HASH_SECRET>"
```

Khóa không bí mật, đã có mặc định:

| Khóa | Mặc định |
|---|---|
| `Vnpay:BaseUrl` | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `Vnpay:ReturnUrl` | `http://localhost:3000/payment/result` |

Thiếu `TmnCode` hoặc `HashSecret` thì backend vẫn khởi động, ghi một cảnh báo vào log và chỉ dùng thanh toán
mô phỏng. Khởi động lại backend sau khi đặt secrets.

## 3. Quy tắc nghiệp vụ

- Số tiền luôn do server tính lại, không lấy từ frontend hay từ tham số VNPAY trả về.
- Chữ ký của mọi callback phải được kiểm tra trước khi đọc dữ liệu.
- Tour: hạn giữ chỗ (`bookings.hold_expires_at`) được kiểm tra lại khi xác nhận. Nếu VNPAY báo đã thu tiền
  nhưng đơn đã hết hạn và chỗ đã trả lại, thanh toán chuyển `refund_needed`; nhân viên hoàn tiền thủ công trên
  trang quản trị merchant của VNPAY (hệ thống không tự hoàn).
- `payments.gateway_meta` lưu tham số callback để đối soát, **không bao giờ** chứa HashSecret.

## Database

Cột `gateway_meta` và trạng thái `refund_needed` do migration 011 tạo; xem
[thứ tự migration](../database/migrations.md).
