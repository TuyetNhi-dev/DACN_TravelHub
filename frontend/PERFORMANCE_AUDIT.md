# SàiHành — Kiểm tra tốc độ chuyển trang

Ngày: 19/10/2026. Đo trên máy local, Next.js 16.2.12, backend .NET 10 kết nối Aiven qua VerifyFull.

## Kết luận có bằng chứng

Điểm chậm lớn nhất quan sát được nằm ở tiến trình development/Turbopack, không phải thời gian trả HTML production. Development từng trả trang sau 5–10 giây, có request flights vượt 15 giây. Log ghi một lần “Compiled in 243.7s”; trace có compile-path flights khoảng 12,92 giây. Không coi 243,7 giây là thời gian của mọi request.

Sau các lần biên dịch, log dev còn xuất hiện lỗi không đọc được next/document.js và JSON. Đã xác minh PID cổng 3000 và command line thuộc đúng frontend của dự án, dừng đúng hai tiến trình dev cha/con rồi chạy lại npm.cmd run dev. Next tự thông báo filesystem cache đã bị xóa vì từng phát hiện lỗi nội bộ Turbopack. Không tự xóa source, node_modules, database hoặc cấu hình. Chưa xác định được nguyên nhân sâu bên trong khiến Turbopack gặp lỗi; không thay bundler, nâng thư viện hoặc cấu hình hệ điều hành theo suy đoán.

Sau restart, các trang đã biên dịch trả HTTP trong khoảng 89–153 ms. Production đã nhanh trước sửa, nên không tuyên bố tối ưu code đã giúp HTML production nhanh hơn đáng kể.

## Phương pháp đo và giới hạn

- Development: tiến trình hiện có localhost:3000; sau đó restart chính tiến trình này và giữ log mới.
- Production: npm.cmd run build và npm.cmd run start -- --port 3001, đo riêng cùng source/config.
- curl đo time_starttransfer (TTFB) và time_total cho sáu route; thực hiện nhiều lượt, tách lượt đầu và lượt ấm.
- Đọc trace/log Next dev để phân biệt công việc Next/biên dịch với application-code. Nhãn render-path trong trace có thể gồm chờ framework, không phải React render thuần.
- Đo HTTP API độc lập và gửi RSC: 1 cho các route production để xác minh endpoint phục vụ điều hướng.
- Công cụ Browser tiếp tục lỗi khởi tạo do sandboxPolicy, nên không đo được click-to-paint, hydration, React Profiler, số request thực tế từ một phiên browser hoặc LCP/INP. Không gọi các số HTTP bên dưới là thời gian chuyển trang hoàn chỉnh.
- Các phép đo local chịu ảnh hưởng warm-up, biên dịch và tải máy; không suy ra SLA hoặc phần trăm cải thiện chung.

## Kết quả trước/sau

Đơn vị: ms, HTTP total. Cột trước là lượt đo dev trước tối ưu/restart; cột sau là lượt thứ hai sau restart đã biên dịch.

| Route | Dev trước | Dev sau restart, lượt ấm |
|---|---:|---:|
| / | 10037 | 153 |
| /tours | 7182 | 89 |
| /hotels | 6294 | 91 |
| /flights | Timeout >15000 | 95 |
| /login | 9999 | 97 |
| /register | 9520 | 97 |

Lượt mở đầu sau restart: home 112 ms (home đã được mở trong lúc startup), tours 323 ms, hotels 395 ms, flights 633 ms, login 342 ms, register 319 ms. Log startup có request home đầu tiên 2,9 giây gồm 2,5 giây Next và 336 ms application-code.

Log Next sau restart tách rõ:

| Route | Lượt đầu: Next / application-code | Lượt ấm: Next / application-code |
|---|---|---|
| tours | 250 / 73 ms | 2 / 77 ms |
| hotels | 307 / 87 ms | khoảng 2 / 88 ms |
| flights | 534 / 96 ms | 6 / 86 ms |
| login | 225 / 94 ms | khoảng 2 / 94 ms |
| register | 209 / 92 ms | khoảng 2 / 94 ms |

Đây là nhãn thời gian của Next, chưa phải phân rã CPU render phía browser.

Production trước sửa: lượt ấm khoảng 3–21 ms cho sáu trang. Sau sửa: lượt ấm khoảng 4–22 ms. Lượt đầu sau khởi động production mới: 19–294 ms. Chênh lệch lượt ấm không chứng minh cải thiện HTML production; thay đổi chính là sửa dev lỗi, tránh reload khi tìm kiếm và giảm công việc xác thực bị lặp.

RSC production sau sửa: home 5,6 ms, tours 8,2 ms, hotels 7,0 ms, flights 11,5 ms, login 6,6 ms, register 3,0 ms; đều HTTP 200. Đây là request RSC riêng lẻ, không giả lập đầy đủ trạng thái router/prefetch của browser.

## API, Empty State và xác thực

