import { SITE_CONTACT } from "@/data/site-contact";
import type { ContentDocument } from "@/types/content";

/**
 * Policy pages. Every statement describes what the code does today (checked against the backend on 21/11/2026):
 * 8-hour sign-in session, 6-digit email OTP valid 10 minutes and cancelled after 5 wrong tries, passwords of at
 * least 12 characters hashed with PBKDF2, 10-minute tour holds, cancellation only before payment and before the
 * trip, simulated payment (VNPAY sandbox not yet wired to the payment page). Update this file with the code.
 */
const UPDATED = "21/11/2026";
const CONTACT_LINE = `Email: ${SITE_CONTACT.email} · Tổng đài: ${SITE_CONTACT.hotline} (${SITE_CONTACT.hours}). `
  + "Đây là thông tin liên hệ mô phỏng của đồ án; trong bản demo, nhóm thực hiện tiếp nhận yêu cầu trực tiếp.";

export const privacyPolicy: ContentDocument = {
  title: "Chính sách riêng tư",
  updated: UPDATED,
  intro: "Trang này nói ngắn gọn SàiHành thu thập gì khi bạn dùng website, dùng để làm gì và lưu ở đâu. "
    + "Phần chi tiết theo pháp luật về bảo vệ dữ liệu cá nhân nằm ở trang Chính sách bảo vệ dữ liệu cá nhân.",
  sections: [
    { id: "du-lieu-thu-thap", heading: "1. Dữ liệu chúng tôi thu thập", items: [
      "Tài khoản: họ tên, email, mật khẩu (chỉ lưu dạng băm, không ai đọc được mật khẩu gốc), số điện thoại liên hệ "
        + "nếu bạn lưu. Nếu đăng nhập bằng Google, chúng tôi lưu thêm mã định danh tài khoản Google do "
        + "Google cung cấp. Thời điểm bạn tích đồng ý với Chính sách bảo vệ dữ liệu cá nhân và Thỏa thuận sử dụng "
        + "cũng được lưu.",
      "Đơn đặt chỗ: dịch vụ bạn chọn, ngày đi, số khách, giá đã tính, trạng thái đơn và thời điểm thanh toán.",
      "Hành khách: họ tên từng người, loại khách (người lớn/trẻ em) và ngày sinh nếu bạn nhập (không bắt buộc).",
      "Yêu cầu dịch vụ cộng thêm (vé tham quan, thuê xe, visa, tour đoàn): họ tên, số điện thoại, email nếu có, "
        + "ghi chú và các thông tin của từng dịch vụ (ví dụ ngày đi, số người). Chúng tôi không hỏi và không lưu số "
        + "hộ chiếu hay số căn cước, và không lưu địa chỉ IP của bạn.",
      "Giỏ hàng: tour, lịch khởi hành và số khách bạn đã lưu; khi đã đăng nhập, giỏ lưu theo tài khoản.",
      "Mã xác nhận email: chỉ lưu dạng băm, hết hạn sau 10 phút.",
    ] },
    { id: "cookie", heading: "2. Cookie và bộ nhớ trình duyệt", paragraphs: [
      "Chúng tôi chỉ dùng cookie cần thiết để website hoạt động, không dùng cookie quảng cáo hay theo dõi:",
    ], items: [
      "Cookie phiên đăng nhập: giữ bạn đăng nhập tối đa 8 giờ, sau đó cần đăng nhập lại.",
      "Cookie chống giả mạo yêu cầu (CSRF): bảo vệ các thao tác như đặt chỗ, thanh toán, hủy đơn.",
      "Bộ nhớ trình duyệt (localStorage) trên máy của bạn: khu vực khởi hành bạn chọn, giao diện sáng/tối và giỏ "
        + "hàng khi chưa đăng nhập. Khi bạn đăng nhập, giỏ hàng này được chuyển vào tài khoản rồi xóa "
        + "khỏi trình duyệt. "
        + "Bạn có thể xóa dữ liệu này bất cứ lúc nào trong cài đặt trình duyệt.",
    ] },
    { id: "muc-dich", heading: "3. Chúng tôi dùng dữ liệu để làm gì", items: [
      "Tạo và bảo vệ tài khoản, gửi mã xác nhận qua email.",
      "Tạo đơn, giữ chỗ tour, tính tiền, để nhân viên liên hệ xác nhận và hỗ trợ bạn.",
      "Liên hệ lại theo yêu cầu dịch vụ cộng thêm bạn gửi (bạn phải tích đồng ý trước khi gửi).",
      "Không dùng dữ liệu để quảng cáo và không bán dữ liệu cho bất kỳ ai.",
    ] },
    { id: "chia-se", heading: "4. Chia sẻ dữ liệu", items: [
      "Nhân viên và quản trị viên của SàiHành xem đơn và yêu cầu dịch vụ để xử lý; khách hàng chỉ xem được dữ liệu "
        + "của chính mình.",
      "Dịch vụ gửi email (Gmail SMTP) nhận địa chỉ email và nội dung thư chứa mã xác nhận.",
      "Google nhận yêu cầu đăng nhập khi bạn chọn \"Tiếp tục với Google\".",
      "Thanh toán: hiện website chỉ có thanh toán mô phỏng, không trừ tiền và không hỏi thông tin thẻ. Khi tích hợp "
        + "cổng VNPAY (môi trường thử nghiệm), bạn nhập thông tin thẻ trên trang của VNPAY; SàiHành không nhận và "
        + "không lưu số thẻ, chỉ lưu mã giao dịch và kết quả thanh toán VNPAY gửi về.",
    ] },
    { id: "luu-tru", heading: "5. Lưu ở đâu và bao lâu", paragraphs: [
      "Dữ liệu lưu trên máy chủ cơ sở dữ liệu MySQL do nhóm thực hiện đồ án quản lý, kết nối có mã hóa. Tài khoản, đơn "
        + "và yêu cầu dịch vụ được giữ trong thời gian đồ án vận hành để bạn xem lại lịch sử; khi kết thúc đồ án, dữ "
        + "liệu demo có thể được xóa toàn bộ. Món trong giỏ được xóa khi bạn xóa, khi bạn đặt lịch đó, hoặc khi lịch "
        + "khởi hành bị xóa khỏi hệ thống.",
    ] },
    { id: "quyen", heading: "6. Quyền của bạn", paragraphs: [
      "Bạn có thể xem và sửa số điện thoại trong trang Tài khoản, xem đơn trong trang Đơn của tôi và xóa món khỏi giỏ "
        + "bất cứ lúc nào. Hiện website chưa có chức năng tự xóa tài khoản; để yêu cầu xem, sửa hoặc xóa dữ liệu khác, "
        + "hãy liên hệ theo mục bên dưới. Chi tiết các quyền theo pháp luật nằm ở trang Chính sách bảo vệ "
        + "dữ liệu cá nhân.",
    ] },
    { id: "lien-he", heading: "7. Liên hệ", paragraphs: [CONTACT_LINE] },
  ],
};

