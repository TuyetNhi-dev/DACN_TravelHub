import Link from "next/link";
export default function HotelNotFound() {
  return <main id="main-content" className="sh-hotels"><div className="container sh-hotel-body"><div className="sh-hotel-panel sh-hotel-empty"><span className="kicker">KHÔNG TÌM THẤY KHÁCH SẠN</span><h1>Điểm dừng chân này chưa có trong danh mục</h1><p>Vui lòng kiểm tra liên kết hoặc chọn một nơi lưu trú khác.</p><Link className="btn btn-primary" href="/hotels">Khám phá khách sạn</Link></div></div></main>;
}
