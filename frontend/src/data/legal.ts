/**
 * Draft legal copy for the course project. Every statement describes what the system actually does today;
 * update this file when behaviour changes (payments, partner integrations…).
 */
export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const LEGAL_DRAFT_NOTICE = "Bản nháp phục vụ đồ án chuyên ngành, chưa có giá trị pháp lý. "
  + "Dữ liệu tour, khách sạn và chuyến bay là dữ liệu demo.";

export const termsOfUse: LegalDocument = {
  title: "Điều khoản sử dụng",
  updated: "17/11/2026",
  sections: [
    { heading: "1. Về SàiHành", paragraphs: [
      "SàiHành là website đặt tour, khách sạn và vé máy bay nội địa, xây dựng cho đồ án chuyên ngành. "
        + "Khi tạo tài khoản hoặc đặt dịch vụ, bạn đồng ý với các điều khoản dưới đây.",
    ] },
    { heading: "2. Tài khoản", paragraphs: [
      "Bạn cung cấp họ tên và email chính xác. Tài khoản đăng ký bằng mật khẩu chỉ hoạt động sau "
        + "khi bạn nhập đúng mã xác nhận 6 số gửi tới email.",
      "Bạn có thể đăng nhập bằng Google; khi đó SàiHành liên kết tài khoản theo email đã được Google xác minh.",
      "Bạn tự bảo mật mật khẩu và mã xác nhận. SàiHành không bao giờ hỏi mã xác nhận qua điện thoại hay tin nhắn.",
    ] },
    { heading: "3. Đặt tour", paragraphs: [
      "Chỗ của tour được giữ ngay khi đơn được tạo, trong giới hạn sức chứa của lịch khởi hành. "
        + "Tổng tiền luôn do hệ thống tính lại, không dựa trên số tiền hiển thị trên trình duyệt.",
    ] },
    { heading: "4. Khách sạn và vé máy bay", paragraphs: [
      "Giá khách sạn và vé máy bay là giá tham khảo do đối tác cung cấp. Đơn ở trạng thái chờ xác nhận cho tới khi "
        + "đối tác báo còn phòng hoặc còn chỗ; SàiHành không cam kết còn phòng hay còn ghế trước thời điểm đó.",
    ] },
    { heading: "5. Thanh toán và hủy đơn", paragraphs: [
      "Hiện SàiHành chưa thu tiền trực tuyến. Trạng thái đơn và khả năng hủy được hiển thị trong mục Đơn của tôi.",
    ] },
    { heading: "6. Liên hệ", paragraphs: ["Hotline hỗ trợ: 1900 6886 (08:00 – 22:00 hằng ngày)."] },
  ],
};

export const privacyPolicy: LegalDocument = {
  title: "Chính sách bảo mật",
  updated: "17/11/2026",
  sections: [
    { heading: "1. Thông tin thu thập", paragraphs: [
      "Khi đăng ký: họ tên, email và mật khẩu. Khi đặt chỗ lần đầu: số điện thoại liên hệ, được lưu vào tài khoản "
        + "để dùng lại cho các lần đặt sau. Khi đặt dịch vụ: thông tin hành khách bạn nhập.",
      "Khi đăng nhập bằng Google: họ tên, email và mã định danh tài khoản Google. SàiHành không nhận mật khẩu Google.",
    ] },
    { heading: "2. Mục đích sử dụng", paragraphs: [
      "Tạo và xác nhận tài khoản, xử lý và theo dõi đơn đặt chỗ, liên hệ với bạn về đơn hàng.",
    ] },
    { heading: "3. Lưu trữ và bảo vệ", paragraphs: [
      "Mật khẩu được băm một chiều, không lưu dạng đọc được. Mã xác nhận email chỉ lưu dạng băm, hết hạn sau "
        + "10 phút và bị vô hiệu sau 5 lần nhập sai.",
      "Phiên đăng nhập dùng cookie HttpOnly, hết hạn sau 8 giờ. Mọi thao tác thay đổi dữ liệu đều có mã chống "
        + "giả mạo yêu cầu (CSRF).",
    ] },
    { heading: "4. Chia sẻ thông tin", paragraphs: [
      "SàiHành không bán dữ liệu cá nhân. Hệ thống hiện chưa tự động gửi dữ liệu cho đối tác; nhân viên SàiHành "
        + "chỉ dùng thông tin cần thiết để xác nhận đơn với khách sạn hoặc hãng bay.",
      "Email xác nhận được gửi qua dịch vụ Gmail của Google.",
    ] },
    { heading: "5. Quyền của bạn", paragraphs: [
      "Bạn có thể yêu cầu xem, sửa hoặc xóa thông tin cá nhân bằng cách liên hệ hotline 1900 6886.",
    ] },
  ],
};
