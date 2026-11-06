# SàiHành — kiểm tra giai đoạn 1 và cải thiện Trang chủ

Ngày kiểm tra: 19/10/2026. Phạm vi: frontend và Trang chủ. Không sửa backend, cấu hình API, database, migration, Aiven hoặc User Secrets.

## Nguồn tham chiếu

Đã đọc trực tiếp `src/App.tsx` của Figma Make qua Figma MCP từ https://www.figma.com/make/sBdMpzEFRGh8nK0XdJ8ALQ/TravelHub-Website-Design.
Giữ cấu trúc hero hai cột, ảnh bo góc và thẻ nổi, tìm kiếm dạng tab, card, điểm đến, lợi ích và banner cuối trang. Giữ bộ ảnh Unsplash từ Make, hệ token xanh dương/xanh đậm/trắng/cam và logo SàiHành hiện có. Không dùng logo TravelHub trong Make thay logo SàiHành.

## Hiện trạng trước sửa

| Hạng mục | Đã có | Còn thiếu / cần cải thiện |
| --- | --- | --- |
| Kiến trúc | Next.js 16.2.12, React 19.2.4, TypeScript, Tailwind 4; App Router | Chỉ có `/`, `/tours`, `/tours/[id]` và 404 mặc định |
| Trang chủ | Hero, tìm kiếm tab, tour nổi bật, khách sạn, chuyến bay, điểm đến, lợi ích, banner | Tìm kiếm chỉ cuộn trang; ngày mặc định năm 2025; khách sạn/chuyến bay dùng mock mặc dù có API |
| Tour | Danh sách/chi tiết API, lọc từ khóa/giá/thời lượng/ngày/điểm đến, phân trang, sắp xếp giá, lịch khởi hành | Chưa có đặt tour nhiều bước; chưa kiểm chứng đầy đủ các luồng; không phát triển tiếp trong đợt này |
| API frontend | `api-client.ts`, `services/tours.ts`: GET `/api/tours`, `/api/tours/{id}`; timeout, abort, kiểm tra định dạng | Trước sửa chưa dùng API khách sạn/chuyến bay |
| API backend đã tồn tại | GET `/api/hotels`, `/api/hotels/{id}`, `/api/flights`, `/api/health/database` | Không phản hồi tại localhost:5108 trong phiên kiểm tra; không khởi động hay thay đổi backend |
| Thương hiệu | Logo PNG SàiHành trong `public/branding`, Logo component, metadata tiếng Việt | Giữ nguyên asset/logo |
| Header/Footer | Menu mobile, tìm tour, hotline, chọn vùng khởi hành | Auth đang disabled; một số link Footer không đúng mục, copyright 2025 |
| Theme/responsive | Token sáng/tối, lưu theme và vùng khởi hành, breakpoint mobile/tablet | Chưa kiểm thử trực quan trên thiết bị; lựa chọn hiện dùng vùng địa lý, chưa đủ bộ lựa chọn thành phố theo yêu cầu dài hạn |
| Khách sạn / vé máy bay | Card Trang chủ và endpoint backend | Chưa có route danh sách/chi tiết/đặt dịch vụ |
| Tài khoản | Nút trạng thái sắp ra mắt | Chưa có đăng ký/đăng nhập/quên mật khẩu/hồ sơ/yêu thích/lịch sử; không tạo xác thực giả |
| Lịch / AI / gợi ý | Chưa triển khai | Cần giai đoạn riêng; lịch âm phải kiểm thử tháng nhuận/chuyển năm |
| Chất lượng | Skip link, label, menu aria, abort và trạng thái API Tour | Chưa có error/loading route riêng; còn nút disabled ở Header và Tour cũ |

## Thay đổi trong đợt này

