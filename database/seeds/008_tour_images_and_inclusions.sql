-- 008_tour_images_and_inclusions.sql
-- DEMO photos (tour_images) and "giá bao gồm / không bao gồm" lines (tour_inclusions) for the tour detail page.
-- Requires seeds/002 and seeds/005 (tours are matched by code, not id).
--
-- Photos: only the curated, credited Unsplash photos of frontend/src/data/photo-library.ts (docs/image-credits.md),
-- and only for tours whose destination has a set taken AT that place. Tours to Quy Nhơn, Vũng Tàu, Cần Thơ, An Giang,
-- Hà Giang, Quảng Bình, Mũi Né, Buôn Ma Thuột, Côn Đảo, Mộc Châu, Tây Ninh, Bến Tre, Lý Sơn, Pleiku and Tam Đảo get
-- no rows on purpose: the site keeps showing labelled illustrations for them instead of photos of another place.
-- The lowest sort_order is the cover photo.
--
-- Inclusions: typical domestic package terms, SIMULATED for the demo (not a contract). Flight tours ("may-bay")
-- include the return flight; tours with nights include the hotel and list the single-room supplement as extra.
--
-- Safe to re-run: a tour that already has photos (or inclusion lines) is skipped, so edits made later are kept.
SET NAMES utf8mb4;
START TRANSACTION;

