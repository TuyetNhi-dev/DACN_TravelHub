# Kiến trúc tổng quan

SàiHành (TravelHub) là web đặt tour, khách sạn và vé máy bay theo mô hình đại lý lữ hành trực tuyến.

```
Trình duyệt
   │  HTML/RSC, fetch /api/* (cùng origin)
   ▼
Next.js (frontend/, cổng 3000) ── rewrite /api/:path* ──►  ASP.NET Core API (backend/, cổng 5108)
                                                              │  MySqlConnector, SQL tham số hóa
                                                              ▼
                                                           MySQL 8
```

Frontend không gọi thẳng backend từ trình duyệt mà đi qua rewrite của Next.js (`frontend/next.config.ts`,
biến `API_BASE_URL`). Nhờ vậy cookie phiên và CSRF là first-party, cookie `SameSite=Strict` vẫn hoạt động.

## Backend: `backend/src/TravelHub.Api/`

| Thư mục | Vai trò |
|---|---|
| `Features/<Tên>/` | Mỗi nghiệp vụ một thư mục: `*Endpoints.cs` → `*Service.cs` → `*Repository.cs`, kèm `*Dtos.cs` |
| `Common/` | Lỗi chung (`ApiErrorMiddleware`, `ApiException`), CSRF (`AntiforgeryFilter`), giờ Việt Nam, gửi email |
| `Configuration/` | Lớp Options (`Database`, `Email`, `Google`, `Vnpay`, `Booking`), đăng ký DI, bảo mật |
| `Data/` | `MySqlConnectionFactory` (TLS VerifyFull), tiện ích đọc dữ liệu |

Các feature hiện có: `Admin`, `Auth` (gồm `EmailVerification`, `Google`, `PasswordReset`), `Bookings`,
`Branches`, `Cart`, `Flights`, `Health`, `Hotels`, `Payments`, `ServiceRequests`, `Tours`.

Quy tắc tầng:

- **Endpoint** mỏng: nhận request, lấy người dùng hiện tại, gọi service, trả DTO.
- **Service** chứa nghiệp vụ và kiểm tra dữ liệu. Không tin giá, tổng tiền hay vai trò do frontend gửi lên.
- **Repository** chứa SQL viết tay, luôn tham số hóa. Không trả thẳng dòng database ra API.
- Lỗi trả một định dạng JSON chung (RFC 7807, có `detail` tiếng Việt, `errors` theo trường, `traceId`),
  đúng mã 400/401/403/404/409/429/503.

Tác vụ nền: `TourHoldExpiryJob` quét định kỳ (`Booking:HoldSweepSeconds`) các đơn quá hạn giữ chỗ, hủy đơn và
trả chỗ tour hoặc ghế vé deal đúng một lần (khóa dòng `FOR UPDATE`).

## Frontend: `frontend/src/`

Luồng gọi: **component → hook → service → API client**. Component không gọi `fetch` trực tiếp.

| Thư mục | Vai trò |
|---|---|
| `app/` | Route của Next.js App Router (mặc định Server Component) |
| `components/` | Giao diện theo khu vực: `tours`, `hotels`, `flights`, `bookings`, `cart`, `admin`, `auth`, `ui`… |
| `hooks/` | Trạng thái và tác vụ phía client (`useResource`, `useBookingSubmit`, `useRequireSession`…) |
| `services/` | Một file cho mỗi nhóm API, giải mã và kiểm tra dữ liệu trả về |
| `lib/` | `api-client.ts` (CSRF, đọc lỗi JSON), `decode.ts`, và logic thuần có test (lọc, tính tiền, lịch âm) |
| `types/` | Kiểu dữ liệu khớp DTO backend |
| `data/` | Nội dung tĩnh (chính sách, trợ giúp, cẩm nang, thư viện ảnh) |
| `styles/` | CSS theo khu vực, dùng token trong `tokens.css` (xem [theme](../design/theme.md)) |

## Nghiệp vụ cốt lõi

- **Tour** có tồn chỗ thật (`tour_departures.capacity`, `reserved_seats`). Đặt tour giữ chỗ bằng một câu
  `UPDATE` có điều kiện trong transaction; hết chỗ trả 409. Đơn giữ chỗ `Booking:TourHoldMinutes` phút, thanh
  toán trong hạn thì `confirmed`.
- **Khách sạn và vé máy bay** là báo giá của đối tác, không có tồn kho. Đơn ở `awaiting_supplier`; nhân viên xác
  nhận với đối tác (`awaiting_payment`) rồi khách mới thanh toán.
- **Vé deal** là ngoại lệ: báo giá có quỹ ghế theo hợp đồng (`allotment_seats`, `sold_seats`), giữ ghế như tour.
- **Phân quyền** 3 vai trò: xem [quyết định 002](decisions/002-three-roles.md).
- **Thanh toán** mô phỏng là mặc định; VNPAY sandbox xem [setup/vnpay.md](../setup/vnpay.md).

Danh sách endpoint: [api.md](api.md). Schema: `database/migrations/`, thứ tự chạy ở
[database/migrations.md](../database/migrations.md).
