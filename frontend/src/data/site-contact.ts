/**
 * Contact details shown on the site. ALL of them are simulated for the course project:
 * - The phone uses the old 0123 prefix, which Vietnam retired in 2018 (moved to 083), so it is not a working
 *   subscriber number today. It is never a tel: link, so nobody is called by mistake.
 * - The email uses the reserved ".example" domain (RFC 2606), which can never belong to anyone.
 * - The address names no real street or building.
 * Replace this file (and seeds/009) with real details only if the site is ever run by a real company.
 */
export const SITE_CONTACT = {
  brand: "SàiHành",
  tagline: "Đi để cảm nhiều hơn",
  address: "Số 01 Đường Mô Phỏng, Phường Ví Dụ, TP. Hồ Chí Minh",
  email: "hotro@saihanh.example",
  hotline: "0123 456 789",
  hours: "08:00 – 22:00 hằng ngày",
  /** Footer hotline line, kept short so it stays on one line. */
  hoursShort: "08:00–22:00",
  simulatedNote: "Thông tin liên hệ mô phỏng của đồ án sinh viên, không phải số điện thoại, email hay địa chỉ thật.",
  githubUrl: "https://github.com/TuyetNhi-dev/DACN_TravelHub",
  /** Where the hotline button leads: the help page section that explains the simulated contact. */
  contactHref: "/tro-giup#lien-he",
} as const;
