# Kế hoạch tính năng tạo dấu ấn SàiHành

Trạng thái: **đề xuất, chờ duyệt**. Đây là kế hoạch, chưa triển khai API, giao diện hay migration.

## Nguyên tắc và hiện trạng

- Tour có tồn chỗ thật; khách sạn và vé máy bay thường là báo giá đối tác, phải ghi rõ chờ xác nhận.
- Vé deal là ngoại lệ có quỹ ghế hợp đồng; chỉ vé deal mới được xác nhận ngay.
- Backend kiểm tra giá, trạng thái, quyền và phạm vi chi nhánh; thao tác admin phải ghi `audit_logs`.
- `frontend/src/lib/vn-holidays.ts` tính ngày lễ theo quy tắc đã biết, nhưng không tự đoán lịch nghỉ Tết/ngày nghỉ bù do cơ quan nhà nước công bố từng năm.
- Nội dung FAQ, chính sách và cẩm nang hiện nằm ở `frontend/src/data/`; cần chuyển/tập hợp nguồn tri thức dùng bởi backend để AI không phụ thuộc dữ liệu chỉ có trong trình duyệt.
- Migration 009 đã tạo `price_alerts` cho vé và `price_alert_notifications`; chưa thấy luồng ứng dụng sử dụng các bảng này.
- Admin đã có manifest đoàn, `booking_passengers`, quy tắc phạm vi chi nhánh và nền audit log. Chưa có check-in.
- Mọi ước lượng bên dưới là ngày công của một người đã quen repo, gồm code và kiểm tra cơ bản; chưa tính chờ duyệt, tích hợp dịch vụ ngoài hoặc sửa lỗi dữ liệu.

## Đề xuất thứ tự

1. **Kỳ nghỉ thông minh** — ít rủi ro, tận dụng thư viện ngày lễ và API tìm tour hiện có; đưa trang nhỏ lên trang chủ trước khi làm trang riêng.
2. **Vé điện tử QR và check-in** — giá trị demo cao, tận dụng trạng thái confirmed và manifest; cần cẩn thận với token, quyền và thao tác lặp.
3. **Săn deal và cảnh báo giá** — ra mắt cảnh báo vé bằng bảng đã có; chỉ mở rộng sang tour sau khi chốt định nghĩa “giảm giá” và lưu lịch sử giá.
4. **Trợ lý AI** — làm sau cùng vì cần chọn nhà cung cấp, xử lý dữ liệu tri thức, giới hạn chi phí và kiểm thử chất lượng tiếng Việt. Bản demo chỉ tư vấn tour/chính sách, không tự đặt chỗ.

Nếu lịch dự án ngắn, hoàn thành kỳ nghỉ thông minh và check-in theo tour trước. Cắt AI toàn phần và cảnh báo email theo dõi giá; trình diễn trợ lý bằng bộ câu hỏi cố định không gọi mô hình nếu cần minh họa giao diện.

## 1. Trợ lý AI

**Trạng thái: đã làm bản demo (không migration, không lưu lịch sử).** Chốt: Google Gemini API gói miễn phí, model
`gemini-3.5-flash-lite` (cấu hình được), khóa ở user-secrets `Ai:GeminiApiKey` gửi qua header `x-goog-api-key`.
Hướng dẫn: [docs/setup/ai-assistant.md](../setup/ai-assistant.md).

- Backend `Features/Assistant/`: `IAiProvider` + adapter `GeminiProvider`; `AssistantService` cho tối đa 3 vòng
  công cụ rồi một lần gọi cuối không công cụ, hạn 15 giây cả lượt; lỗi, thiếu khóa hay quá hạn trả 503.
- Công cụ: `search_tours` (qua `TourService`, cùng bộ lọc `/tours`) và `get_policy` (kho tri thức xuất từ
  `frontend/src/data` bằng `npm run export:assistant-knowledge`). Công cụ khác bị từ chối không chạy.