-- ---------------------------------------------------------------------------------------------------------------
-- Photos
-- ---------------------------------------------------------------------------------------------------------------
-- TOUR001: 5 ảnh Đà Nẵng, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Du khách trên cây cầu cong được nâng bởi bàn tay đá khổng lồ' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1781963577464-aae78aa7be67?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Cầu Rồng bắc qua sông, phía sau là thành phố và hàng cọ' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1674296067534-0f9769040781?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Bãi biển và thành phố nhìn từ trên cao' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1780631392137-f3abcbeb16e2?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Pháo hoa rực sáng trên sông và thành phố về đêm' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR001'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR026: 5 ảnh Đà Nẵng, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1674296067534-0f9769040781?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Bãi biển và thành phố nhìn từ trên cao' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1780631392137-f3abcbeb16e2?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Pháo hoa rực sáng trên sông và thành phố về đêm' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Du khách trên cây cầu cong được nâng bởi bàn tay đá khổng lồ' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1781963577464-aae78aa7be67?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Cầu Rồng bắc qua sông, phía sau là thành phố và hàng cọ' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR026'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR002: 5 ảnh Phú Quốc, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1732243395944-cb3ff9311091?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Bãi cát trắng và hàng dừa bên bờ biển' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1758657281824-239a1bfb3c92?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Cáp treo vượt biển nhìn về thị trấn ven biển' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1779513694945-ca77ad0c3eaa?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Tháp đồng hồ bên bờ biển lúc hoàng hôn' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1698809807960-758cf416e96e?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Bãi biển lúc hoàng hôn với con thuyền trên mặt nước' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1758737922322-b806a5c431a3?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Thị trấn ven biển với bãi cát và nước biển xanh ngọc' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR002'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR027: 5 ảnh Phú Quốc, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1779513694945-ca77ad0c3eaa?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Tháp đồng hồ bên bờ biển lúc hoàng hôn' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1698809807960-758cf416e96e?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Bãi biển lúc hoàng hôn với con thuyền trên mặt nước' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1758737922322-b806a5c431a3?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Thị trấn ven biển với bãi cát và nước biển xanh ngọc' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1732243395944-cb3ff9311091?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Bãi cát trắng và hàng dừa bên bờ biển' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1758657281824-239a1bfb3c92?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Cáp treo vượt biển nhìn về thị trấn ven biển' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR027'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR003: 5 ảnh Đà Lạt, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1699425413886-a6490b7bd009?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Đồi núi chìm trong sương sớm' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1741524427564-0173c980c432?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Rừng thông xanh bên mặt hồ yên ả' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1648210777529-fe379b3b14fc?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Nhà thờ có tháp chuông dưới nắng' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1564396738239-351774a1a50e?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Nhà ven hồ nhìn ra núi dưới trời xanh' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1678099006439-dba9e4d3f9f5?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Đồng cỏ, rặng cây và núi phía xa' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR003'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR028: 5 ảnh Đà Lạt, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1648210777529-fe379b3b14fc?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Nhà thờ có tháp chuông dưới nắng' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1564396738239-351774a1a50e?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Nhà ven hồ nhìn ra núi dưới trời xanh' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1678099006439-dba9e4d3f9f5?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Đồng cỏ, rặng cây và núi phía xa' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1699425413886-a6490b7bd009?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Đồi núi chìm trong sương sớm' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1741524427564-0173c980c432?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Rừng thông xanh bên mặt hồ yên ả' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR028'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR004: 5 ảnh Nha Trang, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1533002832-1721d16b4bb9?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Bãi biển nhìn từ trên cao' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1689326232193-d55f0b7965eb?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Bãi biển với thành phố phía sau' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1767423656732-ca909689612b?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thành phố biển nhìn từ đồi hoa' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1783522712596-e921655528fc?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thuyền đánh cá trong bến cảng nhộn nhịp' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1570366290364-5e76a15ae408?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thành phố và bãi biển ban ngày' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR004'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR029: 5 ảnh Nha Trang, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1767423656732-ca909689612b?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thành phố biển nhìn từ đồi hoa' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1783522712596-e921655528fc?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thuyền đánh cá trong bến cảng nhộn nhịp' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1570366290364-5e76a15ae408?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thành phố và bãi biển ban ngày' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1533002832-1721d16b4bb9?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Bãi biển nhìn từ trên cao' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1689326232193-d55f0b7965eb?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Bãi biển với thành phố phía sau' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR029'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR005: 5 ảnh Vịnh Hạ Long, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Thuyền trên làn nước xanh ngọc giữa các đảo đá vôi vịnh Hạ Long' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1764645859246-8c6db98330a7?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Đảo đá vôi trên vịnh lúc hoàng hôn' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1772867342647-6e6d87a0b014?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Du thuyền đi qua vịnh giữa các núi đá vôi' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1748102288847-b2607862c249?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Toàn cảnh các đảo trên vịnh nhìn từ trên cao' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1697850084120-4896a446a04d?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Du khách chèo kayak qua hang đá trên vịnh' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR005'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR030: 5 ảnh Vịnh Hạ Long, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1772867342647-6e6d87a0b014?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Du thuyền đi qua vịnh giữa các núi đá vôi' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1748102288847-b2607862c249?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Toàn cảnh các đảo trên vịnh nhìn từ trên cao' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1697850084120-4896a446a04d?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Du khách chèo kayak qua hang đá trên vịnh' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1778235982248-d4ee62f01064?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Thuyền neo đậu trong vịnh bao quanh bởi núi đá vôi' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Thuyền trên làn nước xanh ngọc giữa các đảo đá vôi vịnh Hạ Long' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR030'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR006: 5 ảnh Sa Pa, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Ruộng bậc thang và nhà nhỏ trong thung lũng núi' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi xanh nhìn từ trên cao' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1698809807686-42a1f8e14ea3?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Cáp treo vượt trên biển mây' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR006'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR031: 5 ảnh Sa Pa, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi xanh nhìn từ trên cao' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1698809807686-42a1f8e14ea3?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Cáp treo vượt trên biển mây' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Ruộng bậc thang và nhà nhỏ trong thung lũng núi' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR031'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR007: 5 ảnh Hà Nội, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Đường tàu chạy xuyên qua con hẻm' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1778809848221-effdbae7037d?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Phố cổ với cửa hàng và đèn lồng' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1616438096679-620332ede3a2?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Người đội nón lá gánh hàng trên phố' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1599708153386-62bf3f035c78?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Công trình kiến trúc cổ giữa hàng cây xanh' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Nhà cao tầng lúc hoàng hôn' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR007'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR032: 5 ảnh Hà Nội, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1616438096679-620332ede3a2?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Người đội nón lá gánh hàng trên phố' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1599708153386-62bf3f035c78?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Công trình kiến trúc cổ giữa hàng cây xanh' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Nhà cao tầng lúc hoàng hôn' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Đường tàu chạy xuyên qua con hẻm' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1778809848221-effdbae7037d?auto=format&fit=crop&w=1920&q=80' AS url, 'Hà Nội: Phố cổ với cửa hàng và đèn lồng' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR032'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR008: 4 ảnh Huế, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1618165220283-e85246c4171c?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Chùa tháp dưới bầu trời xanh' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1568775791746-bcc117bcb312?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Tháp chùa bên hàng cây' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1784350725199-b3655c49ce2e?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Nắng chiếu vào sân đền cổ' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1664333039578-28ad613ee536?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Công trình cổ có cầu bắc qua mặt nước' AS alt, 40 AS sort_order
) AS photo
WHERE t.code = 'TOUR008'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR033: 4 ảnh Huế, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1784350725199-b3655c49ce2e?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Nắng chiếu vào sân đền cổ' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1664333039578-28ad613ee536?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Công trình cổ có cầu bắc qua mặt nước' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1618165220283-e85246c4171c?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Chùa tháp dưới bầu trời xanh' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1568775791746-bcc117bcb312?auto=format&fit=crop&w=1920&q=80' AS url, 'Huế: Tháp chùa bên hàng cây' AS alt, 40 AS sort_order
) AS photo
WHERE t.code = 'TOUR033'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR009: 5 ảnh Ninh Bình, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Chùa giữa mặt nước và núi đá' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1768158186882-9e7e15e53532?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Cổng đền cổ bên dòng sông và núi' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1725209276479-59220882e9b0?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Du khách đi thuyền nhỏ trên sông' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1545172538-171a802bd867?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Thuyền chèo trên sông ban ngày' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1527428050273-21bd264db1b5?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Chùa trên đỉnh núi đá' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR009'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR034: 5 ảnh Ninh Bình, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1725209276479-59220882e9b0?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Du khách đi thuyền nhỏ trên sông' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1545172538-171a802bd867?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Thuyền chèo trên sông ban ngày' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1527428050273-21bd264db1b5?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Chùa trên đỉnh núi đá' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Chùa giữa mặt nước và núi đá' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1768158186882-9e7e15e53532?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Cổng đền cổ bên dòng sông và núi' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR034'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR010: 5 ảnh Hội An, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1787731218441-1ed95e59b54d?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Du khách đi qua cây cầu treo đèn lồng đỏ ở Hội An' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1563354860-799d15199ac3?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Đèn lồng nhiều màu sắc thắp sáng về đêm' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1761150285751-c593ab20159c?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Thuyền trên sông trước dãy nhà cổ' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Người đạp xe trên phố cổ treo đèn lồng' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1652731011413-93d4c5aa5c7c?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Người đạp xe trên phố cổ về đêm' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR010'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- TOUR035: 5 ảnh Hội An, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1761150285751-c593ab20159c?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Thuyền trên sông trước dãy nhà cổ' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Người đạp xe trên phố cổ treo đèn lồng' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1652731011413-93d4c5aa5c7c?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Người đạp xe trên phố cổ về đêm' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1787731218441-1ed95e59b54d?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Du khách đi qua cây cầu treo đèn lồng đỏ ở Hội An' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1563354860-799d15199ac3?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Đèn lồng nhiều màu sắc thắp sáng về đêm' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'TOUR035'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA001: 5 ảnh Hội An, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1652731011413-93d4c5aa5c7c?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Người đạp xe trên phố cổ về đêm' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1787731218441-1ed95e59b54d?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Du khách đi qua cây cầu treo đèn lồng đỏ ở Hội An' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1563354860-799d15199ac3?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Đèn lồng nhiều màu sắc thắp sáng về đêm' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1761150285751-c593ab20159c?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Thuyền trên sông trước dãy nhà cổ' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1777891873941-ea5d0ee868af?auto=format&fit=crop&w=1920&q=80' AS url, 'Hội An: Người đạp xe trên phố cổ treo đèn lồng' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA001'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA002: 5 ảnh Phú Quốc, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1758737922322-b806a5c431a3?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Thị trấn ven biển với bãi cát và nước biển xanh ngọc' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1732243395944-cb3ff9311091?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Bãi cát trắng và hàng dừa bên bờ biển' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1758657281824-239a1bfb3c92?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Cáp treo vượt biển nhìn về thị trấn ven biển' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1779513694945-ca77ad0c3eaa?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Tháp đồng hồ bên bờ biển lúc hoàng hôn' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1698809807960-758cf416e96e?auto=format&fit=crop&w=1920&q=80' AS url, 'Phú Quốc: Bãi biển lúc hoàng hôn với con thuyền trên mặt nước' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA002'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA003: 5 ảnh Ninh Bình, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1527428050273-21bd264db1b5?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Chùa trên đỉnh núi đá' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Chùa giữa mặt nước và núi đá' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1768158186882-9e7e15e53532?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Cổng đền cổ bên dòng sông và núi' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1725209276479-59220882e9b0?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Du khách đi thuyền nhỏ trên sông' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1545172538-171a802bd867?auto=format&fit=crop&w=1920&q=80' AS url, 'Ninh Bình: Thuyền chèo trên sông ban ngày' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA003'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA006: 5 ảnh Sa Pa, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Ruộng bậc thang và nhà nhỏ trong thung lũng núi' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi xanh nhìn từ trên cao' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1698809807686-42a1f8e14ea3?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Cáp treo vượt trên biển mây' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA006'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA008: 5 ảnh Vịnh Hạ Long, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1697850084120-4896a446a04d?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Du khách chèo kayak qua hang đá trên vịnh' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1778235982248-d4ee62f01064?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Thuyền neo đậu trong vịnh bao quanh bởi núi đá vôi' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Thuyền trên làn nước xanh ngọc giữa các đảo đá vôi vịnh Hạ Long' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1764645859246-8c6db98330a7?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Đảo đá vôi trên vịnh lúc hoàng hôn' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1772867342647-6e6d87a0b014?auto=format&fit=crop&w=1920&q=80' AS url, 'Vịnh Hạ Long: Du thuyền đi qua vịnh giữa các núi đá vôi' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA008'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA009: 5 ảnh Nha Trang, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1570366290364-5e76a15ae408?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thành phố và bãi biển ban ngày' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1533002832-1721d16b4bb9?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Bãi biển nhìn từ trên cao' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1689326232193-d55f0b7965eb?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Bãi biển với thành phố phía sau' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1767423656732-ca909689612b?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thành phố biển nhìn từ đồi hoa' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1783522712596-e921655528fc?auto=format&fit=crop&w=1920&q=80' AS url, 'Nha Trang: Thuyền đánh cá trong bến cảng nhộn nhịp' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA009'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA010: 5 ảnh TP. Hồ Chí Minh, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1920&q=80' AS url, 'TP. Hồ Chí Minh: Đường chân trời thành phố về đêm' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1680525534259-773f7e73b687?auto=format&fit=crop&w=1920&q=80' AS url, 'TP. Hồ Chí Minh: Thành phố về đêm với cây cầu phía trước' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1602646994030-464f98de5e5c?auto=format&fit=crop&w=1920&q=80' AS url, 'TP. Hồ Chí Minh: Nhà cao tầng nhìn từ trên cao ban ngày' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1773489736083-66d0c966fa3b?auto=format&fit=crop&w=1920&q=80' AS url, 'TP. Hồ Chí Minh: Xe máy chạy qua khu chợ trước dãy nhà cũ' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1591269469224-0479a5f956c6?auto=format&fit=crop&w=1920&q=80' AS url, 'TP. Hồ Chí Minh: Đường chân trời thành phố bên kia sông' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA010'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA014: 5 ảnh Đà Nẵng, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1780631392137-f3abcbeb16e2?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Pháo hoa rực sáng trên sông và thành phố về đêm' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Du khách trên cây cầu cong được nâng bởi bàn tay đá khổng lồ' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1781963577464-aae78aa7be67?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Cầu Rồng bắc qua sông, phía sau là thành phố và hàng cọ' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1674296067534-0f9769040781?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Bãi biển và thành phố nhìn từ trên cao' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1786617748816-04b381f37f2f?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Nẵng: Tàu hỏa leo núi màu đỏ bên lâu đài đá trên núi' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA014'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA015: 5 ảnh Sa Pa, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1531737212413-667205e1cda7?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi đồi trùng điệp nhìn từ trên cao' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1480996408299-fc0e830b5db1?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Núi xanh nhìn từ trên cao' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1698809807686-42a1f8e14ea3?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Cáp treo vượt trên biển mây' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1696276959983-2da1448e695a?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Bản làng nằm giữa thung lũng bao quanh bởi núi' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1920&q=80' AS url, 'Sa Pa: Ruộng bậc thang và nhà nhỏ trong thung lũng núi' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA015'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- SEA019: 5 ảnh Đà Lạt, ảnh đại diện sort_order = 10
INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)
SELECT t.id, photo.url, photo.alt, photo.sort_order
FROM tours t
JOIN (
    SELECT 'https://images.unsplash.com/photo-1678099006439-dba9e4d3f9f5?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Đồng cỏ, rặng cây và núi phía xa' AS alt, 10 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1699425413886-a6490b7bd009?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Đồi núi chìm trong sương sớm' AS alt, 20 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1741524427564-0173c980c432?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Rừng thông xanh bên mặt hồ yên ả' AS alt, 30 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1648210777529-fe379b3b14fc?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Nhà thờ có tháp chuông dưới nắng' AS alt, 40 AS sort_order
    UNION ALL
    SELECT 'https://images.unsplash.com/photo-1564396738239-351774a1a50e?auto=format&fit=crop&w=1920&q=80' AS url, 'Đà Lạt: Nhà ven hồ nhìn ra núi dưới trời xanh' AS alt, 50 AS sort_order
) AS photo
WHERE t.code = 'SEA019'
  AND NOT EXISTS (SELECT 1 FROM tour_images existing WHERE existing.tour_id = t.id);

