import Link from "next/link";

/** Empty cart: an original drawing (suitcase, map pin and a dashed route), not a copied illustration. */
export function CartEmpty() {
  return (
    <section className="cart-empty" aria-labelledby="cart-empty-title">
      <svg className="cart-empty-art" viewBox="0 0 240 180" role="img" aria-label="Vali du lịch và ghim bản đồ">
        <ellipse cx="120" cy="160" rx="84" ry="10" className="cart-art-shadow" />
        <path d="M34 120 C 60 70, 110 140, 150 92 S 210 58, 214 40" className="cart-art-route" />
        <rect x="74" y="64" width="92" height="88" rx="14" className="cart-art-case" />
        <path d="M100 64 v-14 a8 8 0 0 1 8 -8 h24 a8 8 0 0 1 8 8 v14" className="cart-art-handle" />
        <rect x="74" y="92" width="92" height="12" className="cart-art-band" />
        <circle cx="94" cy="152" r="6" className="cart-art-wheel" />
        <circle cx="146" cy="152" r="6" className="cart-art-wheel" />
        <path d="M214 12 a14 14 0 0 1 14 14 c0 11 -14 24 -14 24 s-14 -13 -14 -24 a14 14 0 0 1 14 -14 Z"
          className="cart-art-pin" />
        <circle cx="214" cy="26" r="5" className="cart-art-pin-dot" />
      </svg>
      <h2 id="cart-empty-title">Bạn chưa thêm tour nào vào giỏ</h2>
      <p>Lưu các tour bạn thích để so sánh lịch khởi hành và giá, rồi đặt khi đã sẵn sàng.</p>
      <Link className="btn btn-primary" href="/tours">Khám phá tour</Link>
    </section>
  );
}