- Model không nhận giá và ngày; thẻ tour render từ `TourSummaryDto`. Email, số điện thoại trong câu hỏi bị che trước
  khi gửi; không đọc tài khoản hay đơn. Rate limit 6 câu/phút theo người dùng hoặc IP; câu hỏi ≤ 500 ký tự.
- Giao diện: nút "Trợ lý" nổi góc phải mọi trang khách, panel góc phải (desktop) hoặc toàn màn hình (điện thoại),
  3 câu gợi ý, trạng thái đang trả lời/lỗi/không khả dụng (kèm liên kết tìm tour thường).
- Chưa làm: bộ đánh giá 30 câu so sánh nhà cung cấp, lưu số liệu sử dụng.

**Phạm vi bản đầu:** nút chat nổi và mục “Trợ lý AI ✨”; model chỉ được chọn tool tìm kiếm tour/lịch khởi hành, đọc nội dung FAQ/chính sách/cẩm nang đã duyệt. Kết quả tour và giá do API nội bộ trả về; thẻ tour có CTA đặt tour. Ngoài phạm vi tri thức thì nói chưa có thông tin và đưa hotline. Không đặt tour, thanh toán, hay khẳng định còn chỗ ngoài dữ liệu API.

| Hạng mục | Đề xuất |
|---|---|
| Màn hình | Chat responsive, trạng thái đang trả lời/lỗi/rỗng; thẻ tour lấy từ DTO API. Không hiển thị nội dung do model tự bịa thành giá hoặc tồn chỗ. |
| API | `POST /api/assistant/chat` qua backend. Service điều phối một interface `IAiProvider`, tool allowlist chỉ gọi dịch vụ tìm tour và tra cứu nội dung. Tool thực thi ở backend, kiểm tra đầu vào và giới hạn số vòng gọi. |
| Migration | Không cần cho demo nếu chat không lưu lịch sử. Có thể log usage đã loại thông tin cá nhân ở log ứng dụng; không lưu prompt/raw transcript mặc định. |
| Kiểm tra | Unit test dispatch tool, từ chối tool/đầu vào sai, không có kết quả, lỗi hoặc timeout nhà cung cấp, nội dung ngoài nguồn, rate limit theo người dùng/IP; integration test kiểm chứng chat không vượt quyền và giá lấy từ API. |
| Rủi ro | Hallucination, prompt injection trong dữ liệu, rò rỉ thông tin qua prompt, giới hạn miễn phí thay đổi, nhà cung cấp giữ dữ liệu theo điều khoản riêng. Chỉ gửi dữ liệu công khai/đã duyệt; không gửi PII hay thông tin đặt chỗ. Có timeout, giới hạn token, rate limit, fallback FAQ/tìm kiếm thường và thông báo AI tạm không khả dụng. |
| Ước lượng | 5–8 ngày công cho bản chat + tool tìm tour + tri thức tĩnh + giới hạn; 2–3 ngày công thêm cho hardening và bộ đánh giá câu trả lời. |

### Nhà cung cấp và chi phí demo

Giá/điều kiện dưới đây được tra cứu ngày **24/11/2026**; giá token tính USD, chưa VAT, quy đổi, phí thanh toán hay thay đổi bảng giá. Mức miễn phí/giới hạn thực tế tùy tài khoản và model khả dụng.

| Nhà cung cấp | Điểm phù hợp | Ước tính 1.000 lượt chat* |
|---|---|---:|
| Google Gemini API | Có free tier giới hạn cho một số model; nhanh để demo, nhưng xem kỹ điều khoản sử dụng dữ liệu của Free tier. | $0 nếu nằm trong quota miễn phí; nếu dùng model tính phí cần tính theo model đã chốt. |
| Groq API | Free tier với giới hạn RPM/RPD/TPM theo model/tài khoản; API tương thích kiểu OpenAI, tiện thay adapter. Phải kiểm tra model hỗ trợ tool calling và tiếng Việt trước khi chọn. | $0 trong giới hạn miễn phí; không coi là SLA hay quota cố định. |
| Anthropic Claude API | Tool use phù hợp luồng gọi API; API tính theo token và không có gói API miễn phí được đảm bảo. | Theo mức Sonnet hiện công bố khoảng $2/MTok input, $10/MTok output: với giả định 4.000 input + 700 output token/lượt, khoảng **$15.30/1.000 lượt**. |