-- ---------------------------------------------------------------------------------------------------------------
-- Giá bao gồm / không bao gồm
-- ---------------------------------------------------------------------------------------------------------------
-- Tours chosen once up front: each INSERT below would otherwise see the lines the previous one just added.
DROP TEMPORARY TABLE IF EXISTS seed_inclusion_tours;
CREATE TEMPORARY TABLE seed_inclusion_tours AS
SELECT t.id, t.duration_nights,
  EXISTS (SELECT 1 FROM tour_transport_types link JOIN transport_types tt ON tt.id = link.transport_type_id
          WHERE link.tour_id = t.id AND tt.code = 'may-bay') AS by_air
FROM tours t
WHERE NOT EXISTS (SELECT 1 FROM tour_inclusions existing WHERE existing.tour_id = t.id);

-- Bao gồm (insert order is display order)
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'flight', 'Vé máy bay khứ hồi hạng phổ thông, 7 kg hành lý xách tay và 20 kg ký gửi', TRUE
FROM seed_inclusion_tours WHERE by_air;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'transport',
  IF(by_air, 'Xe du lịch máy lạnh đón tiễn sân bay và đưa đón tham quan theo chương trình',
             'Xe du lịch máy lạnh đời mới đưa đón suốt hành trình'), TRUE
FROM seed_inclusion_tours;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'hotel', CONCAT('Khách sạn 3–4 sao, ', duration_nights, ' đêm, 2 khách/phòng (phòng 3 khách khi lẻ)'), TRUE
FROM seed_inclusion_tours WHERE duration_nights > 0;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'meal', 'Các bữa ăn theo chương trình: ăn sáng tại khách sạn, bữa chính thực đơn đặc sản địa phương', TRUE
FROM seed_inclusion_tours;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'ticket', 'Vé vào cổng các điểm tham quan có trong chương trình (lượt thứ nhất)', TRUE
FROM seed_inclusion_tours;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'guide', 'Hướng dẫn viên tiếng Việt nhiệt tình, kinh nghiệm theo suốt tuyến', TRUE
FROM seed_inclusion_tours;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'other', 'Bảo hiểm du lịch trọn tuyến, nước suối 1 chai/khách/ngày, khăn lạnh trên xe', TRUE
FROM seed_inclusion_tours;

-- Không bao gồm
INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'other', 'Chi phí cá nhân: giặt ủi, điện thoại, minibar, đồ uống ngoài bữa ăn', FALSE
FROM seed_inclusion_tours;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'other', 'Thuế VAT (xuất hóa đơn khi khách yêu cầu)', FALSE
FROM seed_inclusion_tours;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'hotel', 'Phụ thu phòng đơn cho khách muốn ở riêng một phòng', FALSE
FROM seed_inclusion_tours WHERE duration_nights > 0;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'ticket', 'Vé tham quan, trò chơi và dịch vụ tự chọn ngoài chương trình', FALSE
FROM seed_inclusion_tours;

INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)
SELECT id, 'other', 'Tiền tip cho hướng dẫn viên và tài xế (tùy lòng hảo tâm)', FALSE
FROM seed_inclusion_tours;

DROP TEMPORARY TABLE seed_inclusion_tours;

COMMIT;
