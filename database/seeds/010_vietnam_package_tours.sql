-- 010_vietnam_package_tours.sql
-- =============================================================================================================
-- DỮ LIỆU MÔ PHỎNG (DEMO) – KHÔNG PHẢI SẢN PHẨM, GIÁ HAY LỊCH KHỞI HÀNH THẬT CỦA BẤT KỲ CÔNG TY NÀO.
-- =============================================================================================================
-- 60 tour trọn gói SH-MB-001..020 (miền Bắc), SH-MT-001..020 (miền Trung, Tây Nguyên), SH-MN-001..020 (miền Nam).
-- Địa danh và cung đường là địa lý Việt Nam có thật; lịch trình viết từ kiến thức chung về điểm đến, không chép từ
-- trang lữ hành nào. Giá, số chỗ, khách sạn và dịch vụ là giả định cho demo.
--
-- Cần chạy trước: migrations 001–015, seeds 002 (chi nhánh HN/DN/HCM/CT, địa điểm, loại phương tiện).
--
-- Dòng tour (Tiết kiệm / Tiêu chuẩn / Cao cấp) lưu ở tour_categories (slug tiet-kiem, tieu-chuan, cao-cap).
-- API công khai chưa trả trường này, nên mô tả tour cũng ghi "Dòng ...".
-- 7 địa điểm mới: Cao Bằng, Phú Yên, Cà Mau, Đồng Tháp, Bạc Liêu, Kiên Giang, Vĩnh Long.
--
-- Lịch khởi hành: 2026-11-25 → 2027-02-21 (90 ngày tính từ 2026-11-23). Tour 1–2 ngày khởi hành hằng tuần,
-- 3–4 ngày cách 2 tuần, 5–7 ngày cách 3 tuần. Giá người lớn theo mùa (trẻ em = 75%, làm tròn 10.000 đ):
--   * chuyến có ngày rơi vào Tết Đinh Mùi 2027-02-05..2027-02-08 (Tất niên đến mùng 3): +30%
--   * khởi hành trong 6 ngày sau mùng 3 (du xuân): +15%; trong 7 ngày trước Tất niên (cận Tết): +10%
--   * chuyến có ngày Tết Dương lịch 2027-01-01: +12%; khởi hành 20–31/12 (cuối năm): +8%
--   * khởi hành 02–28/01/2027 (thấp điểm): −5%
-- Ngày lễ lấy từ frontend/src/lib/vn-holidays.ts. Lịch nghỉ Tết chính thức do Thủ tướng công bố hằng năm nên không
-- suy ra ở đây. tours.base_price = giá người lớn thấp nhất trong các lịch của tour.
--
-- Số chỗ: sức chứa 15–40 theo dòng tour. reserved_seats là số chỗ ĐÃ BÁN GIẢ LẬP (không có đơn đặt chỗ tương ứng
-- trong bookings), để trang web có lịch gần đầy. Lịch được thêm ĐẦU TIÊN của mỗi ngày khởi hành (id nhỏ nhất trong
-- file này cho ngày đó) chỉ còn 1–4 chỗ: mục "Sắp khởi hành" lấy 8 lịch sớm nhất theo (ngày, id), nên demo vào ngày
-- nào cũng có thẻ "Còn N chỗ". Lịch khác luôn còn ít nhất 6 chỗ.
-- Danh sách hành khách (manifest) của các lịch này vì vậy sẽ ít hơn số chỗ đã giữ.
--
-- Ảnh: CHỈ dùng ảnh Unsplash trong thư viện đã ghi nguồn frontend/src/data/photo-library.ts (cùng nguồn với seed
-- 008), và chỉ cho tour có ghé địa điểm mà bộ ảnh mang tên. Ảnh được chọn theo kết quả tìm kiếm tên địa điểm và
-- CHƯA được mở từng trang để xác nhận nơi chụp; một số ảnh có thể chụp ở nơi lân cận (xem mục "Giới hạn" trong
-- docs/design/image-credits.md). Tour tới nơi chưa có bộ ảnh (Hà Giang, Cao Bằng, Mộc Châu, Quảng Bình, Quy Nhơn,
-- Côn Đảo, miền Tây...) không có dòng tour_images; trang web tự hiện ảnh minh họa có nhãn.
--
-- Chạy lại được: tour đã có mã thì bỏ qua toàn bộ (kể cả lịch, lịch trình, ảnh); danh mục và địa điểm chỉ thêm khi
-- chưa có. Cần MySQL 8.0.19+ (VALUES ROW). File được sinh bằng scripts/seeds/package-tours/generate.cjs: sửa dữ liệu
-- ở đó rồi sinh lại, không sửa tay file này.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO tour_categories (slug, name)
SELECT v.slug, v.name
FROM (VALUES
  ROW('tiet-kiem', 'Tiết kiệm'),
  ROW('tieu-chuan', 'Tiêu chuẩn'),
  ROW('cao-cap', 'Cao cấp')
) AS v (slug, name)
WHERE NOT EXISTS (SELECT 1 FROM tour_categories c WHERE c.slug = v.slug);

INSERT INTO locations (parent_id, code, name, location_type)
SELECT NULL, v.code, v.name, 'city'
FROM (VALUES
  ROW('city-cao-bang', 'Cao Bằng'),
  ROW('city-phu-yen', 'Phú Yên'),
  ROW('city-ca-mau', 'Cà Mau'),
  ROW('city-dong-thap', 'Đồng Tháp'),
  ROW('city-bac-lieu', 'Bạc Liêu'),
  ROW('city-kien-giang', 'Kiên Giang'),
  ROW('city-vinh-long', 'Vĩnh Long')
) AS v (code, name)
WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.code = v.code);

