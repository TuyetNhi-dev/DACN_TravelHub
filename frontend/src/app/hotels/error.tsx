"use client";
import Link from "next/link";
export default function HotelsError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="sh-hotels"><div className="container sh-hotel-body"><div className="sh-hotel-panel sh-hotel-empty" role="alert"><h1>Chưa thể mở trang khách sạn</h1><p>Vui lòng thử lại để tiếp tục hành trình.</p><div className="sh-hotel-actions"><button className="btn btn-primary" onClick={reset}>Thử lại</button><Link className="btn btn-outline" href="/hotels">Về danh sách</Link></div></div></div></main>;
}
