-- 005_seasonal_tours.sql
-- DEMO seasonal collections and 20 seasonal tours (requires migrations/006).
-- Tours, prices and dates are simulated; the fireworks dates follow the organiser each year.
-- Run ONCE: tour codes SEA001-SEA020 are unique and a second run stops at the first duplicate.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO tour_collections (slug, name, tagline, season_label, cover_location_id, sort_order) VALUES
  ('tet-2027', 'Tour Tết Nguyên Đán 2027', 'Đón xuân Đinh Mùi trọn vẹn cùng gia đình', 'Tết · 05 – 10/02/2027', 11, 10),
  ('hoa-xuan-tay-bac', 'Mùa hoa mận, hoa đào Tây Bắc', 'Cao nguyên trắng hoa mận, bản làng hồng hoa đào', 'Tháng 1 – 3', 14, 20),
  ('du-thuyen', 'Tour du thuyền', 'Ngủ trên vịnh, ngắm hoàng hôn trên sông', 'Quanh năm', 9, 30),
  ('bien-he', 'Biển hè rực rỡ', 'Nắng vàng, biển xanh, đảo hoang sơ', 'Tháng 5 – 8', 17, 40),
  ('phao-hoa-da-nang', 'Mùa lễ hội pháo hoa Đà Nẵng', 'Đêm pháo hoa bên sông Hàn', 'Tháng 6 – 7 (dự kiến)', 30, 50),
  ('lua-chin-vung-cao', 'Mùa lúa chín vùng cao', 'Ruộng bậc thang vàng óng Tây Bắc', 'Tháng 9 – 10', 21, 60),
  ('nuoc-noi-mien-tay', 'Mùa nước nổi miền Tây', 'Rừng tràm, cá linh, bông điên điển', 'Tháng 9 – 11', 1, 70),
  ('hoa-da-quy', 'Mùa hoa dã quỳ', 'Cao nguyên nhuộm vàng sắc dã quỳ', 'Tháng 11 – 12', 29, 80);

