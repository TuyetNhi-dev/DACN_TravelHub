# Cài đặt Trợ lý AI (Google Gemini)

Trợ lý tư vấn là nút "Trợ lý" ở góc phải mọi trang khách. Backend gọi Google Gemini API (gói miễn phí) qua
`POST /api/assistant/chat`. Không có khóa thì trợ lý trả 503, giao diện báo "Trợ lý tạm không khả dụng" và gợi ý tìm
tour thường; các phần khác của website chạy bình thường.

## 1. Lấy khóa Gemini

1. Đăng nhập [Google AI Studio](https://aistudio.google.com/) bằng tài khoản Google của nhóm.
2. Chọn **Get API key** → **Create API key**, chọn (hoặc tạo) một Google Cloud project.
3. Sao chép khóa. Không dán khóa vào chat, issue, ảnh chụp màn hình hay bất kỳ file nào trong repo.

Lưu ý về gói miễn phí (tra cứu 24/11/2026, xem lại trang giá trước khi dùng):

- Có giới hạn số yêu cầu theo phút và theo ngày, tùy model và tài khoản. Vượt giới hạn thì Gemini từ chối, trợ lý
  hiện "tạm không khả dụng".
- Bảng giá ghi nội dung gửi qua gói miễn phí **được dùng để cải thiện sản phẩm của Google**. Vì vậy backend chỉ gửi
  câu hỏi (đã che email, số điện thoại), nội dung công khai của website và danh sách tour; không gửi thông tin tài
  khoản hay đơn hàng. Giao diện nhắc khách không nhập thông tin cá nhân.

## 2. Đặt khóa bằng user-secrets

Chạy trong `backend/src/TravelHub.Api`:

```powershell
cd backend/src/TravelHub.Api
dotnet user-secrets set "Ai:GeminiApiKey" "<KHÓA_GEMINI>"
dotnet user-secrets list   # chỉ để kiểm tra tên khóa; đừng chụp hay dán kết quả có giá trị
```

Môi trường khác dùng biến môi trường `Ai__GeminiApiKey`. Đổi khóa phải khởi động lại backend.

Các khóa không bí mật, có mặc định (chỉ đặt khi cần đổi):

| Khóa | Mặc định | Ý nghĩa |
|---|---|---|
| `Ai:GeminiModel` | `gemini-3.5-flash-lite` | Model có function calling, nằm trong gói miễn phí |
| `Ai:GeminiThinkingLevel` | `MINIMAL` | Mức "suy nghĩ" của model; thấp để trả lời trong hạn 15 giây. Để rỗng nếu model không hỗ trợ |

## 3. Cách trợ lý hoạt động

- Khóa gửi qua header `x-goog-api-key`, không nằm trong URL nên không lọt vào log. Log chỉ ghi mã HTTP và trạng thái
  lỗi của Google, không ghi nội dung câu hỏi hay khóa.
- Model chỉ được gọi 2 công cụ: `search_tours` (cùng bộ lọc với trang `/tours`) và `get_policy` (FAQ, chính sách,
  cẩm nang). Công cụ khác bị từ chối, không chạy.
- Thẻ tour hiển thị từ dữ liệu hệ thống (DTO), không từ chữ model viết. Model không nhận giá và ngày khởi hành nên
  không lặp lại được; nó được dặn mời khách xem thẻ.
- Tối đa 3 vòng gọi công cụ, cả lượt có hạn 15 giây; câu hỏi tối đa 500 ký tự; mỗi người dùng (hoặc mỗi IP với khách
  vãng lai) tối đa 6 câu mỗi phút. Không lưu lịch sử chat trên server; trình duyệt gửi lại vài dòng gần nhất.

## 4. Cập nhật nội dung tri thức

Nội dung trợ lý trích dẫn lấy từ `frontend/src/data/help-faq.ts`, `policies.ts`, `travel-guides.ts`. Sửa các file đó
xong, chạy trong `frontend/`:

```powershell
npm run export:assistant-knowledge
```

Lệnh ghi lại `backend/src/TravelHub.Api/Features/Assistant/assistant-knowledge.json` (nhúng vào backend khi build).
Test `tests/assistant-knowledge.test.cjs` báo lỗi nếu quên chạy lệnh này.

## 5. Kiểm tra nhanh

1. Chạy `npm run dev` ở thư mục gốc, mở trang chủ, bấm nút "Trợ lý".
2. Bấm câu gợi ý "Chính sách hủy tour": câu trả lời kèm liên kết tới trang Hủy & hoàn tiền.
3. Bấm "Đi Đà Lạt tháng 12": thẻ tour hiện giá và ngày khởi hành trong tháng 12 lấy từ hệ thống.
4. Xóa khóa (`dotnet user-secrets remove "Ai:GeminiApiKey"`), khởi động lại backend: trợ lý báo "tạm không khả dụng"
   kèm liên kết tìm tour thường.