export const dataProtectionPolicy: ContentDocument = {
  title: "Chính sách bảo vệ dữ liệu cá nhân",
  updated: UPDATED,
  intro: "Chính sách này mô tả cách SàiHành xử lý dữ liệu cá nhân, căn cứ theo pháp luật Việt Nam về bảo vệ dữ liệu "
    + "cá nhân. Vì đây là website đồ án sinh viên, nhóm thực hiện đóng vai trò bên kiểm soát và xử lý dữ liệu trong "
    + "phạm vi bản demo.",
  sections: [
    { id: "can-cu", heading: "1. Căn cứ pháp lý", paragraphs: [
      "Chính sách này căn cứ các văn bản đang có hiệu lực sau:",
    ], items: [
      "Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, được Quốc hội thông qua ngày 26/6/2025, có hiệu lực từ 01/01/2026.",
      "Nghị định số 356/2025/NĐ-CP quy định chi tiết Luật Bảo vệ dữ liệu cá nhân, có hiệu lực từ 01/01/2026. Nghị định "
        + "này thay thế Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (đã hết hiệu lực).",
      "Chính sách chỉ tóm tắt cách website áp dụng các văn bản trên, chưa đối chiếu với từng điều khoản "
        + "cụ thể. Khi cần "
        + "chính xác, vui lòng đọc toàn văn trên Cổng thông tin điện tử Chính phủ.",
    ] },
    { id: "loai-du-lieu", heading: "2. Loại dữ liệu được xử lý", paragraphs: [
      "Website chỉ xử lý dữ liệu cá nhân cơ bản: họ tên, email, số điện thoại, ngày sinh của hành khách (nếu bạn "
        + "nhập), thông tin đơn đặt chỗ và yêu cầu dịch vụ. Website không chủ động thu thập dữ liệu cá nhân nhạy cảm "
        + "(sức khỏe, tài chính, sinh trắc học, vị trí…), không hỏi số căn cước, hộ chiếu hay thông tin thẻ. Danh sách "
        + "đầy đủ từng trường dữ liệu có ở trang Chính sách riêng tư.",
    ] },
    { id: "muc-dich", heading: "3. Mục đích và cơ sở xử lý", items: [
      "Thực hiện dịch vụ bạn yêu cầu: tạo tài khoản, đặt chỗ, liên hệ xác nhận đơn và hỗ trợ.",
      "Sự đồng ý của bạn: bạn chủ động tích đồng ý khi đăng ký tài khoản (hoặc ở màn hình Hoàn tất đăng ký khi đăng "
        + "nhập bằng Google lần đầu) và khi gửi yêu cầu dịch vụ cộng thêm; thời điểm đồng ý được lưu lại. Khi chưa "
        + "đồng ý, tài khoản không dùng được các tính năng cần đăng nhập.",
      "An toàn hệ thống: phiên đăng nhập, chống giả mạo yêu cầu và giới hạn số lần thao tác để chống lạm dụng.",
    ] },
    { id: "bao-ve", heading: "4. Biện pháp bảo vệ", items: [
      "Mật khẩu băm bằng thuật toán PBKDF2; mã xác nhận email chỉ lưu dạng băm, hết hạn sau 10 phút và bị hủy sau "
        + "5 lần nhập sai.",
      "Phân quyền: khách hàng chỉ truy cập dữ liệu của mình; nhân viên và quản trị viên mới xem được đơn và yêu cầu "
        + "dịch vụ để xử lý.",
      "Câu lệnh truy vấn cơ sở dữ liệu luôn tham số hóa; kết nối tới cơ sở dữ liệu có mã hóa.",
      "Không ghi mật khẩu, mã xác nhận hay thông tin cá nhân vào nhật ký hệ thống.",
    ] },
    { id: "luu-tru", heading: "5. Thời gian lưu trữ", paragraphs: [
      "Dữ liệu được lưu trong thời gian đồ án vận hành và có thể được xóa toàn bộ khi kết thúc đồ án. Phiên đăng nhập "
        + "hết hạn sau 8 giờ. Dữ liệu trong trình duyệt (localStorage) do bạn quản lý và có thể tự xóa.",
    ] },
    { id: "ben-thu-ba", heading: "6. Bên nhận dữ liệu", items: [
      "Dịch vụ gửi email (Gmail SMTP): địa chỉ email và thư chứa mã xác nhận.",
      "Google: khi bạn chọn đăng nhập bằng Google.",
      "VNPAY: khi cổng thanh toán VNPAY (môi trường thử nghiệm) được dùng, VNPAY xử lý thông tin thẻ trên trang của "
        + "họ; SàiHành không nhận và không lưu số thẻ.",
      "Dữ liệu không được bán hay chuyển cho bên khác vì mục đích quảng cáo.",
    ] },
    { id: "quyen", heading: "7. Quyền của chủ thể dữ liệu", paragraphs: [
      "Theo pháp luật về bảo vệ dữ liệu cá nhân, bạn có các quyền như: được biết về việc xử lý dữ liệu; đồng ý hoặc "
        + "không đồng ý, rút lại sự đồng ý; xem, chỉnh sửa hoặc yêu cầu chỉnh sửa dữ liệu; yêu cầu xóa, hạn chế xử lý "
        + "hoặc phản đối việc xử lý dữ liệu; khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường theo quy định.",
      "Trên website, bạn tự sửa được số điện thoại liên hệ và xóa món trong giỏ. Các yêu cầu khác (ví dụ xóa tài "
        + "khoản) hiện được nhóm xử lý thủ công khi bạn liên hệ; website chưa có chức năng tự xóa tài khoản.",
    ] },
    { id: "su-co", heading: "8. Khi có sự cố", paragraphs: [
      "Nếu phát hiện dữ liệu bị lộ hoặc truy cập trái phép, nhóm sẽ khóa nguyên nhân, đánh giá phạm vi ảnh hưởng và "
        + "thông báo cho người bị ảnh hưởng qua email đã đăng ký.",
    ] },
    { id: "lien-he", heading: "9. Liên hệ", paragraphs: [CONTACT_LINE] },
  ],
};

