# Quy tắc riêng cho frontend
- Next.js App Router. Mặc định là Server Component, chỉ thêm "use client" khi thật sự cần (state, sự kiện, API trình duyệt).
- TypeScript chặt: không dùng any. Kiểu dữ liệu API đặt trong src/types, khớp DTO của backend.
- Gọi API chỉ qua src/services và một API client dùng chung. Kiểm tra dữ liệu nhận về trước khi dùng.
- Đặt tên: component PascalCase, hook bắt đầu bằng use, file service và tiện ích camelCase hoặc kebab-case theo file hiện có.
- Dùng token màu và biến CSS đã có trong dự án, không tự thêm màu hoặc font mới.
- Form dùng một thư viện kiểm tra dữ liệu thống nhất, thông báo lỗi bằng tiếng Việt.
- Logic thuần (lọc, tính tiền, định dạng) tách ra khỏi component và có test trong tests/.
- Không lọc hoặc phân trang dữ liệu lớn ở phía client khi API có thể làm.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
