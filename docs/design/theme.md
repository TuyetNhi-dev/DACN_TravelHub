# Giao diện sáng/tối và token màu

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
4. Chuyển giữa /, /tours và một trang chi tiết tour, kiểm tra theme không đổi.
5. Kiểm tra Header, menu mobile, Footer, ba tab tìm kiếm, input/date/select,
   card tour/hotel/flight, bộ lọc, bảng lịch và nút ở cả hai theme.
6. Thử 1440px, 1024px, 768px, 390px và 320px; nút theme không bị ẩn.
7. Dùng Tab và Enter/Space; tooltip/aria-label mô tả chế độ sẽ chuyển tới.
8. Kiểm tra console không có hydration warning; bật reduced motion để tắt chuyển màu.

Các cặp chữ/nền chính cần tương phản tối thiểu 4.5:1 ở cả hai chế độ.

## Quy ước giao diện trang khách hàng (cập nhật 23/11/2026)

Áp dụng cho mọi trang trừ `/admin`. Token nằm trong `frontend/src/styles/tokens.css`. Lớp làm đẹp chung nằm trong
`frontend/src/styles/refresh.css` (nạp cuối cùng). Quy tắc đổi kiểu phần tử dùng chung được đặt dưới
`body:not(:has(.adm-shell))`, nên trang quản trị giữ nguyên giao diện.

### Màu

| Token | Dùng cho |
|---|---|
| `--ink`, `--text-secondary`, `--muted` | Chữ chính, chữ phụ, chú thích |
| `--blue`, `--blue-soft` | Liên kết, icon, nền nhạt của icon |
| `--brand` (hồng đậm), `--on-brand` | Nút chính, giá tiền, bước đang làm |
| `--footer-bg`, `--promo-start/end` | Nền xanh biển đậm (dải khởi hành, footer) |
| `--sun`, `--sun-ink`, `--sun-soft` | **Màu nhấn ấm (nắng), dùng tiết chế** |

Quy tắc dùng màu nắng:
- `--sun` chỉ dùng để trang trí: gạch eyebrow, sao đánh giá, viền ghi chú. **Không** dùng cho chữ.
- Chữ trên nền sáng dùng `--sun-ink`. Tương phản đạt 6.8:1 trên `--panel` (sáng) và 9.7:1 trên `--panel` (tối).
- Dùng `--sun-soft` làm nền cho nhãn gấp như "Còn N ghế", hộp an tâm khi đặt và ghi chú dữ liệu mô phỏng.
- Không dùng gradient tím, không dùng emoji làm icon. Icon lấy từ `components/ui/Icon.tsx`.

Nền trang chủ (cập nhật 24/11/2026, chỉ giao diện sáng):
- Nền trang giữ màu trắng. Section `--tint` trong `.home` dùng `--blue-soft` để tách nhịp rõ hơn.
- Liên kết nằm trực tiếp trên nền section dùng `--link-on-canvas` (xanh đậm hơn `--blue`), vì `--blue` chỉ đạt
  khoảng 4.43:1 trên `--blue-soft`.
- Nửa dưới trang có một dải đậm `home-section--deep` (nền `--footer-bg`, quầng hồng và nắng) để ngắt chuỗi section sáng.
- Chế độ tối giữ nguyên token tối.