- Trước sửa, danh mục đã có deadline 12 giây và AbortController khi unmount; không thấy vòng retry tự động hoặc vòng useEffect vô hạn. Không thêm cache dữ liệu giá/tồn hoặc thay đổi truy vấn dịch vụ.
- API Aiven trước đo khoảng 406–418 ms sau làm nóng; một request đầu tours 1536 ms. Sau sửa, tours/hotels/flights khoảng 467/441/473 ms, đều 200 và data [], count 0. Không có thay đổi hiệu năng SQL danh mục đáng kể được tuyên bố.
- Thành phần danh mục chuyển từ loading sang Empty State khi nhận []; không có nhánh chờ cho đến khi xuất hiện bản ghi. Flight trang tìm kiếm chưa cần gọi danh mục cho đến bước kết quả. Các API gọi từ client sau hydration, không nằm trong số HTTP HTML.
- AuthProvider không chặn children/route công khai; /me anonymous production khoảng 1–32 ms. Tuy nhiên AuthActions chờ kiểm tra phiên, nên một request treo có thể giữ khu vực đăng nhập ở trạng thái loading. Trước sửa authRequest không có deadline; nay toàn bộ request, kể cả CSRF và đọc body, có deadline 12 giây.
- Source xác nhận initial/focus/poll có thể gọi refresh chồng nhau, không có cơ chế gộp. Đã gộp các request đang chạy; kiểm thử hành vi xác nhận hai refresh đồng thời chỉ gọi một /me. Refresh sau login buộc lấy phiên mới; phản hồi cũ không ghi đè sau logout hoặc login.
- Source backend trước sửa gọi FindByIdAsync trong OnValidatePrincipal rồi lại gọi trong /me; mỗi FindByIdAsync có hai SELECT. Nay /me dùng Account đã được xác minh trong HttpContext.Items: từ bốn xuống hai SELECT cho một /me đã đăng nhập. Đây là phân tích đường chạy code, không phải số đo SQL profiler. Không cache account qua nhiều request; active status, password stamp và assignment vẫn được đọc lại ở mỗi request.
- Loại bỏ refresh /me tức thì dư sau logout vì đã thu hồi ticket và cập nhật state; không bỏ xác thực backend hoặc bảo vệ trang.

## Điều hướng, hình ảnh và JavaScript

- Các mục Header, Logo, nút auth đã dùng Next Link, không có window.location hoặc vòng redirect ở những mục này; giữ nguyên.
- HeaderSearch dùng form GET thông thường, gây document navigation khi submit. Đã đổi sang next/form, giữ giao diện, action và tham số q.
- Chỉ hotels có loading boundary riêng trước sửa; bổ sung app/loading.tsx để các route động còn lại có loading/prefetch boundary, dùng style hiện có. Theo [Next.js navigation](https://nextjs.org/docs/app/getting-started/linking-and-navigating), loading boundary giúp hiển thị phản hồi và partial prefetch cho dynamic routes. Chưa đo trực tiếp thời gian paint của fallback.
- Log browser của Next cảnh báo CSS html scroll-behavior: smooth thiếu data-scroll-behavior. Bổ sung thuộc tính đúng trên html để Next xử lý cuộn khi chuyển route; giữ hành vi cuộn mượt của anchor.
- Logo đã dùng next/image. Đo source PNG 582637 byte, response tối ưu width 384 trả 11380 byte, HTTP 200; không thay asset. Ảnh dưới fold hiện đã lazy, font dùng next/font. Không có bằng chứng profiler cho thấy JS/image là nguyên nhân gây độ trễ nhiều giây của server dev, nên không thiết kế lại ảnh, tách component tùy tiện hoặc thêm thư viện.

## File sửa

1. src/components/layout/HeaderSearch.tsx — next/form tránh full document navigation.
2. src/app/layout.tsx — thuộc tính smooth scroll được Next yêu cầu.
3. src/app/loading.tsx — loading boundary dùng giao diện trạng thái hiện có.
4. src/lib/auth.ts — deadline chung, không nuốt timeout đọc body.
5. src/components/auth/AuthProvider.tsx — gộp request, chặn phản hồi cũ, bỏ request thừa sau logout.
6. src/components/auth/AuthForm.tsx — refresh bắt buộc sau đăng nhập.
7. ../backend/Program.cs và Auth/AuthEndpoints.cs — tái sử dụng account đã xác thực trong cùng request.
8. tests/auth-performance.test.cjs — sáu kiểm thử deadline, gộp request và race login/logout.
9. ../backend/tests/Auth.Integration.ps1 — chấp nhận redirect dạng streaming của loading boundary, vẫn kiểm tra đích /login.
10. PERFORMANCE_AUDIT.md — báo cáo này.

Không đổi giao diện, schema, User Secrets, cấu hình Aiven, timeout danh mục hoặc chính sách bảo mật. Không thêm cache phiên qua request hay lưu token vào storage.

## Xác minh cuối

- npm.cmd run lint toàn frontend: đạt.
- npm.cmd run build: đạt; dotnet build --no-restore: đạt, 0 warning/error.
- node --test tests/*.test.cjs: 35/35 đạt, gồm 6 test mới.
- Kiểm thử HTTP sáu route ở dev/production và RSC production: đạt sau restart. Không còn lỗi module/JSON trong các request được đo sau restart.
- Script tích hợp auth: đăng ký, email trùng, sai mật khẩu, login, me, CUSTOMER/self, HttpOnly, account, logout, phát lại cookie cũ và chuyển /login: đạt. Loading boundary có thể gửi HTTP 200 trước khi stream meta redirect; đã kiểm tra instruction chuyển /login, không coi HTTP 200 một mình là được vào account.
- Script kiểm thử đăng ký tạo Customer riêng trên schema hiện hữu, giữ lại để đối chiếu; không seed dịch vụ hoặc tài khoản quản trị. Trong đợt này chạy lại hai lần, lần đầu dừng vì assertion chỉ hỗ trợ redirect HTTP truyền thống; lần cuối đã đạt toàn bộ.
- Đã để frontend dev chạy lại trên localhost:3000 và backend trên localhost:5108. Production đo trên 3001 chỉ là phiên kiểm tra.

Nếu development chậm lại kèm lỗi Turbopack tương tự, kiểm tra log và restart đúng tiến trình; không đánh giá production dựa vào lần compile đầu. Khi muốn đo tốc độ sử dụng thực tế, chạy bản build production và dùng browser performance profiler; vẫn cần bổ sung phép đo click-to-paint khi công cụ Browser hoạt động.
