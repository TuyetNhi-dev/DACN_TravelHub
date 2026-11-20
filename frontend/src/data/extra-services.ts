import type { IconName } from "@/components/ui/Icon";
import type { ServiceRequestType } from "@/types/service-request";

/** Colour of the icon tile (menu and page header); see .svc-tone--* in services.css. */
export type ServiceTone = "sky" | "green" | "amber" | "violet" | "rose";

export interface ExtraService {
  slug: string;
  /** service_requests.service_type sent with the form. */
  type: ServiceRequestType;
  name: string;
  /** One line under the name in the menu. */
  summary: string;
  icon: IconName;
  tone: ServiceTone;
  /** Page header description. */
  lead: string;
  intro: readonly string[];
  highlights: readonly { title: string; text: string }[];
  faqs: readonly { question: string; answer: string }[];
}

/**
 * "Dịch vụ cộng thêm". Content rules: no prices (every quote comes from staff after the request), no promises
 * that depend on third parties (embassies, carriers, venues), no third-party brand names.
 */
export const EXTRA_SERVICES: readonly ExtraService[] = [
  {
    slug: "ve-tham-quan",
    type: "attraction_tickets",
    name: "Vé tham quan & vui chơi",
    summary: "Khu vui chơi, show diễn, cáp treo",
    icon: "ticket",
    tone: "amber",
    lead: "Đặt trước vé khu vui chơi, show diễn và cáp treo cho cả nhà, đi đúng ngày, vào cổng nhẹ nhàng.",
    intro: [
      "Vào mùa cao điểm, nhiều khu vui chơi và chương trình biểu diễn hết vé từ sớm hoặc phải xếp hàng lâu tại quầy. "
        + "SàiHành nhận đặt trước vé tham quan, vé vui chơi, vé cáp treo và vé xem show tại các điểm đến du lịch "
        + "trong nước.",
      "Bạn chỉ cần cho biết điểm đến, ngày dự kiến và số người. Nhân viên sẽ kiểm tra tình trạng vé, gợi ý loại vé "
        + "phù hợp với trẻ nhỏ, người lớn tuổi và báo giá trước khi bạn quyết định.",
    ],
    highlights: [
      { title: "Một đầu mối cho cả chuyến", text: "Gộp vé tham quan với tour, khách sạn hoặc xe đưa đón trong cùng một lần tư vấn." },
      { title: "Tư vấn theo thành viên đoàn", text: "Lưu ý quy định chiều cao, độ tuổi và các trò chơi phù hợp với trẻ em." },
      { title: "Báo rõ điều kiện vé", text: "Thông tin đổi ngày, hoàn vé và giờ mở cửa được nói trước khi bạn thanh toán." },
    ],
    faqs: [
      { question: "Tôi có nhận vé ngay sau khi gửi yêu cầu không?",
        answer: "Chưa. Yêu cầu giúp nhân viên kiểm tra vé còn hay hết và báo giá. Vé chỉ được xuất sau khi bạn đồng ý và hoàn tất thanh toán theo hướng dẫn." },
      { question: "Trẻ em được tính vé như thế nào?",
        answer: "Mỗi khu vui chơi có quy định riêng, thường dựa trên chiều cao hoặc độ tuổi. Nhân viên sẽ báo cụ thể theo điểm bạn chọn." },
      { question: "Vé đã đặt có đổi ngày được không?",
        answer: "Tùy loại vé và quy định của đơn vị vận hành. Điều kiện đổi, hủy được thông báo rõ trước khi bạn xác nhận đặt." },
      { question: "Tôi có thể đặt vé cho nhiều điểm trong một chuyến không?",
        answer: "Có. Bạn ghi các điểm muốn đi vào ô ghi chú, nhân viên sẽ sắp xếp và báo giá chung một lần." },
    ],
  },
  {
    slug: "thue-xe",
    type: "car_rental",
    name: "Thuê xe & đón sân bay",
    summary: "Xe 4–45 chỗ có tài xế",
    icon: "car",
    tone: "sky",
    lead: "Xe 4 đến 45 chỗ kèm tài xế cho đón tiễn sân bay, du lịch tự túc, công tác hay đưa đón đoàn.",
    intro: [
      "Thuê xe có tài xế giúp bạn chủ động lịch trình mà không phải lo đường xá, chỗ đậu xe hay mệt mỏi sau "
        + "những chặng dài. SàiHành nhận đặt xe 4, 7, 16, 29 và 45 chỗ cho các chuyến trong ngày, nhiều ngày và "
        + "đón tiễn sân bay.",
      "Hãy cho chúng tôi biết số khách, ngày đi, ngày về và điểm đón. Nhân viên sẽ đề xuất loại xe phù hợp với "
        + "số người và hành lý, báo giá trọn gói và xác nhận lại lịch trình trước ngày đi.",
    ],
    highlights: [
      { title: "Đủ loại xe cho mọi đoàn", text: "Từ xe 4 chỗ cho gia đình nhỏ đến xe 45 chỗ cho đoàn công ty." },
      { title: "Tài xế quen đường", text: "Tài xế có kinh nghiệm chạy tuyến du lịch, hỗ trợ hành lý khi đón tiễn." },
      { title: "Đón tiễn sân bay theo giờ bay", text: "Lịch đón được sắp theo số hiệu chuyến bay bạn cung cấp." },
      { title: "Báo giá trước, không phát sinh mập mờ", text: "Phí cầu đường, bến bãi và thời gian chờ được nói rõ khi báo giá." },
    ],
    faqs: [
      { question: "Số chỗ của xe đã gồm tài xế chưa?",
        answer: "Đã gồm. Ví dụ xe 4 chỗ chở được tối đa 3 khách, xe 7 chỗ tối đa 6 khách. Nếu đoàn mang nhiều hành lý, nhân viên có thể gợi ý xe lớn hơn." },
      { question: "Tôi cần đặt xe trước bao lâu?",
        answer: "Nên gửi yêu cầu càng sớm càng tốt, nhất là dịp lễ, Tết. Với chuyến gấp, bạn vẫn có thể gửi yêu cầu, nhân viên sẽ báo khả năng sắp xếp." },
      { question: "Chuyến bay bị trễ thì sao?",
        answer: "Bạn cung cấp số hiệu chuyến bay để tài xế theo dõi giờ hạ cánh. Thời gian chờ thêm (nếu có) được thỏa thuận khi báo giá." },
      { question: "Có thể thay đổi lịch trình trong ngày không?",
        answer: "Có thể điều chỉnh trong phạm vi đã thỏa thuận. Thay đổi lớn về quãng đường hoặc thời gian sẽ được báo lại chi phí trước khi thực hiện." },
      { question: "Giá thuê xe đã gồm những gì?",
        answer: "Mỗi báo giá ghi rõ các khoản đã gồm và chưa gồm, như phí cầu đường, bến bãi, lưu trú của tài xế với chuyến nhiều ngày." },
    ],
  },
  {
    slug: "visa",
    type: "visa",
    name: "Visa",
    summary: "Tư vấn hồ sơ, các nước phổ biến",
    icon: "passport",
    tone: "violet",
    lead: "Tư vấn chuẩn bị hồ sơ xin visa du lịch, công tác, thăm thân cho các nước được người Việt đi nhiều.",
    intro: [
      "Mỗi quốc gia có yêu cầu hồ sơ, thời gian xét duyệt và cách nộp khác nhau. SàiHành hướng dẫn bạn chuẩn bị "
        + "giấy tờ theo đúng yêu cầu hiện hành, rà soát hồ sơ và hỗ trợ đặt lịch nộp khi cần.",
      "Kết quả cấp visa do cơ quan lãnh sự của nước đến quyết định. Chúng tôi không thể cam kết kết quả, nhưng "
        + "một bộ hồ sơ đầy đủ, rõ ràng sẽ giúp quá trình xét duyệt thuận lợi hơn.",
    ],
    highlights: [
      { title: "Danh sách giấy tờ theo từng nước", text: "Nhận danh sách giấy tờ cần chuẩn bị theo loại visa và hoàn cảnh của bạn." },
      { title: "Rà soát hồ sơ trước khi nộp", text: "Kiểm tra tính đầy đủ, thống nhất thông tin giữa các giấy tờ." },
      { title: "Kết hợp với tour và vé máy bay", text: "Sắp xếp lịch trình, đặt chỗ phù hợp với thời gian xét duyệt dự kiến." },
    ],
    faqs: [
      { question: "SàiHành có cam kết đậu visa không?",
        answer: "Không. Quyết định cấp visa thuộc về cơ quan lãnh sự. Chúng tôi giúp bạn chuẩn bị hồ sơ đầy đủ và đúng yêu cầu để tăng sự thuận lợi khi xét duyệt." },
      { question: "Xin visa mất bao lâu?",
        answer: "Tùy quốc gia, loại visa và mùa cao điểm. Nhân viên sẽ báo thời gian xét duyệt tham khảo, vì vậy bạn nên gửi yêu cầu sớm trước ngày đi." },
      { question: "Tôi cần gửi giấy tờ gì khi gửi yêu cầu tư vấn?",
        answer: "Chưa cần gửi giấy tờ nào. Bạn chỉ điền quốc gia, loại visa và ngày dự kiến đi. Vui lòng không nhập số hộ chiếu hay CCCD vào biểu mẫu." },
      { question: "Phí tư vấn và lệ phí lãnh sự tính thế nào?",
        answer: "Lệ phí lãnh sự do nước đến quy định và có thể thay đổi. Nhân viên sẽ báo rõ từng khoản trước khi bạn quyết định sử dụng dịch vụ." },
    ],
  },
  {
    slug: "tour-doan",
    type: "group_tour",
    name: "Tour đoàn & công ty",
    summary: "Team building, hội nghị, thiết kế tour riêng",
    icon: "users",
    tone: "rose",
    lead: "Thiết kế chương trình riêng cho đoàn công ty: du lịch kết hợp team building, hội nghị, khen thưởng.",
    intro: [
      "Mỗi đoàn có mục tiêu riêng: gắn kết nội bộ, tri ân nhân viên, tổ chức hội nghị khách hàng hay đơn giản là "
        + "một chuyến nghỉ dưỡng trọn vẹn. SàiHành lắng nghe yêu cầu của doanh nghiệp để xây dựng lịch trình, "
        + "chương trình hoạt động và phương án hậu cần phù hợp.",
      "Sau khi nhận yêu cầu, nhân viên sẽ liên hệ để làm rõ số lượng, thời gian, ngân sách và kỳ vọng của đoàn, "
        + "sau đó gửi đề xuất chương trình kèm báo giá chi tiết.",
    ],
    highlights: [
      { title: "Chương trình may đo", text: "Lịch trình, hoạt động team building và gala được thiết kế theo mục tiêu của đoàn." },
      { title: "Hậu cần trọn gói", text: "Phối hợp xe, lưu trú, ăn uống, địa điểm hội nghị trong cùng một đầu mối." },
      { title: "Hướng dẫn viên đi cùng đoàn", text: "Điều phối tại chỗ để chương trình diễn ra đúng kế hoạch." },
      { title: "Chứng từ cho doanh nghiệp", text: "Hỗ trợ hợp đồng và hóa đơn theo quy định khi đoàn sử dụng dịch vụ." },
    ],
    faqs: [
      { question: "Đoàn bao nhiêu người thì được thiết kế tour riêng?",
        answer: "Biểu mẫu nhận đoàn từ 10 người. Với đoàn nhỏ hơn, bạn có thể tham khảo các tour ghép đang mở bán hoặc ghi chú để được tư vấn." },
      { question: "Bao lâu thì tôi nhận được đề xuất chương trình?",
        answer: "Nhân viên sẽ liên hệ trong 24 giờ để trao đổi yêu cầu. Thời gian gửi đề xuất phụ thuộc độ phức tạp của chương trình và được hẹn cụ thể khi trao đổi." },
      { question: "Ngân sách dự kiến dùng để làm gì?",
        answer: "Giúp chúng tôi đề xuất phương án sát nhu cầu ngay từ đầu. Đây chỉ là mức tham khảo, không phải cam kết thanh toán." },
      { question: "Có thể kết hợp hội nghị và du lịch trong cùng chuyến không?",
        answer: "Có. Bạn chọn loại chương trình phù hợp và mô tả thêm ở ô ghi chú, ví dụ số buổi họp, thiết bị cần có hay hoạt động mong muốn." },
      { question: "Chương trình có thay đổi được sau khi chốt không?",
        answer: "Có thể điều chỉnh trong thời hạn và điều kiện ghi trong hợp đồng. Mọi thay đổi về chi phí đều được báo trước khi thực hiện." },
    ],
  },
];

export const serviceHref = (slug: string) => `/dich-vu/${slug}`;

/** The service behind a service_requests.service_type value (back office). */
export function serviceOfType(type: string): ExtraService | undefined {
  return EXTRA_SERVICES.find(service => service.type === type);
}

export function findExtraService(slug: string): ExtraService | undefined {
  return EXTRA_SERVICES.find(service => service.slug === slug);
}
