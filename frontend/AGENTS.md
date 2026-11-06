# Quy tắc riêng cho frontend
- Next.js App Router. Mặc định là Server Component, chỉ thêm "use client" khi thật sự cần (state, sự kiện, API trình duyệt).
- TypeScript chặt: không dùng any. Kiểu dữ liệu API đặt trong src/types, khớp DTO của backend.
- Gọi API chỉ qua src/services và một API client dùng chung. Kiểm tra dữ liệu nhận về trước khi dùng.
- Đặt tên: component PascalCase, hook bắt đầu bằng use, file service và tiện ích camelCase hoặc kebab-case theo file hiện có.
- Dùng token màu và biến CSS đã có trong dự án, không tự thêm màu hoặc font mới.
- Form dùng một thư viện kiểm tra dữ liệu thống nhất, thông báo lỗi bằng tiếng Việt.
- Logic thuần (lọc, tính tiền, định dạng) tách ra khỏi component và có test trong tests/.
- Không lọc hoặc phân trang dữ liệu lớn ở phía client khi API có thể làm.
