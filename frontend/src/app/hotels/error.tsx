"use client";

import Link from "next/link";

export default function HotelsError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="container sh-page">
      <div className="sh-state" role="alert">
        <h1>Chưa thể mở trang khách sạn</h1>
        <p>Vui lòng thử lại để tiếp tục hành trình.</p>
        <div className="sh-state-actions">
          <button className="btn btn-primary" onClick={reset}>Thử lại</button>
          <Link className="btn btn-outline" href="/hotels">Về danh sách</Link>
        </div>
      </div>
    </main>
  );
}
