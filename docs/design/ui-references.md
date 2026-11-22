# Tham chiếu giao diện

Giao diện SàiHành do nhóm tự thiết kế, dùng logo, màu và font riêng. Không sao chép giao diện, ảnh hay tài
nguyên của website lữ hành khác.

## Nguồn thiết kế

- Trang chủ ban đầu được chuyển từ bản thiết kế Figma Make của nhóm (bố cục hero hai cột, tìm kiếm dạng tab,
  card tour/khách sạn/chuyến bay, điểm đến, lợi ích, banner cuối trang). Bản thiết kế lưu trong tài khoản Figma
  của nhóm, không để link trong repo.
- Màu, font và biến giao diện: [theme.md](theme.md) và `frontend/src/styles/tokens.css`.
- Ảnh: chỉ dùng ảnh trong [image-credits.md](image-credits.md), luôn gắn nhãn "Ảnh minh họa" khi không phải ảnh
  của chính tour/cơ sở đó.
- Popup chọn khu vực khởi hành: [departure-region.md](departure-region.md).

## Ma trận kiểm tra kích thước

| Kích thước | Cần kiểm tra |
|---|---|
| 1440 × 1000 | Nội dung tối đa khoảng 1180px, hero hai cột, lưới ba card |
| 1024 × 768 | Header và tab tìm kiếm không tràn ngang |
| 768 × 1024 | Menu mobile, hero một cột, lưới hai card |
| 390 × 844 | Form một cột, card và footer không tràn ngang |
| 320 × 740 | Nhãn tìm kiếm, ô ngày và nút vẫn đọc và bấm được |

Bắt buộc trước khi báo xong: 390, 768 và 1440px (xem [kiểm thử](../testing/README.md)).