\* Ước lượng dùng 4 triệu input và 0,7 triệu output token tổng cộng; prompt hệ thống/tri thức/tool result tính vào input. Gọi nhiều bước làm chi phí tăng. Không bao gồm phí công cụ tìm kiếm/grounding. Giá Claude API công bố có thể khác theo model/đợt; đối chiếu lại trang giá ngay trước khi đăng ký.

**Đề xuất:** chạy thử Gemini và Groq trên một bộ 30 câu tiếng Việt có câu hỏi tìm tour, ngày/điểm đi/ngân sách, chính sách và câu ngoài phạm vi; so sánh độ chính xác tool call, độ trễ, giới hạn tài khoản và điều khoản dữ liệu. Chọn một nhà cung cấp cho demo; giữ `IAiProvider` để thay nhà cung cấp. Chưa chọn Claude mặc định vì chi phí không miễn phí và mục tiêu trước mắt là demo.

## 2. Kỳ nghỉ thông minh

**Trạng thái: đã làm bản đầu (frontend, không API, không migration).**

- `frontend/src/lib/holiday-breaks.ts`: đợt nghỉ = chuỗi ngày liên tục gồm ngày lễ `official` của `vn-holidays.ts` và thứ Bảy, Chủ nhật liền kề; liệt kê từ hôm nay (giờ Việt Nam) tới hết 12 tháng. Nếu chỉ cách cuối tuần một ngày làm việc thì gợi ý xin nghỉ thêm ngày đó. Tết và 2/9 kèm ghi chú lịch nghỉ do Thủ tướng công bố hằng năm.
- Tour phù hợp: lịch khởi hành mở bán (`upcomingDepartureDates`) mà cả chuyến, tính ngày về = ngày đi + `durationDays` − 1, nằm trọn trong đợt nghỉ; tour cần ngày nghỉ thêm xếp sau và có nhãn riêng.
- Lọc điểm khởi hành dùng `filterByDeparture` như các danh sách tour khác, tức là lọc theo thành phố khởi hành của tour, không theo từng lịch.
- Màn hình: trang `/ky-nghi`, mục "Đợt nghỉ lễ sắp tới" trên trang chủ, liên kết ở chân trang. Ngày được tính trên trình duyệt vì trang được prerender tĩnh.
- Chưa làm: cảnh báo phụ thu lễ (chưa có dữ liệu phụ thu), `GET /api/holidays`.

**Phạm vi:** trang `/ky-nghi` và một mục trang chủ; tạo khoảng nghỉ 12 tháng tới từ ngày lễ chính thức trong `vn-holidays.ts` cộng cuối tuần liền kề. Cho lọc điểm khởi hành; gợi ý tour có thời lượng vừa số ngày nghỉ. Cảnh báo phụ thu lễ chỉ hiển thị khi giá lịch khởi hành có dữ liệu phụ thu đã xác nhận.

| Hạng mục | Đề xuất |
|---|---|
| Màn hình | Trang danh sách đợt nghỉ, số ngày nghỉ, tour phù hợp và bộ lọc điểm khởi hành; trạng thái không có tour. Ghi chú khi ngày nghỉ chưa được công bố chính thức. |
| API | Có thể bắt đầu bằng tính toán thuần ở frontend từ thư viện lịch và dữ liệu tour hiện có. Nếu cần dùng chung/SEO, thêm `GET /api/holidays?from=&to=&departureRegion=` và DTO đợt nghỉ/tour phù hợp. |
| Migration | Không cần. Không lưu ngày nghỉ dự báo vào DB. |
| Kiểm tra | Ngày qua năm nhuận, chuỗi cuối tuần/ngày lễ sát nhau, biên 12 tháng, ngày lễ truyền thống không bị gắn nhãn ngày nghỉ chính thức, lọc đúng điểm khởi hành và thời lượng tour. |
| Rủi ro | Không có lịch nghỉ cụ thể Tết/ngày bù từng năm; không được gọi dự báo là lịch nghỉ chính thức. Chưa có trường phụ thu lễ có thể kiểm chứng, vì vậy cảnh báo phụ thu phải để ngoài bản đầu hoặc dựa trên dữ liệu giá thực. |
| Ước lượng | 2–4 ngày công cho tính toán + UI; 1–2 ngày nếu cần API và kiểm tra thêm. |

