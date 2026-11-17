"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { directionsUrl, formatPhone, hasLocation, telHref } from "@/lib/branches";
import type { Branch } from "@/types/branch";

interface BranchListProps {
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function BranchList({ branches, selectedId, onSelect }: BranchListProps) {
  const items = useRef(new Map<string, HTMLLIElement>());

  // A pin clicked on the map brings its card into view inside the scrolling list.
  useEffect(() => {
    if (selectedId) items.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  return (
    <ul className="branch-list" aria-label="Danh sách văn phòng">
      {branches.map(branch => (
        <li key={branch.id} ref={node => { if (node) items.current.set(branch.id, node); }}
          className={branch.id === selectedId ? "branch-card is-selected" : "branch-card"}>
          <BranchCard branch={branch} selected={branch.id === selectedId} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

interface BranchCardProps {
  branch: Branch;
  selected: boolean;
  onSelect: (id: string) => void;
}

function BranchCard({ branch, selected, onSelect }: BranchCardProps) {
  const located = hasLocation(branch);
  return (
    <>
      <span className="branch-card-icon" aria-hidden="true"><Icon name="map" /></span>
      <div className="branch-card-body">
        {branch.region && <span className="branch-card-region">{branch.region}</span>}
        <h2>
          {located
            ? <button type="button" aria-pressed={selected} onClick={() => onSelect(branch.id)}
                title="Xem trên bản đồ">{branch.name}</button>
            : branch.name}
        </h2>
        {branch.address && <p className="branch-card-address">{branch.address}</p>}
        <div className="branch-card-meta">
          {branch.phone && (
            <a href={telHref(branch.phone)}><Icon name="headphones" size={16} />{formatPhone(branch.phone)}</a>
          )}
          {branch.openingHours && <span><Icon name="clock" size={16} />{branch.openingHours}</span>}
          {located && (
            <a href={directionsUrl(branch)} target="_blank" rel="noopener noreferrer">
              <Icon name="arrow" size={16} />Chỉ đường
            </a>
          )}
        </div>
      </div>
    </>
  );
}
