# Quy tắc riêng cho backend
- Minimal API đặt trong Api/. Truy cập dữ liệu trong Data/ bằng MySqlConnector với câu SQL tham số hóa.
- Async đến cùng, truyền CancellationToken. Không dùng .Result hay .Wait(). Bật Nullable.
- Chuỗi kết nối và khóa đọc từ user-secrets hoặc biến môi trường, không để trong appsettings được commit.
- Đặt chỗ tour phải nằm trong transaction và giữ chỗ bằng MỘT câu UPDATE có điều kiện, kiểm tra số dòng bị ảnh hưởng. Ví dụ: UPDATE tour_departures SET reserved_seats = reserved_seats + @n WHERE id = @id AND status = 'open' AND reserved_seats + @n <= capacity. Nếu không có dòng nào bị ảnh hưởng thì trả 409.
- Khách sạn và chuyến bay là báo giá, không có tồn kho: không giữ chỗ, tạo mục đơn ở trạng thái awaiting_supplier.
- Mọi thay đổi schema đi qua migration đánh số trong database/migrations/, không sửa tay database.
- Ghi log bằng ILogger, không log bí mật. Lỗi nghiệp vụ dùng exception có mã HTTP rõ ràng và middleware chuyển thành JSON thống nhất.
