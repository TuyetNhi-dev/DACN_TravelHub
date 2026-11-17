"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { ContactPhoneField } from "./ContactPhoneField";

/**
 * Contact block on every booking form, filled from the signed-in account. The phone is saved on the account,
 * so it is asked at most once and reused for every later booking.
 */
export function ContactDetails() {
  const { session } = useAuth();
  if (!session) return null;
  const { fullName, email, phone } = session.user;
  return (
    <section className="sh-panel contact-details" aria-labelledby="contact-title">
      <h2 id="contact-title">Thông tin liên hệ</h2>
      <p className="sh-hotel-caption">
        {phone
          ? "Lấy từ tài khoản của bạn. SàiHành dùng số này để xác nhận đơn và hướng dẫn thanh toán."
          : "Thêm số điện thoại một lần, SàiHành sẽ dùng lại cho các lần đặt sau."}
      </p>
      <dl className="contact-list">
        <div><dt>Họ tên</dt><dd>{fullName}</dd></div>
        <div><dt>Email</dt><dd>{email}</dd></div>
        <div><dt>Điện thoại</dt><dd><ContactPhoneField key={phone ?? "none"} phone={phone} /></dd></div>
      </dl>
    </section>
  );
}

/** Booking buttons stay disabled until the account has a contact phone. */
export function useHasContactPhone(): boolean {
  const { session } = useAuth();
  return Boolean(session?.user.phone);
}

export function MissingPhoneHint() {
  return <p className="sh-hint" role="note">Lưu số điện thoại trong mục Thông tin liên hệ để tiếp tục.</p>;
}
