-- 004_hotel_amenities.sql
-- DEMO facilities and house rules for the demo hotels in seeds/002 (requires migrations/005).
-- Facilities are assigned by star rating: a typical package for each class, not verified partner data.
-- Re-runnable: it clears and rebuilds the demo links.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO amenities (code, name, category, is_highlight, sort_order) VALUES
  ('wifi_free', 'Wi-Fi miễn phí toàn khu', 'internet', TRUE, 10),
  ('air_conditioning', 'Điều hòa', 'room', FALSE, 20),
  ('flat_tv', 'TV màn hình phẳng', 'room', FALSE, 21),
  ('kettle', 'Ấm đun nước, trà và cà phê', 'room', FALSE, 22),
  ('desk', 'Bàn làm việc', 'room', FALSE, 23),
  ('minibar', 'Minibar', 'room', FALSE, 24),
  ('in_room_safe', 'Két an toàn trong phòng', 'room', FALSE, 25),
  ('blackout_curtains', 'Rèm cản sáng', 'room', FALSE, 26),
  ('city_view', 'Phòng có ban công hoặc view thành phố', 'room', TRUE, 27),
  ('hot_shower', 'Vòi sen nước nóng', 'bathroom', FALSE, 30),
  ('toiletries', 'Đồ vệ sinh cá nhân miễn phí', 'bathroom', FALSE, 31),
  ('hair_dryer', 'Máy sấy tóc', 'bathroom', FALSE, 32),
  ('bathtub', 'Bồn tắm', 'bathroom', FALSE, 33),
  ('bathrobe', 'Áo choàng tắm và dép đi trong phòng', 'bathroom', FALSE, 34),
  ('coffee_shop', 'Quán cà phê', 'food', FALSE, 40),
  ('breakfast', 'Bữa sáng buffet', 'food', TRUE, 41),
  ('restaurant', 'Nhà hàng', 'food', TRUE, 42),
  ('room_service', 'Dịch vụ phòng', 'food', FALSE, 43),
  ('bar', 'Quầy bar / lounge', 'food', FALSE, 44),
  ('reception_24h', 'Lễ tân 24/7', 'service', TRUE, 50),
  ('daily_housekeeping', 'Dọn phòng hằng ngày', 'service', FALSE, 51),
  ('luggage_storage', 'Giữ hành lý miễn phí', 'service', FALSE, 52),
  ('laundry', 'Giặt ủi', 'service', FALSE, 53),
  ('tour_desk', 'Quầy hỗ trợ đặt tour và vé tham quan', 'service', FALSE, 54),
  ('express_check_in', 'Nhận và trả phòng nhanh', 'service', FALSE, 55),
  ('currency_exchange', 'Đổi ngoại tệ', 'service', FALSE, 56),
  ('concierge', 'Dịch vụ concierge', 'service', FALSE, 57),
  ('pool', 'Hồ bơi ngoài trời', 'wellness', TRUE, 60),
  ('gym', 'Phòng gym', 'wellness', TRUE, 61),
  ('spa', 'Spa và massage', 'wellness', TRUE, 62),
  ('sauna', 'Phòng xông hơi', 'wellness', FALSE, 63),
  ('family_rooms', 'Phòng gia đình', 'family', FALSE, 70),
  ('crib', 'Nôi em bé theo yêu cầu', 'family', FALSE, 71),
  ('kids_club', 'Khu vui chơi trẻ em', 'family', FALSE, 72),
  ('babysitting', 'Dịch vụ trông trẻ', 'family', FALSE, 73),
  ('parking', 'Chỗ đỗ xe', 'transport', FALSE, 80),
  ('bike_rental', 'Cho thuê xe đạp, xe máy', 'transport', FALSE, 81),
  ('airport_transfer', 'Đưa đón sân bay', 'transport', TRUE, 82),
  ('city_shuttle', 'Xe đưa đón vào trung tâm', 'transport', FALSE, 83),
  ('car_rental', 'Thuê xe riêng có tài xế', 'transport', FALSE, 84),
  ('smoke_detector', 'Thiết bị báo khói', 'safety', FALSE, 90),
  ('cctv', 'Camera an ninh khu vực chung', 'safety', FALSE, 91),
  ('first_aid', 'Bộ sơ cứu', 'safety', FALSE, 92),
  ('security_24h', 'Bảo vệ 24/7', 'safety', FALSE, 93),
  ('elevator', 'Thang máy', 'accessibility', FALSE, 100),
  ('wheelchair_access', 'Lối đi cho xe lăn', 'accessibility', FALSE, 101),
  ('meeting_room', 'Phòng họp', 'business', FALSE, 110),
  ('business_center', 'Trung tâm dịch vụ văn phòng', 'business', FALSE, 111)
