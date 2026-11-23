"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

interface TabsProps<T extends string> {
  /** Prefix for the tab and panel ids, unique on the page. */
  idPrefix: string;
  label: string;
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
}

/** WAI-ARIA tabs: arrow keys move between tabs, only the active tab is in the tab order. */
export function Tabs<T extends string>({ idPrefix, label, tabs, active, onChange, children }: TabsProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    const current = tabs.findIndex(tab => tab.id === active);
    const next = (current + step + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <>
      <div className="ui-tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => (
          <button key={tab.id} ref={element => { buttons.current[index] = element; }} type="button" role="tab"
            id={`${idPrefix}-tab-${tab.id}`} aria-controls={`${idPrefix}-panel`} aria-selected={active === tab.id}
            tabIndex={active === tab.id ? 0 : -1} onClick={() => onChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${active}`}>
        {children}
      </div>
    </>
  );
}
