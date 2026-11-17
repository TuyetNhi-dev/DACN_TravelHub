import Link from "next/link";

export default function HotelNotFound() {
  return (
    <main id="main-content" className="container sh-page">
      <div className="sh-state">
        <h1>Không tìm thấy khách sạn</h1>
        <p>Vui lòng kiểm tra liên kết hoặc chọn một nơi lưu trú khác.</p>
        <Link className="btn btn-primary" href="/hotels">Khám phá khách sạn</Link>
      </div>
    </main>
  );
}