AS new ON DUPLICATE KEY UPDATE name = new.name, category = new.category, is_highlight = new.is_highlight,
  sort_order = new.sort_order;

DELETE FROM hotel_amenities;

-- package: (amenity code, lowest star rating that gets it, extra charge?)
INSERT INTO hotel_amenities (hotel_id, amenity_id, is_paid)
SELECT h.id, a.id, package.is_paid
FROM hotels h
JOIN (VALUES
  ROW('wifi_free', 1, FALSE), ROW('air_conditioning', 1, FALSE), ROW('flat_tv', 1, FALSE), ROW('kettle', 1, FALSE),
  ROW('hot_shower', 1, FALSE), ROW('toiletries', 1, FALSE), ROW('reception_24h', 1, FALSE),
  ROW('daily_housekeeping', 1, FALSE), ROW('luggage_storage', 1, FALSE), ROW('parking', 1, FALSE),
  ROW('smoke_detector', 1, FALSE), ROW('cctv', 1, FALSE), ROW('first_aid', 1, FALSE),
  ROW('desk', 2, FALSE), ROW('hair_dryer', 2, FALSE), ROW('coffee_shop', 2, FALSE), ROW('laundry', 2, TRUE),
  ROW('tour_desk', 2, FALSE), ROW('family_rooms', 2, FALSE), ROW('bike_rental', 2, TRUE),
  ROW('security_24h', 2, FALSE), ROW('elevator', 2, FALSE),
  ROW('minibar', 3, TRUE), ROW('in_room_safe', 3, FALSE), ROW('blackout_curtains', 3, FALSE),
  ROW('breakfast', 3, TRUE), ROW('restaurant', 3, FALSE), ROW('room_service', 3, TRUE),
  ROW('express_check_in', 3, FALSE), ROW('currency_exchange', 3, FALSE), ROW('crib', 3, FALSE),
  ROW('airport_transfer', 3, TRUE),
  ROW('city_view', 4, FALSE), ROW('bathtub', 4, FALSE), ROW('bathrobe', 4, FALSE), ROW('bar', 4, FALSE),
  ROW('concierge', 4, FALSE), ROW('pool', 4, FALSE), ROW('gym', 4, FALSE), ROW('city_shuttle', 4, FALSE),
  ROW('car_rental', 4, TRUE), ROW('wheelchair_access', 4, FALSE), ROW('meeting_room', 4, TRUE),
  ROW('business_center', 4, FALSE),
  ROW('spa', 5, TRUE), ROW('sauna', 5, FALSE), ROW('kids_club', 5, FALSE), ROW('babysitting', 5, TRUE)
) AS package (code, min_stars, is_paid) ON COALESCE(h.star_rating, 1) >= package.min_stars
JOIN amenities a ON a.code = package.code;

-- Hotels whose demo description already promised a pool keep it, whatever their class.
INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id, is_paid)
SELECT h.id, a.id, FALSE FROM hotels h JOIN amenities a ON a.code = 'pool'
WHERE h.description LIKE '%Hồ bơi%';

UPDATE hotels SET check_in_from = '14:00:00', check_out_until = '12:00:00';

DELETE FROM hotel_policies;

INSERT INTO hotel_policies (hotel_id, policy_type, content)
SELECT h.id, policy.policy_type, policy.content
FROM hotels h
JOIN (VALUES
  ROW('children', 'Trẻ em dưới 6 tuổi ở miễn phí khi dùng giường có sẵn cùng bố mẹ. Từ 6 tuổi tính như người lớn.'),
  ROW('extra_bed', 'Giường phụ tùy loại phòng và còn trống; phụ thu thanh toán tại khách sạn.'),
  ROW('pets', 'Không nhận thú cưng.'),
  ROW('smoking', 'Không hút thuốc trong phòng và khu vực chung trong nhà.'),
  ROW('payment', 'Khách sạn nhận tiền mặt, thẻ ngân hàng nội địa, Visa và Mastercard.'),
  ROW('deposit', 'Khách sạn có thể giữ tiền đặt cọc khi nhận phòng và hoàn lại khi trả phòng.'),
  ROW('cancellation', 'Điều kiện hủy theo từng mức giá của đối tác; SàiHành báo rõ khi xác nhận đặt phòng.')
) AS policy (policy_type, content);

COMMIT;
