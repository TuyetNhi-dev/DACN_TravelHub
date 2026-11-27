import type { ContentDocument } from "@/types/content";

/** Course facts given by the team. Member names are not in the brief, so they are not invented here. */
export const PROJECT_TEAM = {
  school: "Trường Đại học Công nghệ TP. Hồ Chí Minh (HUTECH)",
  className: "23DTHC2",
  advisor: "ThS. Nguyễn Huy Cường",
  memberCount: 3,
  /** Filled in by the team; the page says so while it is empty. */
  members: [] as string[],
} as const;

export const aboutPage: ContentDocument = {
  title: "Về chúng tôi",
  updated: "21/11/2026",
  intro: "SàiHành là website đặt tour, khách sạn và vé máy bay nội địa do một nhóm sinh viên xây dựng cho đồ án "
    + "chuyên ngành. Tên gọi đi kèm câu \"Đi để cảm nhiều hơn\": mỗi chuyến đi nên để lại cảm nhận, không chỉ là "
    + "những điểm đã đánh dấu.",
  sections: [
    { id: "cau-chuyen", heading: "Câu chuyện SàiHành", paragraphs: [
      "Nhóm bắt đầu từ một trải nghiệm quen thuộc: thấy tour còn chỗ, điền thông tin xong thì được báo đã hết; hoặc "
        + "thấy giá phòng rẻ nhưng không rõ đó là giá chắc chắn hay chỉ là giá tham khảo. SàiHành được xây dựng để thử "
        + "giải bài toán đó theo cách của một đại lý lữ hành trực tuyến: nói rõ cái gì đã chắc, cái gì "
        + "còn chờ xác nhận.",
    ] },
    { id: "su-menh", heading: "Sứ mệnh", items: [
      "Đặt tour không lo mất chỗ: chỗ được giữ ngay khi tạo đơn, trong 10 phút để bạn thanh toán; quá hạn thì chỗ "
        + "được trả lại cho người khác.",
      "Tư vấn rõ ràng: khách sạn và vé máy bay luôn ghi \"giá hợp đồng, chờ xác nhận chỗ\" cho tới khi "
        + "nhân viên xác nhận với đối tác; dịch vụ cộng thêm như visa, thuê xe được tư vấn qua yêu cầu riêng.",
      "Lịch âm cho người Việt: lịch âm dương và ngày lễ hiển thị ngay trên lịch khởi hành, để bạn chọn ngày đi hợp "
        + "với dịp lễ, Tết hay ngày rằm.",
    ] },
    { id: "gia-tri", heading: "Giá trị", items: [
      "Minh bạch: tổng tiền do hệ thống tính lại, không dựa trên con số hiển thị trên trình duyệt.",
      "Tôn trọng dữ liệu: chỉ hỏi thông tin cần cho việc đặt chỗ, không hỏi số căn cước hay thông tin thẻ.",
      "Dùng tốt trên điện thoại: mọi trang được kiểm tra trên màn hình điện thoại, máy tính bảng và máy tính.",
    ] },
    { id: "nhom", heading: "Nhóm thực hiện", items: [
      `Trường: ${PROJECT_TEAM.school}.`,
      `Lớp: ${PROJECT_TEAM.className}.`,
      `Giảng viên hướng dẫn: ${PROJECT_TEAM.advisor}.`,
      `Thành viên: ${PROJECT_TEAM.memberCount} sinh viên.`,
    ] },
  ],
};
