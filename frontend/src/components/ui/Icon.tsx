import type { ReactNode } from "react";
export type IconName =
  | "search" | "map" | "calendar" | "users" | "plane" | "hotel" | "ticket"
  | "arrow" | "star" | "clock" | "shield" | "headphones" | "wallet" | "check"
  | "menu" | "close" | "minus" | "plus" | "chevron" | "heart" | "bus" | "eye" | "eyeOff"
  | "wifi" | "bed" | "bath" | "utensils" | "bell" | "waves" | "car" | "briefcase" | "accessibility" | "leaf"
  | "passport" | "cart" | "code" | "mail" | "compass" | "alert" | "lock" | "book" | "quote" | "sun"
  | "grid" | "logout" | "list" | "printer" | "download" | "panel" | "history" | "camera" | "scan" | "chat";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a21 21 0 0 1-3 3.8M6 6.5A22 22 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5-1.2M10 10a3 3 0 0 0 4 4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    plane: <><path d="M22 2 9 15" /><path d="m22 2-7 20-4-9-9-4Z" /></>,
    hotel: <><path d="M3 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M17 9h2a2 2 0 0 1 2 2v10M7 7h4M7 11h4M7 15h4M2 21h20" /></>,
    ticket: <><path d="M2 9a3 3 0 0 0 0 6v3h20v-3a3 3 0 0 0 0-6V6H2Z" /><path d="M13 6v2M13 16v2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    star: <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M18 19c0 1.1-.9 2-2 2h-1v-7h5v5ZM6 21H5c-1.1 0-2-.9-2-2v-5h5v7Z" /></>,
    wallet: <><path d="M3 6h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V6Z" /><path d="M3 7V5a2 2 0 0 1 2-2h12M15 12h7v4h-7a2 2 0 0 1 0-4Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12ZM8.5 12h.01M12 12h.01M15.5 12h.01" />,
    camera: <>
      <path d="M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>,
    scan: <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />
    </>,
    code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    cart: <><path d="M3 4h2.2l2.3 11h10.8l2-8H6.4" /><circle cx="9.5" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    wifi: <><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0" /><circle cx="12" cy="19.5" r="1" /></>,
    bed: <><path d="M2 19V5M2 13h20v6M2 17h20" /><path d="M22 13v-1a3 3 0 0 0-3-3h-8v4" /><circle cx="6.5" cy="10.5" r="1.8" /></>,
    bath: <><path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-3Z" /><path d="M6 12V5a2 2 0 0 1 4 0M7 20l-1 2M17 20l1 2" /></>,
    utensils: <><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18" /><path d="M17 21V3c-2 1-3 4-3 7s1 4 3 4" /></>,
    bell: <><path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4Z" /><path d="M10 21h4" /></>,
    waves: <><path d="M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
      <path d="M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" /></>,
    car: <><path d="M5 17H3v-5l2-5h14l2 5v5h-2M3 12h18M9.5 17h5" /><circle cx="7.5" cy="17" r="2" /><circle cx="16.5" cy="17" r="2" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
    accessibility: <><circle cx="12" cy="4.5" r="1.8" /><path d="m5 8.5 7 1.5 7-1.5M12 10v5l-3 6M12 15l3 6" /></>,
    leaf: <path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16Zm0 0 8-8" />,
    bus: <><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M8 19v2M16 19v2M8 7h8" /></>,
    passport: <><rect x="5" y="2" width="14" height="20" rx="2" /><circle cx="12" cy="10" r="3.5" /><path d="M8.5 10h7M12 6.5c-1.2 1-1.2 6 0 7M12 6.5c1.2 1 1.2 6 0 7M9 17h6" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>,
    alert: <>
      <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    book: <><path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M8 7h8M8 11h6" /></>,
    quote: <path d="M7 7H4v6h3l-2 4M17 7h-3v6h3l-2 4" />,
    sun: <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    printer: <><path d="M6 9V2h12v7" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v8H6Z" /></>,
    download: <path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16" />,
    panel: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}


