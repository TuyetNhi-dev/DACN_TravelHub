// Miền Bắc: 15 tour chi nhánh Hà Nội (khởi hành Hà Nội), 5 tour chi nhánh TP.HCM (bay từ TP.HCM).
module.exports = [
  {
    code: 'SH-MB-001', branch: 'HN', tier: 'TK', transport: ['o-to'], days: 1, nights: 0, dest: 'city-ha-noi', dow: 6,
    title: 'Hà Nội một ngày: Lăng Bác – Văn Miếu – phố cổ',
    photos: ['hanoi'],
    highlights: 'Lăng Chủ tịch Hồ Chí Minh, Văn Miếu – Quốc Tử Giám, hồ Hoàn Kiếm, phố cổ',
    itinerary: [
      ['Lăng Bác – Văn Miếu – hồ Hoàn Kiếm – phố cổ',
        'Buổi sáng viếng Lăng Chủ tịch Hồ Chí Minh, tham quan nhà sàn Bác Hồ và chùa Một Cột. Ăn trưa món Hà Nội, '
        + 'chiều thăm Văn Miếu – Quốc Tử Giám, đền Ngọc Sơn bên hồ Hoàn Kiếm rồi dạo phố cổ, thưởng thức cà phê '
        + 'trứng. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-002', branch: 'HN', tier: 'TK', transport: ['o-to'], days: 1, nights: 0, dest: 'city-ninh-binh',
    dow: 0,
    title: 'Ninh Bình một ngày: Tràng An – Bái Đính – Hang Múa',
    photos: ['ninhbinh'],
    highlights: 'Quần thể danh thắng Tràng An, chùa Bái Đính, Hang Múa',
    itinerary: [
      ['Hà Nội – Bái Đính – Tràng An – Hang Múa',
        'Khởi hành sớm đi Ninh Bình theo cao tốc Pháp Vân – Cầu Giẽ. Lễ chùa Bái Đính, ăn trưa đặc sản dê núi và cơm '
        + 'cháy. Chiều ngồi thuyền xuôi suối Tràng An qua các hang động, sau đó leo Hang Múa ngắm toàn cảnh Tam Cốc. '
        + 'Về Hà Nội buổi tối. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-003', branch: 'HN', tier: 'CC', transport: ['o-to'], days: 2, nights: 1, dest: 'city-ha-long', dow: 6,
    title: 'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền 5 sao',
    photos: ['halong'],
    highlights: 'Du thuyền ngủ đêm trên vịnh, hang Sửng Sốt, chèo kayak hang Luồn, đảo Ti Tốp',
    itinerary: [
      ['Hà Nội – Hạ Long, lên du thuyền',
        'Xe limousine đón tại Hà Nội, theo cao tốc Hà Nội – Hải Phòng – Hạ Long đến cảng Tuần Châu. Lên du thuyền, '
        + 'ăn trưa trong lúc tàu đi vào vịnh. Chiều chèo kayak qua hang Luồn, tắm biển đảo Ti Tốp. Tối dự tiệc trên '
        + 'boong và câu mực đêm.'],
      ['Hang Sửng Sốt – về Hà Nội',
        'Tập dưỡng sinh trên boong lúc bình minh, sau bữa sáng thăm hang Sửng Sốt. Ăn trưa trên tàu trong lúc về '
        + 'cảng, xe đưa về Hà Nội buổi chiều. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-004', branch: 'HN', tier: 'TC', transport: ['o-to'], days: 2, nights: 1, dest: 'city-ha-long', dow: 6,
    title: 'Yên Tử – Hạ Long 2 ngày 1 đêm',
    photos: ['halong'],
    highlights: 'Cáp treo Yên Tử lên chùa Đồng, du ngoạn vịnh Hạ Long, hang Thiên Cung',
    itinerary: [
      ['Hà Nội – Yên Tử – Hạ Long',
        'Khởi hành đi Uông Bí, đi cáp treo lên chùa Hoa Yên và chùa Đồng trên đỉnh Yên Tử. Ăn trưa chay hoặc mặn tùy '
        + 'chọn, chiều tiếp tục về Hạ Long nhận phòng. Tối tự do dạo chợ đêm Hạ Long.'],
      ['Du ngoạn vịnh Hạ Long – về Hà Nội',
        'Lên tàu thăm vịnh, ngắm hòn Gà Chọi, hòn Đỉnh Hương và thăm hang Thiên Cung. Ăn trưa hải sản trên tàu, '
        + 'chiều trở về Hà Nội. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-005', branch: 'HN', tier: 'TC', transport: ['o-to'], days: 3, nights: 2, dest: 'city-sa-pa', dow: 5,
    title: 'Sa Pa 3 ngày 2 đêm: bản Cát Cát – đỉnh Fansipan',
    photos: ['sapa'],
    highlights: 'Bản Cát Cát, cáp treo Fansipan, núi Hàm Rồng, đèo Ô Quy Hồ',
    itinerary: [
      ['Hà Nội – Sa Pa – bản Cát Cát',
        'Theo cao tốc Nội Bài – Lào Cai lên Sa Pa, ăn trưa và nhận phòng. Chiều đi bộ xuống bản Cát Cát của người '
        + 'Mông, xem thác nước và nhà máy thủy điện cũ. Tối dạo quanh nhà thờ đá Sa Pa.'],
      ['Chinh phục Fansipan – núi Hàm Rồng',
        'Đi tàu leo núi Mường Hoa và cáp treo lên đỉnh Fansipan 3.143 m, viếng quần thể tâm linh trên đỉnh. Chiều '
        + 'tham quan vườn hoa và sân mây núi Hàm Rồng.'],
      ['Đèo Ô Quy Hồ – thác Bạc – về Hà Nội',
        'Ngắm đèo Ô Quy Hồ từ cổng trời, ghé thác Bạc rồi xuống chợ Sa Pa mua đặc sản. Ăn trưa, về Hà Nội buổi tối. '
        + 'Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-006', branch: 'HN', tier: 'TK', transport: ['o-to'], days: 2, nights: 1, dest: 'city-sa-pa', dow: 5,
    title: 'Sa Pa 2 ngày 1 đêm: trekking Lao Chải – Tả Van',
    photos: ['sapa'],
    highlights: 'Đi bộ thung lũng Mường Hoa, bản Lao Chải và Tả Van, bản Cát Cát',
    itinerary: [
      ['Hà Nội – Sa Pa – trekking Lao Chải, Tả Van',
        'Xe giường nằm đưa lên Sa Pa từ sáng sớm. Sau bữa trưa đi bộ khoảng 10 km dọc thung lũng Mường Hoa qua bản '
        + 'Lao Chải của người Mông và Tả Van của người Giáy, xe đón về thị trấn nghỉ đêm.'],
      ['Bản Cát Cát – về Hà Nội',
        'Sáng thăm bản Cát Cát, chiều tự do mua sắm ở chợ Sa Pa rồi lên xe về Hà Nội, đến nơi khoảng 21 giờ. Kết '
        + 'thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-007', branch: 'HN', tier: 'TC', transport: ['o-to'], days: 4, nights: 3, dest: 'city-ha-giang', dow: 4,
    title: 'Hà Giang 4 ngày 3 đêm: Đồng Văn – Mã Pì Lèng – Lũng Cú',
    photos: [],
    highlights: 'Cổng trời Quản Bạ, dinh thự họ Vương, cột cờ Lũng Cú, đèo Mã Pì Lèng, sông Nho Quế',
    itinerary: [
      ['Hà Nội – thành phố Hà Giang',
        'Khởi hành đi Hà Giang theo cao tốc Hà Nội – Tuyên Quang và quốc lộ 2, dừng chụp ảnh tại cột mốc Km0. Nhận '
        + 'phòng, tối dùng bữa với thắng cố và cháo ấu tẩu.'],
      ['Quản Bạ – Yên Minh – Đồng Văn',
        'Lên cổng trời Quản Bạ ngắm núi đôi Cô Tiên, qua rừng thông Yên Minh đến Sà Phìn thăm dinh thự họ Vương. Tối '
        + 'nghỉ tại thị trấn Đồng Văn, dạo phố cổ dưới chân núi.'],
      ['Lũng Cú – Mã Pì Lèng – sông Nho Quế',
        'Sáng lên cột cờ Lũng Cú nơi cực Bắc, chiều vượt đèo Mã Pì Lèng và đi thuyền trên sông Nho Quế qua hẻm Tu '
        + 'Sản. Nghỉ đêm tại Mèo Vạc.'],
      ['Mèo Vạc – về Hà Nội',
        'Theo cung đường Mậu Duệ về thành phố Hà Giang ăn trưa, chiều lên xe về Hà Nội. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-008', branch: 'HN', tier: 'TK', transport: ['o-to'], days: 3, nights: 2, dest: 'city-ha-giang', dow: 5,
    title: 'Hà Giang 3 ngày 2 đêm: cung đường đá xe giường nằm',
    photos: [],
    highlights: 'Cổng trời Quản Bạ, phố cổ Đồng Văn, cột cờ Lũng Cú, đèo Mã Pì Lèng',
    itinerary: [
      ['Hà Nội – Quản Bạ – Yên Minh',
        'Xe giường nằm khởi hành đêm trước, sáng tới thành phố Hà Giang ăn sáng. Lên cổng trời Quản Bạ, nghỉ đêm tại '
        + 'Yên Minh.'],
      ['Lũng Cú – Đồng Văn – Mã Pì Lèng',
        'Thăm dinh thự họ Vương, cột cờ Lũng Cú, phố cổ Đồng Văn; chiều ngắm đèo Mã Pì Lèng và sông Nho Quế từ trên '
        + 'cao. Nghỉ đêm tại Mèo Vạc hoặc Đồng Văn.'],
      ['Về Hà Nội',
        'Trở về thành phố Hà Giang ăn trưa rồi lên xe về Hà Nội, đến nơi buổi tối. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-009', branch: 'HN', tier: 'TC', transport: ['o-to'], days: 3, nights: 2, dest: 'city-cao-bang', dow: 5,
    title: 'Hồ Ba Bể – thác Bản Giốc 3 ngày 2 đêm',
    photos: [],
    highlights: 'Hồ Ba Bể, thác Bản Giốc, động Ngườm Ngao, khu di tích Pác Bó',
    itinerary: [
      ['Hà Nội – hồ Ba Bể',
        'Khởi hành đi Bắc Kạn, chiều đi thuyền trên hồ Ba Bể thăm ao Tiên, đảo Bà Góa và động Puông. Nghỉ đêm '
        + 'homestay của người Tày ở bản Pác Ngòi.'],
      ['Ba Bể – thác Bản Giốc – động Ngườm Ngao',
        'Di chuyển sang Trùng Khánh, Cao Bằng, ngồi bè tre đến gần chân thác Bản Giốc và thăm chùa Phật tích Trúc '
        + 'Lâm Bản Giốc. Chiều khám phá động Ngườm Ngao, nghỉ đêm tại thành phố Cao Bằng.'],
      ['Pác Bó – về Hà Nội',
        'Thăm khu di tích Pác Bó với suối Lênin và hang Cốc Bó, sau bữa trưa trở về Hà Nội. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-010', branch: 'HN', tier: 'TK', transport: ['o-to'], days: 2, nights: 1, dest: 'city-moc-chau', dow: 6,
    title: 'Mộc Châu 2 ngày 1 đêm: đồi chè – thác Dải Yếm',
    photos: [],
    highlights: 'Đồi chè trái tim, thác Dải Yếm, rừng thông bản Áng, đặc sản bê chao',
    itinerary: [
      ['Hà Nội – Mộc Châu – đồi chè trái tim',
        'Theo quốc lộ 6 qua đèo Thung Khe lên cao nguyên Mộc Châu. Chiều dạo đồi chè trái tim và rừng thông bản Áng, '
        + 'tối thưởng thức bê chao, cá suối nướng.'],
      ['Thác Dải Yếm – về Hà Nội',
        'Sáng thăm thác Dải Yếm và mua sữa, mận sấy làm quà, sau bữa trưa về Hà Nội. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-011', branch: 'HN', tier: 'TC', transport: ['o-to'], days: 3, nights: 2, dest: 'city-ninh-binh',
    dow: 4,
    title: 'Ninh Bình – Hạ Long 3 ngày 2 đêm',
    photos: ['ninhbinh', 'halong'],
    highlights: 'Cố đô Hoa Lư, Tam Cốc – Bích Động, Hang Múa, vịnh Hạ Long',
    itinerary: [
      ['Hà Nội – Hoa Lư – Tam Cốc',
        'Thăm đền vua Đinh, vua Lê ở cố đô Hoa Lư. Chiều đi đò Tam Cốc qua ba hang xuyên núi, ghé chùa Bích Động. '
        + 'Nghỉ đêm tại Ninh Bình.'],
      ['Hang Múa – Hạ Long',
        'Sáng leo Hang Múa, sau đó qua Hải Phòng theo cao tốc Hải Phòng – Hạ Long ra Quảng Ninh. Chiều tự do tắm '
        + 'biển Bãi Cháy, tối dạo công viên Sun World hoặc chợ đêm.'],
      ['Vịnh Hạ Long – về Hà Nội',
        'Du ngoạn vịnh Hạ Long, thăm hang Sửng Sốt và đảo Ti Tốp, ăn trưa trên tàu rồi về Hà Nội. Kết thúc chương '
        + 'trình.'],
    ],
  },
  {
    code: 'SH-MB-012', branch: 'HN', tier: 'CC', transport: ['o-to'], days: 5, nights: 4, dest: 'city-cao-bang', dow: 3,
    title: 'Vòng cung Đông Bắc 5 ngày: Hà Giang – Cao Bằng – Ba Bể',
    photos: [],
    highlights: 'Cột cờ Lũng Cú, đèo Mã Pì Lèng, thác Bản Giốc, núi Mắt Thần, hồ Ba Bể',
    itinerary: [
      ['Hà Nội – Hà Giang',
        'Xe limousine đưa lên Hà Giang, chiều lên cổng trời Quản Bạ. Nghỉ đêm resort tại thành phố Hà Giang.'],
      ['Yên Minh – Đồng Văn – Lũng Cú',
        'Qua rừng thông Yên Minh, thăm dinh thự họ Vương và cột cờ Lũng Cú. Nghỉ đêm tại Đồng Văn.'],
      ['Mã Pì Lèng – Mèo Vạc – Bảo Lạc – Cao Bằng',
        'Đi thuyền trên sông Nho Quế, sau đó theo cung đường Mèo Vạc – Bảo Lạc sang Cao Bằng, ngắm đèo Khau Cốc Chà. '
        + 'Nghỉ đêm tại thành phố Cao Bằng.'],
      ['Núi Mắt Thần – thác Bản Giốc',
        'Ghé núi Mắt Thần ở Hà Quảng, chiều đến Trùng Khánh ngồi bè tre dưới chân thác Bản Giốc, thăm động Ngườm '
        + 'Ngao. Nghỉ đêm tại Trùng Khánh.'],
      ['Hồ Ba Bể – về Hà Nội',
        'Di chuyển về Bắc Kạn đi thuyền trên hồ Ba Bể, ăn trưa cá nướng rồi về Hà Nội. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-013', branch: 'HN', tier: 'TK', transport: ['o-to'], days: 3, nights: 2, dest: 'city-hai-phong',
    dow: 5,
    title: 'Hạ Long – Cát Bà 3 ngày 2 đêm: vịnh Lan Hạ',
    photos: ['halong'],
    highlights: 'Vịnh Hạ Long, phà Tuần Châu – Gia Luận, vịnh Lan Hạ, pháo đài Thần Công',
    itinerary: [
      ['Hà Nội – Hạ Long',
        'Khởi hành đi Hạ Long, chiều tắm biển Bãi Cháy, tối dạo chợ đêm. Nghỉ đêm tại Hạ Long.'],
      ['Phà sang Cát Bà – vịnh Lan Hạ',
        'Đi phà từ Tuần Châu sang Gia Luận, ngắm vịnh Hạ Long trên đường. Đến Cát Bà, lên tàu thăm vịnh Lan Hạ, làng '
        + 'chài Cái Bèo và tắm biển Ba Trái Đào. Nghỉ đêm tại thị trấn Cát Bà.'],
      ['Pháo đài Thần Công – về Hà Nội',
        'Sáng lên pháo đài Thần Công ngắm toàn cảnh vịnh, tắm biển Cát Cò, sau bữa trưa qua phà Cái Viềng về Hải '
        + 'Phòng và về Hà Nội. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-014', branch: 'HN', tier: 'CC', transport: ['o-to'], days: 6, nights: 5, dest: 'city-sa-pa', dow: 1,
    title: 'Hành trình Tây Bắc 6 ngày: Mai Châu – Điện Biên – Sa Pa',
    photos: ['sapa'],
    highlights: 'Bản Lác Mai Châu, cao nguyên Mộc Châu, đèo Pha Đin, di tích Điện Biên Phủ, đèo Ô Quy Hồ, Sa Pa',
    itinerary: [
      ['Hà Nội – Mai Châu',
        'Khởi hành đi Hòa Bình, ngắm thung lũng Mai Châu từ đèo Thung Khe. Chiều đạp xe quanh bản Lác, tối xem múa '
        + 'sạp của người Thái. Nghỉ đêm resort tại Mai Châu.'],
      ['Mai Châu – Mộc Châu – Sơn La',
        'Dừng ở đồi chè trái tim Mộc Châu và thác Dải Yếm, chiều đến Sơn La thăm Nhà tù Sơn La. Nghỉ đêm tại Sơn La.'],
      ['Sơn La – đèo Pha Đin – Điện Biên Phủ',
        'Vượt đèo Pha Đin đến Điện Biên Phủ, thăm Bảo tàng Chiến thắng Điện Biên Phủ, đồi A1 và hầm chỉ huy của '
        + 'tướng De Castries. Nghỉ đêm tại Điện Biên.'],
      ['Điện Biên – Lai Châu',
        'Theo quốc lộ 12 qua thị xã Mường Lay bên hồ thủy điện Sơn La, đến Lai Châu nghỉ đêm.'],
      ['Đèo Ô Quy Hồ – Sa Pa',
        'Vượt đèo Ô Quy Hồ, dừng ở thác Bạc và cổng trời. Chiều thăm bản Cát Cát, nghỉ đêm khách sạn 5 sao tại Sa Pa.'],
      ['Sa Pa – về Hà Nội',
        'Sáng tự do hoặc đi cáp treo Fansipan (tự túc), sau bữa trưa về Hà Nội theo cao tốc Nội Bài – Lào Cai. Kết '
        + 'thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-015', branch: 'HN', tier: 'TK', transport: ['o-to'], days: 2, nights: 1, dest: 'city-tam-dao', dow: 6,
    title: 'Tam Đảo – Tây Thiên 2 ngày 1 đêm',
    photos: [],
    highlights: 'Thiền viện Trúc Lâm Tây Thiên, nhà thờ đá Tam Đảo, thác Bạc Tam Đảo',
    itinerary: [
      ['Hà Nội – Tây Thiên – Tam Đảo',
        'Khởi hành đi Vĩnh Phúc, lễ Thiền viện Trúc Lâm Tây Thiên và đền Thượng. Chiều lên thị trấn Tam Đảo nhận '
        + 'phòng, tối thưởng thức su su xào, gà đồi nướng.'],
      ['Nhà thờ đá – thác Bạc – về Hà Nội',
        'Dạo quanh nhà thờ đá Tam Đảo, đi bộ xuống thác Bạc, sau bữa trưa về Hà Nội. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-016', branch: 'HCM', tier: 'TC', transport: ['may-bay'], days: 4, nights: 3, dest: 'city-ha-long',
    dow: 4,
    title: 'Hà Nội – Ninh Bình – Hạ Long 4 ngày 3 đêm',
    photos: ['hanoi', 'ninhbinh', 'halong'],
    highlights: 'Phố cổ Hà Nội, Tràng An, chùa Bái Đính, du ngoạn vịnh Hạ Long',
    itinerary: [
      ['TP. Hồ Chí Minh – Hà Nội',
        'Bay ra Hà Nội, tham quan Văn Miếu – Quốc Tử Giám và hồ Hoàn Kiếm. Tối xem múa rối nước, nghỉ đêm tại Hà Nội.'],
      ['Hà Nội – Ninh Bình',
        'Đi Ninh Bình lễ chùa Bái Đính, chiều đi thuyền Tràng An. Nghỉ đêm tại Ninh Bình.'],
      ['Ninh Bình – vịnh Hạ Long',
        'Qua Hải Phòng theo cao tốc ra Hạ Long, lên tàu thăm vịnh, hang Sửng Sốt, đảo Ti Tốp. Nghỉ đêm tại Hạ Long.'],
      ['Hạ Long – Nội Bài – TP. Hồ Chí Minh',
        'Sáng tự do tắm biển, sau bữa trưa ra sân bay Nội Bài bay về TP. Hồ Chí Minh. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-017', branch: 'HCM', tier: 'TC', transport: ['may-bay'], days: 4, nights: 3, dest: 'city-sa-pa',
    dow: 5,
    title: 'Hà Nội – Sa Pa – Fansipan 4 ngày 3 đêm',
    photos: ['hanoi', 'sapa'],
    highlights: 'Lăng Bác, phố cổ Hà Nội, bản Cát Cát, cáp treo Fansipan',
    itinerary: [
      ['TP. Hồ Chí Minh – Hà Nội – Sa Pa',
        'Bay ra Nội Bài, xe đón đi thẳng Sa Pa theo cao tốc Nội Bài – Lào Cai. Tối dạo nhà thờ đá Sa Pa.'],
      ['Bản Cát Cát – núi Hàm Rồng',
        'Sáng đi bộ xuống bản Cát Cát, chiều tham quan núi Hàm Rồng và chợ Sa Pa.'],
      ['Fansipan – về Hà Nội',
        'Đi cáp treo lên đỉnh Fansipan, ăn trưa rồi về Hà Nội. Tối dạo phố cổ, nghỉ đêm tại Hà Nội.'],
      ['Hà Nội – TP. Hồ Chí Minh',
        'Viếng Lăng Chủ tịch Hồ Chí Minh và chùa Một Cột, sau đó ra sân bay Nội Bài bay về. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-018', branch: 'HCM', tier: 'CC', transport: ['may-bay'], days: 5, nights: 4, dest: 'city-ha-giang',
    dow: 3,
    title: 'Hà Nội – Hà Giang 5 ngày 4 đêm: cực Bắc cao nguyên đá',
    photos: ['hanoi'],
    highlights: 'Phố cổ Hà Nội, cổng trời Quản Bạ, dinh thự họ Vương, cột cờ Lũng Cú, sông Nho Quế',
    itinerary: [
      ['TP. Hồ Chí Minh – Hà Nội',
        'Bay ra Hà Nội, chiều tham quan hồ Hoàn Kiếm và phố cổ, tối thưởng thức chả cá Lã Vọng. Nghỉ đêm tại Hà Nội.'],
      ['Hà Nội – Hà Giang – Quản Bạ',
        'Xe limousine đưa lên Hà Giang, chiều lên cổng trời Quản Bạ ngắm núi đôi Cô Tiên. Nghỉ đêm resort tại Quản '
        + 'Bạ.'],
      ['Yên Minh – Đồng Văn – Lũng Cú',
        'Qua rừng thông Yên Minh, thăm dinh thự họ Vương và cột cờ Lũng Cú. Tối dạo phố cổ Đồng Văn.'],
      ['Mã Pì Lèng – sông Nho Quế – Hà Giang',
        'Đi thuyền trên sông Nho Quế qua hẻm Tu Sản, chiều về thành phố Hà Giang nghỉ đêm.'],
      ['Hà Giang – Nội Bài – TP. Hồ Chí Minh',
        'Xe đưa thẳng ra sân bay Nội Bài, bay về TP. Hồ Chí Minh. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-019', branch: 'HCM', tier: 'CC', transport: ['may-bay'], days: 3, nights: 2, dest: 'city-ha-long',
    dow: 5,
    title: 'Hà Nội – du thuyền Hạ Long 3 ngày 2 đêm',
    photos: ['halong', 'hanoi'],
    highlights: 'Ngủ đêm trên du thuyền 5 sao, chèo kayak trên vịnh, phố cổ Hà Nội',
    itinerary: [
      ['TP. Hồ Chí Minh – Hà Nội – Hạ Long',
        'Bay ra Nội Bài, xe limousine đưa đến cảng Tuần Châu. Lên du thuyền, chiều chèo kayak qua hang Luồn. Ngủ đêm '
        + 'trên vịnh.'],
      ['Hang Sửng Sốt – Hà Nội',
        'Ngắm bình minh trên vịnh, thăm hang Sửng Sốt. Ăn trưa trên tàu rồi về Hà Nội, tối dạo phố cổ.'],
      ['Hà Nội – TP. Hồ Chí Minh',
        'Thăm Văn Miếu – Quốc Tử Giám, sau đó ra sân bay bay về. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MB-020', branch: 'HCM', tier: 'CC', transport: ['may-bay'], days: 7, nights: 6, dest: 'city-ha-long',
    dow: 0,
    title: 'Trọn vẹn miền Bắc 7 ngày: Hà Nội – Ninh Bình – Hạ Long – Sa Pa',
    photos: ['hanoi', 'ninhbinh', 'halong', 'sapa'],
    highlights: 'Phố cổ Hà Nội, Tràng An, du thuyền Hạ Long, bản Cát Cát, đỉnh Fansipan',
    itinerary: [
      ['TP. Hồ Chí Minh – Hà Nội',
        'Bay ra Hà Nội, chiều thăm hồ Hoàn Kiếm, đền Ngọc Sơn, tối xem múa rối nước Thăng Long.'],
      ['Lăng Bác – Văn Miếu – Ninh Bình',
        'Sáng viếng Lăng Bác và Văn Miếu, chiều đi Ninh Bình nghỉ đêm resort ven núi đá vôi.'],
      ['Tràng An – Hang Múa',
        'Đi thuyền Tràng An, chiều leo Hang Múa ngắm Tam Cốc. Nghỉ đêm tại Ninh Bình.'],
      ['Ninh Bình – du thuyền Hạ Long',
        'Ra Hạ Long lên du thuyền, chèo kayak và tắm biển đảo Ti Tốp. Ngủ đêm trên vịnh.'],
      ['Hạ Long – Sa Pa',
        'Thăm hang Sửng Sốt, về tàu ăn trưa rồi theo cao tốc về hướng Nội Bài và lên Sa Pa.'],
      ['Fansipan – bản Cát Cát',
        'Đi tàu leo núi và cáp treo lên đỉnh Fansipan, chiều thăm bản Cát Cát. Nghỉ đêm tại Sa Pa.'],
      ['Sa Pa – Nội Bài – TP. Hồ Chí Minh',
        'Sáng tự do dạo chợ Sa Pa, sau bữa trưa ra sân bay Nội Bài bay về. Kết thúc chương trình.'],
    ],
  },
];