-- SEA001: Tết Hội An – Đà Nẵng: phố đèn lồng đón xuân
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA001', 'Tết Hội An – Đà Nẵng: phố đèn lồng đón xuân', 11, 2, 4, 3, 'Điểm tham quan nổi bật: Phố cổ Hội An ngày Tết, Bà Nà Hills, Ngũ Hành Sơn.', 6900000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2027-02-05', '2027-02-08', 20, 0, 6900000, 5175000, 'open'),
  (@tour, 22, '2027-02-07', '2027-02-10', 25, 0, 7020000, 5265000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay ra Đà Nẵng, dạo phố cổ Hội An đêm đèn lồng', 'Bay ra Đà Nẵng, dạo phố cổ Hội An đêm đèn lồng.'),
  (@tour, 2, 'Bà Nà Hills và Cầu Vàng', 'Bà Nà Hills và Cầu Vàng.'),
  (@tour, 3, 'Ngũ Hành Sơn, chợ Tết Hàn', 'Ngũ Hành Sơn, chợ Tết Hàn.'),
  (@tour, 4, 'Tự do mua sắm, bay về', 'Tự do mua sắm, bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('tet-2027');

-- SEA002: Tết Phú Quốc: nghỉ dưỡng đảo ngọc
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA002', 'Tết Phú Quốc: nghỉ dưỡng đảo ngọc', 17, 3, 4, 3, 'Điểm tham quan nổi bật: Bãi Sao, cáp treo Hòn Thơm, chợ đêm Phú Quốc.', 7500000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2027-02-06', '2027-02-09', 20, 0, 7500000, 5625000, 'open'),
  (@tour, 8, '2027-02-08', '2027-02-11', 25, 0, 7620000, 5715000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay vào Phú Quốc, ngắm hoàng hôn Sunset Town', 'Bay vào Phú Quốc, ngắm hoàng hôn Sunset Town.'),
  (@tour, 2, 'Cáp treo Hòn Thơm, tắm biển', 'Cáp treo Hòn Thơm, tắm biển.'),
  (@tour, 3, 'Bãi Sao, nhà thùng nước mắm', 'Bãi Sao, nhà thùng nước mắm.'),
  (@tour, 4, 'Chợ Dương Đông, bay về', 'Chợ Dương Đông, bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('tet-2027', 'bien-he');

-- SEA003: Xuân Hà Nội – Ninh Bình: lễ chùa đầu năm
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA003', 'Xuân Hà Nội – Ninh Bình: lễ chùa đầu năm', 16, 1, 3, 2, 'Điểm tham quan nổi bật: Chùa Bái Đính, Tràng An, phố cổ Hà Nội ngày Tết.', 3600000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2027-02-08', '2027-02-10', 20, 0, 3600000, 2700000, 'open'),
  (@tour, 8, '2027-02-10', '2027-02-12', 25, 0, 3720000, 2790000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Lễ chùa Bái Đính đầu năm', 'Lễ chùa Bái Đính đầu năm.'),
  (@tour, 2, 'Đi thuyền Tràng An', 'Đi thuyền Tràng An.'),
  (@tour, 3, 'Hang Múa, về Hà Nội', 'Hang Múa, về Hà Nội. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('tet-2027');

-- SEA004: Tết miền Tây sông nước: chợ nổi Cái Răng
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA004', 'Tết miền Tây sông nước: chợ nổi Cái Răng', 5, 4, 3, 2, 'Điểm tham quan nổi bật: Chợ nổi Cái Răng, vườn trái cây, đờn ca tài tử.', 3200000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2027-02-07', '2027-02-09', 20, 0, 3200000, 2400000, 'open'),
  (@tour, 22, '2027-02-09', '2027-02-11', 25, 0, 3320000, 2490000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Khởi hành đi Cần Thơ, bến Ninh Kiều về đêm', 'Khởi hành đi Cần Thơ, bến Ninh Kiều về đêm.'),
  (@tour, 2, 'Chợ nổi Cái Răng, vườn trái cây', 'Chợ nổi Cái Răng, vườn trái cây.'),
  (@tour, 3, 'Lò hủ tiếu, về TP. Hồ Chí Minh', 'Lò hủ tiếu, về TP. Hồ Chí Minh. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('tet-2027');

-- SEA005: Mộc Châu mùa hoa mận trắng
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA005', 'Mộc Châu mùa hoa mận trắng', 14, 1, 2, 1, 'Điểm tham quan nổi bật: Thung lũng mận Nà Ka, đồi chè trái tim, thác Dải Yếm.', 2400000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2027-01-16', '2027-01-17', 20, 0, 2400000, 1800000, 'open'),
  (@tour, 8, '2027-01-23', '2027-01-24', 25, 0, 2520000, 1890000, 'open'),
  (@tour, 8, '2027-01-30', '2027-01-31', 30, 0, 2640000, 1980000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Đi Mộc Châu, đồi chè trái tim', 'Đi Mộc Châu, đồi chè trái tim.'),
  (@tour, 2, 'Thung lũng mận Nà Ka, thác Dải Yếm, về Hà Nội', 'Thung lũng mận Nà Ka, thác Dải Yếm, về Hà Nội. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('hoa-xuan-tay-bac');

-- SEA006: Sa Pa mùa hoa đào – chinh phục Fansipan
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA006', 'Sa Pa mùa hoa đào – chinh phục Fansipan', 21, 1, 3, 2, 'Điểm tham quan nổi bật: Bản Cát Cát, cáp treo Fansipan, hoa đào Tây Bắc.', 3900000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2027-01-22', '2027-01-24', 20, 0, 3900000, 2925000, 'open'),
  (@tour, 8, '2027-02-19', '2027-02-21', 25, 0, 4020000, 3015000, 'open'),
  (@tour, 8, '2027-03-05', '2027-03-07', 30, 0, 4140000, 3105000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Hà Nội – Sa Pa, bản Cát Cát', 'Hà Nội – Sa Pa, bản Cát Cát.'),
  (@tour, 2, 'Cáp treo Fansipan', 'Cáp treo Fansipan.'),
  (@tour, 3, 'Chợ Sa Pa, về Hà Nội', 'Chợ Sa Pa, về Hà Nội. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('hoa-xuan-tay-bac');

-- SEA007: Hà Giang mùa hoa đào, hoa mận
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA007', 'Hà Giang mùa hoa đào, hoa mận', 7, 1, 4, 3, 'Điểm tham quan nổi bật: Cột cờ Lũng Cú, đèo Mã Pì Lèng, sông Nho Quế.', 4600000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2027-02-19', '2027-02-22', 20, 0, 4600000, 3450000, 'open'),
  (@tour, 8, '2027-03-05', '2027-03-08', 25, 0, 4720000, 3540000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Hà Nội – Hà Giang, cổng trời Quản Bạ', 'Hà Nội – Hà Giang, cổng trời Quản Bạ.'),
  (@tour, 2, 'Dinh vua Mèo, cột cờ Lũng Cú', 'Dinh vua Mèo, cột cờ Lũng Cú.'),
  (@tour, 3, 'Mã Pì Lèng, thuyền sông Nho Quế', 'Mã Pì Lèng, thuyền sông Nho Quế.'),
  (@tour, 4, 'Về Hà Nội', 'Về Hà Nội. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('hoa-xuan-tay-bac');

-- SEA008: Du thuyền 5 sao vịnh Hạ Long – Lan Hạ
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA008', 'Du thuyền 5 sao vịnh Hạ Long – Lan Hạ', 9, 1, 2, 1, 'Điểm tham quan nổi bật: Ngủ đêm trên vịnh, chèo kayak, hang Sửng Sốt.', 4200000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2026-12-05', '2026-12-06', 20, 0, 4200000, 3150000, 'open'),
  (@tour, 8, '2026-12-19', '2026-12-20', 25, 0, 4320000, 3240000, 'open'),
  (@tour, 8, '2027-01-09', '2027-01-10', 30, 0, 4440000, 3330000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Lên du thuyền, chèo kayak, tiệc hoàng hôn', 'Lên du thuyền, chèo kayak, tiệc hoàng hôn.'),
  (@tour, 2, 'Tập thái cực quyền trên boong, hang Sửng Sốt, về Hà Nội', 'Tập thái cực quyền trên boong, hang Sửng Sốt, về Hà Nội. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('du-thuyen');

-- SEA009: Du thuyền hoàng hôn vịnh Nha Trang
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA009', 'Du thuyền hoàng hôn vịnh Nha Trang', 15, 3, 3, 2, 'Điểm tham quan nổi bật: Du thuyền vịnh Nha Phu, lặn ngắm san hô, tắm bùn.', 4800000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2026-12-12', '2026-12-14', 20, 0, 4800000, 3600000, 'open'),
  (@tour, 22, '2027-01-16', '2027-01-18', 25, 0, 4920000, 3690000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay ra Nha Trang, tháp Bà Ponagar', 'Bay ra Nha Trang, tháp Bà Ponagar.'),
  (@tour, 2, 'Du thuyền ngắm hoàng hôn trên vịnh', 'Du thuyền ngắm hoàng hôn trên vịnh.'),
  (@tour, 3, 'Tắm bùn khoáng, bay về', 'Tắm bùn khoáng, bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('du-thuyen', 'bien-he');

-- SEA010: Du thuyền sông Sài Gòn ngắm thành phố về đêm
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA010', 'Du thuyền sông Sài Gòn ngắm thành phố về đêm', 22, 3, 1, 0, 'Điểm tham quan nổi bật: Ăn tối trên du thuyền, ngắm Landmark 81 và cầu Ba Son.', 890000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2026-11-28', '2026-11-28', 20, 0, 890000, 668000, 'open'),
  (@tour, 22, '2026-12-12', '2026-12-12', 25, 0, 1010000, 758000, 'open'),
  (@tour, 22, '2026-12-26', '2026-12-26', 30, 0, 1130000, 848000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Đón khách bến Bạch Đằng, ăn tối và ngắm thành phố trên sông', 'Đón khách bến Bạch Đằng, ăn tối và ngắm thành phố trên sông. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('du-thuyen');

-- SEA011: Quy Nhơn – Kỳ Co – Eo Gió mùa biển xanh
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA011', 'Quy Nhơn – Kỳ Co – Eo Gió mùa biển xanh', 19, 2, 4, 3, 'Điểm tham quan nổi bật: Kỳ Co, Eo Gió, Ghềnh Ráng Tiên Sa.', 5400000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2027-05-22', '2027-05-25', 20, 0, 5400000, 4050000, 'open'),
  (@tour, 22, '2027-06-12', '2027-06-15', 25, 0, 5520000, 4140000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay ra Quy Nhơn, Ghềnh Ráng', 'Bay ra Quy Nhơn, Ghềnh Ráng.'),
  (@tour, 2, 'Cano ra Kỳ Co, lặn ngắm san hô Bãi Dứa', 'Cano ra Kỳ Co, lặn ngắm san hô Bãi Dứa.'),
  (@tour, 3, 'Eo Gió, Tịnh xá Ngọc Hòa', 'Eo Gió, Tịnh xá Ngọc Hòa.'),
  (@tour, 4, 'Bay về', 'Bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('bien-he');

-- SEA012: Côn Đảo – lặn ngắm san hô Hòn Bảy Cạnh
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA012', 'Côn Đảo – lặn ngắm san hô Hòn Bảy Cạnh', 4, 3, 3, 2, 'Điểm tham quan nổi bật: Hòn Bảy Cạnh, bãi Đầm Trầu, di tích nhà tù Côn Đảo.', 6200000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2027-05-15', '2027-05-17', 20, 0, 6200000, 4650000, 'open'),
  (@tour, 22, '2027-06-19', '2027-06-21', 25, 0, 6320000, 4740000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay ra Côn Đảo, di tích nhà tù', 'Bay ra Côn Đảo, di tích nhà tù.'),
  (@tour, 2, 'Cano ra Hòn Bảy Cạnh, lặn ngắm san hô', 'Cano ra Hòn Bảy Cạnh, lặn ngắm san hô.'),
  (@tour, 3, 'Bãi Đầm Trầu, bay về', 'Bãi Đầm Trầu, bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('bien-he');

-- SEA013: Lý Sơn – đảo tỏi giữa biển khơi
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA013', 'Lý Sơn – đảo tỏi giữa biển khơi', 12, 2, 3, 2, 'Điểm tham quan nổi bật: Cổng Tò Vò, đỉnh Thới Lới, Đảo Bé.', 3800000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 30, '2027-06-05', '2027-06-07', 20, 0, 3800000, 2850000, 'open'),
  (@tour, 30, '2027-07-03', '2027-07-05', 25, 0, 3920000, 2940000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Đà Nẵng – cảng Sa Kỳ, tàu ra đảo, cổng Tò Vò', 'Đà Nẵng – cảng Sa Kỳ, tàu ra đảo, cổng Tò Vò.'),
  (@tour, 2, 'Đảo Bé, đỉnh Thới Lới', 'Đảo Bé, đỉnh Thới Lới.'),
  (@tour, 3, 'Tàu về đất liền, về Đà Nẵng', 'Tàu về đất liền, về Đà Nẵng. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('bien-he');

-- SEA014: Đà Nẵng mùa lễ hội pháo hoa quốc tế
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA014', 'Đà Nẵng mùa lễ hội pháo hoa quốc tế', 30, 2, 4, 3, 'Điểm tham quan nổi bật: Đêm pháo hoa sông Hàn (theo lịch ban tổ chức), Sơn Trà, Hội An.', 6100000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2027-06-11', '2027-06-14', 20, 0, 6100000, 4575000, 'open'),
  (@tour, 22, '2027-06-25', '2027-06-28', 25, 0, 6220000, 4665000, 'open'),
  (@tour, 22, '2027-07-09', '2027-07-12', 30, 0, 6340000, 4755000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay ra Đà Nẵng, bán đảo Sơn Trà', 'Bay ra Đà Nẵng, bán đảo Sơn Trà.'),
  (@tour, 2, 'Hội An, tối xem pháo hoa bên sông Hàn', 'Hội An, tối xem pháo hoa bên sông Hàn.'),
  (@tour, 3, 'Bà Nà Hills', 'Bà Nà Hills.'),
  (@tour, 4, 'Tự do tắm biển Mỹ Khê, bay về', 'Tự do tắm biển Mỹ Khê, bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('phao-hoa-da-nang');

-- SEA015: Sa Pa mùa lúa chín – thung lũng Mường Hoa
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA015', 'Sa Pa mùa lúa chín – thung lũng Mường Hoa', 21, 1, 3, 2, 'Điểm tham quan nổi bật: Ruộng bậc thang Mường Hoa, bản Tả Van, đèo Ô Quy Hồ.', 3700000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2027-09-10', '2027-09-12', 20, 0, 3700000, 2775000, 'open'),
  (@tour, 8, '2027-09-24', '2027-09-26', 25, 0, 3820000, 2865000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Hà Nội – Sa Pa, đèo Ô Quy Hồ', 'Hà Nội – Sa Pa, đèo Ô Quy Hồ.'),
  (@tour, 2, 'Trekking Mường Hoa – Tả Van', 'Trekking Mường Hoa – Tả Van.'),
  (@tour, 3, 'Bản Cát Cát, về Hà Nội', 'Bản Cát Cát, về Hà Nội. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('lua-chin-vung-cao');

-- SEA016: Hà Giang mùa lúa chín Hoàng Su Phì
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA016', 'Hà Giang mùa lúa chín Hoàng Su Phì', 7, 1, 4, 3, 'Điểm tham quan nổi bật: Ruộng bậc thang Hoàng Su Phì, Lũng Cú, Mã Pì Lèng.', 4800000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 8, '2027-09-17', '2027-09-20', 20, 0, 4800000, 3600000, 'open'),
  (@tour, 8, '2027-10-01', '2027-10-04', 25, 0, 4920000, 3690000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Hà Nội – Hà Giang', 'Hà Nội – Hà Giang.'),
  (@tour, 2, 'Ruộng bậc thang Hoàng Su Phì', 'Ruộng bậc thang Hoàng Su Phì.'),
  (@tour, 3, 'Lũng Cú, Mã Pì Lèng', 'Lũng Cú, Mã Pì Lèng.'),
  (@tour, 4, 'Về Hà Nội', 'Về Hà Nội. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('lua-chin-vung-cao');

-- SEA017: An Giang mùa nước nổi – rừng tràm Trà Sư
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA017', 'An Giang mùa nước nổi – rừng tràm Trà Sư', 1, 4, 3, 2, 'Điểm tham quan nổi bật: Rừng tràm Trà Sư, núi Sam, ẩm thực cá linh bông điên điển.', 3300000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2027-09-24', '2027-09-26', 20, 0, 3300000, 2475000, 'open'),
  (@tour, 22, '2027-10-15', '2027-10-17', 25, 0, 3420000, 2565000, 'open'),
  (@tour, 22, '2027-11-05', '2027-11-07', 30, 0, 3540000, 2655000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Khởi hành đi Châu Đốc, miếu Bà Chúa Xứ', 'Khởi hành đi Châu Đốc, miếu Bà Chúa Xứ.'),
  (@tour, 2, 'Xuồng xuyên rừng tràm Trà Sư', 'Xuồng xuyên rừng tràm Trà Sư.'),
  (@tour, 3, 'Làng Chăm, về TP. Hồ Chí Minh', 'Làng Chăm, về TP. Hồ Chí Minh. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('nuoc-noi-mien-tay');

-- SEA018: Cần Thơ mùa nước nổi, chợ nổi Cái Răng
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA018', 'Cần Thơ mùa nước nổi, chợ nổi Cái Răng', 5, 4, 2, 1, 'Điểm tham quan nổi bật: Chợ nổi, đồng nước mùa lũ, bánh xèo bông điên điển.', 2200000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 2);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2027-10-02', '2027-10-03', 20, 0, 2200000, 1650000, 'open'),
  (@tour, 22, '2027-10-23', '2027-10-24', 25, 0, 2320000, 1740000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Đi Cần Thơ, đồng nước mùa lũ', 'Đi Cần Thơ, đồng nước mùa lũ.'),
  (@tour, 2, 'Chợ nổi Cái Răng, về TP. Hồ Chí Minh', 'Chợ nổi Cái Răng, về TP. Hồ Chí Minh. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('nuoc-noi-mien-tay');

-- SEA019: Đà Lạt mùa hoa dã quỳ – săn mây Cầu Đất
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA019', 'Đà Lạt mùa hoa dã quỳ – săn mây Cầu Đất', 29, 3, 3, 2, 'Điểm tham quan nổi bật: Đồi dã quỳ, săn mây Cầu Đất, đồi chè.', 3600000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2026-11-27', '2026-11-29', 20, 0, 3600000, 2700000, 'open'),
  (@tour, 22, '2026-12-04', '2026-12-06', 25, 0, 3720000, 2790000, 'open'),
  (@tour, 22, '2026-12-11', '2026-12-13', 30, 0, 3840000, 2880000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay lên Đà Lạt, cung đường dã quỳ', 'Bay lên Đà Lạt, cung đường dã quỳ.'),
  (@tour, 2, 'Săn mây Cầu Đất, đồi chè', 'Săn mây Cầu Đất, đồi chè.'),
  (@tour, 3, 'Chợ Đà Lạt, bay về', 'Chợ Đà Lạt, bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('hoa-da-quy');

-- SEA020: Pleiku – Biển Hồ mùa dã quỳ Tây Nguyên
INSERT INTO tours (code, title, destination_id, operating_branch_id, duration_days, duration_nights, description, base_price, status)
VALUES ('SEA020', 'Pleiku – Biển Hồ mùa dã quỳ Tây Nguyên', 18, 3, 3, 2, 'Điểm tham quan nổi bật: Biển Hồ, núi lửa Chư Đăng Ya, đồi chè Biển Hồ.', 4400000, 'published');
SET @tour = LAST_INSERT_ID();
INSERT INTO tour_transport_types (tour_id, transport_type_id) VALUES (@tour, 1);
INSERT INTO tour_departures (tour_id, departure_location_id, departure_date, return_date, capacity, reserved_seats, adult_price, child_price, status) VALUES
  (@tour, 22, '2026-11-28', '2026-11-30', 20, 0, 4400000, 3300000, 'open'),
  (@tour, 22, '2026-12-05', '2026-12-07', 25, 0, 4520000, 3390000, 'open');
INSERT INTO tour_itinerary_days (tour_id, day_number, title, description) VALUES
  (@tour, 1, 'Bay ra Pleiku, Biển Hồ', 'Bay ra Pleiku, Biển Hồ.'),
  (@tour, 2, 'Núi lửa Chư Đăng Ya mùa dã quỳ', 'Núi lửa Chư Đăng Ya mùa dã quỳ.'),
  (@tour, 3, 'Đồi chè, bay về', 'Đồi chè, bay về. Kết thúc hành trình.');
INSERT INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT id, @tour, 10 FROM tour_collections WHERE slug IN ('hoa-da-quy');

-- Existing catalogue tours that fit a theme join it too (after the seasonal tours: sort_order 50).
INSERT IGNORE INTO tour_collection_items (collection_id, tour_id, sort_order)
SELECT c.id, t.id, 50 FROM tours t JOIN locations l ON l.id = t.destination_id
JOIN tour_collections c ON c.slug = CASE
    WHEN l.name IN ('Hạ Long', 'Vân Đồn') THEN 'du-thuyen'
    WHEN l.name IN ('Phú Quốc', 'Nha Trang', 'Quy Nhơn', 'Vũng Tàu', 'Mũi Né', 'Côn Đảo') THEN 'bien-he'
    WHEN l.name IN ('Đà Lạt', 'Buôn Ma Thuột') THEN 'hoa-da-quy'
    WHEN l.name IN ('Cần Thơ', 'An Giang', 'Bến Tre') THEN 'nuoc-noi-mien-tay'
    WHEN l.name IN ('Sa Pa', 'Hà Giang', 'Mộc Châu') THEN 'lua-chin-vung-cao'
  END
WHERE t.code NOT LIKE 'SEA%' AND t.status = 'published';

COMMIT;