export const termsOfUse: ContentDocument = {
  title: "Thỏa thuận sử dụng",
  updated: UPDATED,
  intro: "Khi dùng website SàiHành, bạn đồng ý với các điều kiện dưới đây.",
  sections: [
    { id: "do-an", heading: "1. Website đồ án mô phỏng", paragraphs: [
      "SàiHành là website đồ án chuyên ngành của sinh viên HUTECH, không phải doanh nghiệp lữ hành thật. Tour, giá, "
        + "lịch khởi hành, khách sạn, chuyến bay và thông tin liên hệ là dữ liệu mô phỏng. Không có dịch vụ du lịch "
        + "thật nào được cung cấp và thanh toán hiện không trừ tiền thật.",
    ] },
    { id: "tai-khoan", heading: "2. Tài khoản", items: [
      "Bạn cung cấp họ tên và email chính xác. Tài khoản đăng ký bằng mật khẩu chỉ hoạt động sau khi bạn nhập đúng mã "
        + "6 số gửi tới email; mật khẩu tối thiểu 12 ký tự.",
      "Bạn có thể đăng nhập bằng Google; nếu email đó đã có tài khoản SàiHành, hai tài khoản được liên kết.",
      "Bạn tự bảo mật mật khẩu và mã xác nhận. SàiHành không bao giờ hỏi mã xác nhận qua điện thoại hay tin nhắn.",
      "Cần lưu số điện thoại liên hệ trong tài khoản trước khi đặt chỗ.",
    ] },
    { id: "dat-cho", heading: "3. Đặt chỗ", items: [
      "Tour: khi tạo đơn, chỗ được giữ trong 10 phút. Thanh toán trong thời gian này thì đơn được xác nhận; quá hạn "
        + "thì đơn tự hủy và chỗ được trả lại.",
      "Khách sạn và vé máy bay: giá là giá tham khảo của đối tác. Đơn chờ nhân viên xác nhận với đối tác trước, sau "
        + "đó bạn mới thanh toán. SàiHành không cam kết còn phòng hay còn ghế trước khi xác nhận.",
      "Vé deal (có ghi \"Xác nhận ngay\") được giữ ghế 10 phút như tour.",
      "Giỏ hàng chỉ lưu lựa chọn, không giữ chỗ và không giữ giá.",
    ] },
    { id: "gia", heading: "4. Giá có thể thay đổi", paragraphs: [
      "Giá hiển thị có thể thay đổi theo thời điểm đặt. Tổng tiền của đơn luôn do hệ thống tính lại theo giá của lịch "
        + "khởi hành hoặc báo giá tại lúc đặt, không dựa trên số tiền hiển thị trên trình duyệt hay trong giỏ hàng.",
    ] },
    { id: "su-dung", heading: "5. Sử dụng đúng mục đích", items: [
      "Không dùng công cụ tự động gửi số lượng lớn yêu cầu; hệ thống giới hạn số lần thao tác để chống lạm dụng.",
      "Không nhập thông tin của người khác khi chưa được họ đồng ý.",
      "Không tìm cách truy cập dữ liệu của người dùng khác hoặc khu vực quản trị.",
    ] },
    { id: "trach-nhiem", heading: "6. Giới hạn trách nhiệm", paragraphs: [
      "Vì đây là website mô phỏng, nhóm thực hiện không chịu trách nhiệm về quyết định du lịch thật dựa trên thông tin "
        + "trên website. Nội dung cẩm nang du lịch chỉ mang tính tham khảo chung. Website có thể tạm dừng "
        + "hoặc thay đổi "
        + "chức năng bất cứ lúc nào trong quá trình làm đồ án.",
    ] },
    { id: "lien-quan", heading: "7. Chính sách liên quan", items: [
      "Chính sách riêng tư và Chính sách bảo vệ dữ liệu cá nhân: cách website xử lý dữ liệu của bạn.",
      "Chính sách hủy & hoàn tiền: khi nào bạn tự hủy được đơn.",
    ] },
    { id: "lien-he", heading: "8. Liên hệ", paragraphs: [CONTACT_LINE] },
  ],
};

