# Giao diện sáng/tối TravelHub

- Nút mặt trăng/mặt trời nằm bên phải Header, cạnh khu vực đăng nhập.
- Mặc định sáng; không tự đổi theo hệ điều hành.
- Lựa chọn lưu tại localStorage key travelhub-theme; chuyển route vẫn giữ theme.
- Script tĩnh trong head áp dụng lựa chọn trước khi render body.
  suppressHydrationWarning chỉ đặt trên html vì data-theme được cập nhật trước hydration.
- ThemeToggle dùng useSyncExternalStore với server snapshot ổn định.
- Nếu storage bị chặn, nút vẫn đổi theme cho phiên hiện tại; không thể lưu khi refresh.
- color-scheme đồng bộ điều khiển native như date/select ở chế độ tối.
- Chuyển màu 180ms; tôn trọng prefers-reduced-motion.

## Thêm component sau này

Dùng biến trong src/styles/tokens.css:

- --canvas: nền trang; --panel: nền card/form; --surface: nền phụ.
- --ink, --muted, --text-secondary: chữ; --line: viền.
- --brand: nền nút xanh thương hiệu; --on-brand: chữ trên nút.
- --blue: màu nhấn cho chữ/icon, được tăng độ sáng trong dark mode.
- Tailwind có background, foreground, card, primary, border từ cùng token.

Không thêm nền trắng/chữ đen cố định vào component mới.
Ảnh gốc giữ nguyên, không dùng filter đảo màu.

## Kiểm thử

Chạy npm.cmd run dev trong frontend và mở http://localhost:3000.

1. Xóa key travelhub-theme trong DevTools nếu muốn kiểm tra lần đầu: trang sáng.
2. Nhấn nút mặt trăng: nền tối, chữ sáng; nhấn mặt trời để về sáng.
3. Chọn tối rồi refresh; kiểm tra vẫn tối từ khi tải trang.
4. Chuyển giữa /, /tours và /tours/TOUR001, kiểm tra theme không đổi.
5. Kiểm tra Header, menu mobile, Footer, ba tab tìm kiếm, input/date/select,
   card tour/hotel/flight, bộ lọc, bảng lịch và nút ở cả hai theme.
6. Thử 1440px, 1024px, 768px, 390px và 320px; nút theme không bị ẩn.
7. Dùng Tab và Enter/Space; tooltip/aria-label mô tả chế độ sẽ chuyển tới.
8. Kiểm tra console không có hydration warning; bật reduced motion để tắt chuyển màu.

Đã qua: TypeScript, lint, production build; kiểm thử logic chuyển hai chiều,
bootstrap từ storage, storage không hợp lệ/bị chặn, đồng bộ tab, cleanup listener;
tương phản các cặp chữ/nền chính tối thiểu 4.5:1.
Chưa kiểm chứng trực tiếp giao diện, hydration và responsive bằng trình duyệt:
công cụ trình duyệt trong phiên báo missing sandboxPolicy.

Không sửa API client, dữ liệu tour, backend hoặc MySQL.
