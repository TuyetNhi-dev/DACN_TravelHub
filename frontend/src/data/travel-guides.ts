/**
 * "Cẩm nang du lịch": general, widely known advice only. No prices, statistics or exact dates are given, because
 * weather and festivals change from year to year (the text says "thường" / "tùy năm" on purpose). Kept as
 * structured data so a chatbot can quote it, and so each guide can suggest real tours from the catalogue.
 */
export interface GuideSection {
  id: string;
  heading: string;
  paragraphs: string[];
  tips?: string[];
}

export interface TravelGuide {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  /** Destination whose photos illustrate the card (see lib/media getDestinationImages). */
  coverPlace: string;
  tags: string[];
  /** Tours whose destination or title contains one of these words are suggested under the article. */
  relatedKeywords: string[];
  sections: GuideSection[];
}

const UPDATED = "21/11/2026";

export const TRAVEL_GUIDES: TravelGuide[] = [
  {
    slug: "thoi-diem-dep-da-lat-phu-quoc-ha-giang",
    title: "Thời điểm đẹp đi Đà Lạt, Phú Quốc và Hà Giang",
    summary: "Ba điểm đến, ba kiểu thời tiết khác nhau: chọn mùa nào để đi cho trọn vẹn.",
    updated: UPDATED,
    coverPlace: "Đà Lạt",
    tags: ["Thời tiết", "Lên kế hoạch"],
    relatedKeywords: ["Đà Lạt", "Phú Quốc", "Hà Giang"],
    sections: [
      { id: "da-lat", heading: "Đà Lạt", paragraphs: [
        "Đà Lạt mát quanh năm, nhưng thường chia hai mùa rõ: mùa khô khoảng từ cuối năm đến đầu xuân, trời trong, ít "
          + "mưa, hợp đi dạo và săn mây buổi sớm; mùa mưa khoảng giữa năm, chiều hay có mưa nhưng cảnh vật xanh và "
          + "vắng khách hơn.",
        "Cuối năm có nhiều loài hoa nở, trong đó dã quỳ thường vàng rực các triền đồi; thời điểm cụ thể thay đổi theo "
          + "từng năm.",
      ], tips: [
        "Đêm và sáng sớm khá lạnh, nên mang áo khoác dù đi mùa nào.",
        "Mùa mưa nên xếp lịch tham quan ngoài trời vào buổi sáng.",
      ] },
      { id: "phu-quoc", heading: "Phú Quốc", paragraphs: [
        "Phú Quốc thường đẹp nhất vào mùa khô, khoảng từ cuối năm đến tháng tư năm sau: trời nắng, biển "
          + "êm, nước trong, "
          + "hợp tắm biển và đi tàu ra các đảo nhỏ.",
        "Mùa mưa thường rơi vào khoảng giữa năm, có những đợt gió mạnh làm biển động ở một số bãi; bù lại giá dịch vụ "
          + "thường dễ chịu hơn và đảo vắng hơn.",
      ], tips: [
        "Kiểm tra dự báo thời tiết trước các chuyến tàu ra đảo; chuyến có thể bị hủy khi biển động.",
        "Mang kem chống nắng và nón rộng vành, nắng biển rất gắt vào giữa trưa.",
      ] },
      { id: "ha-giang", heading: "Hà Giang", paragraphs: [
        "Hà Giang mỗi mùa một vẻ: mùa xuân có hoa đào, hoa mận nở trên bản; mùa thu là lúa chín trên ruộng bậc thang; "
          + "cuối thu thường là mùa hoa tam giác mạch. Thời điểm từng mùa hoa thay đổi theo năm và theo độ cao.",
        "Mùa hè thường mưa nhiều, đường đèo có thể sạt lở; mùa đông trời lạnh, có lúc có sương muối trên núi cao.",
      ], tips: [
        "Đường đèo dài và quanh co: nên đi theo tour hoặc thuê xe có tài xế quen đường.",
        "Mang thuốc chống say xe và áo ấm, kể cả khi đi vào mùa thu.",
      ] },
    ],
  },
  {
    slug: "kinh-nghiem-di-tour-gia-dinh",
    title: "Kinh nghiệm đi tour cùng gia đình",
    summary: "Chọn tour, chuẩn bị cho trẻ nhỏ và người lớn tuổi để cả nhà cùng vui.",
    updated: UPDATED,
    coverPlace: "Nha Trang",
    tags: ["Gia đình", "Trẻ em"],
    relatedKeywords: ["Phú Quốc", "Nha Trang", "Đà Nẵng", "Vũng Tàu"],
    sections: [
      { id: "chon-tour", heading: "Chọn tour phù hợp", paragraphs: [
        "Với gia đình có trẻ nhỏ hoặc ông bà, nên ưu tiên tour có lịch trình thong thả, ít di chuyển đường dài trong "
          + "ngày và có thời gian nghỉ trưa. Các điểm biển như Phú Quốc, Nha Trang hay Đà Nẵng thường dễ "
          + "đi cho cả nhà.",
        "Xem kỹ lịch trình từng ngày trên trang tour và mục Giá tour bao gồm để biết bữa ăn, vé tham quan nào đã có.",
      ] },
      { id: "dat-cho", heading: "Đặt chỗ cho cả nhà", paragraphs: [
        "Đặt một đơn cho cả gia đình để mọi người cùng một lịch khởi hành. Nhập đúng họ tên từng người như trên giấy "
          + "tờ; với trẻ em, chọn đúng số trẻ em để hệ thống áp giá trẻ em của lịch đó (nếu có).",
        "Nếu chưa chốt ngày, hãy thêm vài lịch vào giỏ hàng để so sánh giá và số chỗ, rồi đặt khi cả nhà "
          + "đã thống nhất. "
          + "Lưu ý giỏ hàng không giữ chỗ.",
      ] },
      { id: "chuan-bi", heading: "Chuẩn bị cho trẻ và người lớn tuổi", paragraphs: [
        "Chuẩn bị đồ dùng quen thuộc của trẻ, thuốc thông thường và thuốc riêng của người lớn tuổi. Mang theo giấy tờ "
          + "tùy thân của người lớn và giấy tờ của trẻ theo yêu cầu khi đi máy bay.",
      ], tips: [
        "Để một túi nhỏ đựng nước, khăn giấy, đồ ăn nhẹ ở nơi dễ lấy.",
        "Báo trước với hướng dẫn viên nếu trong đoàn có người cần hỗ trợ đi lại.",
      ] },
    ],
  },
  {
    slug: "chuan-bi-hanh-ly",
    title: "Chuẩn bị hành lý cho chuyến đi trong nước",
    summary: "Danh sách gọn nhẹ theo kiểu khí hậu: biển, núi và thành phố.",
    updated: UPDATED,
    coverPlace: "Sa Pa",
    tags: ["Hành lý", "Mẹo hay"],
    relatedKeywords: ["Sa Pa", "Đà Lạt", "Hạ Long"],
    sections: [
      { id: "co-ban", heading: "Đồ cần có cho mọi chuyến đi", paragraphs: [
        "Giấy tờ tùy thân, điện thoại và sạc dự phòng, thuốc cá nhân, vài bộ quần áo dễ phối và một đôi giày đi bộ "
          + "thoải mái. Chụp lại giấy tờ quan trọng và lưu trên điện thoại.",
      ], tips: [
        "Kiểm tra quy định hành lý xách tay và ký gửi của hãng bay trước khi xếp đồ.",
        "Để thuốc và giấy tờ trong hành lý xách tay, không để trong vali ký gửi.",
      ] },
      { id: "bien", heading: "Đi biển", paragraphs: [
        "Đồ bơi, kem chống nắng, nón và kính mát, dép đi biển, túi chống nước cho điện thoại. Mang thêm áo khoác mỏng "
          + "cho những chuyến tàu buổi sớm hoặc phòng có máy lạnh.",
      ] },
      { id: "nui", heading: "Đi núi, vùng cao", paragraphs: [
        "Áo ấm nhiều lớp (dễ mặc thêm, cởi bớt), áo mưa mỏng, giày có độ bám tốt. Vùng cao như Sa Pa hay Hà Giang "
          + "chênh lệch nhiệt độ ngày đêm lớn, kể cả vào mùa hè.",
      ] },
      { id: "gon-nhe", heading: "Giữ hành lý gọn nhẹ", paragraphs: [
        "Ưu tiên đồ nhanh khô, cuộn quần áo thay vì gấp, và chừa chỗ cho quà mang về. Một vali gọn giúp di chuyển "
          + "giữa các điểm trong tour nhanh hơn.",
      ] },
    ],
  },
  {
    slug: "du-lich-dip-tet",
    title: "Du lịch dịp Tết: lên kế hoạch sớm",
    summary: "Đi chơi Tết vui hơn khi chọn ngày theo lịch âm và đặt chỗ sớm.",
    updated: UPDATED,
    coverPlace: "Hội An",
    tags: ["Tết", "Lịch âm"],
    relatedKeywords: ["Tết", "Xuân"],
    sections: [
      { id: "chon-ngay", heading: "Chọn ngày theo lịch âm", paragraphs: [
        "Tết Nguyên Đán theo lịch âm nên rơi vào ngày dương khác nhau mỗi năm. Hãy xem trang Lịch âm dương của SàiHành "
          + "để biết ngày mùng 1 và các ngày lễ, rồi chọn lịch khởi hành phù hợp với kỳ nghỉ của cả nhà.",
        "Nhiều gia đình muốn ở nhà đêm giao thừa và mùng 1, rồi đi chơi từ mùng 2 hoặc mùng 3; lịch khởi hành những "
          + "ngày này thường được chọn nhiều.",
      ] },
      { id: "dat-som", heading: "Đặt chỗ sớm", paragraphs: [
        "Dịp Tết nhu cầu đi lại tăng mạnh nên tour, phòng và vé thường hết chỗ sớm và giá có thể cao hơn ngày thường. "
          + "Khi đã chọn được tour, hãy đặt sớm: chỗ của tour được giữ ngay khi bạn tạo đơn, trong 10 "
          + "phút để thanh toán.",
      ], tips: [
        "Thêm các lịch đang cân nhắc vào giỏ hàng để so sánh, nhưng nhớ giỏ hàng không giữ chỗ.",
        "Đọc kỹ mục Giá tour bao gồm và Không bao gồm trên trang tour trước khi đặt.",
      ] },
      { id: "luu-y", heading: "Lưu ý khi đi chơi Tết", paragraphs: [
        "Một số cửa hàng, quán ăn đóng cửa những ngày đầu năm, nhất là mùng 1. Các điểm tham quan và lễ hội đầu xuân "
          + "thường đông; nên đi sớm, giữ đồ cá nhân cẩn thận và tôn trọng phong tục nơi đến.",
      ] },
    ],
  },
];

export function findGuide(slug: string): TravelGuide | undefined {
  return TRAVEL_GUIDES.find(guide => guide.slug === slug);
}
