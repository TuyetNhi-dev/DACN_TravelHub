# AGENTS.md: TravelHub / SàiHành

## Dự án
- Web đặt tour, khách sạn, vé máy bay (đồ án chuyên ngành, nhóm 3 người). Mô hình: đại lý lữ hành trực tuyến kiểu Saigontourist.
- frontend/: Next.js + TypeScript + Tailwind. backend/: ASP.NET Core minimal API + MySqlConnector, SQL viết tay trong repository. database/: tài liệu, schema, migration, seed. docs/: tài liệu.
- Nghiệp vụ cốt lõi: tour có tồn chỗ thật (tour_departures.capacity và reserved_seats). Khách sạn và chuyến bay là BÁO GIÁ của đối tác (hotel_offers, flight_offers), không phải tồn kho. Đơn của chúng ở trạng thái chờ xác nhận (awaiting_supplier), tuyệt đối không hứa còn phòng hay còn ghế.

## Cách làm việc
1. Đọc code liên quan trước khi sửa. Sửa nhỏ, đúng phạm vi được yêu cầu. Không refactor hay đổi file không liên quan.
2. Không bịa. Không tạo dữ liệu giả rồi nói là dữ liệu thật. Không nói "đã chạy" hay "đã kiểm thử" nếu chưa chạy. Nói rõ cái gì đã chạy, cái gì chưa, vì sao.
3. Hỏi lại khi yêu cầu mơ hồ hoặc ảnh hưởng schema, hợp đồng API, bảo mật.
4. Cuối mỗi tác vụ báo: các file đã đổi, lệnh đã chạy và kết quả, rủi ro còn lại.

## Clean code (bắt buộc)
- Tên rõ nghĩa. Mã nguồn bằng tiếng Anh, chuỗi hiển thị cho người dùng bằng tiếng Việt.
- Hàm tối đa khoảng 40 dòng, mỗi hàm một việc. Component dưới khoảng 200 dòng, vượt thì tách. Dòng không quá 120 ký tự, không để JSX dài trên một dòng.
- Không lặp code. Không magic string hay magic number: dùng enum hoặc hằng số (trạng thái, hạng vé, vai trò).
- Tách tầng. Backend: endpoint (mỏng, chỉ nhận và trả) → service (nghiệp vụ) → repository (SQL). Frontend: component → hook → service → API client. Không gọi fetch hoặc axios trực tiếp trong component.
- Không trả thẳng bảng database ra API. Dùng DTO riêng, tên trường API bằng tiếng Anh camelCase. Không thêm trường tiếng Việt mới.
- Xử lý lỗi rõ ràng, không nuốt lỗi (không catch rỗng). Một định dạng JSON lỗi chung, dùng đúng mã HTTP (400, 401, 403, 404, 409).
- Comment giải thích "vì sao", không nhắc lại code làm gì. Xóa code chết, không để console.log hay TODO vô chủ.
- Ưu tiên đơn giản. Không thêm thư viện hoặc lớp trừu tượng khi chưa cần.

## Dữ liệu và bảo mật (không thương lượng)
- Không bao giờ commit bí mật: .env, mật khẩu, chuỗi kết nối, khóa API, file chứng chỉ CA. Dùng biến môi trường hoặc user-secrets, và cập nhật .env.example khi thêm biến.
- SQL luôn tham số hóa, không nối chuỗi từ dữ liệu người dùng.
- Kiểm tra dữ liệu ở server. Không tin tổng tiền, giá hay vai trò do frontend gửi lên.
- Tiền dùng DECIMAL ở database, định dạng ở giao diện. Thời gian lưu UTC.
- Mật khẩu băm bằng BCrypt. Không log bí mật hoặc thông tin cá nhân.
- KHÔNG chạy lệnh thay đổi database thật (CREATE, ALTER, DROP, INSERT, UPDATE, DELETE) và không deploy khi chưa được yêu cầu rõ. Thay đổi schema phải là file migration đánh số trong database/migrations/ và chờ người dùng duyệt.
- Không xóa file hay dữ liệu nếu chưa được yêu cầu.

## Kiểm tra trước khi báo xong
- Frontend (trong frontend/): npm run lint; npx tsc --noEmit; node --test tests/*.test.cjs. Chạy npm run build khi đổi cấu hình hoặc route.
- Backend (trong backend/): dotnet build; dotnet test nếu có.
- Lỗi lint, kiểu hoặc test do thay đổi của mình gây ra phải sửa trước khi báo xong.

## Git
- Mỗi việc một nhánh, commit nhỏ theo dạng feat:, fix:, docs:, refactor:, test:, chore:. Không push thẳng vào main, không force push, không tự commit nếu không được yêu cầu.
- Tài liệu mới đặt trong docs/, không để file .md rải ở thư mục gốc.

## Giao diện
- Responsive, có trạng thái đang tải, rỗng và lỗi. Hỗ trợ truy cập (nhãn, độ tương phản, bàn phím). Tiền VND, ngày giờ theo giờ Việt Nam.
- Khách sạn và chuyến bay hiển thị "giá tham khảo, chờ xác nhận".
