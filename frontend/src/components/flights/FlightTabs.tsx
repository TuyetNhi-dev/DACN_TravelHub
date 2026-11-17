import Link from "next/link";

const TABS = [
  { key: "search", label: "Tìm chuyến bay", href: "/flights" },
  { key: "deals", label: "Săn vé rẻ", href: "/flights/deals" },
] as const;

export type FlightTab = (typeof TABS)[number]["key"];

/** Both flight pages live under "Vé máy bay"; these tabs switch between searching and the deals list. */
export function FlightTabs({ current }: { current: FlightTab }) {
  return (
    <nav className="fd-tabs" aria-label="Vé máy bay">
      {TABS.map(tab => (
        <Link key={tab.key} href={tab.href} aria-current={tab.key === current ? "page" : undefined}
          className={tab.key === current ? "fd-tab is-active" : "fd-tab"}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