## 3. Vé điện tử QR và check-in

**Trạng thái: đã code bản đầu; migration 017 chờ duyệt và chưa chạy trên database nào.**

Đã chốt: QR = `SH1.<mã vé>.<version>.<HMAC-SHA256>` ký bằng `Ticket:SigningKey` (user-secrets), không chứa thông tin
cá nhân; thư viện `qrcode` (vẽ QR) và `jsqr` (quét camera, chạy cả iPhone Safari); mọi nhân viên trong phạm vi chi
nhánh điều hành được check-in, chỉ quản lý/admin được hoàn tác; email vé để sau.

- Migration `017_tour_tickets_and_check_in.sql`: `tour_tickets` (một vé mỗi mục đơn tour, tạo khi khách mở vé lần
  đầu) và `passenger_check_ins` (khóa chính `passenger_id`, quét lặp hoặc đồng thời trả 409).
- Khách: `/bookings/[id]/ve` (xem, in vé); nút "Xem vé điện tử" ở chi tiết đơn tour đã thanh toán.
- Nhân viên: `/admin/departures/[id]/check-in` (mở từ "Danh sách đoàn"): quét QR bằng camera, hoặc tìm theo mã đơn
  hay tên khách rồi chọn từng người. Check-in mở từ 1 ngày trước ngày đi tới ngày về. Audit ghi mã đơn và số khách,
  không ghi tên hay mã vé.
- Chưa làm: email vé, cấp lại vé (tăng `version`) từ admin, vé cho vé deal.

**Phạm vi:** sau khi đơn tour chuyển `confirmed`, mỗi booking có vé xem/in được; email xác nhận có liên kết vé. Admin/nhân viên mở check-in theo chuyến, quét camera hoặc nhập mã dự phòng, đánh dấu từng hành khách. Bản đầu chỉ áp dụng tour confirmed; quyết định riêng trước khi hỗ trợ vé deal.

| Hạng mục | Đề xuất |
|---|---|
| Màn hình | Trang vé khách hàng, bản in gọn; trang check-in theo departure với tìm kiếm/scan, danh sách đã lên xe và trạng thái scan. Yêu cầu quyền camera, luôn có nhập mã thủ công. |
| API | Endpoint khách lấy vé của chính mình; endpoint nhân viên lấy manifest/check-in theo departure và ghi check-in. Backend xác minh chữ ký, trạng thái booking, hành khách thuộc booking/chuyến, phạm vi chi nhánh và trạng thái chưa check-in. Trả 409 nếu quét lại. |
| Migration | Cần migration đánh số mới: mã vé ngẫu nhiên/định danh opaque, hash hoặc token có chữ ký và version; bảng check-in cho từng hành khách với actor/time, unique cho hành khách/booking item. Không chứa PII trong QR. Chốt schema trước khi viết migration. |
| Kiểm tra | Chữ ký sai/hết hạn/đã thu hồi, vé không confirmed, sai chuyến, ngoài phạm vi, hai request đồng thời, quét lặp, user/customer không xem được người khác, audit cùng transaction và email không làm lộ token ngoài URL cần thiết. |
| Rủi ro | Ảnh QR có thể bị chia sẻ; token dài hạn bị lộ; quét trùng do mạng chập chờn. Token nên ngẫu nhiên, không suy đoán, có thể thu hồi; check-in atomic và idempotency rõ ràng; audit không chứa token/PII nhạy cảm. |
| Ước lượng | 5–8 ngày công cho migration, API, UI scan/in và email; thêm 1–2 ngày cho kiểm tra thiết bị camera và luồng đồng thời. |

## 4. Săn deal và cảnh báo giá

