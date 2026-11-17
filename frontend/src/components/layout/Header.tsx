import { ContactBar } from "./ContactBar";
import { HeaderScrollState } from "./HeaderScrollState";
import { Logo } from "./Logo";
import { Navigation } from "./Navigation";

export function Header() {
  return (
    <header className="header">
      <HeaderScrollState />
      <ContactBar />
      <div className="container nav"><Logo /><Navigation /></div>
    </header>
  );
}