### Chữ

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--text-display` | 56–104px | Chữ lớn ở hero |
| `--text-h1` | 32–48px | Tiêu đề trang (đậm 800, line-height 1.15) |
| `--text-h2` | 26–36px | Tiêu đề section |
| `--text-h3`, `--text-h4` | 18–22px, 17px | Tiêu đề thẻ |
| `--text-lead` | 17–19px | Đoạn mở đầu dưới tiêu đề trang |
| `--text-body`, `--text-small`, `--text-caption` | 16, 14, 13px | Thân bài, phụ, chú thích (tối thiểu 14px trên màn cảm ứng) |

Tiêu đề dùng `text-wrap: balance`, đoạn văn dùng `text-wrap: pretty`. Line-height thân bài là `--leading-body` (1.7).

### Khoảng cách, bo góc, bóng

- Khoảng cách theo lưới 8px: `--space-1` (4px) đến `--space-24` (96px). Khoảng cách giữa các section là `--section-gap`.
- Bo góc: `--radius-xs` 6, `--radius-sm` 10, `--radius-md` 16, `--radius-lg` 24 (thẻ, panel), `--radius-xl` 32
  (dải lớn), `--radius-pill` (nút, chip).
- Bóng: `--shadow-sm` (trạng thái nghỉ), `--shadow-hover` (khi hover), `--shadow-md` và `--shadow-lg` (lớp nổi).
  Chế độ tối có bộ bóng riêng.

### Chuyển động

- Thời gian: `--duration-fast` 200ms, `--duration-base` 300ms, `--duration-slow` 500ms, `--duration-page` 420ms.
  Easing: `--ease-out`.
- Hiện dần khi cuộn: bọc section trong `<Reveal>`, đánh dấu phần tử con bằng `data-reveal-item` để chúng hiện lần lượt.
- Chuyển trang: `#main-content` mờ dần lên khi route được mount.
- Thẻ: khi hover thì nâng lên 6px và ảnh phóng 1.06 trong 900ms.
- `prefers-reduced-motion: reduce` tắt toàn bộ animation và transition.

### Tiếp cận

- Vùng bấm tối thiểu `--tap-min` (44px) cho nút, ô nhập và select.
- Viền focus là `--focus-ring` (3px, màu `--blue`). Thẻ có liên kết phủ toàn thẻ (`.ui-stretched`) thì hiện viền ở cả thẻ.
- Ảnh nội dung phải có `alt` mô tả. Ảnh chỉ để trang trí (tiêu đề thẻ đã đủ nghĩa) thì dùng `alt=""`.

### Component dùng chung (`frontend/src/components/ui`)

| Component | Ghi chú |
|---|---|
| `Button`, `ButtonLink` | Có các biến thể `primary`, `outline`, `ghost`, `glass`, `white` và cỡ `sm`/`md`/`lg`; có trạng thái loading và disabled |
| `Card`, `MediaFrame` | Thẻ bo `--radius-lg`. Ảnh có tỉ lệ cố định và nhãn "Ảnh minh họa" khi cần |
| `Badge` | Các tone `info`, `success`, `warning`, `danger`, `neutral`, `brand`, `image`, `sun` (gấp/ấm) |
| `PriceTag` | Giá VND. `quote` thêm nhãn "Giá hợp đồng, chờ xác nhận chỗ" cho khách sạn và vé |
| `StarRating`, `ReviewScore` | Hạng sao khách sạn; điểm đánh giá (chỉ dùng cho dữ liệu mô phỏng có ghi rõ) |
| `SectionHeader` | Eyebrow, tiêu đề, mô tả, liên kết "Xem tất cả" |
| `EmptyState`, `ErrorState`, `LoadingState` | Có icon tròn, nội dung căn giữa, nút "Thử lại" |
| `Skeleton`, `CardSkeletons` | Khung chờ có hiệu ứng shimmer (đứng yên khi giảm chuyển động) |
| `Steps` | Thanh bước đặt tour: Chọn tour → Giữ chỗ → Thanh toán → Hoàn tất |
| `TrustNotes` | Ba cam kết khi đặt tour: giữ chỗ 10 phút, thanh toán mô phỏng an toàn, hủy khi chưa xác nhận |

### Dữ liệu mô phỏng

Mục "Cảm nhận sau chuyến đi" ở trang chủ dùng `src/data/testimonials.ts`. Đây là đánh giá do nhóm viết để minh họa,
và trang luôn ghi rõ điều đó ngay trên danh sách. Không trình bày dữ liệu này như ý kiến của khách thật.

### Ảnh chụp trước và sau

Ảnh chụp các trang ở 390, 768 và 1440px, cả giao diện sáng và tối, lưu trong `docs/design/screenshots/before`
và `docs/design/screenshots/after`.