export const cancellationPolicy: ContentDocument = {
  title: "Chính sách hủy & hoàn tiền",
  updated: UPDATED,
  intro: "Quy định dưới đây khớp với cách hệ thống đang xử lý đơn. Phần nào chưa được làm trên hệ thống đều ghi rõ.",
  sections: [
    { id: "tu-huy", heading: "1. Khi nào bạn tự hủy được đơn", paragraphs: [
      "Mở đơn từ trang Đơn của tôi, nút \"Hủy đơn\" chỉ hiện khi đơn đủ cả hai điều kiện:",
    ], items: [
      "Đơn chưa thanh toán và chưa được xác nhận: đang giữ chỗ chờ thanh toán (tour, vé deal), đang chờ đối tác xác "
        + "nhận, hoặc đã được đối tác xác nhận nhưng bạn chưa thanh toán (khách sạn, vé máy bay).",
      "Chưa đến ngày sử dụng dịch vụ (ngày khởi hành hoặc ngày nhận phòng).",
    ] },
    { id: "da-thanh-toan", heading: "2. Đơn đã thanh toán", paragraphs: [
      "Đơn đã thanh toán hoặc đã xác nhận không tự hủy được trên website. Vui lòng liên hệ tổng đài để được hỗ trợ.",
    ] },
    { id: "tu-dong-huy", heading: "3. Đơn tự hủy", items: [
      "Tour và vé deal: nếu không thanh toán trong 10 phút giữ chỗ, đơn tự hủy và chỗ được trả lại. Bạn không mất phí.",
      "Khách sạn và vé máy bay: nếu đối tác báo hết phòng hoặc hết chỗ, đơn chuyển sang trạng thái không thành công. "
        + "Bạn chưa thanh toán ở bước này nên không mất phí.",
    ] },
    { id: "phi-huy", heading: "4. Phí hủy theo thời điểm (đang áp dụng thử nghiệm)", paragraphs: [
      "Phí hủy tính theo số ngày trước ngày khởi hành hiện đang áp dụng thử nghiệm và chưa được hệ thống tự động tính. "
        + "Khi tính năng này hoàn thiện, mức phí sẽ được công bố trên trang này trước khi áp dụng.",
    ] },
    { id: "hoan-tien", heading: "5. Hoàn tiền", items: [
      "Thanh toán hiện là mô phỏng, không trừ tiền thật, nên không phát sinh hoàn tiền thật.",
      "Khi dùng cổng VNPAY (môi trường thử nghiệm): nếu VNPAY báo đã trừ tiền nhưng thời gian giữ chỗ đã hết và đơn đã "
        + "tự hủy, giao dịch được ghi nhận là cần hoàn tiền và nhân viên xử lý hoàn tiền thủ công qua VNPAY. Việc hoàn "
        + "tiền này đang áp dụng thử nghiệm.",
    ] },
    { id: "lien-he", heading: "6. Liên hệ", paragraphs: [CONTACT_LINE] },
  ],
};
