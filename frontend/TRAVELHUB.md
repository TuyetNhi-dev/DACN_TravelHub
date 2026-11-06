# TravelHub — Giai đoạn 1

Trang chủ được chuyển từ Figma Make sang Next.js App Router. Nguồn:
https://www.figma.com/make/sBdMpzEFRGh8nK0XdJ8ALQ/TravelHub-Website-Design

## Cấu trúc

- `src/app`: trang chủ, layout và CSS chung.
- `src/styles/tokens.css`: font, màu và biến nhận diện.
- `src/components/layout`: Header, Footer, Logo, Navigation.
- `src/components/home`: SearchTabs, TourCard, HotelCard, FlightCard.
- `src/components/ui/Icon.tsx`: SVG từ nguồn Make.
- `src/data/home.ts`: dữ liệu mẫu và URL ảnh gốc.

Chỉ Navigation và SearchTabs dùng Client Component. Layout, trang chủ và các card
không cần state. Các link hiện trỏ tới section trang chủ; chưa tạo route nghiệp vụ.

## Phạm vi

Có banner, tìm kiếm ba loại dịch vụ, tour nổi bật, điểm đến, khách sạn,
giá vé tham khảo, giới thiệu dịch vụ và footer.

Tìm kiếm chỉ cuộn đến phần dịch vụ tương ứng và thông báo dữ liệu minh họa,
chưa lọc dữ liệu hoặc gọi API. Nút đăng nhập, đăng ký, yêu thích, chi tiết tour,
xem phòng và chọn chuyến được vô hiệu hóa trong giai đoạn này.
Giá và ngày năm 2025 được giữ theo dữ liệu mẫu Make.

Ảnh dùng nguyên URL Unsplash từ Make qua img; chưa chuyển sang next/image.
Font Be Vietnam Pro dùng next/font/google, nên build cần truy cập nguồn font.
Không sử dụng URL asset Figma tạm thời. Không cài thêm dependency.

## Chạy trên Windows / VS Code

Trong terminal PowerShell ở thư mục gốc:

```powershell
node --version
npm --version
cd frontend
npm run dev
```

Mở http://localhost:3000 (hoặc cổng Next.js thông báo).
Nếu Node/npm không được nhận diện, kiểm tra Node.js LTS tương thích Next.js 16
(tối thiểu Node 20.9) và PATH trên máy. Sau khi sửa PATH/cài Node theo lựa chọn
của bạn, mở lại VS Code và terminal. Nếu PowerShell chặn npm.ps1, dùng npm.cmd.
Chỉ chạy npm ci khi cần khôi phục dependency; không cần chạy khi node_modules
hiện có hoạt động.

## Kiểm tra sau khi có Node/npm

```powershell
cd frontend
npx --no-install tsc --noEmit --incremental false
npm run lint
npm run build
```

## Ma trận kiểm tra giao diện

| Kích thước | Nội dung cần kiểm tra |
| --- | --- |
| 1440 × 1000 | Nội dung tối đa 1180px, hero hai cột, ba tour/hotel |
| 1024 × 768 | Header và tab vé máy bay không tràn ngang |
| 768 × 1024 | Menu mobile, hero một cột, hai tour/hotel |
| 390 × 844 | Form một cột, card và footer không tràn ngang |
| 320 × 740 | Nhãn tìm kiếm, ngày và nút vẫn đọc/thao tác được |

Thử cả ba tab tìm kiếm, mở/đóng menu, link section, bàn phím Tab và focus.
Kiểm tra ảnh tải được và crop đúng nguồn Make.

## Trạng thái xác minh tại thời điểm chuyển đổi

- Đã đọc nguồn Make và kiểm tra frontend trước khi sửa.
- Đã rà soát tĩnh breakpoint 900px/600px, import và phạm vi Client Component.
- Shell không tìm thấy node/npm; chưa chạy TypeScript, ESLint hoặc build.
- Chưa kiểm chứng responsive trực tiếp trên trình duyệt.
- Figma MCP get_screenshot không hỗ trợ file Make, chưa đối chiếu pixel.
