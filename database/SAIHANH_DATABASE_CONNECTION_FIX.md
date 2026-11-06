# SàiHành — Sửa kết nối Aiven

Ngày 19/10/2026.

## Nguyên nhân và cấu hình

Factory kiểm tra `config.Name != "travelhub_demo"`, nên saihanh_db bị từ chối trước OpenAsync. DatabaseConfigurationException được middleware chuyển thành 503; MySqlCode/Cause null vì chưa có exception MySQL. Health cũng hardcode tên database cũ. Đã bỏ điều kiện tên demo, kiểm tra Name không rỗng và trả tên thực từ SELECT DATABASE().

CreateBuilder giữ thứ tự ưu tiên tăng dần: appsettings.json → appsettings.{Environment}.json → User Secrets trong Development → environment → command line. Project có UserSecretsId; profile http đặt Development. Backend kiểm thử xác nhận Development, localhost:5108. Secrets đủ Host, Port, Username, Password, Name, SslCa; Name khớp saihanh_db. Không có Database__* tương ứng ghi đè trong tiến trình kiểm tra. Không in các giá trị nhạy cảm.

Database:SslMode có trong secrets nhưng không bind và không được sử dụng. Factory luôn VerifyFull. CA tồn tại và mở đọc được; kết nối Aiven thành công với kiểm tra chứng chỉ/hostname. Trong sandbox từng gặp 1042/AuthenticationException; lần chạy ngoài sandbox được phép thành công với cùng cấu hình. Không hạ TLS.

DI: Configure bind section Database vào DatabaseOptions; factory singleton nhận IOptions; repository scoped nhận factory. Không thấy lỗi DI/thứ tự cấu hình. IOptions không hot reload secrets; cần restart sau thay đổi cấu hình. Không sửa User Secrets hoặc tài khoản Aiven.

## File sửa

- backend/Data/MySqlConnectionFactory.cs: bỏ giới hạn tên demo; giữ kiểm tra đủ cấu hình, port, CA và VerifyFull.
- backend/Data/TravelRepository.cs: health đọc tên thật, chuyển 5 truy vấn sang schema mới, parameter ID UInt64.
- backend/Api/TravelEndpoints.cs: health trả tên thật; validation ID số nguyên dương UInt64.
- backend/Models/TravelModels.cs: tiền long? → decimal? để bảo toàn DECIMAL(15,2).
- backend/README.md: cập nhật hướng dẫn và giới hạn kiểm thử.
- database/SAIHANH_DATABASE_CONNECTION_FIX.md: báo cáo này.

Không sửa middleware, frontend, dữ liệu, schema hoặc database cũ.

## Bảng/cột không tương thích và mapping

Metadata trực tiếp: MySQL 8.0.45, saihanh_db có 42 bảng. COUNT(*) từng bảng đều bằng 0 tại lúc kiểm tra.

| Truy vấn cũ | Nguồn mới / xử lý |
|---|---|
| tours.tour_id, ten_tour | tours.id CAST AS CHAR, title |
| diem_den | locations.name qua destination_id |
| diem_khoi_hanh | Gộp locations.name khác nhau qua tour_departures.departure_location_id |
| so_ngay, so_dem | duration_days, duration_nights |
| phuong_tien | tour_transport_types + transport_types.name |
| gia_nguoi_lon_vnd | tours.base_price; lịch dùng adult_price |
| gia_tre_em_vnd tại tour | NULL, giá child_price nằm theo lịch nên không tự chọn lịch |
| lich_trinh_tom_tat | tours.description |
| diem_tham_quan, loai_du_lieu, nguon_tham_khao | NULL, chưa có nguồn tương đương |
| tour_departures.departure_id, ngay_khoi_hanh | id, departure_date; tour_id là số |
| so_cho_con, trang_thai | capacity - reserved_seats, status |
| hotels.hotel_id, ten_khach_san | hotels.id, name |
| thanh_pho, dia_chi, hang_sao_demo | locations.name qua location_id, address, star_rating |
| gia_tu_vnd_dem | MIN hotel_offers.nightly_price qua room_types: VND active, hiệu lực chứa ngày hiện tại |
| tien_nghi, nguon_tham_khao | NULL; ghi_chu lấy hotels.description |
| rooms (không còn bảng này) | room_types |
| room_id, loai_phong, suc_chua | room_types.id, name, max_guests |
| gia_vnd_dem | MIN offer VND active còn hiệu lực của loại phòng |
| so_phong_con, loai_du_lieu | NULL, không có nguồn tồn tương ứng |
| flights.flight_id, so_hieu_demo | flights.id, flight_number |
| hang_bay_tham_khao | airlines.name qua airline_id |
| ma_san_bay_di/den, noi_di/den | locations.code/name qua origin_location_id/destination_location_id |
| ngay_bay, gio_di, gio_den | DATE/TIME từ depart_at/arrive_at, không đổi timezone ngầm |
| thoi_gian_phut | TIMESTAMPDIFF(MINUTE, depart_at, arrive_at) |
| hang_ve, gia_vnd | cabin_class/quoted_price cùng offer VND active chưa hết hạn, rẻ nhất; hòa giá chọn id nhỏ nhất |
| so_ghe_con, ghi_chu, nguon_tham_khao | NULL, không suy diễn dữ liệu |

Giữ tên JSON cũ để giảm ảnh hưởng frontend. Giá hotel/flight là giá tham khảo, không phải báo giá ngày lưu trú hoặc cam kết tồn. locations.name có thể là địa điểm thay vì thành phố tùy location_type; chưa có dữ liệu để kiểm tra phân cấp. Không thêm nghiệp vụ đặt/ghi dữ liệu.

## Kết quả kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| dotnet build backend/TravelHub.Api.csproj --no-restore | Thành công, 0 warning / 0 error |
| SELECT 1 | 1 |
| SELECT DATABASE() | saihanh_db |
| GET /api/health/database | 200, status ok, database saihanh_db |
| GET /api/tours | 200, data [], count 0 |
| GET /api/hotels | 200, data [], count 0 |
| GET /api/flights | 200, data [], count 0 |
| GET /api/tours/1; /api/hotels/1 | 404 đúng khi chưa có dữ liệu |
| GET /api/tours/abc | 400 |
| GET /api/tours/18446744073709551615 | 404; ID UInt64 tối đa được chấp nhận |
| 5 truy vấn tour/lịch/hotel/phòng/flight với LIMIT 0 trực tiếp trên Aiven | Thành công, không lỗi bảng/cột |

Health/danh sách kiểm thử trên backend thật. LIMIT 0 bổ sung xác minh truy vấn lịch/phòng mà API chi tiết chưa đi vào nhánh đọc con do không có tour/hotel.

Giới hạn: chưa kiểm thử mapper với dòng thật, tiền có phần lẻ, quan hệ và API chi tiết trả 200 vì database rỗng. Không tạo seed data để che giới hạn.

## Bước tiếp theo

Khởi động lại backend cũ trong IDE nếu còn giữ phiên trước sửa. Khi có dữ liệu hợp lệ do bạn chủ động cung cấp, kiểm thử lại danh sách/chi tiết, giá và múi giờ. Hợp đồng API đầy đủ cho 42 bảng là công việc riêng; bản sửa tập trung kết nối và GET hiện hữu.
