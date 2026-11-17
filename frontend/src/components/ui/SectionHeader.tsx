import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  link?: { href: string; label: string };
  /** Extra controls on the right, e.g. carousel arrows. */
  actions?: ReactNode;
  id?: string;
}

export function SectionHeader({ eyebrow, title, description, link, actions, id }: SectionHeaderProps) {
  return (
    <header className="ui-section-head">
      <div>
        <span className="ui-eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {(link || actions) && (
        <div className="ui-section-actions">
          {actions}
          {link && <Link className="ui-view-all" href={link.href}>{link.label} <Icon name="arrow" size={18} /></Link>}
        </div>
      )}
    </header>
  );
}
