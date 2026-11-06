import { Logo } from "./Logo";
import { Navigation } from "./Navigation";
import { ContactBar } from "./ContactBar";
export function Header() { return <header className="header"><ContactBar /><div className="container nav"><Logo /><Navigation /></div></header>; }