**Phạm vi đầu:** tái sử dụng migration 009 cho cảnh báo vé; người dùng đăng ký tuyến, khoảng ngày và ngưỡng giá; job so sánh giá offer hợp lệ, tối đa một email mỗi cảnh báo trong 24 giờ, kèm link hủy. Trang “Tour giờ chót” dùng tour có lịch mở bán và ngày khởi hành gần, đếm ngược theo UTC/server; không gọi là deal giảm giá nếu không có lịch sử giá chứng minh.

| Hạng mục | Đề xuất |
|---|---|
| Màn hình | Nút “Báo tôi khi giá giảm”, form quản lý/hủy cảnh báo; mục tour giờ chót hiển thị thời hạn đặt và tồn chỗ thật. Giá vé ghi “giá hợp đồng, chờ xác nhận chỗ”, không hứa còn ghế. |
| API | CRUD cảnh báo của chính người dùng; endpoint hủy bằng capability token; job nền quét offer. Dùng unique notification và transaction/lock để chống hai job gửi trùng. |
| Migration | Cảnh báo vé dùng bảng migration 009 hiện có. Cảnh báo tour cần quyết định riêng: định nghĩa giá so sánh, nguồn giá chuẩn và retention lịch sử trước khi thêm bảng/migration. |
| Kiểm tra | Quyền sở hữu, token hủy một lần/đúng cảnh báo, khoảng ngày và giá hợp lệ, không gửi lại trong 24 giờ, hai sweep đồng thời, email lỗi/retry, alert hết hạn, giá tăng/giảm và timezone. |
| Rủi ro | Chưa thấy code dùng schema 009; giá offer có thể cũ hoặc không đại diện giá thực bán. Không dùng từ “giảm” nếu chỉ có một báo giá; thông báo là giá tham khảo đối tác và chờ xác nhận. Gửi email thất bại cần retry có giới hạn, tránh gửi lặp. |
| Ước lượng | 4–6 ngày công cho cảnh báo vé + job/email + màn quản lý; 2–4 ngày thêm nếu cảnh báo tour sau khi chốt dữ liệu lịch sử giá. |

## Cập nhật các mục “Có thì tốt” trong ROADMAP

Chuyển các hạng mục dưới đây ra khỏi đường găng, chỉ làm sau phần cốt lõi tour và các tính năng được duyệt:

- Phần B bản đồ.
- Vé khứ hồi.
- AI tóm tắt đánh giá.
- So sánh tour.
- Lịch tháng `/lich` (mục hoãn hiện có).
- Theo dõi giá vé (mục hoãn hiện có; bản đầu cảnh báo dùng migration 009).
- Gợi ý tour/khách sạn/vé không dùng AI (mục 9.3; có thể thay bằng tour nổi bật tĩnh).

Không cắt luồng tour cốt lõi, giữ chỗ, hạn thanh toán và email giao dịch. Nếu trễ, cắt lần lượt: AI tóm tắt/so sánh, bản đồ và vé khứ hồi, cảnh báo giá; giữ check-in và kỳ nghỉ ở bản nhỏ nếu kịp.

## Ý tưởng tham khảo cho bài đồ án

Các ý dưới đây được ghi nhận từ tài liệu tham khảo để cân nhắc cho bài làm; đây không phải cam kết sẽ triển khai. Ưu tiên tính năng bám sát dữ liệu thật và nghiệp vụ hiện có của TravelHub.

### Có thể đưa vào định hướng hoặc bản mở rộng gần

