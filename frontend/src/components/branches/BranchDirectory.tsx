"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { ALL_REGIONS, hasLocation, inRegion, regionsOf } from "@/lib/branches";
import { getBranches } from "@/services/branches";
import type { Branch } from "@/types/branch";
import { BranchList } from "./BranchList";
import { BranchMap } from "./BranchMap";

const INTRO = "Ghé văn phòng gần bạn để được tư vấn lịch trình và đặt chỗ trực tiếp.";

export function BranchDirectory() {
  const { state, retry } = useResource("branches", getBranches);
  return (
    <main id="main-content" className="branch-page">
      <div className="container">
        <header className="branch-head">
          <h1>Hệ thống văn phòng</h1>
          <p>{state.status === "ready" ? `${state.data.length} văn phòng trên toàn quốc. ${INTRO}` : INTRO}</p>
        </header>
        {state.status === "loading" && <LoadingState label="Đang tải danh sách văn phòng…" />}
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
        {state.status === "ready" && (state.data.length > 0
          ? <BranchExplorer branches={state.data} />
          : <EmptyState title="Chưa có văn phòng nào">Vui lòng gọi hotline để được hỗ trợ.</EmptyState>
        )}
      </div>
    </main>
  );
}

function BranchExplorer({ branches }: { branches: Branch[] }) {
  const [region, setRegion] = useState(ALL_REGIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const regions = useMemo(() => regionsOf(branches), [branches]);
  const visible = useMemo(() => branches.filter(branch => inRegion(branch, region)), [branches, region]);
  const pinned = useMemo(() => visible.filter(hasLocation), [visible]);

  function chooseRegion(next: string) {
    setRegion(next);
    setSelectedId(null);
  }

  return (
    <>
      {regions.length > 1 && <RegionFilter regions={regions} value={region} onChange={chooseRegion} />}
      <div className="branch-layout">
        <BranchMap branches={pinned} selectedId={selectedId} onSelect={setSelectedId} />
        <BranchList branches={visible} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </>
  );
}

interface RegionFilterProps {
  regions: string[];
  value: string;
  onChange: (region: string) => void;
}

function RegionFilter({ regions, value, onChange }: RegionFilterProps) {
  const options = [{ label: "Tất cả", value: ALL_REGIONS }, ...regions.map(name => ({ label: name, value: name }))];
  return (
    <div className="branch-filter" role="group" aria-label="Lọc theo khu vực">
      {options.map(option => (
        <button key={option.value} type="button" aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}>{option.label}</button>
      ))}
    </div>
  );
}
