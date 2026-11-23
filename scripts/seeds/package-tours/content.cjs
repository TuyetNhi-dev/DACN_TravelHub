/* "Giá bao gồm / không bao gồm" lines and credited library photos of each tour. */
const { MAX_PHOTOS, PHOTO_PLACES } = require('./config.cjs');

const TRANSPORT = {
  TK: 'Xe du lịch máy lạnh đưa đón theo chương trình (xe ghế ngồi hoặc giường nằm tùy chặng)',
  TC: 'Xe du lịch đời mới, máy lạnh, đưa đón suốt tuyến',
  CC: 'Xe limousine hoặc xe du lịch cao cấp đưa đón suốt tuyến',
};
const HOTEL = {
  TK: 'Khách sạn 2–3 sao, phòng 2–3 khách',
  TC: 'Khách sạn 3–4 sao, phòng 2 khách',
  CC: 'Khách sạn, resort hoặc du thuyền 4–5 sao, phòng 2 khách',
};
const MEALS_WITH_NIGHTS = {
  TK: 'Ăn sáng tại khách sạn; các bữa chính theo thực đơn đoàn',
  TC: 'Ăn sáng tại khách sạn; các bữa chính với món đặc sản địa phương',
  CC: 'Ăn sáng buffet; các bữa chính set menu tại nhà hàng chọn lọc, một bữa tối đặc biệt',
};
const MEALS_DAY_TOUR = {
  TK: 'Một bữa trưa theo thực đơn đoàn',
  TC: 'Một bữa trưa với món đặc sản địa phương',
  CC: 'Bữa trưa buffet hoặc set menu',
};
const FLIGHT = 'Vé máy bay khứ hồi hạng phổ thông theo chương trình; hành lý theo điều kiện hãng, '
  + 'cần xác nhận khi xuất vé';

function includedLines(tour) {
  const { tier } = tour;
  const nights = tour.nights > 0;
  const lines = [];
  if (tour.transport.includes('may-bay')) lines.push(['flight', FLIGHT]);
  lines.push(['transport', TRANSPORT[tier]]);
  if (nights) lines.push(['hotel', HOTEL[tier]]);
  lines.push(['meal', (nights ? MEALS_WITH_NIGHTS : MEALS_DAY_TOUR)[tier]]);
  lines.push(['guide', tier === 'CC' ? 'Hướng dẫn viên tiếng Việt nhiều kinh nghiệm suốt tuyến'
    : 'Hướng dẫn viên tiếng Việt suốt tuyến']);
  lines.push(['ticket', 'Vé vào cổng các điểm tham quan có trong chương trình']);
  lines.push(['other', 'Bảo hiểm du lịch trong thời gian tour; nước uống trên xe']);
  lines.push(['other', 'Giá từng ngày khởi hành đã gồm phụ thu lễ, Tết (nếu có)']);
  if (tier === 'CC') lines.push(['other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế']);
  if (tier !== 'TK') lines.push(['other', 'Thuế VAT']);
  return lines;
}

function excludedLines(tour) {
  const lines = [['other', 'Chi phí cá nhân, đồ uống ngoài thực đơn, giặt ủi']];
  if (tour.nights > 0) lines.push(['hotel', 'Phụ thu phòng đơn']);
  if (tour.tier !== 'CC') lines.push(['other', 'Tiền bồi dưỡng hướng dẫn viên và tài xế (tùy ý)']);
  if (tour.tier === 'TK') lines.push(['other', 'Hóa đơn VAT']);
  return [...lines, ...(tour.excluded ?? [])];
}

/** [service_type, description, is_included] rows. */
function inclusions(tour) {
  return [
    ...includedLines(tour).map(([type, text]) => [type, text, 1]),
    ...excludedLines(tour).map(([type, text]) => [type, text, 0]),
  ];
}

/** Up to MAX_PHOTOS photos, taking one from each place set in turn; the rotation varies the cover per tour. */
function photos(tour, index, photoLibrary) {
  const sets = tour.photos.map(key => {
    const list = photoLibrary[key];
    if (!list || !PHOTO_PLACES[key]) throw Error(`${tour.code}: unknown photo set ${key}`);
    const shift = index % list.length;
    return [...list.slice(shift), ...list.slice(0, shift)].map(photo => ({ key, photo }));
  });
  const picked = [];
  for (let round = 0; picked.length < MAX_PHOTOS && sets.some(set => set[round]); round++)
    for (const set of sets) if (set[round] && picked.length < MAX_PHOTOS) picked.push(set[round]);
  return picked.map(({ key, photo }, i) => ({
    url: `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=1920&q=80`,
    alt: `${PHOTO_PLACES[key]}: ${photo.alt}`,
    sort: (i + 1) * 10,
  }));
}

module.exports = { inclusions, photos };
