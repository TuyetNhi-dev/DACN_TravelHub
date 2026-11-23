// Miền Nam: 5 tour chi nhánh TP.HCM (khởi hành TP.HCM), 15 tour chi nhánh Cần Thơ (khởi hành Cần Thơ).
module.exports = [
  {
    code: 'SH-MN-001', branch: 'HCM', tier: 'TK', transport: ['o-to'], days: 1, nights: 0, dest: 'city-tay-ninh',
    dow: 0,
    title: 'Củ Chi – Tây Ninh một ngày: địa đạo – núi Bà Đen',
    photos: [],
    highlights: 'Địa đạo Củ Chi, Tòa Thánh Cao Đài Tây Ninh, cáp treo núi Bà Đen',
    itinerary: [
      ['TP. Hồ Chí Minh – Củ Chi – Tây Ninh',
        'Sáng thăm địa đạo Củ Chi, thử bò qua đường hầm và ăn khoai mì chấm muối mè. Đến Tây Ninh dự lễ trưa tại Tòa '
        + 'Thánh Cao Đài, chiều đi cáp treo lên núi Bà Đen viếng chùa Bà. Về TP. Hồ Chí Minh buổi tối. Kết thúc '
        + 'chương trình.'],
    ],
  },
  {
    code: 'SH-MN-002', branch: 'HCM', tier: 'TC', transport: ['o-to'], days: 2, nights: 1, dest: 'city-vung-tau',
    dow: 6,
    title: 'Vũng Tàu 2 ngày 1 đêm: tượng Chúa Kitô – Bạch Dinh',
    photos: [],
    highlights: 'Tượng Chúa Kitô Vua, ngọn hải đăng Vũng Tàu, Bạch Dinh, bãi Sau',
    itinerary: [
      ['TP. Hồ Chí Minh – Vũng Tàu',
        'Theo cao tốc Long Thành và quốc lộ 51 ra Vũng Tàu, ăn trưa bánh khọt. Chiều leo lên tượng Chúa Kitô Vua, '
        + 'tắm biển bãi Sau.'],
      ['Hải đăng – Bạch Dinh – về TP. Hồ Chí Minh',
        'Lên ngọn hải đăng ngắm thành phố, thăm Bạch Dinh, mua hải sản khô ở chợ Xóm Lưới rồi về. Kết thúc chương '
        + 'trình.'],
    ],
  },
  {
    code: 'SH-MN-003', branch: 'HCM', tier: 'CC', transport: ['may-bay'], days: 3, nights: 2, dest: 'city-con-dao',
    dow: 5,
    title: 'Côn Đảo 3 ngày 2 đêm: hành hương và nghỉ dưỡng',
    photos: [],
    highlights: 'Nhà tù Côn Đảo, nghĩa trang Hàng Dương, miếu Bà Phi Yến, bãi Đầm Trầu, resort 5 sao',
    itinerary: [
      ['TP. Hồ Chí Minh – Côn Đảo',
        'Bay ra Côn Đảo, nhận phòng resort. Chiều thăm Bảo tàng Côn Đảo, trại Phú Hải và chuồng cọp. Tối viếng nghĩa '
        + 'trang Hàng Dương và mộ chị Võ Thị Sáu.'],
      ['Miếu Bà Phi Yến – bãi Đầm Trầu',
        'Viếng miếu Bà Phi Yến, chùa Núi Một, chiều tắm biển bãi Đầm Trầu và ngắm máy bay hạ cánh sát bãi.'],
      ['Côn Đảo – TP. Hồ Chí Minh',
        'Sáng tự do tại resort, ra sân bay Cỏ Ống bay về. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-004', branch: 'HCM', tier: 'TC', transport: ['may-bay'], days: 4, nights: 3, dest: 'city-phu-quoc',
    dow: 4,
    title: 'Phú Quốc 4 ngày 3 đêm: Nam đảo – cáp treo Hòn Thơm',
    photos: ['phuquoc'],
    highlights: 'Cáp treo Hòn Thơm, Bãi Sao, lặn ngắm san hô An Thới, chợ đêm Phú Quốc',
    itinerary: [
      ['TP. Hồ Chí Minh – Phú Quốc',
        'Bay ra Phú Quốc, chiều thăm Dinh Cậu, tối dạo chợ đêm Phú Quốc.'],
      ['Nam đảo – cáp treo Hòn Thơm',
        'Thăm nhà tù Phú Quốc, nhà thùng nước mắm, đi cáp treo vượt biển sang Hòn Thơm. Chiều tắm biển Bãi Sao.'],
      ['Câu cá – lặn ngắm san hô',
        'Đi tàu quanh quần đảo An Thới, câu cá và lặn ngắm san hô. Tối ngắm hoàng hôn ở thị trấn Hoàng Hôn.'],
      ['Phú Quốc – TP. Hồ Chí Minh',
        'Thăm cơ sở nuôi cấy ngọc trai, ra sân bay bay về. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-005', branch: 'HCM', tier: 'TC', transport: ['o-to'], days: 1, nights: 0, dest: 'city-tp-ho-chi-minh',
    dow: 2,
    title: 'Sài Gòn một ngày: Dinh Độc Lập – chợ Bến Thành',
    photos: ['saigon'],
    highlights: 'Dinh Độc Lập, Bưu điện Thành phố, Bảo tàng Chứng tích Chiến tranh, chợ Bến Thành, phố đi bộ Nguyễn '
      + 'Huệ',
    itinerary: [
      ['Dinh Độc Lập – Bưu điện – chợ Bến Thành',
        'Tham quan Dinh Độc Lập và Bảo tàng Chứng tích Chiến tranh, ngắm Nhà thờ Đức Bà từ bên ngoài và Bưu điện '
        + 'Thành phố. Ăn trưa cơm tấm, chiều mua sắm ở chợ Bến Thành, tối dạo phố đi bộ Nguyễn Huệ. Kết thúc chương '
        + 'trình.'],
    ],
  },
  {
    code: 'SH-MN-006', branch: 'CT', tier: 'TK', transport: ['o-to'], days: 1, nights: 0, dest: 'city-can-tho', dow: 6,
    title: 'Cần Thơ một ngày: chợ nổi Cái Răng – vườn trái cây',
    photos: [],
    highlights: 'Chợ nổi Cái Răng, lò hủ tiếu, vườn trái cây Phong Điền, nhà cổ Bình Thủy',
    itinerary: [
      ['Chợ nổi Cái Răng – Phong Điền – Bình Thủy',
        'Xuống thuyền từ bến Ninh Kiều lúc 5 giờ 30 đi chợ nổi Cái Răng, ăn sáng hủ tiếu trên ghe và xem làm hủ '
        + 'tiếu. Thăm vườn trái cây ở Phong Điền, chiều tham quan nhà cổ Bình Thủy và chùa Ông. Kết thúc chương '
        + 'trình.'],
    ],
  },
  {
    code: 'SH-MN-007', branch: 'CT', tier: 'TK', transport: ['o-to'], days: 2, nights: 1, dest: 'city-an-giang', dow: 6,
    title: 'Châu Đốc – rừng tràm Trà Sư 2 ngày 1 đêm',
    photos: [],
    highlights: 'Rừng tràm Trà Sư, miếu Bà Chúa Xứ núi Sam, Tây An cổ tự, làng Chăm Đa Phước, làng bè',
    itinerary: [
      ['Cần Thơ – Châu Đốc – núi Sam',
        'Qua Long Xuyên đến Châu Đốc, viếng miếu Bà Chúa Xứ, Tây An cổ tự và lăng Thoại Ngọc Hầu dưới chân núi Sam. '
        + 'Tối ăn lẩu mắm, nghỉ đêm tại Châu Đốc.'],
      ['Làng bè – rừng tràm Trà Sư – về Cần Thơ',
        'Đi thuyền thăm làng bè nuôi cá và làng Chăm Đa Phước, sau đó vào rừng tràm Trà Sư bằng xuồng máy và xuồng '
        + 'chèo. Về Cần Thơ buổi chiều. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-008', branch: 'CT', tier: 'TK', transport: ['o-to'], days: 1, nights: 0, dest: 'city-ben-tre', dow: 0,
    title: 'Bến Tre một ngày: xứ dừa – xuồng ba lá',
    photos: [],
    highlights: 'Cồn Phụng, chèo xuồng ba lá rạch dừa nước, lò kẹo dừa, đờn ca tài tử',
    itinerary: [
      ['Cần Thơ – Bến Tre – cồn Phụng',
        'Khởi hành đi Bến Tre qua cầu Rạch Miễu, đi thuyền sang cồn Phụng. Ngồi xuồng ba lá vào rạch dừa nước, thăm '
        + 'lò kẹo dừa, nghe đờn ca tài tử và ăn trái cây. Ăn trưa cá tai tượng chiên xù, chiều về Cần Thơ. Kết thúc '
        + 'chương trình.'],
    ],
  },
  {
    code: 'SH-MN-009', branch: 'CT', tier: 'TC', transport: ['o-to'], days: 2, nights: 1, dest: 'city-ca-mau', dow: 5,
    title: 'Đất Mũi Cà Mau 2 ngày 1 đêm',
    photos: [],
    highlights: 'Mũi Cà Mau, cột mốc tọa độ quốc gia, rừng đước, Vườn quốc gia Mũi Cà Mau',
    itinerary: [
      ['Cần Thơ – thành phố Cà Mau',
        'Qua Hậu Giang, Bạc Liêu đến Cà Mau, chiều thăm chợ nổi Cà Mau và công viên Hồng Bàng. Tối ăn lẩu mắm U Minh.'],
      ['Đất Mũi – về Cần Thơ',
        'Ca nô từ Cà Mau xuôi sông xuyên rừng đước ra Đất Mũi, chụp ảnh biểu tượng con tàu và cột mốc tọa độ quốc '
        + 'gia, đi bộ trên cầu gỗ trong Vườn quốc gia Mũi Cà Mau. Chiều về Cần Thơ. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-010', branch: 'CT', tier: 'TC', transport: ['o-to'], days: 3, nights: 2, dest: 'city-ca-mau', dow: 4,
    title: 'Sóc Trăng – Bạc Liêu – Cà Mau 3 ngày 2 đêm',
    photos: [],
    highlights: 'Chùa Dơi, chùa Chén Kiểu, nhà Công tử Bạc Liêu, cánh đồng điện gió, Đất Mũi',
    itinerary: [
      ['Cần Thơ – Sóc Trăng – Bạc Liêu',
        'Thăm chùa Dơi và chùa Chén Kiểu của người Khmer ở Sóc Trăng, ăn trưa bún nước lèo. Chiều đến Bạc Liêu thăm '
        + 'nhà Công tử Bạc Liêu, tối nghe đờn ca tài tử tại khu lưu niệm nhạc sĩ Cao Văn Lầu.'],
      ['Điện gió Bạc Liêu – Cà Mau – Đất Mũi',
        'Ngắm cánh đồng điện gió ven biển, sau đó đi Cà Mau và ca nô ra Đất Mũi. Nghỉ đêm tại Năm Căn hoặc Cà Mau.'],
      ['Cà Mau – về Cần Thơ',
        'Sáng thăm chợ Cà Mau, mua khô cá, mật ong U Minh rồi về Cần Thơ. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-011', branch: 'CT', tier: 'TC', transport: ['may-bay'], days: 3, nights: 2, dest: 'city-phu-quoc',
    dow: 5,
    title: 'Phú Quốc 3 ngày 2 đêm bay từ Cần Thơ',
    photos: ['phuquoc'],
    highlights: 'Cáp treo Hòn Thơm, Bãi Sao, Grand World, chợ đêm Phú Quốc',
    itinerary: [
      ['Cần Thơ – Phú Quốc',
        'Bay từ Cần Thơ ra Phú Quốc, chiều thăm Grand World, tối dạo chợ đêm Phú Quốc.'],
      ['Nam đảo – Hòn Thơm',
        'Thăm nhà thùng nước mắm, đi cáp treo sang Hòn Thơm, chiều tắm biển Bãi Sao.'],
      ['Phú Quốc – Cần Thơ',
        'Thăm Dinh Cậu, mua tiêu và nước mắm làm quà, ra sân bay bay về. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-012', branch: 'CT', tier: 'CC', transport: ['may-bay'], days: 5, nights: 4, dest: 'city-phu-quoc',
    dow: 3,
    title: 'Phú Quốc nghỉ dưỡng 5 ngày 4 đêm: resort Bãi Khem',
    photos: ['phuquoc'],
    highlights: 'Resort 5 sao, du thuyền ngắm hoàng hôn, lặn ngắm san hô Hòn Móng Tay, cáp treo Hòn Thơm',
    itinerary: [
      ['Cần Thơ – Phú Quốc',
        'Bay ra Phú Quốc, xe riêng đưa về resort phía Nam đảo. Chiều tự do tắm biển.'],
      ['Nghỉ dưỡng – spa',
        'Tự do tại resort, buổi chiều có một liệu trình spa 60 phút.'],
      ['Quần đảo An Thới – Hòn Móng Tay',
        'Ca nô riêng đi Hòn Móng Tay, lặn ngắm san hô và câu cá, ăn trưa hải sản trên đảo.'],
      ['Hòn Thơm – du thuyền hoàng hôn',
        'Đi cáp treo sang Hòn Thơm, chiều lên du thuyền ngắm hoàng hôn và dùng bữa tối trên biển.'],
      ['Phú Quốc – Cần Thơ',
        'Sáng tự do, ra sân bay bay về Cần Thơ. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-013', branch: 'CT', tier: 'CC', transport: ['may-bay'], days: 2, nights: 1, dest: 'city-con-dao',
    dow: 6,
    title: 'Côn Đảo 2 ngày 1 đêm bay từ Cần Thơ',
    photos: [],
    highlights: 'Nghĩa trang Hàng Dương, nhà tù Côn Đảo, miếu Bà Phi Yến, cầu tàu 914',
    itinerary: [
      ['Cần Thơ – Côn Đảo',
        'Bay từ Cần Thơ ra Côn Đảo, nhận phòng resort. Chiều thăm trại Phú Hải, chuồng cọp và cầu tàu 914. Tối viếng '
        + 'nghĩa trang Hàng Dương.'],
      ['Miếu Bà Phi Yến – về Cần Thơ',
        'Viếng miếu Bà Phi Yến và chùa Núi Một, sau bữa trưa ra sân bay Cỏ Ống bay về. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-014', branch: 'CT', tier: 'TK', transport: ['o-to'], days: 2, nights: 1, dest: 'city-dong-thap',
    dow: 6,
    title: 'Đồng Tháp 2 ngày 1 đêm: làng hoa Sa Đéc – Tràm Chim',
    photos: [],
    highlights: 'Làng hoa Sa Đéc, nhà cổ Huỳnh Thủy Lê, Vườn quốc gia Tràm Chim, khu di tích Gò Tháp',
    itinerary: [
      ['Cần Thơ – Sa Đéc',
        'Qua cầu Cao Lãnh đến Sa Đéc, thăm làng hoa Tân Quy Đông và nhà cổ Huỳnh Thủy Lê. Tối ăn hủ tiếu Sa Đéc, '
        + 'nghỉ đêm tại Cao Lãnh.'],
      ['Tràm Chim – Gò Tháp – về Cần Thơ',
        'Đi xuồng trong Vườn quốc gia Tràm Chim ngắm chim nước, chiều thăm khu di tích Gò Tháp rồi về Cần Thơ. Kết '
        + 'thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-015', branch: 'CT', tier: 'CC', transport: ['o-to'], days: 4, nights: 3, dest: 'city-an-giang', dow: 3,
    title: 'Vòng cung Tây Nam 4 ngày: Châu Đốc – Hà Tiên – Rạch Giá',
    photos: [],
    highlights: 'Núi Sam, rừng tràm Trà Sư, Mũi Nai, Thạch Động, lăng Mạc Cửu, chợ nổi Cái Răng',
    itinerary: [
      ['Cần Thơ – Châu Đốc',
        'Đến Châu Đốc viếng miếu Bà Chúa Xứ núi Sam, chiều đi xuồng vào rừng tràm Trà Sư. Nghỉ đêm resort ven núi '
        + 'Sam.'],
      ['Châu Đốc – Hà Tiên',
        'Theo đường ven biên giới sang Hà Tiên, thăm lăng Mạc Cửu, chùa Phù Dung và Thạch Động. Tối ngắm hoàng hôn ở '
        + 'Mũi Nai.'],
      ['Hà Tiên – Rạch Giá',
        'Theo quốc lộ 80 về Rạch Giá, ghé chùa Hang và bãi đá Hòn Phụ Tử ở Kiên Lương. Nghỉ đêm tại Rạch Giá.'],
      ['Rạch Giá – Cần Thơ – chợ nổi Cái Răng',
        'Về Cần Thơ, chiều đi thuyền trên sông Cần Thơ ngắm chợ nổi Cái Răng và nhà cổ Bình Thủy. Kết thúc chương '
        + 'trình.'],
    ],
  },
  {
    code: 'SH-MN-016', branch: 'CT', tier: 'CC', transport: ['o-to'], days: 3, nights: 2, dest: 'city-can-tho', dow: 5,
    title: 'Cần Thơ nghỉ dưỡng 3 ngày 2 đêm: thuyền riêng – ẩm thực sông nước',
    photos: [],
    highlights: 'Thuyền riêng đi chợ nổi Cái Răng, resort ven sông Hậu, lớp nấu ăn miền Tây, nhà cổ Bình Thủy',
    itinerary: [
      ['Nhận phòng resort ven sông',
        'Xe đón tại Cần Thơ, nhận phòng resort trên cồn ven sông Hậu. Chiều đạp xe quanh cồn, tối dùng bữa trên du '
        + 'thuyền sông Hậu.'],
      ['Chợ nổi Cái Răng bằng thuyền riêng',
        'Thuyền riêng đưa đi chợ nổi Cái Răng lúc bình minh, ghé lò hủ tiếu và vườn trái cây Phong Điền. Chiều học '
        + 'nấu bánh xèo, cá kho tộ.'],
      ['Nhà cổ Bình Thủy – kết thúc',
        'Thăm nhà cổ Bình Thủy và chùa Ông, trả phòng sau bữa trưa. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-017', branch: 'CT', tier: 'TK', transport: ['o-to'], days: 2, nights: 1, dest: 'city-bac-lieu', dow: 6,
    title: 'Sóc Trăng – Bạc Liêu 2 ngày 1 đêm',
    photos: [],
    highlights: 'Chùa Dơi, chùa Đất Sét, nhà Công tử Bạc Liêu, cánh đồng điện gió, vườn chim Bạc Liêu',
    itinerary: [
      ['Cần Thơ – Sóc Trăng – Bạc Liêu',
        'Thăm chùa Dơi và chùa Đất Sét ở Sóc Trăng, chiều đến Bạc Liêu tham quan nhà Công tử Bạc Liêu. Tối nghe đờn '
        + 'ca tài tử.'],
      ['Điện gió – vườn chim – về Cần Thơ',
        'Ngắm cánh đồng điện gió ven biển, thăm vườn chim Bạc Liêu, sau bữa trưa về Cần Thơ. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-018', branch: 'CT', tier: 'TC', transport: ['o-to'], days: 3, nights: 2, dest: 'city-kien-giang',
    dow: 5,
    title: 'Quần đảo Nam Du 3 ngày 2 đêm',
    photos: [],
    highlights: 'Tàu cao tốc Rạch Giá – Nam Du, bãi Cây Mến, Hòn Mấu, ngọn hải đăng Nam Du',
    itinerary: [
      ['Cần Thơ – Rạch Giá – Nam Du',
        'Xe đưa đến Rạch Giá, đi tàu cao tốc ra Nam Du. Chiều tắm biển bãi Cây Mến, tối ăn hải sản tại làng chài.'],
      ['Ca nô quanh quần đảo',
        'Đi ca nô thăm Hòn Mấu, Hòn Dầu, lặn ngắm san hô. Chiều leo lên ngọn hải đăng ngắm toàn cảnh quần đảo.'],
      ['Nam Du – Rạch Giá – về Cần Thơ',
        'Lên tàu về Rạch Giá, xe đưa về Cần Thơ. Lịch tàu phụ thuộc thời tiết biển. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-019', branch: 'CT', tier: 'TK', transport: ['o-to'], days: 2, nights: 1, dest: 'city-vinh-long',
    dow: 6,
    title: 'Cù lao An Bình 2 ngày 1 đêm: homestay miệt vườn',
    photos: [],
    highlights: 'Homestay cù lao An Bình, vườn trái cây, lò gạch gốm Mang Thít, đờn ca tài tử',
    itinerary: [
      ['Cần Thơ – Vĩnh Long – cù lao An Bình',
        'Đến Vĩnh Long, đi đò sang cù lao An Bình nhận phòng homestay. Chiều đạp xe qua vườn chôm chôm, chèo xuồng '
        + 'tát mương bắt cá, tối nấu ăn cùng chủ nhà.'],
      ['Lò gạch Mang Thít – về Cần Thơ',
        'Thăm làng gạch gốm Mang Thít bên sông Cổ Chiên, sau bữa trưa về Cần Thơ. Kết thúc chương trình.'],
    ],
  },
  {
    code: 'SH-MN-020', branch: 'CT', tier: 'CC', transport: ['o-to', 'may-bay'], days: 5, nights: 4,
    dest: 'city-phu-quoc', dow: 1,
    title: 'Hà Tiên – Phú Quốc 5 ngày 4 đêm: tàu cao tốc ra đảo',
    photos: ['phuquoc'],
    highlights: 'Thạch Động, Mũi Nai, tàu cao tốc Hà Tiên – Phú Quốc, cáp treo Hòn Thơm, Bãi Sao',
    itinerary: [
      ['Cần Thơ – Hà Tiên',
        'Qua Rạch Giá đến Hà Tiên, thăm lăng Mạc Cửu và Thạch Động. Tối ngắm hoàng hôn ở Mũi Nai.'],
      ['Hà Tiên – Phú Quốc',
        'Đi tàu cao tốc ra Phú Quốc, nhận phòng resort 5 sao. Chiều tự do tắm biển, tối dạo chợ đêm.'],
      ['Nam đảo – Hòn Thơm',
        'Thăm nhà tù Phú Quốc, đi cáp treo sang Hòn Thơm, chiều tắm biển Bãi Sao.'],
      ['Bắc đảo – hoàng hôn Gành Dầu',
        'Thăm Vườn quốc gia Phú Quốc và làng chài Hàm Ninh, chiều ngắm hoàng hôn ở Gành Dầu.'],
      ['Phú Quốc – Cần Thơ',
        'Sáng tự do, ra sân bay bay về Cần Thơ. Kết thúc chương trình.'],
    ],
  },
];
