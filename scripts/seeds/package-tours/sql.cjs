/* SQL text of seed 010: a header, then one re-runnable block per tour. */
const { TODAY, WINDOW_START, WINDOW_END, TIERS, BRANCH_ORIGIN, ORIGIN_NAME, NEW_LOCATIONS } = require('./config.cjs');

const q = value => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
const rowsSql = rows => rows.map(row => `  ROW(${row.join(', ')})`).join(',\n');

/** INSERT ... SELECT over a VALUES table; `guard` skips the rows when the tour already existed. */
function valuesInsert({ into, select, rows, alias, guard = 'WHERE @tour IS NOT NULL' }) {
  return `${into}\n${select}\nFROM (VALUES\n${rowsSql(rows)}\n) AS v (${alias})\n${guard};`;
}

const NOTES = `-- 010_vietnam_package_tours.sql
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
-- Lịch khởi hành: {start} → {end} (90 ngày tính từ {today}). Tour 1–2 ngày khởi hành hằng tuần,
-- 3–4 ngày cách 2 tuần, 5–7 ngày cách 3 tuần. Giá người lớn theo mùa (trẻ em = 75%, làm tròn 10.000 đ):
--   * chuyến có ngày rơi vào Tết Đinh Mùi {tetStart}..{tetEnd} (Tất niên đến mùng 3): +30%
--   * khởi hành trong 6 ngày sau mùng 3 (du xuân): +15%; trong 7 ngày trước Tất niên (cận Tết): +10%
--   * chuyến có ngày Tết Dương lịch {newYear}: +12%; khởi hành 20–31/12 (cuối năm): +8%
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
`;

function header(holiday) {
  const values = { start: WINDOW_START, end: WINDOW_END, today: TODAY, tetStart: holiday.tetStart,
    tetEnd: holiday.tetEnd, newYear: holiday.newYear };
  const notes = NOTES.replace(/\{(\w+)\}/g, (_, key) => values[key]);
  const categories = valuesInsert({
    into: 'INSERT INTO tour_categories (slug, name)', select: 'SELECT v.slug, v.name', alias: 'slug, name',
    rows: Object.values(TIERS).map(tier => [q(tier.slug), q(tier.name)]),
    guard: 'WHERE NOT EXISTS (SELECT 1 FROM tour_categories c WHERE c.slug = v.slug)',
  });
  const locations = valuesInsert({
    into: 'INSERT INTO locations (parent_id, code, name, location_type)',
    select: "SELECT NULL, v.code, v.name, 'city'", alias: 'code, name',
    rows: NEW_LOCATIONS.map(([code, name]) => [q(code), q(name)]),
    guard: 'WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.code = v.code)',
  });
  return `${notes}\n${categories}\n\n${locations}\n\n`;
}

function tourInsert(tour, minPrice) {
  const tier = TIERS[tour.tier];
  const description = `Dòng ${tier.name} · khởi hành từ ${ORIGIN_NAME[tour.branch]}. Điểm nhấn: ${tour.highlights}.`;
  return `INSERT INTO tours (code, title, category_id, destination_id, operating_branch_id, duration_days,
  duration_nights, description, base_price, status)
SELECT ${q(tour.code)}, ${q(tour.title)},
  (SELECT id FROM tour_categories WHERE slug = ${q(tier.slug)}),
  (SELECT id FROM locations WHERE code = ${q(tour.dest)}), @branch, ${tour.days}, ${tour.nights},
  ${q(description)}, ${minPrice}, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tours WHERE code = ${q(tour.code)});`;
}

function departuresInsert(deps) {
  return valuesInsert({
    into: 'INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date, '
      + 'return_date,\n  capacity, min_guests, reserved_seats, adult_price, child_price, status)',
    select: 'SELECT @tour, @branch, @origin, v.departure_date, v.return_date, v.capacity, v.min_guests, '
      + "v.reserved_seats,\n  v.adult_price, v.child_price, 'open'",
    rows: deps.map(d => [q(d.dep), q(d.ret), d.capacity, d.minGuests, d.reserved, d.adult, d.child]),
    alias: 'departure_date, return_date, capacity, min_guests, reserved_seats, adult_price, child_price',
  });
}

function childInserts(tour, inclusionRows, imgs) {
  const statements = [
    valuesInsert({
      into: 'INSERT INTO tour_itinerary_days (tour_id, day_number, title, description)',
      select: 'SELECT @tour, v.day_number, v.title, v.description', alias: 'day_number, title, description',
      rows: tour.itinerary.map(([title, text], i) => [i + 1, q(title), q(text)]),
    }),
    valuesInsert({
      into: 'INSERT INTO tour_inclusions (tour_id, service_type, description, is_included)',
      select: 'SELECT @tour, v.service_type, v.description, v.is_included',
      alias: 'service_type, description, is_included',
      rows: inclusionRows.map(([type, text, included]) => [q(type), q(text), included]),
    }),
  ];
  if (imgs.length > 0) statements.push(valuesInsert({
    into: 'INSERT INTO tour_images (tour_id, image_url, alt_text, sort_order)',
    select: 'SELECT @tour, v.image_url, v.alt_text, v.sort_order', alias: 'image_url, alt_text, sort_order',
    rows: imgs.map(img => [q(img.url), q(img.alt), img.sort]),
  }));
  return statements;
}

/** One tour block; @tour stays NULL when the code already exists, so every child insert is skipped too. */
function tourBlock(tour, deps, inclusionRows, imgs) {
  const tier = TIERS[tour.tier];
  return [
    `-- ${tour.code} · ${tour.title} (${tier.name}, chi nhánh ${tour.branch}, ${deps.length} lịch)`,
    `SET @branch = (SELECT id FROM branches WHERE code = ${q(tour.branch)});`,
    `SET @origin = (SELECT id FROM locations WHERE code = ${q(BRANCH_ORIGIN[tour.branch])});`,
    tourInsert(tour, Math.min(...deps.map(row => row.adult))),
    'SET @tour = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);',
    `INSERT INTO tour_transport_types (tour_id, transport_type_id)
SELECT @tour, id FROM transport_types WHERE code IN (${tour.transport.map(q).join(', ')}) AND @tour IS NOT NULL;`,
    departuresInsert(deps),
    ...childInserts(tour, inclusionRows, imgs),
  ].join('\n') + '\n';
}

module.exports = { header, tourBlock };
