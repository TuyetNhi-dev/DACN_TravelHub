"use client";

import Form from "next/form";
import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { useSearchCombobox } from "@/hooks/useSearchCombobox";
import { SearchSuggestions } from "./SearchSuggestions";

/**
 * Header search with suggestions while typing (ROADMAP 8.2): destinations open the filtered tour list, tours open
 * their page. Without JavaScript it is still a plain form to /tours.
 */
export function HeaderSearch() {
  const listId = useId();
  const box = useSearchCombobox();
  const optionId = (index: number) => `${listId}-${box.options[index]?.key}`;
  return (
    <Form action="/tours" role="search" aria-label="Tìm tour trên SàiHành" className="header-search"
      onSubmit={box.close}>
      <input name="q" type="search" role="combobox" aria-label="Tên tour hoặc điểm đến" aria-autocomplete="list"
        aria-expanded={box.showList} aria-controls={listId}
        aria-activedescendant={box.showList && box.active >= 0 ? optionId(box.active) : undefined}
        placeholder="Tìm tour, điểm đến…" maxLength={200} autoComplete="off" value={box.text}
        onChange={event => box.type(event.target.value)} onFocus={box.openList} onBlur={box.close}
        onKeyDown={box.onKeyDown} />
      <button type="submit" aria-label="Tìm kiếm tour" title="Tìm kiếm tour"><Icon name="search" size={18} /></button>
      {box.showList && (
        <SearchSuggestions id={listId} options={box.options} active={box.active} optionId={optionId}
          status={box.status} onPick={box.pick} />
      )}
    </Form>
  );
}
