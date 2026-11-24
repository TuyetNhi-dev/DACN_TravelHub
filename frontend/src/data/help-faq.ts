import { SITE_CONTACT } from "@/data/site-contact";

/**
 * "Trợ giúp & câu hỏi thường gặp". Every answer matches the code as of 21/11/2026 (auth OTP rules, 10-minute
 * holds, cancellation rule, cart limits, service request rules). Structured so a chatbot can use it as a source.
 */
export interface FaqItem {
  id: string;
  question: string;
  answer: string[];
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

export const HELP_UPDATED = "21/11/2026";

export const FAQ_GROUPS: FaqGroup[] = [
  { id: "tai-khoan", title: "Tài khoản", items: [
    { id: "dang-ky", question: "Đăng ký tài khoản như thế nào?", answer: [
      "Vào Đăng nhập, chọn Đăng ký ngay, điền họ tên, email, mật khẩu (12–128 ký tự, nhập lại hai lần) và số điện "
        + "thoại nếu muốn (không bắt buộc, dùng để điền sẵn liên hệ khi đặt tour). Tích ô đồng ý với Chính sách bảo vệ "
        + "dữ liệu cá nhân và Thỏa thuận sử dụng rồi bấm Gửi mã OTP. Nhập mã 6 số trong email để kích hoạt tài khoản; "
        + "bạn được đăng nhập luôn.",
    ] },
    { id: "ma-otp", question: "Không nhận được mã xác nhận hoặc mã hết hạn?", answer: [
      "Mã có hiệu lực 10 phút. Bạn có thể gửi lại mã sau 60 giây. Nhập sai 5 lần thì mã bị hủy và cần gửi mã mới. "
        + "Nếu đã đóng trang, bạn vẫn nhập mã được ở trang xác nhận email hoặc khi đăng nhập lại. Hãy kiểm tra cả "
        + "thư mục Spam.",
    ] },
    { id: "google", question: "Có đăng nhập bằng Google được không?", answer: [
      "Được, nếu nút \"Tiếp tục với Google\" hiện trên trang đăng nhập. Nếu email Google trùng với tài khoản SàiHành "
        + "đã có, hai tài khoản được liên kết với nhau.",
    ] },
    { id: "quen-mat-khau", question: "Tôi quên mật khẩu thì làm sao?", answer: [
      "Bấm \"Quên mật khẩu?\" ở trang đăng nhập và nhập email. Nếu email đã đăng ký, bạn nhận mã 6 số có hiệu lực 10 "
        + "phút; gửi lại được sau 60 giây, tối đa 5 mã mỗi giờ, nhập sai 5 lần thì mã bị hủy. Nhập mã và mật khẩu mới "
        + "là xong; mọi phiên đăng nhập cũ của tài khoản bị đăng xuất. Để bảo mật, trang luôn trả cùng một thông báo "
        + "dù email có đăng ký hay không.",
      "Tài khoản tạo bằng Google cũng dùng cách này để đặt mật khẩu và đăng nhập bằng email.",
    ] },
    { id: "hoan-tat-dang-ky", question: "Vì sao tôi thấy màn hình \"Hoàn tất đăng ký\"?", answer: [
      "Tài khoản của bạn chưa đồng ý với Chính sách bảo vệ dữ liệu cá nhân và Thỏa thuận sử dụng (thường gặp khi đăng "
        + "nhập bằng Google lần đầu, hoặc tài khoản tạo trước khi có bước này). Bạn cần tích đồng ý để dùng các tính "
        + "năng cần đăng nhập như đặt tour, giỏ hàng, xem đơn; nếu không muốn, bạn có thể đăng xuất.",
    ] },
    { id: "dang-xuat", question: "Vì sao tôi bị đăng xuất?", answer: [
      "Phiên đăng nhập hết hạn sau 8 giờ. Phiên cũng có thể mất khi máy chủ khởi động lại. Bạn chỉ cần đăng nhập lại.",
    ] },
  ] },
  { id: "dat-tour", title: "Đặt tour và giữ chỗ 10 phút", items: [
    { id: "cach-dat", question: "Đặt tour gồm những bước nào?", answer: [
      "Mở trang tour, chọn ngày khởi hành và số khách, nhập họ tên từng hành khách rồi bấm Giữ chỗ ngay. Bạn cần "
        + "đăng nhập và đã lưu số điện thoại liên hệ trong tài khoản.",
    ] },
    { id: "giu-cho", question: "Giữ chỗ 10 phút nghĩa là gì?", answer: [
      "Ngay khi tạo đơn, số chỗ của bạn được trừ khỏi lịch khởi hành và giữ trong 10 phút. Thanh toán trong thời gian "
        + "này thì đơn được xác nhận. Quá 10 phút chưa thanh toán, đơn tự hủy và chỗ được trả lại cho người khác.",
    ] },
    { id: "so-khach", question: "Một đơn đặt được tối đa bao nhiêu khách?", answer: [
      "Tối đa 20 khách và không vượt quá số chỗ còn lại của lịch khởi hành. Đoàn lớn hơn vui lòng gửi yêu "
        + "cầu Tour đoàn "
        + "& công ty trong mục Dịch vụ cộng thêm.",
    ] },
    { id: "gia-tre-em", question: "Giá trẻ em tính thế nào?", answer: [
      "Mỗi lịch khởi hành có giá người lớn và có thể có giá trẻ em. Nếu lịch chưa có giá trẻ em, trẻ em tính theo giá "
        + "người lớn. Tổng tiền luôn do hệ thống tính lại khi tạo đơn.",
    ] },
    { id: "khach-san-ve", question: "Đặt khách sạn, vé máy bay có giữ chỗ ngay không?", answer: [
      "Không. Giá khách sạn và vé máy bay là giá hợp đồng với đối tác, nhưng còn phòng, còn ghế hay không "
        + "thì nhân viên phải xác nhận với đối tác trước, sau đó bạn mới thanh toán. "
        + "Riêng vé deal có ghi \"Xác nhận ngay\" được giữ ghế 10 phút như tour.",
    ] },
  ] },
  { id: "thanh-toan", title: "Thanh toán", items: [
    { id: "cach-thanh-toan", question: "Thanh toán bằng cách nào?", answer: [
      "Hiện website dùng thanh toán mô phỏng cho đồ án: bấm \"Thanh toán (mô phỏng)\" trong trang đơn, không trừ tiền "
        + "thật và không cần thông tin thẻ. Cổng VNPAY (môi trường thử nghiệm) đang được tích hợp.",
    ] },
    { id: "the", question: "SàiHành có lưu thông tin thẻ của tôi không?", answer: [
      "Không. Website không hỏi thông tin thẻ. Khi dùng VNPAY, bạn nhập thẻ trên trang của VNPAY; SàiHành chỉ nhận mã "
        + "giao dịch và kết quả thanh toán.",
    ] },
    { id: "het-han", question: "Hết 10 phút mà tôi chưa thanh toán xong?", answer: [
      "Đơn tour tự hủy và chỗ được trả lại; bạn cần tạo đơn mới nếu lịch còn chỗ. Hệ thống kiểm tra lại thời hạn ngay "
        + "lúc thanh toán, nên không thể thanh toán cho đơn đã hết hạn.",
    ] },
  ] },
  { id: "huy-don", title: "Hủy đơn", items: [
    { id: "tu-huy", question: "Tôi tự hủy đơn được không?", answer: [
      "Được, khi đơn chưa thanh toán, chưa được xác nhận và chưa đến ngày sử dụng dịch vụ. Mở đơn trong Đơn của tôi, "
        + "nút Hủy đơn chỉ hiện khi đủ điều kiện.",
    ] },
    { id: "da-thanh-toan", question: "Đơn đã thanh toán có hủy được không?", answer: [
      "Không tự hủy được trên website; vui lòng liên hệ tổng đài. Phí hủy theo thời điểm đang áp dụng thử nghiệm, xem "
        + "Chính sách hủy & hoàn tiền.",
    ] },
  ] },
  { id: "gio-hang", title: "Giỏ hàng", items: [
    { id: "giu-cho-gio", question: "Thêm vào giỏ có giữ chỗ không?", answer: [
      "Không. Giỏ chỉ lưu lựa chọn (tour, ngày khởi hành, số khách), không giữ chỗ và không giữ giá. Giá "
        + "và số chỗ trong "
        + "giỏ là thông tin hiện tại; món đổi giá hoặc hết chỗ được cảnh báo rõ.",
    ] },
    { id: "gioi-han", question: "Giỏ chứa được bao nhiêu món?", answer: [
      "Tối đa 10 món. Thêm lại một lịch khởi hành đã có trong giỏ thì số khách được cập nhật, không tạo món mới.",
    ] },
    { id: "chua-dang-nhap", question: "Chưa đăng nhập có dùng giỏ được không?", answer: [
      "Được. Giỏ được lưu trong trình duyệt của bạn. Khi đăng nhập, giỏ được chuyển vào tài khoản; nếu "
        + "một lịch có ở cả "
        + "hai nơi, bản mới hơn được giữ. Món hết chỗ, ngừng bán hoặc vượt quá 10 món sẽ không được chuyển và bạn được "
        + "báo số món đó.",
    ] },
    { id: "dat-tu-gio", question: "Đặt từ giỏ như thế nào?", answer: [
      "Bấm Đặt ngay ở từng món: trang tour mở ra với lịch và số khách đã điền sẵn, bạn nhập họ tên hành khách rồi giữ "
        + "chỗ như bình thường. Mỗi tour được đặt và thanh toán riêng. Đặt xong, món đó tự rời khỏi giỏ.",
    ] },
  ] },
  { id: "dich-vu", title: "Dịch vụ cộng thêm", items: [
    { id: "co-gi", question: "SàiHành có những dịch vụ cộng thêm nào?", answer: [
      "Vé tham quan & vui chơi, thuê xe & đón sân bay, visa, tour đoàn & công ty. Bạn gửi yêu cầu, nhân viên liên hệ "
        + "lại để tư vấn; đây không phải đơn đặt chỗ.",
    ] },
    { id: "can-dang-nhap", question: "Gửi yêu cầu có cần đăng nhập không?", answer: [
      "Không. Bạn điền họ tên, số điện thoại, email (không bắt buộc) và tích đồng ý được liên hệ. Website không hỏi số "
        + "hộ chiếu hay số căn cước. Mỗi máy chỉ gửi được một số yêu cầu trong 10 phút để chống spam.",
    ] },
  ] },
];

export const HELP_CONTACT = {
  heading: "Liên hệ",
  lines: [
    `Tổng đài hỗ trợ: ${SITE_CONTACT.hotline} (${SITE_CONTACT.hours}).`,
    `Email: ${SITE_CONTACT.email}.`,
    `Địa chỉ: ${SITE_CONTACT.address}.`,
    SITE_CONTACT.simulatedNote,
  ],
};