-- SH-MB-001 · Hà Nội một ngày: Lăng Bác – Văn Miếu – phố cổ (Tiết kiệm, chi nhánh HN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-001', 'Hà Nội một ngày: Lăng Bác – Văn Miếu – phố cổ',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-ha-noi'), @branch, 1, 0,
  'Dòng Tiết kiệm · khởi hành từ Hà Nội. Điểm nhấn: Lăng Chủ tịch Hồ Chí Minh, Văn Miếu – Quốc Tử Giám, hồ Hoàn Kiếm, phố cổ.', 590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-001');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-28', 40, 15, 36, 590000, 440000),
  ROW('2026-12-05', '2026-12-05', 40, 15, 38, 590000, 440000),
  ROW('2026-12-12', '2026-12-12', 40, 15, 39, 590000, 440000),
  ROW('2026-12-19', '2026-12-19', 40, 15, 37, 590000, 440000),
  ROW('2026-12-26', '2026-12-26', 40, 15, 36, 590000, 440000),
  ROW('2027-01-02', '2027-01-02', 40, 15, 38, 590000, 440000),
  ROW('2027-01-09', '2027-01-09', 40, 15, 39, 590000, 440000),
  ROW('2027-01-16', '2027-01-16', 40, 15, 37, 590000, 440000),
  ROW('2027-01-23', '2027-01-23', 40, 15, 38, 590000, 440000),
  ROW('2027-01-30', '2027-01-30', 40, 15, 38, 590000, 440000),
  ROW('2027-02-06', '2027-02-06', 40, 15, 39, 790000, 590000),
  ROW('2027-02-13', '2027-02-13', 40, 15, 38, 690000, 520000),
  ROW('2027-02-20', '2027-02-20', 40, 15, 37, 590000, 440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Lăng Bác – Văn Miếu – hồ Hoàn Kiếm – phố cổ', 'Buổi sáng viếng Lăng Chủ tịch Hồ Chí Minh, tham quan nhà sàn Bác Hồ và chùa Một Cột. Ăn trưa món Hà Nội, chiều thăm Văn Miếu – Quốc Tử Giám, đền Ngọc Sơn bên hồ Hoàn Kiếm rồi dạo phố cổ, thưởng thức cà phê trứng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('meal', 'Một bữa trưa theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Đường tàu chạy xuyên qua con hẻm', 10),
  ROW('https://images.unsplash.com/photo-1778809848221-effdbae7037d?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Phố cổ với cửa hàng và đèn lồng', 20),
  ROW('https://images.unsplash.com/photo-1616438096679-620332ede3a2?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Người đội nón lá gánh hàng trên phố', 30),
  ROW('https://images.unsplash.com/photo-1599708153386-62bf3f035c78?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Công trình kiến trúc cổ giữa hàng cây xanh', 40),
  ROW('https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Nhà cao tầng lúc hoàng hôn', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-002 · Ninh Bình một ngày: Tràng An – Bái Đính – Hang Múa (Tiết kiệm, chi nhánh HN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-002', 'Ninh Bình một ngày: Tràng An – Bái Đính – Hang Múa',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-ninh-binh'), @branch, 1, 0,
  'Dòng Tiết kiệm · khởi hành từ Hà Nội. Điểm nhấn: Quần thể danh thắng Tràng An, chùa Bái Đính, Hang Múa.', 590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-002');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-29', '2026-11-29', 30, 15, 27, 590000, 440000),
  ROW('2026-12-06', '2026-12-06', 30, 15, 27, 590000, 440000),
  ROW('2026-12-13', '2026-12-13', 30, 15, 27, 590000, 440000),
  ROW('2026-12-20', '2026-12-20', 30, 15, 28, 590000, 440000),
  ROW('2026-12-27', '2026-12-27', 30, 15, 28, 590000, 440000),
  ROW('2027-01-03', '2027-01-03', 30, 15, 27, 590000, 440000),
  ROW('2027-01-10', '2027-01-10', 30, 15, 26, 590000, 440000),
  ROW('2027-01-17', '2027-01-17', 30, 15, 27, 590000, 440000),
  ROW('2027-01-24', '2027-01-24', 30, 15, 27, 590000, 440000),
  ROW('2027-01-31', '2027-01-31', 30, 15, 28, 590000, 440000),
  ROW('2027-02-07', '2027-02-07', 30, 15, 26, 790000, 590000),
  ROW('2027-02-14', '2027-02-14', 30, 15, 28, 690000, 520000),
  ROW('2027-02-21', '2027-02-21', 30, 15, 27, 590000, 440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Bái Đính – Tràng An – Hang Múa', 'Khởi hành sớm đi Ninh Bình theo cao tốc Pháp Vân – Cầu Giẽ. Lễ chùa Bái Đính, ăn trưa đặc sản dê núi và cơm cháy. Chiều ngồi thuyền xuôi suối Tràng An qua các hang động, sau đó leo Hang Múa ngắm toàn cảnh Tam Cốc. Về Hà Nội buổi tối. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('meal', 'Một bữa trưa theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1768158186882-9e7e15e53532?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Cổng đền cổ bên dòng sông và núi', 10),
  ROW('https://images.unsplash.com/photo-1725209276479-59220882e9b0?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Du khách đi thuyền nhỏ trên sông', 20),
  ROW('https://images.unsplash.com/photo-1545172538-171a802bd867?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Thuyền chèo trên sông ban ngày', 30),
  ROW('https://images.unsplash.com/photo-1527428050273-21bd264db1b5?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Chùa trên đỉnh núi đá', 40),
  ROW('https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Chùa giữa mặt nước và núi đá', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-003 · Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền 5 sao (Cao cấp, chi nhánh HN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-003', 'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền 5 sao',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-ha-long'), @branch, 2, 1,
  'Dòng Cao cấp · khởi hành từ Hà Nội. Điểm nhấn: Du thuyền ngủ đêm trên vịnh, hang Sửng Sốt, chèo kayak hang Luồn, đảo Ti Tốp.', 4390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-003');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 15, 6, 8, 4590000, 3440000),
  ROW('2026-12-05', '2026-12-06', 15, 6, 9, 4590000, 3440000),
  ROW('2026-12-12', '2026-12-13', 15, 6, 3, 4590000, 3440000),
  ROW('2026-12-19', '2026-12-20', 15, 6, 5, 4590000, 3440000),
  ROW('2026-12-26', '2026-12-27', 15, 6, 3, 4990000, 3740000),
  ROW('2027-01-02', '2027-01-03', 15, 6, 2, 4390000, 3290000),
  ROW('2027-01-09', '2027-01-10', 15, 6, 2, 4390000, 3290000),
  ROW('2027-01-16', '2027-01-17', 15, 6, 1, 4390000, 3290000),
  ROW('2027-01-23', '2027-01-24', 15, 6, 4, 4390000, 3290000),
  ROW('2027-01-30', '2027-01-31', 15, 6, 1, 5090000, 3820000),
  ROW('2027-02-06', '2027-02-07', 15, 6, 9, 5990000, 4490000),
  ROW('2027-02-13', '2027-02-14', 15, 6, 3, 5290000, 3970000),
  ROW('2027-02-20', '2027-02-21', 15, 6, 4, 4590000, 3440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Hạ Long, lên du thuyền', 'Xe limousine đón tại Hà Nội, theo cao tốc Hà Nội – Hải Phòng – Hạ Long đến cảng Tuần Châu. Lên du thuyền, ăn trưa trong lúc tàu đi vào vịnh. Chiều chèo kayak qua hang Luồn, tắm biển đảo Ti Tốp. Tối dự tiệc trên boong và câu mực đêm.'),
  ROW(2, 'Hang Sửng Sốt – về Hà Nội', 'Tập dưỡng sinh trên boong lúc bình minh, sau bữa sáng thăm hang Sửng Sốt. Ăn trưa trên tàu trong lúc về cảng, xe đưa về Hà Nội buổi chiều. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1772867342647-6e6d87a0b014?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Du thuyền đi qua vịnh giữa các núi đá vôi', 10),
  ROW('https://images.unsplash.com/photo-1748102288847-b2607862c249?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Toàn cảnh các đảo trên vịnh nhìn từ trên cao', 20),
  ROW('https://images.unsplash.com/photo-1697850084120-4896a446a04d?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Du khách chèo kayak qua hang đá trên vịnh', 30),
  ROW('https://images.unsplash.com/photo-1778235982248-d4ee62f01064?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Thuyền neo đậu trong vịnh bao quanh bởi núi đá vôi', 40),
  ROW('https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Thuyền trên làn nước xanh ngọc giữa các đảo đá vôi vịnh Hạ Long', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-004 · Yên Tử – Hạ Long 2 ngày 1 đêm (Tiêu chuẩn, chi nhánh HN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-004', 'Yên Tử – Hạ Long 2 ngày 1 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-ha-long'), @branch, 2, 1,
  'Dòng Tiêu chuẩn · khởi hành từ Hà Nội. Điểm nhấn: Cáp treo Yên Tử lên chùa Đồng, du ngoạn vịnh Hạ Long, hang Thiên Cung.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-004');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 30, 10, 19, 2490000, 1870000),
  ROW('2026-12-05', '2026-12-06', 30, 10, 11, 2490000, 1870000),
  ROW('2026-12-12', '2026-12-13', 30, 10, 12, 2490000, 1870000),
  ROW('2026-12-19', '2026-12-20', 30, 10, 5, 2490000, 1870000),
  ROW('2026-12-26', '2026-12-27', 30, 10, 10, 2690000, 2020000),
  ROW('2027-01-02', '2027-01-03', 30, 10, 6, 2390000, 1790000),
  ROW('2027-01-09', '2027-01-10', 30, 10, 2, 2390000, 1790000),
  ROW('2027-01-16', '2027-01-17', 30, 10, 4, 2390000, 1790000),
  ROW('2027-01-23', '2027-01-24', 30, 10, 3, 2390000, 1790000),
  ROW('2027-01-30', '2027-01-31', 30, 10, 7, 2790000, 2090000),
  ROW('2027-02-06', '2027-02-07', 30, 10, 22, 3290000, 2470000),
  ROW('2027-02-13', '2027-02-14', 30, 10, 8, 2890000, 2170000),
  ROW('2027-02-20', '2027-02-21', 30, 10, 2, 2490000, 1870000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Yên Tử – Hạ Long', 'Khởi hành đi Uông Bí, đi cáp treo lên chùa Hoa Yên và chùa Đồng trên đỉnh Yên Tử. Ăn trưa chay hoặc mặn tùy chọn, chiều tiếp tục về Hạ Long nhận phòng. Tối tự do dạo chợ đêm Hạ Long.'),
  ROW(2, 'Du ngoạn vịnh Hạ Long – về Hà Nội', 'Lên tàu thăm vịnh, ngắm hòn Gà Chọi, hòn Đỉnh Hương và thăm hang Thiên Cung. Ăn trưa hải sản trên tàu, chiều trở về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1748102288847-b2607862c249?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Toàn cảnh các đảo trên vịnh nhìn từ trên cao', 10),
  ROW('https://images.unsplash.com/photo-1697850084120-4896a446a04d?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Du khách chèo kayak qua hang đá trên vịnh', 20),
  ROW('https://images.unsplash.com/photo-1778235982248-d4ee62f01064?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Thuyền neo đậu trong vịnh bao quanh bởi núi đá vôi', 30),
  ROW('https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Thuyền trên làn nước xanh ngọc giữa các đảo đá vôi vịnh Hạ Long', 40),
  ROW('https://images.unsplash.com/photo-1764645859246-8c6db98330a7?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Đảo đá vôi trên vịnh lúc hoàng hôn', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-005 · Sa Pa 3 ngày 2 đêm: bản Cát Cát – đỉnh Fansipan (Tiêu chuẩn, chi nhánh HN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-005', 'Sa Pa 3 ngày 2 đêm: bản Cát Cát – đỉnh Fansipan',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-sa-pa'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Hà Nội. Điểm nhấn: Bản Cát Cát, cáp treo Fansipan, núi Hàm Rồng, đèo Ô Quy Hồ.', 3590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-005');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 30, 10, 27, 3790000, 2840000),
  ROW('2026-12-11', '2026-12-13', 30, 10, 27, 3790000, 2840000),
  ROW('2026-12-25', '2026-12-27', 30, 10, 27, 4090000, 3070000),
  ROW('2027-01-08', '2027-01-10', 30, 10, 29, 3590000, 2690000),
  ROW('2027-01-22', '2027-01-24', 30, 10, 27, 3590000, 2690000),
  ROW('2027-02-05', '2027-02-07', 30, 10, 29, 4890000, 3670000),
  ROW('2027-02-19', '2027-02-21', 30, 10, 28, 3790000, 2840000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Sa Pa – bản Cát Cát', 'Theo cao tốc Nội Bài – Lào Cai lên Sa Pa, ăn trưa và nhận phòng. Chiều đi bộ xuống bản Cát Cát của người Mông, xem thác nước và nhà máy thủy điện cũ. Tối dạo quanh nhà thờ đá Sa Pa.'),
  ROW(2, 'Chinh phục Fansipan – núi Hàm Rồng', 'Đi tàu leo núi Mường Hoa và cáp treo lên đỉnh Fansipan 3.143 m, viếng quần thể tâm linh trên đỉnh. Chiều tham quan vườn hoa và sân mây núi Hàm Rồng.'),
  ROW(3, 'Đèo Ô Quy Hồ – thác Bạc – về Hà Nội', 'Ngắm đèo Ô Quy Hồ từ cổng trời, ghé thác Bạc rồi xuống chợ Sa Pa mua đặc sản. Ăn trưa, về Hà Nội buổi tối. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi', 10),
  ROW('https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Ruộng bậc thang và nhà nhỏ trong thung lũng núi', 20),
  ROW('https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao', 30),
  ROW('https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi xanh nhìn từ trên cao', 40),
  ROW('https://images.unsplash.com/photo-1698809807686-42a1f8e14ea3?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Cáp treo vượt trên biển mây', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-006 · Sa Pa 2 ngày 1 đêm: trekking Lao Chải – Tả Van (Tiết kiệm, chi nhánh HN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-006', 'Sa Pa 2 ngày 1 đêm: trekking Lao Chải – Tả Van',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-sa-pa'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ Hà Nội. Điểm nhấn: Đi bộ thung lũng Mường Hoa, bản Lao Chải và Tả Van, bản Cát Cát.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-006');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-28', 30, 15, 13, 1690000, 1270000),
  ROW('2026-12-04', '2026-12-05', 30, 15, 28, 1690000, 1270000),
  ROW('2026-12-11', '2026-12-12', 30, 15, 11, 1690000, 1270000),
  ROW('2026-12-18', '2026-12-19', 30, 15, 27, 1690000, 1270000),
  ROW('2026-12-25', '2026-12-26', 30, 15, 9, 1790000, 1340000),
  ROW('2027-01-01', '2027-01-02', 30, 15, 27, 1890000, 1420000),
  ROW('2027-01-08', '2027-01-09', 30, 15, 1, 1590000, 1190000),
  ROW('2027-01-15', '2027-01-16', 30, 15, 26, 1590000, 1190000),
  ROW('2027-01-22', '2027-01-23', 30, 15, 2, 1590000, 1190000),
  ROW('2027-01-29', '2027-01-30', 30, 15, 28, 1890000, 1420000),
  ROW('2027-02-05', '2027-02-06', 30, 15, 23, 2190000, 1640000),
  ROW('2027-02-12', '2027-02-13', 30, 15, 29, 1990000, 1490000),
  ROW('2027-02-19', '2027-02-20', 30, 15, 1, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Sa Pa – trekking Lao Chải, Tả Van', 'Xe giường nằm đưa lên Sa Pa từ sáng sớm. Sau bữa trưa đi bộ khoảng 10 km dọc thung lũng Mường Hoa qua bản Lao Chải của người Mông và Tả Van của người Giáy, xe đón về thị trấn nghỉ đêm.'),
  ROW(2, 'Bản Cát Cát – về Hà Nội', 'Sáng thăm bản Cát Cát, chiều tự do mua sắm ở chợ Sa Pa rồi lên xe về Hà Nội, đến nơi khoảng 21 giờ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Ruộng bậc thang và nhà nhỏ trong thung lũng núi', 10),
  ROW('https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao', 20),
  ROW('https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi xanh nhìn từ trên cao', 30),
  ROW('https://images.unsplash.com/photo-1698809807686-42a1f8e14ea3?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Cáp treo vượt trên biển mây', 40),
  ROW('https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-007 · Hà Giang 4 ngày 3 đêm: Đồng Văn – Mã Pì Lèng – Lũng Cú (Tiêu chuẩn, chi nhánh HN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-007', 'Hà Giang 4 ngày 3 đêm: Đồng Văn – Mã Pì Lèng – Lũng Cú',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-ha-giang'), @branch, 4, 3,
  'Dòng Tiêu chuẩn · khởi hành từ Hà Nội. Điểm nhấn: Cổng trời Quản Bạ, dinh thự họ Vương, cột cờ Lũng Cú, đèo Mã Pì Lèng, sông Nho Quế.', 4790000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-007');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-26', '2026-11-29', 30, 10, 26, 4990000, 3740000),
  ROW('2026-12-10', '2026-12-13', 30, 10, 26, 4990000, 3740000),
  ROW('2026-12-24', '2026-12-27', 30, 10, 26, 5390000, 4040000),
  ROW('2027-01-07', '2027-01-10', 30, 10, 29, 4790000, 3590000),
  ROW('2027-01-21', '2027-01-24', 30, 10, 28, 4790000, 3590000),
  ROW('2027-02-04', '2027-02-07', 30, 10, 29, 6490000, 4870000),
  ROW('2027-02-18', '2027-02-21', 30, 10, 28, 4990000, 3740000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – thành phố Hà Giang', 'Khởi hành đi Hà Giang theo cao tốc Hà Nội – Tuyên Quang và quốc lộ 2, dừng chụp ảnh tại cột mốc Km0. Nhận phòng, tối dùng bữa với thắng cố và cháo ấu tẩu.'),
  ROW(2, 'Quản Bạ – Yên Minh – Đồng Văn', 'Lên cổng trời Quản Bạ ngắm núi đôi Cô Tiên, qua rừng thông Yên Minh đến Sà Phìn thăm dinh thự họ Vương. Tối nghỉ tại thị trấn Đồng Văn, dạo phố cổ dưới chân núi.'),
  ROW(3, 'Lũng Cú – Mã Pì Lèng – sông Nho Quế', 'Sáng lên cột cờ Lũng Cú nơi cực Bắc, chiều vượt đèo Mã Pì Lèng và đi thuyền trên sông Nho Quế qua hẻm Tu Sản. Nghỉ đêm tại Mèo Vạc.'),
  ROW(4, 'Mèo Vạc – về Hà Nội', 'Theo cung đường Mậu Duệ về thành phố Hà Giang ăn trưa, chiều lên xe về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MB-008 · Hà Giang 3 ngày 2 đêm: cung đường đá xe giường nằm (Tiết kiệm, chi nhánh HN, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-008', 'Hà Giang 3 ngày 2 đêm: cung đường đá xe giường nằm',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-ha-giang'), @branch, 3, 2,
  'Dòng Tiết kiệm · khởi hành từ Hà Nội. Điểm nhấn: Cổng trời Quản Bạ, phố cổ Đồng Văn, cột cờ Lũng Cú, đèo Mã Pì Lèng.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-008');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-04', '2026-12-06', 40, 15, 17, 2590000, 1940000),
  ROW('2026-12-18', '2026-12-20', 40, 15, 16, 2590000, 1940000),
  ROW('2027-01-01', '2027-01-03', 40, 15, 0, 2890000, 2170000),
  ROW('2027-01-15', '2027-01-17', 40, 15, 11, 2390000, 1790000),
  ROW('2027-01-29', '2027-01-31', 40, 15, 6, 2790000, 2090000),
  ROW('2027-02-12', '2027-02-14', 40, 15, 4, 2890000, 2170000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Quản Bạ – Yên Minh', 'Xe giường nằm khởi hành đêm trước, sáng tới thành phố Hà Giang ăn sáng. Lên cổng trời Quản Bạ, nghỉ đêm tại Yên Minh.'),
  ROW(2, 'Lũng Cú – Đồng Văn – Mã Pì Lèng', 'Thăm dinh thự họ Vương, cột cờ Lũng Cú, phố cổ Đồng Văn; chiều ngắm đèo Mã Pì Lèng và sông Nho Quế từ trên cao. Nghỉ đêm tại Mèo Vạc hoặc Đồng Văn.'),
  ROW(3, 'Về Hà Nội', 'Trở về thành phố Hà Giang ăn trưa rồi lên xe về Hà Nội, đến nơi buổi tối. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MB-009 · Hồ Ba Bể – thác Bản Giốc 3 ngày 2 đêm (Tiêu chuẩn, chi nhánh HN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-009', 'Hồ Ba Bể – thác Bản Giốc 3 ngày 2 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-cao-bang'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Hà Nội. Điểm nhấn: Hồ Ba Bể, thác Bản Giốc, động Ngườm Ngao, khu di tích Pác Bó.', 3590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-009');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 20, 10, 13, 3790000, 2840000),
  ROW('2026-12-11', '2026-12-13', 20, 10, 9, 3790000, 2840000),
  ROW('2026-12-25', '2026-12-27', 20, 10, 7, 4090000, 3070000),
  ROW('2027-01-08', '2027-01-10', 20, 10, 3, 3590000, 2690000),
  ROW('2027-01-22', '2027-01-24', 20, 10, 3, 3590000, 2690000),
  ROW('2027-02-05', '2027-02-07', 20, 10, 13, 4890000, 3670000),
  ROW('2027-02-19', '2027-02-21', 20, 10, 1, 3790000, 2840000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – hồ Ba Bể', 'Khởi hành đi Bắc Kạn, chiều đi thuyền trên hồ Ba Bể thăm ao Tiên, đảo Bà Góa và động Puông. Nghỉ đêm homestay của người Tày ở bản Pác Ngòi.'),
  ROW(2, 'Ba Bể – thác Bản Giốc – động Ngườm Ngao', 'Di chuyển sang Trùng Khánh, Cao Bằng, ngồi bè tre đến gần chân thác Bản Giốc và thăm chùa Phật tích Trúc Lâm Bản Giốc. Chiều khám phá động Ngườm Ngao, nghỉ đêm tại thành phố Cao Bằng.'),
  ROW(3, 'Pác Bó – về Hà Nội', 'Thăm khu di tích Pác Bó với suối Lênin và hang Cốc Bó, sau bữa trưa trở về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MB-010 · Mộc Châu 2 ngày 1 đêm: đồi chè – thác Dải Yếm (Tiết kiệm, chi nhánh HN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-010', 'Mộc Châu 2 ngày 1 đêm: đồi chè – thác Dải Yếm',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-moc-chau'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ Hà Nội. Điểm nhấn: Đồi chè trái tim, thác Dải Yếm, rừng thông bản Áng, đặc sản bê chao.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-010');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 40, 15, 27, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-06', 40, 15, 23, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-13', 40, 15, 19, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-20', 40, 15, 10, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-27', 40, 15, 10, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-03', 40, 15, 2, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-10', 40, 15, 9, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-17', 40, 15, 3, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-24', 40, 15, 5, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-31', 40, 15, 11, 1890000, 1420000),
  ROW('2027-02-06', '2027-02-07', 40, 15, 22, 2190000, 1640000),
  ROW('2027-02-13', '2027-02-14', 40, 15, 11, 1990000, 1490000),
  ROW('2027-02-20', '2027-02-21', 40, 15, 9, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Mộc Châu – đồi chè trái tim', 'Theo quốc lộ 6 qua đèo Thung Khe lên cao nguyên Mộc Châu. Chiều dạo đồi chè trái tim và rừng thông bản Áng, tối thưởng thức bê chao, cá suối nướng.'),
  ROW(2, 'Thác Dải Yếm – về Hà Nội', 'Sáng thăm thác Dải Yếm và mua sữa, mận sấy làm quà, sau bữa trưa về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MB-011 · Ninh Bình – Hạ Long 3 ngày 2 đêm (Tiêu chuẩn, chi nhánh HN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-011', 'Ninh Bình – Hạ Long 3 ngày 2 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-ninh-binh'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Hà Nội. Điểm nhấn: Cố đô Hoa Lư, Tam Cốc – Bích Động, Hang Múa, vịnh Hạ Long.', 3590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-011');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-26', '2026-11-28', 30, 10, 11, 3790000, 2840000),
  ROW('2026-12-10', '2026-12-12', 30, 10, 8, 3790000, 2840000),
  ROW('2026-12-24', '2026-12-26', 30, 10, 5, 4090000, 3070000),
  ROW('2027-01-07', '2027-01-09', 30, 10, 5, 3590000, 2690000),
  ROW('2027-01-21', '2027-01-23', 30, 10, 5, 3590000, 2690000),
  ROW('2027-02-04', '2027-02-06', 30, 10, 15, 4890000, 3670000),
  ROW('2027-02-18', '2027-02-20', 30, 10, 3, 3790000, 2840000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Hoa Lư – Tam Cốc', 'Thăm đền vua Đinh, vua Lê ở cố đô Hoa Lư. Chiều đi đò Tam Cốc qua ba hang xuyên núi, ghé chùa Bích Động. Nghỉ đêm tại Ninh Bình.'),
  ROW(2, 'Hang Múa – Hạ Long', 'Sáng leo Hang Múa, sau đó qua Hải Phòng theo cao tốc Hải Phòng – Hạ Long ra Quảng Ninh. Chiều tự do tắm biển Bãi Cháy, tối dạo công viên Sun World hoặc chợ đêm.'),
  ROW(3, 'Vịnh Hạ Long – về Hà Nội', 'Du ngoạn vịnh Hạ Long, thăm hang Sửng Sốt và đảo Ti Tốp, ăn trưa trên tàu rồi về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Chùa giữa mặt nước và núi đá', 10),
  ROW('https://images.unsplash.com/photo-1697850084120-4896a446a04d?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Du khách chèo kayak qua hang đá trên vịnh', 20),
  ROW('https://images.unsplash.com/photo-1768158186882-9e7e15e53532?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Cổng đền cổ bên dòng sông và núi', 30),
  ROW('https://images.unsplash.com/photo-1778235982248-d4ee62f01064?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Thuyền neo đậu trong vịnh bao quanh bởi núi đá vôi', 40),
  ROW('https://images.unsplash.com/photo-1725209276479-59220882e9b0?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Du khách đi thuyền nhỏ trên sông', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-012 · Vòng cung Đông Bắc 5 ngày: Hà Giang – Cao Bằng – Ba Bể (Cao cấp, chi nhánh HN, 4 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-012', 'Vòng cung Đông Bắc 5 ngày: Hà Giang – Cao Bằng – Ba Bể',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-cao-bang'), @branch, 5, 4,
  'Dòng Cao cấp · khởi hành từ Hà Nội. Điểm nhấn: Cột cờ Lũng Cú, đèo Mã Pì Lèng, thác Bản Giốc, núi Mắt Thần, hồ Ba Bể.', 10890000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-012');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-09', '2026-12-13', 15, 6, 14, 11490000, 8620000),
  ROW('2026-12-30', '2027-01-03', 15, 6, 12, 12890000, 9670000),
  ROW('2027-01-20', '2027-01-24', 15, 6, 11, 10890000, 8170000),
  ROW('2027-02-10', '2027-02-14', 15, 6, 13, 13190000, 9890000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Hà Giang', 'Xe limousine đưa lên Hà Giang, chiều lên cổng trời Quản Bạ. Nghỉ đêm resort tại thành phố Hà Giang.'),
  ROW(2, 'Yên Minh – Đồng Văn – Lũng Cú', 'Qua rừng thông Yên Minh, thăm dinh thự họ Vương và cột cờ Lũng Cú. Nghỉ đêm tại Đồng Văn.'),
  ROW(3, 'Mã Pì Lèng – Mèo Vạc – Bảo Lạc – Cao Bằng', 'Đi thuyền trên sông Nho Quế, sau đó theo cung đường Mèo Vạc – Bảo Lạc sang Cao Bằng, ngắm đèo Khau Cốc Chà. Nghỉ đêm tại thành phố Cao Bằng.'),
  ROW(4, 'Núi Mắt Thần – thác Bản Giốc', 'Ghé núi Mắt Thần ở Hà Quảng, chiều đến Trùng Khánh ngồi bè tre dưới chân thác Bản Giốc, thăm động Ngườm Ngao. Nghỉ đêm tại Trùng Khánh.'),
  ROW(5, 'Hồ Ba Bể – về Hà Nội', 'Di chuyển về Bắc Kạn đi thuyền trên hồ Ba Bể, ăn trưa cá nướng rồi về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MB-013 · Hạ Long – Cát Bà 3 ngày 2 đêm: vịnh Lan Hạ (Tiết kiệm, chi nhánh HN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-013', 'Hạ Long – Cát Bà 3 ngày 2 đêm: vịnh Lan Hạ',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-hai-phong'), @branch, 3, 2,
  'Dòng Tiết kiệm · khởi hành từ Hà Nội. Điểm nhấn: Vịnh Hạ Long, phà Tuần Châu – Gia Luận, vịnh Lan Hạ, pháo đài Thần Công.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-013');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 35, 15, 16, 2590000, 1940000),
  ROW('2026-12-11', '2026-12-13', 35, 15, 14, 2590000, 1940000),
  ROW('2026-12-25', '2026-12-27', 35, 15, 15, 2790000, 2090000),
  ROW('2027-01-08', '2027-01-10', 35, 15, 2, 2390000, 1790000),
  ROW('2027-01-22', '2027-01-24', 35, 15, 2, 2390000, 1790000),
  ROW('2027-02-05', '2027-02-07', 35, 15, 17, 3290000, 2470000),
  ROW('2027-02-19', '2027-02-21', 35, 15, 9, 2590000, 1940000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Hạ Long', 'Khởi hành đi Hạ Long, chiều tắm biển Bãi Cháy, tối dạo chợ đêm. Nghỉ đêm tại Hạ Long.'),
  ROW(2, 'Phà sang Cát Bà – vịnh Lan Hạ', 'Đi phà từ Tuần Châu sang Gia Luận, ngắm vịnh Hạ Long trên đường. Đến Cát Bà, lên tàu thăm vịnh Lan Hạ, làng chài Cái Bèo và tắm biển Ba Trái Đào. Nghỉ đêm tại thị trấn Cát Bà.'),
  ROW(3, 'Pháo đài Thần Công – về Hà Nội', 'Sáng lên pháo đài Thần Công ngắm toàn cảnh vịnh, tắm biển Cát Cò, sau bữa trưa qua phà Cái Viềng về Hải Phòng và về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Thuyền trên làn nước xanh ngọc giữa các đảo đá vôi vịnh Hạ Long', 10),
  ROW('https://images.unsplash.com/photo-1764645859246-8c6db98330a7?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Đảo đá vôi trên vịnh lúc hoàng hôn', 20),
  ROW('https://images.unsplash.com/photo-1772867342647-6e6d87a0b014?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Du thuyền đi qua vịnh giữa các núi đá vôi', 30),
  ROW('https://images.unsplash.com/photo-1748102288847-b2607862c249?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Toàn cảnh các đảo trên vịnh nhìn từ trên cao', 40),
  ROW('https://images.unsplash.com/photo-1697850084120-4896a446a04d?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Du khách chèo kayak qua hang đá trên vịnh', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-014 · Hành trình Tây Bắc 6 ngày: Mai Châu – Điện Biên – Sa Pa (Cao cấp, chi nhánh HN, 4 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-014', 'Hành trình Tây Bắc 6 ngày: Mai Châu – Điện Biên – Sa Pa',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-sa-pa'), @branch, 6, 5,
  'Dòng Cao cấp · khởi hành từ Hà Nội. Điểm nhấn: Bản Lác Mai Châu, cao nguyên Mộc Châu, đèo Pha Đin, di tích Điện Biên Phủ, đèo Ô Quy Hồ, Sa Pa.', 13090000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-014');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-07', '2026-12-12', 24, 6, 23, 13790000, 10340000),
  ROW('2026-12-28', '2027-01-02', 24, 6, 21, 15490000, 11620000),
  ROW('2027-01-18', '2027-01-23', 24, 6, 22, 13090000, 9820000),
  ROW('2027-02-08', '2027-02-13', 24, 6, 20, 17890000, 13420000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Mai Châu', 'Khởi hành đi Hòa Bình, ngắm thung lũng Mai Châu từ đèo Thung Khe. Chiều đạp xe quanh bản Lác, tối xem múa sạp của người Thái. Nghỉ đêm resort tại Mai Châu.'),
  ROW(2, 'Mai Châu – Mộc Châu – Sơn La', 'Dừng ở đồi chè trái tim Mộc Châu và thác Dải Yếm, chiều đến Sơn La thăm Nhà tù Sơn La. Nghỉ đêm tại Sơn La.'),
  ROW(3, 'Sơn La – đèo Pha Đin – Điện Biên Phủ', 'Vượt đèo Pha Đin đến Điện Biên Phủ, thăm Bảo tàng Chiến thắng Điện Biên Phủ, đồi A1 và hầm chỉ huy của tướng De Castries. Nghỉ đêm tại Điện Biên.'),
  ROW(4, 'Điện Biên – Lai Châu', 'Theo quốc lộ 12 qua thị xã Mường Lay bên hồ thủy điện Sơn La, đến Lai Châu nghỉ đêm.'),
  ROW(5, 'Đèo Ô Quy Hồ – Sa Pa', 'Vượt đèo Ô Quy Hồ, dừng ở thác Bạc và cổng trời. Chiều thăm bản Cát Cát, nghỉ đêm khách sạn 5 sao tại Sa Pa.'),
  ROW(6, 'Sa Pa – về Hà Nội', 'Sáng tự do hoặc đi cáp treo Fansipan (tự túc), sau bữa trưa về Hà Nội theo cao tốc Nội Bài – Lào Cai. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1698809807686-42a1f8e14ea3?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Cáp treo vượt trên biển mây', 10),
  ROW('https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi', 20),
  ROW('https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Ruộng bậc thang và nhà nhỏ trong thung lũng núi', 30),
  ROW('https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao', 40),
  ROW('https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi xanh nhìn từ trên cao', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-015 · Tam Đảo – Tây Thiên 2 ngày 1 đêm (Tiết kiệm, chi nhánh HN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-ha-noi');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-015', 'Tam Đảo – Tây Thiên 2 ngày 1 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-tam-dao'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ Hà Nội. Điểm nhấn: Thiền viện Trúc Lâm Tây Thiên, nhà thờ đá Tam Đảo, thác Bạc Tam Đảo.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-015');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 40, 15, 25, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-06', 40, 15, 18, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-13', 40, 15, 6, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-20', 40, 15, 13, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-27', 40, 15, 19, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-03', 40, 15, 3, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-10', 40, 15, 9, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-17', 40, 15, 9, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-24', 40, 15, 3, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-31', 40, 15, 11, 1890000, 1420000),
  ROW('2027-02-06', '2027-02-07', 40, 15, 31, 2190000, 1640000),
  ROW('2027-02-13', '2027-02-14', 40, 15, 8, 1990000, 1490000),
  ROW('2027-02-20', '2027-02-21', 40, 15, 4, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Hà Nội – Tây Thiên – Tam Đảo', 'Khởi hành đi Vĩnh Phúc, lễ Thiền viện Trúc Lâm Tây Thiên và đền Thượng. Chiều lên thị trấn Tam Đảo nhận phòng, tối thưởng thức su su xào, gà đồi nướng.'),
  ROW(2, 'Nhà thờ đá – thác Bạc – về Hà Nội', 'Dạo quanh nhà thờ đá Tam Đảo, đi bộ xuống thác Bạc, sau bữa trưa về Hà Nội. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MB-016 · Hà Nội – Ninh Bình – Hạ Long 4 ngày 3 đêm (Tiêu chuẩn, chi nhánh HCM, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-016', 'Hà Nội – Ninh Bình – Hạ Long 4 ngày 3 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-ha-long'), @branch, 4, 3,
  'Dòng Tiêu chuẩn · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Phố cổ Hà Nội, Tràng An, chùa Bái Đính, du ngoạn vịnh Hạ Long.', 7390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-016');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-03', '2026-12-06', 20, 10, 19, 7790000, 5840000),
  ROW('2026-12-17', '2026-12-20', 20, 10, 19, 7790000, 5840000),
  ROW('2026-12-31', '2027-01-03', 20, 10, 18, 8690000, 6520000),
  ROW('2027-01-14', '2027-01-17', 20, 10, 18, 7390000, 5540000),
  ROW('2027-01-28', '2027-01-31', 20, 10, 16, 7390000, 5540000),
  ROW('2027-02-11', '2027-02-14', 20, 10, 19, 8990000, 6740000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Hà Nội', 'Bay ra Hà Nội, tham quan Văn Miếu – Quốc Tử Giám và hồ Hoàn Kiếm. Tối xem múa rối nước, nghỉ đêm tại Hà Nội.'),
  ROW(2, 'Hà Nội – Ninh Bình', 'Đi Ninh Bình lễ chùa Bái Đính, chiều đi thuyền Tràng An. Nghỉ đêm tại Ninh Bình.'),
  ROW(3, 'Ninh Bình – vịnh Hạ Long', 'Qua Hải Phòng theo cao tốc ra Hạ Long, lên tàu thăm vịnh, hang Sửng Sốt, đảo Ti Tốp. Nghỉ đêm tại Hạ Long.'),
  ROW(4, 'Hạ Long – Nội Bài – TP. Hồ Chí Minh', 'Sáng tự do tắm biển, sau bữa trưa ra sân bay Nội Bài bay về TP. Hồ Chí Minh. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Đường tàu chạy xuyên qua con hẻm', 10),
  ROW('https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Chùa giữa mặt nước và núi đá', 20),
  ROW('https://images.unsplash.com/photo-1748102288847-b2607862c249?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Toàn cảnh các đảo trên vịnh nhìn từ trên cao', 30),
  ROW('https://images.unsplash.com/photo-1778809848221-effdbae7037d?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Phố cổ với cửa hàng và đèn lồng', 40),
  ROW('https://images.unsplash.com/photo-1768158186882-9e7e15e53532?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Cổng đền cổ bên dòng sông và núi', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-017 · Hà Nội – Sa Pa – Fansipan 4 ngày 3 đêm (Tiêu chuẩn, chi nhánh HCM, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-017', 'Hà Nội – Sa Pa – Fansipan 4 ngày 3 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-sa-pa'), @branch, 4, 3,
  'Dòng Tiêu chuẩn · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Lăng Bác, phố cổ Hà Nội, bản Cát Cát, cáp treo Fansipan.', 7390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-017');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-30', 30, 10, 15, 7790000, 5840000),
  ROW('2026-12-11', '2026-12-14', 30, 10, 11, 7790000, 5840000),
  ROW('2026-12-25', '2026-12-28', 30, 10, 12, 8390000, 6290000),
  ROW('2027-01-08', '2027-01-11', 30, 10, 7, 7390000, 5540000),
  ROW('2027-01-22', '2027-01-25', 30, 10, 7, 7390000, 5540000),
  ROW('2027-02-05', '2027-02-08', 30, 10, 21, 10090000, 7570000),
  ROW('2027-02-19', '2027-02-22', 30, 10, 0, 7790000, 5840000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Hà Nội – Sa Pa', 'Bay ra Nội Bài, xe đón đi thẳng Sa Pa theo cao tốc Nội Bài – Lào Cai. Tối dạo nhà thờ đá Sa Pa.'),
  ROW(2, 'Bản Cát Cát – núi Hàm Rồng', 'Sáng đi bộ xuống bản Cát Cát, chiều tham quan núi Hàm Rồng và chợ Sa Pa.'),
  ROW(3, 'Fansipan – về Hà Nội', 'Đi cáp treo lên đỉnh Fansipan, ăn trưa rồi về Hà Nội. Tối dạo phố cổ, nghỉ đêm tại Hà Nội.'),
  ROW(4, 'Hà Nội – TP. Hồ Chí Minh', 'Viếng Lăng Chủ tịch Hồ Chí Minh và chùa Một Cột, sau đó ra sân bay Nội Bài bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1778809848221-effdbae7037d?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Phố cổ với cửa hàng và đèn lồng', 10),
  ROW('https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao', 20),
  ROW('https://images.unsplash.com/photo-1616438096679-620332ede3a2?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Người đội nón lá gánh hàng trên phố', 30),
  ROW('https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Núi xanh nhìn từ trên cao', 40),
  ROW('https://images.unsplash.com/photo-1599708153386-62bf3f035c78?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Công trình kiến trúc cổ giữa hàng cây xanh', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-018 · Hà Nội – Hà Giang 5 ngày 4 đêm: cực Bắc cao nguyên đá (Cao cấp, chi nhánh HCM, 4 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-018', 'Hà Nội – Hà Giang 5 ngày 4 đêm: cực Bắc cao nguyên đá',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-ha-giang'), @branch, 5, 4,
  'Dòng Cao cấp · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Phố cổ Hà Nội, cổng trời Quản Bạ, dinh thự họ Vương, cột cờ Lũng Cú, sông Nho Quế.', 14890000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-018');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-09', '2026-12-13', 20, 6, 5, 15690000, 11770000),
  ROW('2026-12-30', '2027-01-03', 20, 6, 0, 17590000, 13190000),
  ROW('2027-01-20', '2027-01-24', 20, 6, 4, 14890000, 11170000),
  ROW('2027-02-10', '2027-02-14', 20, 6, 5, 18090000, 13570000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Hà Nội', 'Bay ra Hà Nội, chiều tham quan hồ Hoàn Kiếm và phố cổ, tối thưởng thức chả cá Lã Vọng. Nghỉ đêm tại Hà Nội.'),
  ROW(2, 'Hà Nội – Hà Giang – Quản Bạ', 'Xe limousine đưa lên Hà Giang, chiều lên cổng trời Quản Bạ ngắm núi đôi Cô Tiên. Nghỉ đêm resort tại Quản Bạ.'),
  ROW(3, 'Yên Minh – Đồng Văn – Lũng Cú', 'Qua rừng thông Yên Minh, thăm dinh thự họ Vương và cột cờ Lũng Cú. Tối dạo phố cổ Đồng Văn.'),
  ROW(4, 'Mã Pì Lèng – sông Nho Quế – Hà Giang', 'Đi thuyền trên sông Nho Quế qua hẻm Tu Sản, chiều về thành phố Hà Giang nghỉ đêm.'),
  ROW(5, 'Hà Giang – Nội Bài – TP. Hồ Chí Minh', 'Xe đưa thẳng ra sân bay Nội Bài, bay về TP. Hồ Chí Minh. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1616438096679-620332ede3a2?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Người đội nón lá gánh hàng trên phố', 10),
  ROW('https://images.unsplash.com/photo-1599708153386-62bf3f035c78?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Công trình kiến trúc cổ giữa hàng cây xanh', 20),
  ROW('https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Nhà cao tầng lúc hoàng hôn', 30),
  ROW('https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Đường tàu chạy xuyên qua con hẻm', 40),
  ROW('https://images.unsplash.com/photo-1778809848221-effdbae7037d?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Phố cổ với cửa hàng và đèn lồng', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-019 · Hà Nội – du thuyền Hạ Long 3 ngày 2 đêm (Cao cấp, chi nhánh HCM, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-019', 'Hà Nội – du thuyền Hạ Long 3 ngày 2 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-ha-long'), @branch, 3, 2,
  'Dòng Cao cấp · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Ngủ đêm trên du thuyền 5 sao, chèo kayak trên vịnh, phố cổ Hà Nội.', 10490000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-019');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 15, 6, 7, 11090000, 8320000),
  ROW('2026-12-11', '2026-12-13', 15, 6, 3, 11090000, 8320000),
  ROW('2026-12-25', '2026-12-27', 15, 6, 5, 11990000, 8990000),
  ROW('2027-01-08', '2027-01-10', 15, 6, 2, 10490000, 7870000),
  ROW('2027-01-22', '2027-01-24', 15, 6, 2, 10490000, 7870000),
  ROW('2027-02-05', '2027-02-07', 15, 6, 9, 14390000, 10790000),
  ROW('2027-02-19', '2027-02-21', 15, 6, 0, 11090000, 8320000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Hà Nội – Hạ Long', 'Bay ra Nội Bài, xe limousine đưa đến cảng Tuần Châu. Lên du thuyền, chiều chèo kayak qua hang Luồn. Ngủ đêm trên vịnh.'),
  ROW(2, 'Hang Sửng Sốt – Hà Nội', 'Ngắm bình minh trên vịnh, thăm hang Sửng Sốt. Ăn trưa trên tàu rồi về Hà Nội, tối dạo phố cổ.'),
  ROW(3, 'Hà Nội – TP. Hồ Chí Minh', 'Thăm Văn Miếu – Quốc Tử Giám, sau đó ra sân bay bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Thuyền trên làn nước xanh ngọc giữa các đảo đá vôi vịnh Hạ Long', 10),
  ROW('https://images.unsplash.com/photo-1599708153386-62bf3f035c78?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Công trình kiến trúc cổ giữa hàng cây xanh', 20),
  ROW('https://images.unsplash.com/photo-1764645859246-8c6db98330a7?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Đảo đá vôi trên vịnh lúc hoàng hôn', 30),
  ROW('https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Nhà cao tầng lúc hoàng hôn', 40),
  ROW('https://images.unsplash.com/photo-1772867342647-6e6d87a0b014?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Du thuyền đi qua vịnh giữa các núi đá vôi', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MB-020 · Trọn vẹn miền Bắc 7 ngày: Hà Nội – Ninh Bình – Hạ Long – Sa Pa (Cao cấp, chi nhánh HCM, 4 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MB-020', 'Trọn vẹn miền Bắc 7 ngày: Hà Nội – Ninh Bình – Hạ Long – Sa Pa',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-ha-long'), @branch, 7, 6,
  'Dòng Cao cấp · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Phố cổ Hà Nội, Tràng An, du thuyền Hạ Long, bản Cát Cát, đỉnh Fansipan.', 19290000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MB-020');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-06', '2026-12-12', 20, 6, 9, 20290000, 15220000),
  ROW('2026-12-27', '2027-01-02', 20, 6, 3, 22690000, 17020000),
  ROW('2027-01-17', '2027-01-23', 20, 6, 1, 19290000, 14470000),
  ROW('2027-02-07', '2027-02-13', 20, 6, 13, 26390000, 19790000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Hà Nội', 'Bay ra Hà Nội, chiều thăm hồ Hoàn Kiếm, đền Ngọc Sơn, tối xem múa rối nước Thăng Long.'),
  ROW(2, 'Lăng Bác – Văn Miếu – Ninh Bình', 'Sáng viếng Lăng Bác và Văn Miếu, chiều đi Ninh Bình nghỉ đêm resort ven núi đá vôi.'),
  ROW(3, 'Tràng An – Hang Múa', 'Đi thuyền Tràng An, chiều leo Hang Múa ngắm Tam Cốc. Nghỉ đêm tại Ninh Bình.'),
  ROW(4, 'Ninh Bình – du thuyền Hạ Long', 'Ra Hạ Long lên du thuyền, chèo kayak và tắm biển đảo Ti Tốp. Ngủ đêm trên vịnh.'),
  ROW(5, 'Hạ Long – Sa Pa', 'Thăm hang Sửng Sốt, về tàu ăn trưa rồi theo cao tốc về hướng Nội Bài và lên Sa Pa.'),
  ROW(6, 'Fansipan – bản Cát Cát', 'Đi tàu leo núi và cáp treo lên đỉnh Fansipan, chiều thăm bản Cát Cát. Nghỉ đêm tại Sa Pa.'),
  ROW(7, 'Sa Pa – Nội Bài – TP. Hồ Chí Minh', 'Sáng tự do dạo chợ Sa Pa, sau bữa trưa ra sân bay Nội Bài bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Nhà cao tầng lúc hoàng hôn', 10),
  ROW('https://images.unsplash.com/photo-1527428050273-21bd264db1b5?auto=format&fit=crop&w=1920&q=80', 'Ninh Bình: Chùa trên đỉnh núi đá', 20),
  ROW('https://images.unsplash.com/photo-1764645859246-8c6db98330a7?auto=format&fit=crop&w=1920&q=80', 'Hạ Long: Đảo đá vôi trên vịnh lúc hoàng hôn', 30),
  ROW('https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80', 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi', 40),
  ROW('https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1920&q=80', 'Hà Nội: Đường tàu chạy xuyên qua con hẻm', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-001 · Bà Nà Hills một ngày: Cầu Vàng – Làng Pháp (Cao cấp, chi nhánh DN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-001', 'Bà Nà Hills một ngày: Cầu Vàng – Làng Pháp',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-da-nang'), @branch, 1, 0,
  'Dòng Cao cấp · khởi hành từ Đà Nẵng. Điểm nhấn: Cáp treo Bà Nà, Cầu Vàng, vườn hoa Le Jardin D’Amour, Làng Pháp.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-001');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-28', 24, 6, 16, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-05', 24, 6, 15, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-12', 24, 6, 5, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-19', 24, 6, 9, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-26', 24, 6, 11, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-02', 24, 6, 1, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-09', 24, 6, 2, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-16', 24, 6, 0, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-23', 24, 6, 5, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-30', 24, 6, 3, 1790000, 1340000),
  ROW('2027-02-06', '2027-02-06', 24, 6, 16, 2090000, 1570000),
  ROW('2027-02-13', '2027-02-13', 24, 6, 2, 1890000, 1420000),
  ROW('2027-02-20', '2027-02-20', 24, 6, 1, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Bà Nà Hills', 'Xe đón tại khách sạn, lên Bà Nà bằng cáp treo. Dạo Cầu Vàng, vườn hoa Le Jardin D’Amour, hầm rượu Debay và Làng Pháp, ăn trưa buffet trên núi. Chiều xuống núi, về lại khách sạn. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('meal', 'Bữa trưa buffet hoặc set menu', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Du khách trên cây cầu cong được nâng bởi bàn tay đá khổng lồ', 10),
  ROW('https://images.unsplash.com/photo-1781963577464-aae78aa7be67?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Cầu Rồng bắc qua sông, phía sau là thành phố và hàng cọ', 20),
  ROW('https://images.unsplash.com/photo-1674296067534-0f9769040781?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Bãi biển và thành phố nhìn từ trên cao', 30),
  ROW('https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi', 40),
  ROW('https://images.unsplash.com/photo-1780631392137-f3abcbeb16e2?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Pháo hoa rực sáng trên sông và thành phố về đêm', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-002 · Hội An một ngày: rừng dừa Bảy Mẫu – phố cổ đèn lồng (Tiết kiệm, chi nhánh DN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-002', 'Hội An một ngày: rừng dừa Bảy Mẫu – phố cổ đèn lồng',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-hoi-an'), @branch, 1, 0,
  'Dòng Tiết kiệm · khởi hành từ Đà Nẵng. Điểm nhấn: Rừng dừa Bảy Mẫu Cẩm Thanh, chùa Cầu, hội quán Phúc Kiến, thả đèn hoa đăng sông Hoài.', 590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-002');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-28', 30, 15, 18, 590000, 440000),
  ROW('2026-12-05', '2026-12-05', 30, 15, 11, 590000, 440000),
  ROW('2026-12-12', '2026-12-12', 30, 15, 6, 590000, 440000),
  ROW('2026-12-19', '2026-12-19', 30, 15, 5, 590000, 440000),
  ROW('2026-12-26', '2026-12-26', 30, 15, 9, 590000, 440000),
  ROW('2027-01-02', '2027-01-02', 30, 15, 8, 590000, 440000),
  ROW('2027-01-09', '2027-01-09', 30, 15, 8, 590000, 440000),
  ROW('2027-01-16', '2027-01-16', 30, 15, 5, 590000, 440000),
  ROW('2027-01-23', '2027-01-23', 30, 15, 3, 590000, 440000),
  ROW('2027-01-30', '2027-01-30', 30, 15, 5, 590000, 440000),
  ROW('2027-02-06', '2027-02-06', 30, 15, 19, 790000, 590000),
  ROW('2027-02-13', '2027-02-13', 30, 15, 6, 690000, 520000),
  ROW('2027-02-20', '2027-02-20', 30, 15, 4, 590000, 440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Cẩm Thanh – phố cổ Hội An', 'Chiều đi Hội An, ngồi thuyền thúng trong rừng dừa Bảy Mẫu Cẩm Thanh. Vào phố cổ thăm chùa Cầu, hội quán Phúc Kiến và nhà cổ Tấn Ký, ăn tối cao lầu. Thả đèn hoa đăng trên sông Hoài rồi về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('meal', 'Một bữa trưa theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1563354860-799d15199ac3?auto=format&fit=crop&w=1920&q=80', 'Hội An: Đèn lồng nhiều màu sắc thắp sáng về đêm', 10),
  ROW('https://images.unsplash.com/photo-1761150285751-c593ab20159c?auto=format&fit=crop&w=1920&q=80', 'Hội An: Thuyền trên sông trước dãy nhà cổ', 20),
  ROW('https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ treo đèn lồng', 30),
  ROW('https://images.unsplash.com/photo-1652731011413-93d4c5aa5c7c?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ về đêm', 40),
  ROW('https://images.unsplash.com/photo-1787731218441-1ed95e59b54d?auto=format&fit=crop&w=1920&q=80', 'Hội An: Du khách đi qua cây cầu treo đèn lồng đỏ ở Hội An', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-003 · Cố đô Huế 2 ngày 1 đêm qua đèo Hải Vân (Tiêu chuẩn, chi nhánh DN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-003', 'Cố đô Huế 2 ngày 1 đêm qua đèo Hải Vân',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-hue'), @branch, 2, 1,
  'Dòng Tiêu chuẩn · khởi hành từ Đà Nẵng. Điểm nhấn: Đèo Hải Vân, Đại Nội, chùa Thiên Mụ, lăng Khải Định, ca Huế trên sông Hương.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-003');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 25, 10, 9, 2490000, 1870000),
  ROW('2026-12-05', '2026-12-06', 25, 10, 10, 2490000, 1870000),
  ROW('2026-12-12', '2026-12-13', 25, 10, 8, 2490000, 1870000),
  ROW('2026-12-19', '2026-12-20', 25, 10, 10, 2490000, 1870000),
  ROW('2026-12-26', '2026-12-27', 25, 10, 3, 2690000, 2020000),
  ROW('2027-01-02', '2027-01-03', 25, 10, 6, 2390000, 1790000),
  ROW('2027-01-09', '2027-01-10', 25, 10, 6, 2390000, 1790000),
  ROW('2027-01-16', '2027-01-17', 25, 10, 0, 2390000, 1790000),
  ROW('2027-01-23', '2027-01-24', 25, 10, 5, 2390000, 1790000),
  ROW('2027-01-30', '2027-01-31', 25, 10, 4, 2790000, 2090000),
  ROW('2027-02-06', '2027-02-07', 25, 10, 13, 3290000, 2470000),
  ROW('2027-02-13', '2027-02-14', 25, 10, 0, 2890000, 2170000),
  ROW('2027-02-20', '2027-02-21', 25, 10, 1, 2490000, 1870000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – đèo Hải Vân – Đại Nội', 'Vượt đèo Hải Vân, dừng ở đầm Lập An. Chiều tham quan Đại Nội, tối nghe ca Huế trên thuyền rồng sông Hương.'),
  ROW(2, 'Thiên Mụ – lăng Khải Định – về Đà Nẵng', 'Thăm chùa Thiên Mụ, lăng Khải Định, mua mè xửng ở chợ Đông Ba rồi về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1784350725199-b3655c49ce2e?auto=format&fit=crop&w=1920&q=80', 'Huế: Nắng chiếu vào sân đền cổ', 10),
  ROW('https://images.unsplash.com/photo-1664333039578-28ad613ee536?auto=format&fit=crop&w=1920&q=80', 'Huế: Công trình cổ có cầu bắc qua mặt nước', 20),
  ROW('https://images.unsplash.com/photo-1618165220283-e85246c4171c?auto=format&fit=crop&w=1920&q=80', 'Huế: Chùa tháp dưới bầu trời xanh', 30),
  ROW('https://images.unsplash.com/photo-1568775791746-bcc117bcb312?auto=format&fit=crop&w=1920&q=80', 'Huế: Tháp chùa bên hàng cây', 40)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-004 · Đà Nẵng – Hội An – Huế 4 ngày 3 đêm (Tiêu chuẩn, chi nhánh DN, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-004', 'Đà Nẵng – Hội An – Huế 4 ngày 3 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-hoi-an'), @branch, 4, 3,
  'Dòng Tiêu chuẩn · khởi hành từ Đà Nẵng. Điểm nhấn: Bán đảo Sơn Trà, Ngũ Hành Sơn, phố cổ Hội An, Đại Nội Huế.', 4790000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-004');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-03', '2026-12-06', 20, 10, 12, 4990000, 3740000),
  ROW('2026-12-17', '2026-12-20', 20, 10, 3, 4990000, 3740000),
  ROW('2026-12-31', '2027-01-03', 20, 10, 1, 5590000, 4190000),
  ROW('2027-01-14', '2027-01-17', 20, 10, 3, 4790000, 3590000),
  ROW('2027-01-28', '2027-01-31', 20, 10, 4, 4790000, 3590000),
  ROW('2027-02-11', '2027-02-14', 20, 10, 5, 5790000, 4340000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Sơn Trà – Ngũ Hành Sơn – Hội An', 'Viếng chùa Linh Ứng trên bán đảo Sơn Trà, thăm Ngũ Hành Sơn và làng đá Non Nước. Chiều vào Hội An, tối dạo phố cổ.'),
  ROW(2, 'Làng rau Trà Quế – rừng dừa Bảy Mẫu', 'Sáng làm nông dân ở làng rau Trà Quế, chiều đi thuyền thúng Cẩm Thanh. Nghỉ đêm tại Hội An.'),
  ROW(3, 'Hội An – đèo Hải Vân – Huế', 'Ra Huế qua đèo Hải Vân, chiều tham quan Đại Nội và chùa Thiên Mụ. Nghỉ đêm tại Huế.'),
  ROW(4, 'Lăng Tự Đức – về Đà Nẵng', 'Thăm lăng Tự Đức, sau bữa trưa bánh bèo, bánh nậm về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi', 10),
  ROW('https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ treo đèn lồng', 20),
  ROW('https://images.unsplash.com/photo-1664333039578-28ad613ee536?auto=format&fit=crop&w=1920&q=80', 'Huế: Công trình cổ có cầu bắc qua mặt nước', 30),
  ROW('https://images.unsplash.com/photo-1780631392137-f3abcbeb16e2?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Pháo hoa rực sáng trên sông và thành phố về đêm', 40),
  ROW('https://images.unsplash.com/photo-1652731011413-93d4c5aa5c7c?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ về đêm', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-005 · Quảng Bình 3 ngày 2 đêm: Phong Nha – động Thiên Đường (Tiêu chuẩn, chi nhánh DN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-005', 'Quảng Bình 3 ngày 2 đêm: Phong Nha – động Thiên Đường',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-quang-binh'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Đà Nẵng. Điểm nhấn: Động Phong Nha, động Thiên Đường, sông Chày – hang Tối, Vũng Chùa – đảo Yến.', 3590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-005');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 25, 10, 11, 3790000, 2840000),
  ROW('2026-12-11', '2026-12-13', 25, 10, 10, 3790000, 2840000),
  ROW('2026-12-25', '2026-12-27', 25, 10, 9, 4090000, 3070000),
  ROW('2027-01-08', '2027-01-10', 25, 10, 7, 3590000, 2690000),
  ROW('2027-01-22', '2027-01-24', 25, 10, 0, 3590000, 2690000),
  ROW('2027-02-05', '2027-02-07', 25, 10, 16, 4890000, 3670000),
  ROW('2027-02-19', '2027-02-21', 25, 10, 4, 3790000, 2840000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Đồng Hới', 'Khởi hành ra Quảng Bình qua Huế và Quảng Trị. Tối dạo biển Nhật Lệ, nghỉ đêm tại Đồng Hới.'),
  ROW(2, 'Động Phong Nha – động Thiên Đường', 'Đi thuyền trên sông Son vào động Phong Nha, chiều khám phá động Thiên Đường. Nghỉ đêm tại Phong Nha.'),
  ROW(3, 'Sông Chày – hang Tối – Vũng Chùa', 'Chèo kayak, đu dây và tắm bùn ở sông Chày – hang Tối. Trên đường về viếng mộ Đại tướng Võ Nguyên Giáp tại Vũng Chùa – đảo Yến. Về Đà Nẵng buổi tối. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MT-006 · Đảo Lý Sơn 3 ngày 2 đêm (Tiết kiệm, chi nhánh DN, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-006', 'Đảo Lý Sơn 3 ngày 2 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-ly-son'), @branch, 3, 2,
  'Dòng Tiết kiệm · khởi hành từ Đà Nẵng. Điểm nhấn: Cổng Tò Vò, chùa Hang, đỉnh Thới Lới, đảo Bé, cánh đồng tỏi.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-006');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-04', '2026-12-06', 30, 15, 11, 2590000, 1940000),
  ROW('2026-12-18', '2026-12-20', 30, 15, 8, 2590000, 1940000),
  ROW('2027-01-01', '2027-01-03', 30, 15, 0, 2890000, 2170000),
  ROW('2027-01-15', '2027-01-17', 30, 15, 1, 2390000, 1790000),
  ROW('2027-01-29', '2027-01-31', 30, 15, 6, 2790000, 2090000),
  ROW('2027-02-12', '2027-02-14', 30, 15, 0, 2890000, 2170000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – cảng Sa Kỳ – Lý Sơn', 'Xe đưa vào Quảng Ngãi, đi tàu cao tốc từ cảng Sa Kỳ ra đảo. Chiều thăm chùa Hang và cổng Tò Vò lúc hoàng hôn.'),
  ROW(2, 'Đảo Bé – đỉnh Thới Lới', 'Đi ca nô sang đảo Bé tắm biển, lặn ngắm san hô. Chiều lên đỉnh Thới Lới ngắm toàn cảnh đảo và những ruộng tỏi.'),
  ROW(3, 'Lý Sơn – về Đà Nẵng', 'Mua tỏi Lý Sơn làm quà, lên tàu về đất liền rồi về Đà Nẵng. Lịch tàu phụ thuộc thời tiết biển. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MT-007 · Quy Nhơn 3 ngày 2 đêm: Eo Gió – Kỳ Co (Tiêu chuẩn, chi nhánh DN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-007', 'Quy Nhơn 3 ngày 2 đêm: Eo Gió – Kỳ Co',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-quy-nhon'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Đà Nẵng. Điểm nhấn: Eo Gió, bãi Kỳ Co, Ghềnh Ráng Tiên Sa, tháp Đôi, làng chài Nhơn Lý.', 3590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-007');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-26', '2026-11-28', 20, 10, 8, 3790000, 2840000),
  ROW('2026-12-10', '2026-12-12', 20, 10, 7, 3790000, 2840000),
  ROW('2026-12-24', '2026-12-26', 20, 10, 8, 4090000, 3070000),
  ROW('2027-01-07', '2027-01-09', 20, 10, 1, 3590000, 2690000),
  ROW('2027-01-21', '2027-01-23', 20, 10, 4, 3590000, 2690000),
  ROW('2027-02-04', '2027-02-06', 20, 10, 14, 4890000, 3670000),
  ROW('2027-02-18', '2027-02-20', 20, 10, 0, 3790000, 2840000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Quy Nhơn', 'Theo cao tốc và quốc lộ 1 vào Bình Định. Chiều thăm tháp Đôi của người Chăm, tối dạo biển Quy Nhơn.'),
  ROW(2, 'Eo Gió – Kỳ Co', 'Đi ca nô ra bãi Kỳ Co tắm biển, ăn trưa hải sản ở làng chài Nhơn Lý, chiều ngắm Eo Gió.'),
  ROW(3, 'Ghềnh Ráng – về Đà Nẵng', 'Thăm Ghềnh Ráng Tiên Sa và mộ nhà thơ Hàn Mặc Tử, mua bánh ít lá gai rồi về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MT-008 · Quy Nhơn – Phú Yên 4 ngày 3 đêm: Gành Đá Đĩa – Mũi Điện (Tiêu chuẩn, chi nhánh DN, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-008', 'Quy Nhơn – Phú Yên 4 ngày 3 đêm: Gành Đá Đĩa – Mũi Điện',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-phu-yen'), @branch, 4, 3,
  'Dòng Tiêu chuẩn · khởi hành từ Đà Nẵng. Điểm nhấn: Kỳ Co, Eo Gió, Gành Đá Đĩa, Bãi Xép, Mũi Điện, tháp Nhạn.', 4790000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-008');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-02', '2026-12-05', 25, 10, 21, 4990000, 3740000),
  ROW('2026-12-16', '2026-12-19', 25, 10, 23, 4990000, 3740000),
  ROW('2026-12-30', '2027-01-02', 25, 10, 0, 5590000, 4190000),
  ROW('2027-01-13', '2027-01-16', 25, 10, 22, 4790000, 3590000),
  ROW('2027-01-27', '2027-01-30', 25, 10, 22, 4790000, 3590000),
  ROW('2027-02-10', '2027-02-13', 25, 10, 6, 5790000, 4340000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Quy Nhơn', 'Khởi hành vào Quy Nhơn, chiều thăm Ghềnh Ráng Tiên Sa. Nghỉ đêm tại Quy Nhơn.'),
  ROW(2, 'Kỳ Co – Eo Gió – Phú Yên', 'Tắm biển Kỳ Co, ngắm Eo Gió, chiều theo quốc lộ 1 vào Phú Yên. Trên đường ghé Gành Đá Đĩa. Nghỉ đêm tại Tuy Hòa.'),
  ROW(3, 'Mũi Điện – Bãi Xép – tháp Nhạn', 'Đón bình minh ở Mũi Điện, cực Đông đất liền, tắm biển Bãi Môn. Chiều thăm Bãi Xép và tháp Nhạn bên sông Đà Rằng.'),
  ROW(4, 'Tuy Hòa – về Đà Nẵng', 'Thưởng thức mắt cá ngừ đại dương, sau đó về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MT-009 · Tây Nguyên 4 ngày 3 đêm: Kon Tum – Pleiku – Buôn Ma Thuột (Tiết kiệm, chi nhánh DN, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-009', 'Tây Nguyên 4 ngày 3 đêm: Kon Tum – Pleiku – Buôn Ma Thuột',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-buon-ma-thuot'), @branch, 4, 3,
  'Dòng Tiết kiệm · khởi hành từ Đà Nẵng. Điểm nhấn: Nhà thờ gỗ Kon Tum, làng Kon Klor, Biển Hồ Pleiku, Bảo tàng Thế giới Cà phê, thác Dray Nur, Buôn Đôn.', 3190000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-009');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-01', '2026-12-04', 40, 15, 38, 3390000, 2540000),
  ROW('2026-12-15', '2026-12-18', 40, 15, 38, 3390000, 2540000),
  ROW('2026-12-29', '2027-01-01', 40, 15, 37, 3790000, 2840000),
  ROW('2027-01-12', '2027-01-15', 40, 15, 36, 3190000, 2390000),
  ROW('2027-01-26', '2027-01-29', 40, 15, 38, 3190000, 2390000),
  ROW('2027-02-09', '2027-02-12', 40, 15, 36, 3890000, 2920000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Kon Tum', 'Qua Quảng Nam lên Kon Tum theo đường Hồ Chí Minh. Chiều thăm nhà thờ gỗ Kon Tum và nhà rông Kon Klor.'),
  ROW(2, 'Kon Tum – Pleiku', 'Đến Pleiku thăm Biển Hồ, đồi chè Biển Hồ và chùa Minh Thành. Nghỉ đêm tại Pleiku.'),
  ROW(3, 'Pleiku – Buôn Ma Thuột – Buôn Đôn', 'Vào Đắk Lắk, thăm Bảo tàng Thế giới Cà phê, chiều qua cầu treo Buôn Đôn và thác Dray Nur. Tối thưởng thức cà phê Ban Mê.'),
  ROW(4, 'Buôn Ma Thuột – về Đà Nẵng', 'Xe đưa về Đà Nẵng theo quốc lộ 14 và cao tốc, về đến nơi buổi tối. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MT-010 · Huế – Phong Nha 3 ngày 2 đêm (Tiết kiệm, chi nhánh DN, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-010', 'Huế – Phong Nha 3 ngày 2 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-hue'), @branch, 3, 2,
  'Dòng Tiết kiệm · khởi hành từ Đà Nẵng. Điểm nhấn: Đại Nội, chùa Thiên Mụ, động Phong Nha, cầu Hiền Lương – sông Bến Hải.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-010');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-04', '2026-12-06', 35, 15, 12, 2590000, 1940000),
  ROW('2026-12-18', '2026-12-20', 35, 15, 8, 2590000, 1940000),
  ROW('2027-01-01', '2027-01-03', 35, 15, 0, 2890000, 2170000),
  ROW('2027-01-15', '2027-01-17', 35, 15, 9, 2390000, 1790000),
  ROW('2027-01-29', '2027-01-31', 35, 15, 4, 2790000, 2090000),
  ROW('2027-02-12', '2027-02-14', 35, 15, 1, 2890000, 2170000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Huế', 'Qua hầm Hải Vân ra Huế, tham quan Đại Nội và chùa Thiên Mụ. Nghỉ đêm tại Huế.'),
  ROW(2, 'Cầu Hiền Lương – động Phong Nha', 'Dừng ở cầu Hiền Lương bên sông Bến Hải, chiều đi thuyền vào động Phong Nha. Nghỉ đêm tại Phong Nha.'),
  ROW(3, 'Phong Nha – về Đà Nẵng', 'Sáng tự do, sau bữa trưa về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1568775791746-bcc117bcb312?auto=format&fit=crop&w=1920&q=80', 'Huế: Tháp chùa bên hàng cây', 10),
  ROW('https://images.unsplash.com/photo-1784350725199-b3655c49ce2e?auto=format&fit=crop&w=1920&q=80', 'Huế: Nắng chiếu vào sân đền cổ', 20),
  ROW('https://images.unsplash.com/photo-1664333039578-28ad613ee536?auto=format&fit=crop&w=1920&q=80', 'Huế: Công trình cổ có cầu bắc qua mặt nước', 30),
  ROW('https://images.unsplash.com/photo-1618165220283-e85246c4171c?auto=format&fit=crop&w=1920&q=80', 'Huế: Chùa tháp dưới bầu trời xanh', 40)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-011 · Hội An nghỉ dưỡng 3 ngày 2 đêm: resort ven biển – Cù Lao Chàm (Cao cấp, chi nhánh DN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-011', 'Hội An nghỉ dưỡng 3 ngày 2 đêm: resort ven biển – Cù Lao Chàm',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-hoi-an'), @branch, 3, 2,
  'Dòng Cao cấp · khởi hành từ Đà Nẵng. Điểm nhấn: Resort 5 sao ven biển An Bàng, Cù Lao Chàm, lớp nấu ăn làng rau Trà Quế, phố cổ về đêm.', 6590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-011');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 18, 6, 8, 6890000, 5170000),
  ROW('2026-12-11', '2026-12-13', 18, 6, 3, 6890000, 5170000),
  ROW('2026-12-25', '2026-12-27', 18, 6, 5, 7490000, 5620000),
  ROW('2027-01-08', '2027-01-10', 18, 6, 0, 6590000, 4940000),
  ROW('2027-01-22', '2027-01-24', 18, 6, 2, 6590000, 4940000),
  ROW('2027-02-05', '2027-02-07', 18, 6, 12, 8990000, 6740000),
  ROW('2027-02-19', '2027-02-21', 18, 6, 5, 6890000, 5170000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Hội An', 'Nhận phòng resort ven biển, chiều tự do. Tối ăn tối tại một nhà hàng trong phố cổ, thả đèn trên sông Hoài.'),
  ROW(2, 'Cù Lao Chàm', 'Ca nô từ cảng Cửa Đại ra Cù Lao Chàm, lặn ngắm san hô, thăm chùa Hải Tạng và chợ Tân Hiệp. Chiều về resort.'),
  ROW(3, 'Lớp nấu ăn Trà Quế – về Đà Nẵng', 'Học nấu món Quảng tại làng rau Trà Quế, sau bữa trưa xe đưa về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1787731218441-1ed95e59b54d?auto=format&fit=crop&w=1920&q=80', 'Hội An: Du khách đi qua cây cầu treo đèn lồng đỏ ở Hội An', 10),
  ROW('https://images.unsplash.com/photo-1563354860-799d15199ac3?auto=format&fit=crop&w=1920&q=80', 'Hội An: Đèn lồng nhiều màu sắc thắp sáng về đêm', 20),
  ROW('https://images.unsplash.com/photo-1761150285751-c593ab20159c?auto=format&fit=crop&w=1920&q=80', 'Hội An: Thuyền trên sông trước dãy nhà cổ', 30),
  ROW('https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ treo đèn lồng', 40),
  ROW('https://images.unsplash.com/photo-1652731011413-93d4c5aa5c7c?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ về đêm', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-012 · Nha Trang 3 ngày 2 đêm: Hòn Mun – tắm bùn khoáng (Tiêu chuẩn, chi nhánh DN, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-012', 'Nha Trang 3 ngày 2 đêm: Hòn Mun – tắm bùn khoáng',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-nha-trang'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Đà Nẵng. Điểm nhấn: Tháp Bà Ponagar, lặn ngắm san hô Hòn Mun, tắm bùn khoáng, chợ Đầm.', 6190000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-012');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-04', '2026-12-06', 20, 10, 8, 6590000, 4940000),
  ROW('2026-12-18', '2026-12-20', 20, 10, 6, 6590000, 4940000),
  ROW('2027-01-01', '2027-01-03', 20, 10, 3, 7290000, 5470000),
  ROW('2027-01-15', '2027-01-17', 20, 10, 1, 6190000, 4640000),
  ROW('2027-01-29', '2027-01-31', 20, 10, 1, 7190000, 5390000),
  ROW('2027-02-12', '2027-02-14', 20, 10, 0, 7490000, 5620000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Nha Trang', 'Bay vào Cam Ranh, chiều thăm tháp Bà Ponagar và chùa Long Sơn. Tối dạo biển Trần Phú.'),
  ROW(2, 'Vịnh Nha Trang – Hòn Mun', 'Đi tàu ra Hòn Mun lặn ngắm san hô, ăn trưa trên đảo, chiều tắm bùn khoáng nóng.'),
  ROW(3, 'Chợ Đầm – về Đà Nẵng', 'Mua hải sản khô ở chợ Đầm, ra sân bay Cam Ranh bay về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1689326232193-d55f0b7965eb?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Bãi biển với thành phố phía sau', 10),
  ROW('https://images.unsplash.com/photo-1767423656732-ca909689612b?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Thành phố biển nhìn từ đồi hoa', 20),
  ROW('https://images.unsplash.com/photo-1783522712596-e921655528fc?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Thuyền đánh cá trong bến cảng nhộn nhịp', 30),
  ROW('https://images.unsplash.com/photo-1570366290364-5e76a15ae408?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Thành phố và bãi biển ban ngày', 40),
  ROW('https://images.unsplash.com/photo-1533002832-1721d16b4bb9?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Bãi biển nhìn từ trên cao', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-013 · Đà Lạt 3 ngày 2 đêm: nghỉ dưỡng hồ Tuyền Lâm (Cao cấp, chi nhánh DN, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-013', 'Đà Lạt 3 ngày 2 đêm: nghỉ dưỡng hồ Tuyền Lâm',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-da-lat'), @branch, 3, 2,
  'Dòng Cao cấp · khởi hành từ Đà Nẵng. Điểm nhấn: Resort ven hồ Tuyền Lâm, Thiền viện Trúc Lâm, đồi chè Cầu Đất, núi Langbiang.', 10490000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-013');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-26', '2026-11-28', 20, 6, 12, 11090000, 8320000),
  ROW('2026-12-10', '2026-12-12', 20, 6, 3, 11090000, 8320000),
  ROW('2026-12-24', '2026-12-26', 20, 6, 4, 11990000, 8990000),
  ROW('2027-01-07', '2027-01-09', 20, 6, 5, 10490000, 7870000),
  ROW('2027-01-21', '2027-01-23', 20, 6, 0, 10490000, 7870000),
  ROW('2027-02-04', '2027-02-06', 20, 6, 13, 14390000, 10790000),
  ROW('2027-02-18', '2027-02-20', 20, 6, 4, 11090000, 8320000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Đà Lạt', 'Bay đến Liên Khương, nhận phòng resort bên hồ Tuyền Lâm. Chiều thăm Thiền viện Trúc Lâm, tối dạo hồ Xuân Hương.'),
  ROW(2, 'Đồi chè Cầu Đất – Langbiang', 'Săn mây và thăm đồi chè Cầu Đất buổi sáng, chiều lên đỉnh Langbiang bằng xe jeep. Ăn tối lẩu gà lá é.'),
  ROW(3, 'Ga Đà Lạt – về Đà Nẵng', 'Thăm ga Đà Lạt và chợ Đà Lạt, ra sân bay Liên Khương bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1648210777529-fe379b3b14fc?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Nhà thờ có tháp chuông dưới nắng', 10),
  ROW('https://images.unsplash.com/photo-1564396738239-351774a1a50e?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Nhà ven hồ nhìn ra núi dưới trời xanh', 20),
  ROW('https://images.unsplash.com/photo-1678099006439-dba9e4d3f9f5?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Đồng cỏ, rặng cây và núi phía xa', 30),
  ROW('https://images.unsplash.com/photo-1699425413886-a6490b7bd009?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Đồi núi chìm trong sương sớm', 40),
  ROW('https://images.unsplash.com/photo-1741524427564-0173c980c432?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Rừng thông xanh bên mặt hồ yên ả', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-014 · Con đường di sản miền Trung 6 ngày: Phong Nha – Huế – Hội An – Mỹ Sơn (Cao cấp, chi nhánh DN, 4 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-014', 'Con đường di sản miền Trung 6 ngày: Phong Nha – Huế – Hội An – Mỹ Sơn',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-hoi-an'), @branch, 6, 5,
  'Dòng Cao cấp · khởi hành từ Đà Nẵng. Điểm nhấn: Động Phong Nha, Đại Nội Huế, đèo Hải Vân, phố cổ Hội An, thánh địa Mỹ Sơn.', 13090000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-014');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-30', '2026-12-05', 24, 6, 21, 13790000, 10340000),
  ROW('2026-12-21', '2026-12-26', 24, 6, 21, 14890000, 11170000),
  ROW('2027-01-11', '2027-01-16', 24, 6, 21, 13090000, 9820000),
  ROW('2027-02-01', '2027-02-06', 24, 6, 20, 17890000, 13420000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Đà Nẵng – Huế', 'Qua đèo Hải Vân ra Huế, chiều thăm chùa Thiên Mụ, tối nghe ca Huế trên sông Hương. Nghỉ đêm khách sạn 5 sao.'),
  ROW(2, 'Huế – Phong Nha', 'Ra Quảng Bình, đi thuyền vào động Phong Nha. Nghỉ đêm resort tại Phong Nha.'),
  ROW(3, 'Động Thiên Đường – về Huế', 'Khám phá động Thiên Đường, chiều về Huế. Tối thưởng thức ẩm thực cung đình.'),
  ROW(4, 'Đại Nội – lăng Tự Đức – Đà Nẵng', 'Tham quan Đại Nội và lăng Tự Đức, chiều về Đà Nẵng ngắm cầu Rồng về đêm.'),
  ROW(5, 'Thánh địa Mỹ Sơn – Hội An', 'Thăm thánh địa Mỹ Sơn, chiều vào Hội An dạo phố cổ, thả đèn hoa đăng.'),
  ROW(6, 'Hội An – Đà Nẵng', 'Sáng tự do tại Hội An, trưa về Đà Nẵng. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1568775791746-bcc117bcb312?auto=format&fit=crop&w=1920&q=80', 'Huế: Tháp chùa bên hàng cây', 10),
  ROW('https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi', 20),
  ROW('https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ treo đèn lồng', 30),
  ROW('https://images.unsplash.com/photo-1784350725199-b3655c49ce2e?auto=format&fit=crop&w=1920&q=80', 'Huế: Nắng chiếu vào sân đền cổ', 40),
  ROW('https://images.unsplash.com/photo-1780631392137-f3abcbeb16e2?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Pháo hoa rực sáng trên sông và thành phố về đêm', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-015 · Đà Nẵng một ngày: Sơn Trà – Ngũ Hành Sơn – cầu Rồng (Tiết kiệm, chi nhánh DN, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'DN');
SET @origin = (SELECT id FROM locations WHERE code = 'city-da-nang');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-015', 'Đà Nẵng một ngày: Sơn Trà – Ngũ Hành Sơn – cầu Rồng',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-da-nang'), @branch, 1, 0,
  'Dòng Tiết kiệm · khởi hành từ Đà Nẵng. Điểm nhấn: Chùa Linh Ứng Sơn Trà, Ngũ Hành Sơn, làng đá Non Nước, cầu Rồng phun lửa.', 590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-015');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-28', 30, 15, 20, 590000, 440000),
  ROW('2026-12-05', '2026-12-05', 30, 15, 18, 590000, 440000),
  ROW('2026-12-12', '2026-12-12', 30, 15, 7, 590000, 440000),
  ROW('2026-12-19', '2026-12-19', 30, 15, 7, 590000, 440000),
  ROW('2026-12-26', '2026-12-26', 30, 15, 7, 590000, 440000),
  ROW('2027-01-02', '2027-01-02', 30, 15, 2, 590000, 440000),
  ROW('2027-01-09', '2027-01-09', 30, 15, 4, 590000, 440000),
  ROW('2027-01-16', '2027-01-16', 30, 15, 6, 590000, 440000),
  ROW('2027-01-23', '2027-01-23', 30, 15, 8, 590000, 440000),
  ROW('2027-01-30', '2027-01-30', 30, 15, 6, 590000, 440000),
  ROW('2027-02-06', '2027-02-06', 30, 15, 18, 790000, 590000),
  ROW('2027-02-13', '2027-02-13', 30, 15, 8, 690000, 520000),
  ROW('2027-02-20', '2027-02-20', 30, 15, 1, 590000, 440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Sơn Trà – Ngũ Hành Sơn – cầu Rồng', 'Viếng chùa Linh Ứng trên bán đảo Sơn Trà, sau đó thăm Ngũ Hành Sơn và làng đá mỹ nghệ Non Nước. Ăn trưa mì Quảng, chiều tắm biển Mỹ Khê. Tối xem cầu Rồng phun lửa và phun nước lúc 21 giờ thứ Bảy. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('meal', 'Một bữa trưa theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1780631392137-f3abcbeb16e2?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Pháo hoa rực sáng trên sông và thành phố về đêm', 10),
  ROW('https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Du khách trên cây cầu cong được nâng bởi bàn tay đá khổng lồ', 20),
  ROW('https://images.unsplash.com/photo-1781963577464-aae78aa7be67?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Cầu Rồng bắc qua sông, phía sau là thành phố và hàng cọ', 30),
  ROW('https://images.unsplash.com/photo-1674296067534-0f9769040781?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Bãi biển và thành phố nhìn từ trên cao', 40),
  ROW('https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-016 · Đà Lạt 3 ngày 2 đêm từ TP. Hồ Chí Minh (Tiết kiệm, chi nhánh HCM, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-016', 'Đà Lạt 3 ngày 2 đêm từ TP. Hồ Chí Minh',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-da-lat'), @branch, 3, 2,
  'Dòng Tiết kiệm · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Hồ Xuân Hương, thác Datanla, Thiền viện Trúc Lâm, chợ đêm Đà Lạt.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-016');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-04', '2026-12-06', 35, 15, 24, 2590000, 1940000),
  ROW('2026-12-18', '2026-12-20', 35, 15, 6, 2590000, 1940000),
  ROW('2027-01-01', '2027-01-03', 35, 15, 3, 2890000, 2170000),
  ROW('2027-01-15', '2027-01-17', 35, 15, 2, 2390000, 1790000),
  ROW('2027-01-29', '2027-01-31', 35, 15, 6, 2790000, 2090000),
  ROW('2027-02-12', '2027-02-14', 35, 15, 5, 2890000, 2170000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Đà Lạt', 'Khởi hành sáng sớm theo cao tốc Dầu Giây và đèo Bảo Lộc lên Đà Lạt. Tối dạo chợ đêm, ăn bánh tráng nướng.'),
  ROW(2, 'Datanla – Trúc Lâm – hồ Tuyền Lâm', 'Đi máng trượt xuống thác Datanla, lên cáp treo đến Thiền viện Trúc Lâm và hồ Tuyền Lâm. Chiều thăm ga Đà Lạt.'),
  ROW(3, 'Đà Lạt – TP. Hồ Chí Minh', 'Mua dâu tây, mứt Đà Lạt làm quà rồi về TP. Hồ Chí Minh. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1699425413886-a6490b7bd009?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Đồi núi chìm trong sương sớm', 10),
  ROW('https://images.unsplash.com/photo-1741524427564-0173c980c432?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Rừng thông xanh bên mặt hồ yên ả', 20),
  ROW('https://images.unsplash.com/photo-1648210777529-fe379b3b14fc?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Nhà thờ có tháp chuông dưới nắng', 30),
  ROW('https://images.unsplash.com/photo-1564396738239-351774a1a50e?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Nhà ven hồ nhìn ra núi dưới trời xanh', 40),
  ROW('https://images.unsplash.com/photo-1678099006439-dba9e4d3f9f5?auto=format&fit=crop&w=1920&q=80', 'Đà Lạt: Đồng cỏ, rặng cây và núi phía xa', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-017 · Nha Trang 4 ngày 3 đêm: resort vịnh Ninh Vân (Cao cấp, chi nhánh HCM, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-017', 'Nha Trang 4 ngày 3 đêm: resort vịnh Ninh Vân',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-nha-trang'), @branch, 4, 3,
  'Dòng Cao cấp · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Resort 5 sao vịnh Ninh Vân, tháp Bà Ponagar, lặn ngắm san hô Hòn Mun.', 12690000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-017');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-26', '2026-11-29', 20, 6, 11, 13390000, 10040000),
  ROW('2026-12-10', '2026-12-13', 20, 6, 4, 13390000, 10040000),
  ROW('2026-12-24', '2026-12-27', 20, 6, 7, 14490000, 10870000),
  ROW('2027-01-07', '2027-01-10', 20, 6, 1, 12690000, 9520000),
  ROW('2027-01-21', '2027-01-24', 20, 6, 4, 12690000, 9520000),
  ROW('2027-02-04', '2027-02-07', 20, 6, 12, 17390000, 13040000),
  ROW('2027-02-18', '2027-02-21', 20, 6, 5, 13390000, 10040000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Nha Trang – Ninh Vân', 'Bay ra Cam Ranh, ca nô riêng đưa đến resort vịnh Ninh Vân. Chiều tự do tắm biển, ngắm hoàng hôn.'),
  ROW(2, 'Nghỉ dưỡng tại resort', 'Tự do sử dụng hồ bơi, spa và các hoạt động thể thao biển của resort.'),
  ROW(3, 'Hòn Mun – thành phố Nha Trang', 'Đi tàu riêng ra Hòn Mun lặn ngắm san hô, chiều về thành phố thăm tháp Bà Ponagar, nghỉ đêm khách sạn ven biển.'),
  ROW(4, 'Nha Trang – TP. Hồ Chí Minh', 'Sáng tắm biển Trần Phú, ra sân bay Cam Ranh bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1689326232193-d55f0b7965eb?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Bãi biển với thành phố phía sau', 10),
  ROW('https://images.unsplash.com/photo-1767423656732-ca909689612b?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Thành phố biển nhìn từ đồi hoa', 20),
  ROW('https://images.unsplash.com/photo-1783522712596-e921655528fc?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Thuyền đánh cá trong bến cảng nhộn nhịp', 30),
  ROW('https://images.unsplash.com/photo-1570366290364-5e76a15ae408?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Thành phố và bãi biển ban ngày', 40),
  ROW('https://images.unsplash.com/photo-1533002832-1721d16b4bb9?auto=format&fit=crop&w=1920&q=80', 'Nha Trang: Bãi biển nhìn từ trên cao', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-018 · Đà Nẵng – Hội An – Huế 5 ngày 4 đêm (Cao cấp, chi nhánh HCM, 4 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-018', 'Đà Nẵng – Hội An – Huế 5 ngày 4 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-da-nang'), @branch, 5, 4,
  'Dòng Cao cấp · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Bà Nà Hills, Cầu Vàng, phố cổ Hội An, Đại Nội Huế, đèo Hải Vân.', 14890000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-018');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-02', '2026-12-06', 20, 6, 11, 15690000, 11770000),
  ROW('2026-12-23', '2026-12-27', 20, 6, 19, 16990000, 12740000),
  ROW('2027-01-13', '2027-01-17', 20, 6, 1, 14890000, 11170000),
  ROW('2027-02-03', '2027-02-07', 20, 6, 17, 20390000, 15290000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Đà Nẵng', 'Bay ra Đà Nẵng, chiều viếng chùa Linh Ứng Sơn Trà, tắm biển Mỹ Khê. Nghỉ đêm khách sạn 5 sao ven biển.'),
  ROW(2, 'Bà Nà Hills', 'Lên Bà Nà bằng cáp treo, dạo Cầu Vàng và Làng Pháp, ăn trưa buffet trên núi.'),
  ROW(3, 'Ngũ Hành Sơn – Hội An', 'Thăm Ngũ Hành Sơn, chiều vào Hội An dạo phố cổ, tối ăn tối bên sông Hoài.'),
  ROW(4, 'Hội An – Hải Vân – Huế', 'Ra Huế qua đèo Hải Vân, tham quan Đại Nội, tối nghe ca Huế trên sông Hương.'),
  ROW(5, 'Huế – TP. Hồ Chí Minh', 'Thăm chùa Thiên Mụ và lăng Khải Định, ra sân bay Phú Bài bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1674296067534-0f9769040781?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Bãi biển và thành phố nhìn từ trên cao', 10),
  ROW('https://images.unsplash.com/photo-1761150285751-c593ab20159c?auto=format&fit=crop&w=1920&q=80', 'Hội An: Thuyền trên sông trước dãy nhà cổ', 20),
  ROW('https://images.unsplash.com/photo-1568775791746-bcc117bcb312?auto=format&fit=crop&w=1920&q=80', 'Huế: Tháp chùa bên hàng cây', 30),
  ROW('https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80', 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi', 40),
  ROW('https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80', 'Hội An: Người đạp xe trên phố cổ treo đèn lồng', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MT-019 · Quy Nhơn – Phú Yên 4 ngày 3 đêm bay từ TP. Hồ Chí Minh (Tiêu chuẩn, chi nhánh HCM, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-019', 'Quy Nhơn – Phú Yên 4 ngày 3 đêm bay từ TP. Hồ Chí Minh',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-quy-nhon'), @branch, 4, 3,
  'Dòng Tiêu chuẩn · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Kỳ Co, Eo Gió, tháp Đôi, Gành Đá Đĩa, Mũi Điện.', 7390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-019');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-26', '2026-11-29', 20, 10, 10, 7790000, 5840000),
  ROW('2026-12-10', '2026-12-13', 20, 10, 6, 7790000, 5840000),
  ROW('2026-12-24', '2026-12-27', 20, 10, 9, 8390000, 6290000),
  ROW('2027-01-07', '2027-01-10', 20, 10, 4, 7390000, 5540000),
  ROW('2027-01-21', '2027-01-24', 20, 10, 1, 7390000, 5540000),
  ROW('2027-02-04', '2027-02-07', 20, 10, 14, 10090000, 7570000),
  ROW('2027-02-18', '2027-02-21', 20, 10, 2, 7790000, 5840000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Quy Nhơn', 'Bay đến Phù Cát, chiều thăm tháp Đôi và Ghềnh Ráng Tiên Sa. Nghỉ đêm tại Quy Nhơn.'),
  ROW(2, 'Kỳ Co – Eo Gió', 'Ca nô ra Kỳ Co tắm biển, ăn trưa hải sản tại Nhơn Lý, chiều ngắm Eo Gió.'),
  ROW(3, 'Quy Nhơn – Gành Đá Đĩa – Tuy Hòa', 'Vào Phú Yên thăm Gành Đá Đĩa, chiều tắm biển Bãi Xép. Nghỉ đêm tại Tuy Hòa.'),
  ROW(4, 'Mũi Điện – TP. Hồ Chí Minh', 'Đón bình minh ở Mũi Điện, sau bữa trưa ra sân bay Tuy Hòa bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MT-020 · Mũi Né 2 ngày 1 đêm: đồi cát bay – Bàu Trắng (Tiết kiệm, chi nhánh HCM, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MT-020', 'Mũi Né 2 ngày 1 đêm: đồi cát bay – Bàu Trắng',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-mui-ne'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Đồi cát bay, đồi cát trắng Bàu Trắng, suối Tiên, làng chài Mũi Né, tháp Pô Sah Inư.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MT-020');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 30, 15, 13, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-06', 30, 15, 14, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-13', 30, 15, 10, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-20', 30, 15, 14, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-27', 30, 15, 7, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-03', 30, 15, 4, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-10', 30, 15, 0, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-17', 30, 15, 3, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-24', 30, 15, 2, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-31', 30, 15, 5, 1890000, 1420000),
  ROW('2027-02-06', '2027-02-07', 30, 15, 15, 2190000, 1640000),
  ROW('2027-02-13', '2027-02-14', 30, 15, 1, 1990000, 1490000),
  ROW('2027-02-20', '2027-02-21', 30, 15, 3, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Mũi Né', 'Theo cao tốc Long Thành – Dầu Giây và cao tốc Phan Thiết ra Mũi Né. Chiều thăm tháp Pô Sah Inư, trượt cát ở đồi cát bay và lội suối Tiên. Tối ăn hải sản ở làng chài.'),
  ROW(2, 'Bàu Trắng – làng chài – về TP. Hồ Chí Minh', 'Đón bình minh ở đồi cát trắng Bàu Trắng, ghé làng chài Mũi Né mua hải sản, sau bữa trưa về TP. Hồ Chí Minh. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-001 · Củ Chi – Tây Ninh một ngày: địa đạo – núi Bà Đen (Tiết kiệm, chi nhánh HCM, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-001', 'Củ Chi – Tây Ninh một ngày: địa đạo – núi Bà Đen',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-tay-ninh'), @branch, 1, 0,
  'Dòng Tiết kiệm · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Địa đạo Củ Chi, Tòa Thánh Cao Đài Tây Ninh, cáp treo núi Bà Đen.', 590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-001');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-29', '2026-11-29', 35, 15, 22, 590000, 440000),
  ROW('2026-12-06', '2026-12-06', 35, 15, 13, 590000, 440000),
  ROW('2026-12-13', '2026-12-13', 35, 15, 11, 590000, 440000),
  ROW('2026-12-20', '2026-12-20', 35, 15, 11, 590000, 440000),
  ROW('2026-12-27', '2026-12-27', 35, 15, 5, 590000, 440000),
  ROW('2027-01-03', '2027-01-03', 35, 15, 2, 590000, 440000),
  ROW('2027-01-10', '2027-01-10', 35, 15, 7, 590000, 440000),
  ROW('2027-01-17', '2027-01-17', 35, 15, 5, 590000, 440000),
  ROW('2027-01-24', '2027-01-24', 35, 15, 0, 590000, 440000),
  ROW('2027-01-31', '2027-01-31', 35, 15, 2, 590000, 440000),
  ROW('2027-02-07', '2027-02-07', 35, 15, 25, 790000, 590000),
  ROW('2027-02-14', '2027-02-14', 35, 15, 6, 690000, 520000),
  ROW('2027-02-21', '2027-02-21', 35, 15, 7, 590000, 440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Củ Chi – Tây Ninh', 'Sáng thăm địa đạo Củ Chi, thử bò qua đường hầm và ăn khoai mì chấm muối mè. Đến Tây Ninh dự lễ trưa tại Tòa Thánh Cao Đài, chiều đi cáp treo lên núi Bà Đen viếng chùa Bà. Về TP. Hồ Chí Minh buổi tối. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('meal', 'Một bữa trưa theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-002 · Vũng Tàu 2 ngày 1 đêm: tượng Chúa Kitô – Bạch Dinh (Tiêu chuẩn, chi nhánh HCM, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-002', 'Vũng Tàu 2 ngày 1 đêm: tượng Chúa Kitô – Bạch Dinh',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-vung-tau'), @branch, 2, 1,
  'Dòng Tiêu chuẩn · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Tượng Chúa Kitô Vua, ngọn hải đăng Vũng Tàu, Bạch Dinh, bãi Sau.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-002');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 30, 10, 17, 2490000, 1870000),
  ROW('2026-12-05', '2026-12-06', 30, 10, 18, 2490000, 1870000),
  ROW('2026-12-12', '2026-12-13', 30, 10, 14, 2490000, 1870000),
  ROW('2026-12-19', '2026-12-20', 30, 10, 11, 2490000, 1870000),
  ROW('2026-12-26', '2026-12-27', 30, 10, 14, 2690000, 2020000),
  ROW('2027-01-02', '2027-01-03', 30, 10, 5, 2390000, 1790000),
  ROW('2027-01-09', '2027-01-10', 30, 10, 5, 2390000, 1790000),
  ROW('2027-01-16', '2027-01-17', 30, 10, 2, 2390000, 1790000),
  ROW('2027-01-23', '2027-01-24', 30, 10, 8, 2390000, 1790000),
  ROW('2027-01-30', '2027-01-31', 30, 10, 2, 2790000, 2090000),
  ROW('2027-02-06', '2027-02-07', 30, 10, 22, 3290000, 2470000),
  ROW('2027-02-13', '2027-02-14', 30, 10, 1, 2890000, 2170000),
  ROW('2027-02-20', '2027-02-21', 30, 10, 3, 2490000, 1870000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Vũng Tàu', 'Theo cao tốc Long Thành và quốc lộ 51 ra Vũng Tàu, ăn trưa bánh khọt. Chiều leo lên tượng Chúa Kitô Vua, tắm biển bãi Sau.'),
  ROW(2, 'Hải đăng – Bạch Dinh – về TP. Hồ Chí Minh', 'Lên ngọn hải đăng ngắm thành phố, thăm Bạch Dinh, mua hải sản khô ở chợ Xóm Lưới rồi về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-003 · Côn Đảo 3 ngày 2 đêm: hành hương và nghỉ dưỡng (Cao cấp, chi nhánh HCM, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-003', 'Côn Đảo 3 ngày 2 đêm: hành hương và nghỉ dưỡng',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-con-dao'), @branch, 3, 2,
  'Dòng Cao cấp · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Nhà tù Côn Đảo, nghĩa trang Hàng Dương, miếu Bà Phi Yến, bãi Đầm Trầu, resort 5 sao.', 10490000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-003');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 20, 6, 12, 11090000, 8320000),
  ROW('2026-12-11', '2026-12-13', 20, 6, 5, 11090000, 8320000),
  ROW('2026-12-25', '2026-12-27', 20, 6, 6, 11990000, 8990000),
  ROW('2027-01-08', '2027-01-10', 20, 6, 3, 10490000, 7870000),
  ROW('2027-01-22', '2027-01-24', 20, 6, 4, 10490000, 7870000),
  ROW('2027-02-05', '2027-02-07', 20, 6, 12, 14390000, 10790000),
  ROW('2027-02-19', '2027-02-21', 20, 6, 3, 11090000, 8320000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Côn Đảo', 'Bay ra Côn Đảo, nhận phòng resort. Chiều thăm Bảo tàng Côn Đảo, trại Phú Hải và chuồng cọp. Tối viếng nghĩa trang Hàng Dương và mộ chị Võ Thị Sáu.'),
  ROW(2, 'Miếu Bà Phi Yến – bãi Đầm Trầu', 'Viếng miếu Bà Phi Yến, chùa Núi Một, chiều tắm biển bãi Đầm Trầu và ngắm máy bay hạ cánh sát bãi.'),
  ROW(3, 'Côn Đảo – TP. Hồ Chí Minh', 'Sáng tự do tại resort, ra sân bay Cỏ Ống bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-004 · Phú Quốc 4 ngày 3 đêm: Nam đảo – cáp treo Hòn Thơm (Tiêu chuẩn, chi nhánh HCM, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-004', 'Phú Quốc 4 ngày 3 đêm: Nam đảo – cáp treo Hòn Thơm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-phu-quoc'), @branch, 4, 3,
  'Dòng Tiêu chuẩn · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Cáp treo Hòn Thơm, Bãi Sao, lặn ngắm san hô An Thới, chợ đêm Phú Quốc.', 7390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-004');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-03', '2026-12-06', 30, 10, 15, 7790000, 5840000),
  ROW('2026-12-17', '2026-12-20', 30, 10, 5, 7790000, 5840000),
  ROW('2026-12-31', '2027-01-03', 30, 10, 5, 8690000, 6520000),
  ROW('2027-01-14', '2027-01-17', 30, 10, 4, 7390000, 5540000),
  ROW('2027-01-28', '2027-01-31', 30, 10, 5, 7390000, 5540000),
  ROW('2027-02-11', '2027-02-14', 30, 10, 1, 8990000, 6740000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'TP. Hồ Chí Minh – Phú Quốc', 'Bay ra Phú Quốc, chiều thăm Dinh Cậu, tối dạo chợ đêm Phú Quốc.'),
  ROW(2, 'Nam đảo – cáp treo Hòn Thơm', 'Thăm nhà tù Phú Quốc, nhà thùng nước mắm, đi cáp treo vượt biển sang Hòn Thơm. Chiều tắm biển Bãi Sao.'),
  ROW(3, 'Câu cá – lặn ngắm san hô', 'Đi tàu quanh quần đảo An Thới, câu cá và lặn ngắm san hô. Tối ngắm hoàng hôn ở thị trấn Hoàng Hôn.'),
  ROW(4, 'Phú Quốc – TP. Hồ Chí Minh', 'Thăm cơ sở nuôi cấy ngọc trai, ra sân bay bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1698809807960-758cf416e96e?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi biển lúc hoàng hôn với con thuyền trên mặt nước', 10),
  ROW('https://images.unsplash.com/photo-1758737922322-b806a5c431a3?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Thị trấn ven biển với bãi cát và nước biển xanh ngọc', 20),
  ROW('https://images.unsplash.com/photo-1732243395944-cb3ff9311091?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi cát trắng và hàng dừa bên bờ biển', 30),
  ROW('https://images.unsplash.com/photo-1758657281824-239a1bfb3c92?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Cáp treo vượt biển nhìn về thị trấn ven biển', 40),
  ROW('https://images.unsplash.com/photo-1779513694945-ca77ad0c3eaa?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Tháp đồng hồ bên bờ biển lúc hoàng hôn', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MN-005 · Sài Gòn một ngày: Dinh Độc Lập – chợ Bến Thành (Tiêu chuẩn, chi nhánh HCM, 12 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'HCM');
SET @origin = (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-005', 'Sài Gòn một ngày: Dinh Độc Lập – chợ Bến Thành',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-tp-ho-chi-minh'), @branch, 1, 0,
  'Dòng Tiêu chuẩn · khởi hành từ TP. Hồ Chí Minh. Điểm nhấn: Dinh Độc Lập, Bưu điện Thành phố, Bảo tàng Chứng tích Chiến tranh, chợ Bến Thành, phố đi bộ Nguyễn Huệ.', 790000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-005');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-01', '2026-12-01', 20, 10, 13, 890000, 670000),
  ROW('2026-12-08', '2026-12-08', 20, 10, 17, 890000, 670000),
  ROW('2026-12-15', '2026-12-15', 20, 10, 6, 890000, 670000),
  ROW('2026-12-22', '2026-12-22', 20, 10, 17, 990000, 740000),
  ROW('2026-12-29', '2026-12-29', 20, 10, 4, 990000, 740000),
  ROW('2027-01-05', '2027-01-05', 20, 10, 19, 790000, 590000),
  ROW('2027-01-12', '2027-01-12', 20, 10, 2, 790000, 590000),
  ROW('2027-01-19', '2027-01-19', 20, 10, 19, 790000, 590000),
  ROW('2027-01-26', '2027-01-26', 20, 10, 2, 790000, 590000),
  ROW('2027-02-02', '2027-02-02', 20, 10, 16, 990000, 740000),
  ROW('2027-02-09', '2027-02-09', 20, 10, 4, 990000, 740000),
  ROW('2027-02-16', '2027-02-16', 20, 10, 18, 890000, 670000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Dinh Độc Lập – Bưu điện – chợ Bến Thành', 'Tham quan Dinh Độc Lập và Bảo tàng Chứng tích Chiến tranh, ngắm Nhà thờ Đức Bà từ bên ngoài và Bưu điện Thành phố. Ăn trưa cơm tấm, chiều mua sắm ở chợ Bến Thành, tối dạo phố đi bộ Nguyễn Huệ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('meal', 'Một bữa trưa với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1591269469224-0479a5f956c6?auto=format&fit=crop&w=1920&q=80', 'TP. Hồ Chí Minh: Đường chân trời thành phố bên kia sông', 10),
  ROW('https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1920&q=80', 'TP. Hồ Chí Minh: Đường chân trời thành phố về đêm', 20),
  ROW('https://images.unsplash.com/photo-1680525534259-773f7e73b687?auto=format&fit=crop&w=1920&q=80', 'TP. Hồ Chí Minh: Thành phố về đêm với cây cầu phía trước', 30),
  ROW('https://images.unsplash.com/photo-1602646994030-464f98de5e5c?auto=format&fit=crop&w=1920&q=80', 'TP. Hồ Chí Minh: Nhà cao tầng nhìn từ trên cao ban ngày', 40),
  ROW('https://images.unsplash.com/photo-1773489736083-66d0c966fa3b?auto=format&fit=crop&w=1920&q=80', 'TP. Hồ Chí Minh: Xe máy chạy qua khu chợ trước dãy nhà cũ', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MN-006 · Cần Thơ một ngày: chợ nổi Cái Răng – vườn trái cây (Tiết kiệm, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-006', 'Cần Thơ một ngày: chợ nổi Cái Răng – vườn trái cây',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-can-tho'), @branch, 1, 0,
  'Dòng Tiết kiệm · khởi hành từ Cần Thơ. Điểm nhấn: Chợ nổi Cái Răng, lò hủ tiếu, vườn trái cây Phong Điền, nhà cổ Bình Thủy.', 590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-006');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-28', 35, 15, 13, 590000, 440000),
  ROW('2026-12-05', '2026-12-05', 35, 15, 21, 590000, 440000),
  ROW('2026-12-12', '2026-12-12', 35, 15, 6, 590000, 440000),
  ROW('2026-12-19', '2026-12-19', 35, 15, 7, 590000, 440000),
  ROW('2026-12-26', '2026-12-26', 35, 15, 7, 590000, 440000),
  ROW('2027-01-02', '2027-01-02', 35, 15, 0, 590000, 440000),
  ROW('2027-01-09', '2027-01-09', 35, 15, 1, 590000, 440000),
  ROW('2027-01-16', '2027-01-16', 35, 15, 3, 590000, 440000),
  ROW('2027-01-23', '2027-01-23', 35, 15, 1, 590000, 440000),
  ROW('2027-01-30', '2027-01-30', 35, 15, 6, 590000, 440000),
  ROW('2027-02-06', '2027-02-06', 35, 15, 25, 790000, 590000),
  ROW('2027-02-13', '2027-02-13', 35, 15, 6, 690000, 520000),
  ROW('2027-02-20', '2027-02-20', 35, 15, 2, 590000, 440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Chợ nổi Cái Răng – Phong Điền – Bình Thủy', 'Xuống thuyền từ bến Ninh Kiều lúc 5 giờ 30 đi chợ nổi Cái Răng, ăn sáng hủ tiếu trên ghe và xem làm hủ tiếu. Thăm vườn trái cây ở Phong Điền, chiều tham quan nhà cổ Bình Thủy và chùa Ông. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('meal', 'Một bữa trưa theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-007 · Châu Đốc – rừng tràm Trà Sư 2 ngày 1 đêm (Tiết kiệm, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-007', 'Châu Đốc – rừng tràm Trà Sư 2 ngày 1 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-an-giang'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ Cần Thơ. Điểm nhấn: Rừng tràm Trà Sư, miếu Bà Chúa Xứ núi Sam, Tây An cổ tự, làng Chăm Đa Phước, làng bè.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-007');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 35, 15, 21, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-06', 35, 15, 23, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-13', 35, 15, 6, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-20', 35, 15, 9, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-27', 35, 15, 14, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-03', 35, 15, 1, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-10', 35, 15, 2, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-17', 35, 15, 10, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-24', 35, 15, 6, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-31', 35, 15, 6, 1890000, 1420000),
  ROW('2027-02-06', '2027-02-07', 35, 15, 19, 2190000, 1640000),
  ROW('2027-02-13', '2027-02-14', 35, 15, 3, 1990000, 1490000),
  ROW('2027-02-20', '2027-02-21', 35, 15, 2, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Châu Đốc – núi Sam', 'Qua Long Xuyên đến Châu Đốc, viếng miếu Bà Chúa Xứ, Tây An cổ tự và lăng Thoại Ngọc Hầu dưới chân núi Sam. Tối ăn lẩu mắm, nghỉ đêm tại Châu Đốc.'),
  ROW(2, 'Làng bè – rừng tràm Trà Sư – về Cần Thơ', 'Đi thuyền thăm làng bè nuôi cá và làng Chăm Đa Phước, sau đó vào rừng tràm Trà Sư bằng xuồng máy và xuồng chèo. Về Cần Thơ buổi chiều. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-008 · Bến Tre một ngày: xứ dừa – xuồng ba lá (Tiết kiệm, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-008', 'Bến Tre một ngày: xứ dừa – xuồng ba lá',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-ben-tre'), @branch, 1, 0,
  'Dòng Tiết kiệm · khởi hành từ Cần Thơ. Điểm nhấn: Cồn Phụng, chèo xuồng ba lá rạch dừa nước, lò kẹo dừa, đờn ca tài tử.', 590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-008');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-29', '2026-11-29', 30, 15, 12, 590000, 440000),
  ROW('2026-12-06', '2026-12-06', 30, 15, 14, 590000, 440000),
  ROW('2026-12-13', '2026-12-13', 30, 15, 9, 590000, 440000),
  ROW('2026-12-20', '2026-12-20', 30, 15, 13, 590000, 440000),
  ROW('2026-12-27', '2026-12-27', 30, 15, 12, 590000, 440000),
  ROW('2027-01-03', '2027-01-03', 30, 15, 3, 590000, 440000),
  ROW('2027-01-10', '2027-01-10', 30, 15, 2, 590000, 440000),
  ROW('2027-01-17', '2027-01-17', 30, 15, 2, 590000, 440000),
  ROW('2027-01-24', '2027-01-24', 30, 15, 6, 590000, 440000),
  ROW('2027-01-31', '2027-01-31', 30, 15, 2, 590000, 440000),
  ROW('2027-02-07', '2027-02-07', 30, 15, 15, 790000, 590000),
  ROW('2027-02-14', '2027-02-14', 30, 15, 0, 690000, 520000),
  ROW('2027-02-21', '2027-02-21', 30, 15, 3, 590000, 440000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Bến Tre – cồn Phụng', 'Khởi hành đi Bến Tre qua cầu Rạch Miễu, đi thuyền sang cồn Phụng. Ngồi xuồng ba lá vào rạch dừa nước, thăm lò kẹo dừa, nghe đờn ca tài tử và ăn trái cây. Ăn trưa cá tai tượng chiên xù, chiều về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('meal', 'Một bữa trưa theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-009 · Đất Mũi Cà Mau 2 ngày 1 đêm (Tiêu chuẩn, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-009', 'Đất Mũi Cà Mau 2 ngày 1 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-ca-mau'), @branch, 2, 1,
  'Dòng Tiêu chuẩn · khởi hành từ Cần Thơ. Điểm nhấn: Mũi Cà Mau, cột mốc tọa độ quốc gia, rừng đước, Vườn quốc gia Mũi Cà Mau.', 2390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-009');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-28', 30, 10, 11, 2490000, 1870000),
  ROW('2026-12-04', '2026-12-05', 30, 10, 20, 2490000, 1870000),
  ROW('2026-12-11', '2026-12-12', 30, 10, 13, 2490000, 1870000),
  ROW('2026-12-18', '2026-12-19', 30, 10, 4, 2490000, 1870000),
  ROW('2026-12-25', '2026-12-26', 30, 10, 10, 2690000, 2020000),
  ROW('2027-01-01', '2027-01-02', 30, 10, 8, 2790000, 2090000),
  ROW('2027-01-08', '2027-01-09', 30, 10, 0, 2390000, 1790000),
  ROW('2027-01-15', '2027-01-16', 30, 10, 2, 2390000, 1790000),
  ROW('2027-01-22', '2027-01-23', 30, 10, 0, 2390000, 1790000),
  ROW('2027-01-29', '2027-01-30', 30, 10, 7, 2790000, 2090000),
  ROW('2027-02-05', '2027-02-06', 30, 10, 22, 3290000, 2470000),
  ROW('2027-02-12', '2027-02-13', 30, 10, 7, 2890000, 2170000),
  ROW('2027-02-19', '2027-02-20', 30, 10, 3, 2490000, 1870000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – thành phố Cà Mau', 'Qua Hậu Giang, Bạc Liêu đến Cà Mau, chiều thăm chợ nổi Cà Mau và công viên Hồng Bàng. Tối ăn lẩu mắm U Minh.'),
  ROW(2, 'Đất Mũi – về Cần Thơ', 'Ca nô từ Cà Mau xuôi sông xuyên rừng đước ra Đất Mũi, chụp ảnh biểu tượng con tàu và cột mốc tọa độ quốc gia, đi bộ trên cầu gỗ trong Vườn quốc gia Mũi Cà Mau. Chiều về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-010 · Sóc Trăng – Bạc Liêu – Cà Mau 3 ngày 2 đêm (Tiêu chuẩn, chi nhánh CT, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-010', 'Sóc Trăng – Bạc Liêu – Cà Mau 3 ngày 2 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-ca-mau'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Cần Thơ. Điểm nhấn: Chùa Dơi, chùa Chén Kiểu, nhà Công tử Bạc Liêu, cánh đồng điện gió, Đất Mũi.', 3590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-010');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-03', '2026-12-05', 30, 10, 10, 3790000, 2840000),
  ROW('2026-12-17', '2026-12-19', 30, 10, 4, 3790000, 2840000),
  ROW('2026-12-31', '2027-01-02', 30, 10, 0, 4190000, 3140000),
  ROW('2027-01-14', '2027-01-16', 30, 10, 3, 3590000, 2690000),
  ROW('2027-01-28', '2027-01-30', 30, 10, 0, 3590000, 2690000),
  ROW('2027-02-11', '2027-02-13', 30, 10, 0, 4290000, 3220000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Sóc Trăng – Bạc Liêu', 'Thăm chùa Dơi và chùa Chén Kiểu của người Khmer ở Sóc Trăng, ăn trưa bún nước lèo. Chiều đến Bạc Liêu thăm nhà Công tử Bạc Liêu, tối nghe đờn ca tài tử tại khu lưu niệm nhạc sĩ Cao Văn Lầu.'),
  ROW(2, 'Điện gió Bạc Liêu – Cà Mau – Đất Mũi', 'Ngắm cánh đồng điện gió ven biển, sau đó đi Cà Mau và ca nô ra Đất Mũi. Nghỉ đêm tại Năm Căn hoặc Cà Mau.'),
  ROW(3, 'Cà Mau – về Cần Thơ', 'Sáng thăm chợ Cà Mau, mua khô cá, mật ong U Minh rồi về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-011 · Phú Quốc 3 ngày 2 đêm bay từ Cần Thơ (Tiêu chuẩn, chi nhánh CT, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-011', 'Phú Quốc 3 ngày 2 đêm bay từ Cần Thơ',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-phu-quoc'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Cần Thơ. Điểm nhấn: Cáp treo Hòn Thơm, Bãi Sao, Grand World, chợ đêm Phú Quốc.', 6190000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-011');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-27', '2026-11-29', 20, 10, 12, 6590000, 4940000),
  ROW('2026-12-11', '2026-12-13', 20, 10, 8, 6590000, 4940000),
  ROW('2026-12-25', '2026-12-27', 20, 10, 4, 7090000, 5320000),
  ROW('2027-01-08', '2027-01-10', 20, 10, 2, 6190000, 4640000),
  ROW('2027-01-22', '2027-01-24', 20, 10, 0, 6190000, 4640000),
  ROW('2027-02-05', '2027-02-07', 20, 10, 10, 8490000, 6370000),
  ROW('2027-02-19', '2027-02-21', 20, 10, 0, 6590000, 4940000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Phú Quốc', 'Bay từ Cần Thơ ra Phú Quốc, chiều thăm Grand World, tối dạo chợ đêm Phú Quốc.'),
  ROW(2, 'Nam đảo – Hòn Thơm', 'Thăm nhà thùng nước mắm, đi cáp treo sang Hòn Thơm, chiều tắm biển Bãi Sao.'),
  ROW(3, 'Phú Quốc – Cần Thơ', 'Thăm Dinh Cậu, mua tiêu và nước mắm làm quà, ra sân bay bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1732243395944-cb3ff9311091?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi cát trắng và hàng dừa bên bờ biển', 10),
  ROW('https://images.unsplash.com/photo-1758657281824-239a1bfb3c92?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Cáp treo vượt biển nhìn về thị trấn ven biển', 20),
  ROW('https://images.unsplash.com/photo-1779513694945-ca77ad0c3eaa?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Tháp đồng hồ bên bờ biển lúc hoàng hôn', 30),
  ROW('https://images.unsplash.com/photo-1698809807960-758cf416e96e?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi biển lúc hoàng hôn với con thuyền trên mặt nước', 40),
  ROW('https://images.unsplash.com/photo-1758737922322-b806a5c431a3?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Thị trấn ven biển với bãi cát và nước biển xanh ngọc', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MN-012 · Phú Quốc nghỉ dưỡng 5 ngày 4 đêm: resort Bãi Khem (Cao cấp, chi nhánh CT, 5 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-012', 'Phú Quốc nghỉ dưỡng 5 ngày 4 đêm: resort Bãi Khem',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-phu-quoc'), @branch, 5, 4,
  'Dòng Cao cấp · khởi hành từ Cần Thơ. Điểm nhấn: Resort 5 sao, du thuyền ngắm hoàng hôn, lặn ngắm san hô Hòn Móng Tay, cáp treo Hòn Thơm.', 14890000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-012');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-25', '2026-11-29', 20, 6, 18, 15690000, 11770000),
  ROW('2026-12-16', '2026-12-20', 20, 6, 8, 15690000, 11770000),
  ROW('2027-01-06', '2027-01-10', 20, 6, 18, 14890000, 11170000),
  ROW('2027-01-27', '2027-01-31', 20, 6, 1, 14890000, 11170000),
  ROW('2027-02-17', '2027-02-21', 20, 6, 19, 15690000, 11770000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Phú Quốc', 'Bay ra Phú Quốc, xe riêng đưa về resort phía Nam đảo. Chiều tự do tắm biển.'),
  ROW(2, 'Nghỉ dưỡng – spa', 'Tự do tại resort, buổi chiều có một liệu trình spa 60 phút.'),
  ROW(3, 'Quần đảo An Thới – Hòn Móng Tay', 'Ca nô riêng đi Hòn Móng Tay, lặn ngắm san hô và câu cá, ăn trưa hải sản trên đảo.'),
  ROW(4, 'Hòn Thơm – du thuyền hoàng hôn', 'Đi cáp treo sang Hòn Thơm, chiều lên du thuyền ngắm hoàng hôn và dùng bữa tối trên biển.'),
  ROW(5, 'Phú Quốc – Cần Thơ', 'Sáng tự do, ra sân bay bay về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1758657281824-239a1bfb3c92?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Cáp treo vượt biển nhìn về thị trấn ven biển', 10),
  ROW('https://images.unsplash.com/photo-1779513694945-ca77ad0c3eaa?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Tháp đồng hồ bên bờ biển lúc hoàng hôn', 20),
  ROW('https://images.unsplash.com/photo-1698809807960-758cf416e96e?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi biển lúc hoàng hôn với con thuyền trên mặt nước', 30),
  ROW('https://images.unsplash.com/photo-1758737922322-b806a5c431a3?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Thị trấn ven biển với bãi cát và nước biển xanh ngọc', 40),
  ROW('https://images.unsplash.com/photo-1732243395944-cb3ff9311091?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi cát trắng và hàng dừa bên bờ biển', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

-- SH-MN-013 · Côn Đảo 2 ngày 1 đêm bay từ Cần Thơ (Cao cấp, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-013', 'Côn Đảo 2 ngày 1 đêm bay từ Cần Thơ',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-con-dao'), @branch, 2, 1,
  'Dòng Cao cấp · khởi hành từ Cần Thơ. Điểm nhấn: Nghĩa trang Hàng Dương, nhà tù Côn Đảo, miếu Bà Phi Yến, cầu tàu 914.', 8390000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-013');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 18, 6, 8, 8790000, 6590000),
  ROW('2026-12-05', '2026-12-06', 18, 6, 10, 8790000, 6590000),
  ROW('2026-12-12', '2026-12-13', 18, 6, 6, 8790000, 6590000),
  ROW('2026-12-19', '2026-12-20', 18, 6, 5, 8790000, 6590000),
  ROW('2026-12-26', '2026-12-27', 18, 6, 5, 9490000, 7120000),
  ROW('2027-01-02', '2027-01-03', 18, 6, 5, 8390000, 6290000),
  ROW('2027-01-09', '2027-01-10', 18, 6, 3, 8390000, 6290000),
  ROW('2027-01-16', '2027-01-17', 18, 6, 4, 8390000, 6290000),
  ROW('2027-01-23', '2027-01-24', 18, 6, 1, 8390000, 6290000),
  ROW('2027-01-30', '2027-01-31', 18, 6, 4, 9690000, 7270000),
  ROW('2027-02-06', '2027-02-07', 18, 6, 12, 11390000, 8540000),
  ROW('2027-02-13', '2027-02-14', 18, 6, 0, 10090000, 7570000),
  ROW('2027-02-20', '2027-02-21', 18, 6, 3, 8790000, 6590000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Côn Đảo', 'Bay từ Cần Thơ ra Côn Đảo, nhận phòng resort. Chiều thăm trại Phú Hải, chuồng cọp và cầu tàu 914. Tối viếng nghĩa trang Hàng Dương.'),
  ROW(2, 'Miếu Bà Phi Yến – về Cần Thơ', 'Viếng miếu Bà Phi Yến và chùa Núi Một, sau bữa trưa ra sân bay Cỏ Ống bay về. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-014 · Đồng Tháp 2 ngày 1 đêm: làng hoa Sa Đéc – Tràm Chim (Tiết kiệm, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-014', 'Đồng Tháp 2 ngày 1 đêm: làng hoa Sa Đéc – Tràm Chim',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-dong-thap'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ Cần Thơ. Điểm nhấn: Làng hoa Sa Đéc, nhà cổ Huỳnh Thủy Lê, Vườn quốc gia Tràm Chim, khu di tích Gò Tháp.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-014');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 40, 15, 22, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-06', 40, 15, 18, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-13', 40, 15, 12, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-20', 40, 15, 6, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-27', 40, 15, 12, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-03', 40, 15, 0, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-10', 40, 15, 1, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-17', 40, 15, 7, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-24', 40, 15, 4, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-31', 40, 15, 1, 1890000, 1420000),
  ROW('2027-02-06', '2027-02-07', 40, 15, 25, 2190000, 1640000),
  ROW('2027-02-13', '2027-02-14', 40, 15, 5, 1990000, 1490000),
  ROW('2027-02-20', '2027-02-21', 40, 15, 5, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Sa Đéc', 'Qua cầu Cao Lãnh đến Sa Đéc, thăm làng hoa Tân Quy Đông và nhà cổ Huỳnh Thủy Lê. Tối ăn hủ tiếu Sa Đéc, nghỉ đêm tại Cao Lãnh.'),
  ROW(2, 'Tràm Chim – Gò Tháp – về Cần Thơ', 'Đi xuồng trong Vườn quốc gia Tràm Chim ngắm chim nước, chiều thăm khu di tích Gò Tháp rồi về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-015 · Vòng cung Tây Nam 4 ngày: Châu Đốc – Hà Tiên – Rạch Giá (Cao cấp, chi nhánh CT, 7 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-015', 'Vòng cung Tây Nam 4 ngày: Châu Đốc – Hà Tiên – Rạch Giá',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-an-giang'), @branch, 4, 3,
  'Dòng Cao cấp · khởi hành từ Cần Thơ. Điểm nhấn: Núi Sam, rừng tràm Trà Sư, Mũi Nai, Thạch Động, lăng Mạc Cửu, chợ nổi Cái Răng.', 8690000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-015');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-25', '2026-11-28', 24, 6, 14, 9190000, 6890000),
  ROW('2026-12-09', '2026-12-12', 24, 6, 4, 9190000, 6890000),
  ROW('2026-12-23', '2026-12-26', 24, 6, 5, 9890000, 7420000),
  ROW('2027-01-06', '2027-01-09', 24, 6, 5, 8690000, 6520000),
  ROW('2027-01-20', '2027-01-23', 24, 6, 1, 8690000, 6520000),
  ROW('2027-02-03', '2027-02-06', 24, 6, 12, 11990000, 8990000),
  ROW('2027-02-17', '2027-02-20', 24, 6, 2, 9190000, 6890000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Châu Đốc', 'Đến Châu Đốc viếng miếu Bà Chúa Xứ núi Sam, chiều đi xuồng vào rừng tràm Trà Sư. Nghỉ đêm resort ven núi Sam.'),
  ROW(2, 'Châu Đốc – Hà Tiên', 'Theo đường ven biên giới sang Hà Tiên, thăm lăng Mạc Cửu, chùa Phù Dung và Thạch Động. Tối ngắm hoàng hôn ở Mũi Nai.'),
  ROW(3, 'Hà Tiên – Rạch Giá', 'Theo quốc lộ 80 về Rạch Giá, ghé chùa Hang và bãi đá Hòn Phụ Tử ở Kiên Lương. Nghỉ đêm tại Rạch Giá.'),
  ROW(4, 'Rạch Giá – Cần Thơ – chợ nổi Cái Răng', 'Về Cần Thơ, chiều đi thuyền trên sông Cần Thơ ngắm chợ nổi Cái Răng và nhà cổ Bình Thủy. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-016 · Cần Thơ nghỉ dưỡng 3 ngày 2 đêm: thuyền riêng – ẩm thực sông nước (Cao cấp, chi nhánh CT, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-016', 'Cần Thơ nghỉ dưỡng 3 ngày 2 đêm: thuyền riêng – ẩm thực sông nước',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-can-tho'), @branch, 3, 2,
  'Dòng Cao cấp · khởi hành từ Cần Thơ. Điểm nhấn: Thuyền riêng đi chợ nổi Cái Răng, resort ven sông Hậu, lớp nấu ăn miền Tây, nhà cổ Bình Thủy.', 6590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-016');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-04', '2026-12-06', 20, 6, 8, 6890000, 5170000),
  ROW('2026-12-18', '2026-12-20', 20, 6, 4, 6890000, 5170000),
  ROW('2027-01-01', '2027-01-03', 20, 6, 3, 7690000, 5770000),
  ROW('2027-01-15', '2027-01-17', 20, 6, 1, 6590000, 4940000),
  ROW('2027-01-29', '2027-01-31', 20, 6, 5, 7590000, 5690000),
  ROW('2027-02-12', '2027-02-14', 20, 6, 4, 7890000, 5920000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Nhận phòng resort ven sông', 'Xe đón tại Cần Thơ, nhận phòng resort trên cồn ven sông Hậu. Chiều đạp xe quanh cồn, tối dùng bữa trên du thuyền sông Hậu.'),
  ROW(2, 'Chợ nổi Cái Răng bằng thuyền riêng', 'Thuyền riêng đưa đi chợ nổi Cái Răng lúc bình minh, ghé lò hủ tiếu và vườn trái cây Phong Điền. Chiều học nấu bánh xèo, cá kho tộ.'),
  ROW(3, 'Nhà cổ Bình Thủy – kết thúc', 'Thăm nhà cổ Bình Thủy và chùa Ông, trả phòng sau bữa trưa. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-017 · Sóc Trăng – Bạc Liêu 2 ngày 1 đêm (Tiết kiệm, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-017', 'Sóc Trăng – Bạc Liêu 2 ngày 1 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-bac-lieu'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ Cần Thơ. Điểm nhấn: Chùa Dơi, chùa Đất Sét, nhà Công tử Bạc Liêu, cánh đồng điện gió, vườn chim Bạc Liêu.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-017');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 40, 15, 23, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-06', 40, 15, 23, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-13', 40, 15, 6, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-20', 40, 15, 10, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-27', 40, 15, 15, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-03', 40, 15, 6, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-10', 40, 15, 11, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-17', 40, 15, 4, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-24', 40, 15, 2, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-31', 40, 15, 4, 1890000, 1420000),
  ROW('2027-02-06', '2027-02-07', 40, 15, 22, 2190000, 1640000),
  ROW('2027-02-13', '2027-02-14', 40, 15, 9, 1990000, 1490000),
  ROW('2027-02-20', '2027-02-21', 40, 15, 9, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Sóc Trăng – Bạc Liêu', 'Thăm chùa Dơi và chùa Đất Sét ở Sóc Trăng, chiều đến Bạc Liêu tham quan nhà Công tử Bạc Liêu. Tối nghe đờn ca tài tử.'),
  ROW(2, 'Điện gió – vườn chim – về Cần Thơ', 'Ngắm cánh đồng điện gió ven biển, thăm vườn chim Bạc Liêu, sau bữa trưa về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-018 · Quần đảo Nam Du 3 ngày 2 đêm (Tiêu chuẩn, chi nhánh CT, 6 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-018', 'Quần đảo Nam Du 3 ngày 2 đêm',
  (SELECT id FROM tour_categories WHERE slug = 'tieu-chuan'),
  (SELECT id FROM locations WHERE code = 'city-kien-giang'), @branch, 3, 2,
  'Dòng Tiêu chuẩn · khởi hành từ Cần Thơ. Điểm nhấn: Tàu cao tốc Rạch Giá – Nam Du, bãi Cây Mến, Hòn Mấu, ngọn hải đăng Nam Du.', 3590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-018');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-04', '2026-12-06', 25, 10, 13, 3790000, 2840000),
  ROW('2026-12-18', '2026-12-20', 25, 10, 5, 3790000, 2840000),
  ROW('2027-01-01', '2027-01-03', 25, 10, 5, 4190000, 3140000),
  ROW('2027-01-15', '2027-01-17', 25, 10, 7, 3590000, 2690000),
  ROW('2027-01-29', '2027-01-31', 25, 10, 7, 4090000, 3070000),
  ROW('2027-02-12', '2027-02-14', 25, 10, 4, 4290000, 3220000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Rạch Giá – Nam Du', 'Xe đưa đến Rạch Giá, đi tàu cao tốc ra Nam Du. Chiều tắm biển bãi Cây Mến, tối ăn hải sản tại làng chài.'),
  ROW(2, 'Ca nô quanh quần đảo', 'Đi ca nô thăm Hòn Mấu, Hòn Dầu, lặn ngắm san hô. Chiều leo lên ngọn hải đăng ngắm toàn cảnh quần đảo.'),
  ROW(3, 'Nam Du – Rạch Giá – về Cần Thơ', 'Lên tàu về Rạch Giá, xe đưa về Cần Thơ. Lịch tàu phụ thuộc thời tiết biển. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn 3–4 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-019 · Cù lao An Bình 2 ngày 1 đêm: homestay miệt vườn (Tiết kiệm, chi nhánh CT, 13 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-019', 'Cù lao An Bình 2 ngày 1 đêm: homestay miệt vườn',
  (SELECT id FROM tour_categories WHERE slug = 'tiet-kiem'),
  (SELECT id FROM locations WHERE code = 'city-vinh-long'), @branch, 2, 1,
  'Dòng Tiết kiệm · khởi hành từ Cần Thơ. Điểm nhấn: Homestay cù lao An Bình, vườn trái cây, lò gạch gốm Mang Thít, đờn ca tài tử.', 1590000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-019');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-11-28', '2026-11-29', 35, 15, 24, 1690000, 1270000),
  ROW('2026-12-05', '2026-12-06', 35, 15, 14, 1690000, 1270000),
  ROW('2026-12-12', '2026-12-13', 35, 15, 16, 1690000, 1270000),
  ROW('2026-12-19', '2026-12-20', 35, 15, 16, 1690000, 1270000),
  ROW('2026-12-26', '2026-12-27', 35, 15, 12, 1790000, 1340000),
  ROW('2027-01-02', '2027-01-03', 35, 15, 1, 1590000, 1190000),
  ROW('2027-01-09', '2027-01-10', 35, 15, 8, 1590000, 1190000),
  ROW('2027-01-16', '2027-01-17', 35, 15, 6, 1590000, 1190000),
  ROW('2027-01-23', '2027-01-24', 35, 15, 3, 1590000, 1190000),
  ROW('2027-01-30', '2027-01-31', 35, 15, 6, 1890000, 1420000),
  ROW('2027-02-06', '2027-02-07', 35, 15, 21, 2190000, 1640000),
  ROW('2027-02-13', '2027-02-14', 35, 15, 5, 1990000, 1490000),
  ROW('2027-02-20', '2027-02-21', 35, 15, 1, 1690000, 1270000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Vĩnh Long – cù lao An Bình', 'Đến Vĩnh Long, đi đò sang cù lao An Bình nhận phòng homestay. Chiều đạp xe qua vườn chôm chôm, chèo xuồng tát mương bắt cá, tối nấu ăn cùng chủ nhà.'),
  ROW(2, 'Lò gạch Mang Thít – về Cần Thơ', 'Thăm làng gạch gốm Mang Thít bên sông Cổ Chiên, sau bữa trưa về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('transport', 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)', 1),
  ROW('hotel', 'Khách sạn 2–3 sao, phòng 2–3 khách', 1),
  ROW('meal', 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)', 0),
  ROW('other', 'Hóa đơn VAT', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;

-- SH-MN-020 · Hà Tiên – Phú Quốc 5 ngày 4 đêm: tàu cao tốc ra đảo (Cao cấp, chi nhánh CT, 4 lịch)
SET @branch = (SELECT id FROM branches WHERE code = 'CT');
SET @origin = (SELECT id FROM locations WHERE code = 'city-can-tho');
INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT 'SH-MN-020', 'Hà Tiên – Phú Quốc 5 ngày 4 đêm: tàu cao tốc ra đảo',
  (SELECT id FROM tour_categories WHERE slug = 'cao-cap'),
  (SELECT id FROM locations WHERE code = 'city-phu-quoc'), @branch, 5, 4,
  'Dòng Cao cấp · khởi hành từ Cần Thơ. Điểm nhấn: Thạch Động, Mũi Nai, tàu cao tốc Hà Tiên – Phú Quốc, cáp treo Hòn Thơm, Bãi Sao.', 14890000, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = 'SH-MN-020');
SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN ('o-to', 'may-bay') AND @tour IS NOT NULL;
INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, return_date,
  capacity, min_guests, reserved_seats, adult_price, child_price, status)
SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, v.reserved_seats,
  v.adult_price, v.child_price, 'open'
FROM (VALUES
  ROW('2026-12-14', '2026-12-18', 24, 6, 22, 15690000, 11770000),
  ROW('2027-01-04', '2027-01-08', 24, 6, 22, 14890000, 11170000),
  ROW('2027-01-25', '2027-01-29', 24, 6, 20, 14890000, 11170000),
  ROW('2027-02-15', '2027-02-19', 24, 6, 20, 15690000, 11770000)
) AS v (departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price)
WHERE @tour IS NOT NULL;
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)
SELECT @tour, v.day_number, v.title, v.description
FROM (VALUES
  ROW(1, 'Cần Thơ – Hà Tiên', 'Qua Rạch Giá đến Hà Tiên, thăm lăng Mạc Cửu và Thạch Động. Tối ngắm hoàng hôn ở Mũi Nai.'),
  ROW(2, 'Hà Tiên – Phú Quốc', 'Đi tàu cao tốc ra Phú Quốc, nhận phòng resort 5 sao. Chiều tự do tắm biển, tối dạo chợ đêm.'),
  ROW(3, 'Nam đảo – Hòn Thơm', 'Thăm nhà tù Phú Quốc, đi cáp treo sang Hòn Thơm, chiều tắm biển Bãi Sao.'),
  ROW(4, 'Bắc đảo – hoàng hôn Gành Dầu', 'Thăm Vườn quốc gia Phú Quốc và làng chài Hàm Ninh, chiều ngắm hoàng hôn ở Gành Dầu.'),
  ROW(5, 'Phú Quốc – Cần Thơ', 'Sáng tự do, ra sân bay bay về Cần Thơ. Kết thúc chương trình.')
) AS v (day_number, title, description)
WHERE @tour IS NOT NULL;
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT @tour, v.service_type, v.description, v.is_included
FROM (VALUES
  ROW('flight', 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, cần xác nhận khi xuất vé', 1),
  ROW('transport', 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến', 1),
  ROW('hotel', 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách', 1),
  ROW('meal', 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt', 1),
  ROW('guide', 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến', 1),
  ROW('ticket', 'Vé vào cổng các điểm tham quan có trong chương trình', 1),
  ROW('other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe', 1),
  ROW('other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)', 1),
  ROW('other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế', 1),
  ROW('other', 'Thuế VAT', 1),
  ROW('other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi', 0),
  ROW('hotel', 'Phụ thu phòng đơn', 0)
) AS v (service_type, description, is_included)
WHERE @tour IS NOT NULL;
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT @tour, v.image_url, v.alt_text, v.sort_order
FROM (VALUES
  ROW('https://images.unsplash.com/photo-1758737922322-b806a5c431a3?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Thị trấn ven biển với bãi cát và nước biển xanh ngọc', 10),
  ROW('https://images.unsplash.com/photo-1732243395944-cb3ff9311091?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi cát trắng và hàng dừa bên bờ biển', 20),
  ROW('https://images.unsplash.com/photo-1758657281824-239a1bfb3c92?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Cáp treo vượt biển nhìn về thị trấn ven biển', 30),
  ROW('https://images.unsplash.com/photo-1779513694945-ca77ad0c3eaa?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Tháp đồng hồ bên bờ biển lúc hoàng hôn', 40),
  ROW('https://images.unsplash.com/photo-1698809807960-758cf416e96e?auto=format&fit=crop&w=1920&q=80', 'Phú Quốc: Bãi biển lúc hoàng hôn với con thuyền trên mặt nước', 50)
) AS v (image_url, alt_text, sort_order)
WHERE @tour IS NOT NULL;

COMMIT;