- **Tìm kiếm thông minh và bộ lọc chi tiết:** đang phù hợp nhất với sản phẩm. Tìm kiếm tour đã có lọc điểm đến, ngày, thời lượng, giá và điểm khởi hành; có thể cân nhắc thêm loại trải nghiệm hoặc nhóm tuổi khi dữ liệu tour hỗ trợ. Không thêm bộ lọc không có thuộc tính nguồn đáng tin cậy.
- **Gợi ý cá nhân hóa:** có thể là hướng phát triển sau này. Bản đầu nên dựa trên lựa chọn khách chủ động cung cấp (điểm đến, ngân sách, ngày, sở thích), không thu thập/lưu lịch sử hành vi trước khi có thiết kế về đồng ý, mục đích sử dụng và thời hạn lưu dữ liệu.
- **Đặt tour thuận tiện trên điện thoại:** phù hợp với nghiệp vụ cốt lõi; tiếp tục ưu tiên giữ chỗ đúng hạn, hiển thị giá và trạng thái rõ ràng, thanh toán mô phỏng/VNPAY theo roadmap. Không diễn đạt là thanh toán đa kênh khi các cổng chưa tích hợp.
- **Đánh giá xác thực:** chỉ nên làm sau khi có bảng đánh giá gắn với đơn đã hoàn tất, quy tắc chống đánh giá giả, kiểm duyệt và API. Chưa có nền dữ liệu review thì không tạo bình luận mẫu như dữ liệu thật; AI tóm tắt cũng phải chờ nguồn đánh giá đủ tin cậy.
- **Hỗ trợ đa ngôn ngữ:** hướng mở rộng có ích nhưng không ưu tiên trước khi hoàn thiện tiếng Việt. Cần dịch nhất quán giao diện, nội dung tour, email, lỗi API và định dạng tiền/ngày; không tự dịch nội dung pháp lý/chính sách mà chưa rà soát.

### Để ngoài phạm vi hiện tại hoặc cần quyết định nghiệp vụ riêng

- **Voucher, khuyến mãi theo mùa, gói combo:** cần quy tắc giá, điều kiện áp dụng, giới hạn sử dụng và xử lý hoàn/hủy; combo còn phải tôn trọng việc khách sạn/vé thường là báo giá chờ đối tác xác nhận. Giữ ngoài đường găng, thiết kế và duyệt schema trước.
- **Tìm tour từ ảnh hoặc “vibe”:** cần nguồn ảnh có quyền sử dụng, gắn nhãn tour và mô hình/chi phí xử lý ảnh; chưa có dữ liệu đó thì không hứa tìm kiếm chính xác từ ảnh.
- **Tour bí mật/Blind Box:** không phù hợp mặc định với yêu cầu minh bạch điểm đến, lịch trình và giá. Chỉ xem xét nếu sản phẩm có tự nguyện tham gia, công bố rõ điều kiện/giá và cơ chế hoàn tiền được duyệt.
- **Xem trước AR/VR 360 độ:** phụ thuộc nội dung 360 có bản quyền, dung lượng và khả năng vận hành trên điện thoại; chưa có nguồn tài sản nên để ngoài phạm vi.
- **Lập lịch trình nhóm và chia tiền (split-bill):** là một luồng đặt/chia thanh toán mới, cần chủ nhóm, thành viên, hạn thanh toán, người không trả và xử lý hủy/hoàn. Không gộp vào đặt tour hiện tại nếu chưa có thiết kế nghiệp vụ.
- **Khóa giá tour 72 giờ:** không triển khai với giả định một khoản phí nhỏ giữ được giá nếu chưa có hợp đồng/đối tác đảm bảo mức giá và thời hạn. Tour hiện có giá theo lịch khởi hành và cơ chế giữ chỗ có thời hạn; vé/khách sạn là báo giá chờ xác nhận.

### Thứ tự cân nhắc cho bài làm

1. Hoàn thiện tìm kiếm/lọc tour, luồng đặt và thanh toán an toàn trên điện thoại.
2. Làm kỳ nghỉ thông minh và check-in QR theo kế hoạch nếu còn thời gian.
3. Chỉ thêm đánh giá xác thực khi đã có nghiệp vụ và dữ liệu đánh giá thật.
4. Để cá nhân hóa AI, đa ngôn ngữ và các ý tưởng cần đối tác/tài sản mới ở phần hướng phát triển, không đưa thành tính năng đã hoàn thành.

## Tài liệu giá tham khảo

- [Google Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Groq rate limits](https://console.groq.com/docs/rate-limits) và [billing FAQ](https://console.groq.com/docs/billing-faqs)
- [Anthropic Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing)