- `src/app/page.tsx`: giữ bố cục Make; dùng HomeSearch và HomeCatalog; điểm đến dẫn `/tours?q=...`; ưu tiên ảnh hero, lazy-load ảnh điểm đến, khai báo kích thước; bổ sung giới thiệu/slogan; không tạo khuyến mãi giả.
- `src/components/home/HomeSearch.tsx`: tìm tour/khách sạn/chuyến bay từ API; lọc tiếng Việt có/không dấu; tour theo lựa chọn khởi hành; ngày tour kiểm tra departures thật với tối đa 5 request đồng thời; chuyến bay một chiều theo điểm đi/đến/ngày. Loading/error/retry/empty, hủy request khi đổi tab/rời trang; reset khi đổi vùng. Không có kiểm tra phòng trống/khứ hồi/số khách và ghi rõ giới hạn.
- `src/services/home-catalog.ts`: adapter riêng cho endpoint khách sạn/chuyến bay; kiểm tra dữ liệu; giữ null/giá 0; không fallback mock khi API lỗi.
- `src/components/home/HomeCatalog.tsx`: danh mục API, trạng thái tải/lỗi/rỗng, retry; card mở thông tin tham khảo bằng bàn phím; ảnh chỉ minh họa; cảnh báo dữ liệu có thể demo và chưa xác nhận tồn chỗ.
- `src/styles/home.css`, `src/app/globals.css`: bố trí tìm kiếm responsive, kết quả có giới hạn cuộn, token tương thích dark mode, giảm chuyển động theo cài đặt hệ thống.
- `src/data/home.ts`: bỏ cam kết bảo mật tuyệt đối/ưu đãi mỗi ngày/hỗ trợ 24/7 chưa được xác nhận. Dữ liệu mock cũ giữ riêng để không phá import hiện có; Trang chủ không dùng mock khách sạn/chuyến bay nữa.
- `src/components/layout/Footer.tsx`: link giới thiệu/liên hệ đúng mục, hotline bấm gọi, ghi rõ chính sách chưa cập nhật, năm 2026.
- `tests/home-catalog.test.cjs`: kiểm tra chuẩn hóa tiếng Việt, mapping endpoint/giá/ngày, null/0, dữ liệu rỗng, lỗi mạng và dữ liệu sai định dạng.

## Thứ tự đề xuất sau khi được duyệt

1. Tour: kiểm thử chức năng đang có trước; hoàn thiện chi tiết, lịch trình, dịch vụ/chính sách, album và đặt tour demo có nhãn rõ.
2. Khách sạn: route danh sách/chi tiết, adapter API phòng, bộ lọc và luồng đặt phòng demo.
3. Vé máy bay: danh sách/chi tiết, một chiều/khứ hồi, bộ lọc và luồng chọn chuyến demo.
4. Lịch du lịch: thuật toán/thư viện âm lịch đáng tin cậy; kiểm thử Tết, chuyển năm, tháng nhuận; chỉ dùng lịch khởi hành API.
5. Tài khoản demo: form validation, không lưu mật khẩu và không tuyên bố xác thực bảo mật thật.
6. Tìm kiếm có gợi ý, lựa chọn thành phố khởi hành và gợi ý dịch vụ có lý do.
7. Giao diện lịch trình/chat FAQ có nhãn demo; tóm tắt đánh giá chỉ khi có dữ liệu nguồn.

Mỗi bước kiểm tra responsive, theme, accessibility và build; không phát triển backend nghiệp vụ mới.

## Kiểm thử và giới hạn

- `npm.cmd run lint`: đạt.
- `npm.cmd run build`: đạt; Next.js kiểm tra TypeScript thành công; các route cũ được giữ.
- `node --test tests/home-catalog.test.cjs`: 5/5 đạt. Đây là kiểm thử adapter với fixture, không phải xác nhận API đang hoạt động.
- Production server khởi động tại localhost:3000 để kiểm tra HTTP: `/` và `/tours?q=Hoi%20An` trả 200, `/unknown-page` trả 404. HTML có logo SàiHành, mục tìm kiếm và giới thiệu. Đã dừng server kiểm thử sau kiểm tra; chạy `npm.cmd run dev` trong `frontend` để xem lại.
- Backend localhost:5108 chưa kết nối được; chưa xác nhận end-to-end dữ liệu API thực tế.
- Browser skill đã đọc, nhưng công cụ trình duyệt bị lỗi `missing field sandboxPolicy`; chưa kiểm tra screenshot, viewport, thao tác bàn phím thực tế và theme trực quan. Responsive/dark mode chỉ được kiểm tra ở mức mã nguồn.
- Chưa triển khai autocomplete, sort kết quả tìm kiếm Trang chủ, hotel theo ngày/số khách, flight khứ hồi, tài khoản, lịch hoặc AI. Đây là các giai đoạn tiếp theo.

Dừng sau Trang chủ, chờ người dùng kiểm tra và đồng ý trước khi sửa trang Tour.
