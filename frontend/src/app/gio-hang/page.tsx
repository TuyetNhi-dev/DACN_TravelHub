import { CartPage } from "@/components/cart/CartPage";

export const metadata = { title: "Giỏ hàng | SàiHành", robots: { index: false, follow: false } };

export default function CartRoute() {
  return <CartPage />;
}
