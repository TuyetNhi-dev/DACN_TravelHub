"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DEPARTURE_STORAGE_KEY, regionLabel, regions, validRegion, type Region } from "@/lib/departure-region";
import { Icon } from "@/components/ui/Icon";

interface DepartureContextValue {
  region: Region | null;
  choose: (region: Region) => void;
  open: () => void;
}
const DepartureContext = createContext<DepartureContextValue | null>(null);
export function useDeparture() {
  const value = useContext(DepartureContext);
  if (!value) throw new Error("DepartureProvider missing");
  return value;
}

export function DepartureProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<Region | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const sessionChoice = useRef<Region>("all");
  const [storageWarning, setStorageWarning] = useState(false);
  function open() {
    if (!dialog.current || dialog.current.open) return;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
  }
  function choose(value: Region) {
    sessionChoice.current = value;
    setRegion(value);
    try { localStorage.setItem(DEPARTURE_STORAGE_KEY, value); setStorageWarning(false); }
    catch { setStorageWarning(true); }
    dialog.current?.close();
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  }
  useEffect(() => {
    let active = true;
    // Hydrate from browser storage without changing the server's first-render markup.
    void Promise.resolve().then(() => {
      if (!active) return;
      let saved: string | null = null;
      try { saved = localStorage.getItem(DEPARTURE_STORAGE_KEY); } catch { /* Session still works. */ }
      const value = validRegion(saved) ? saved : "all";
      sessionChoice.current = value;
      setRegion(value);
      if (!validRegion(saved)) open();
    });
    return () => {
      active = false;
      if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
    };
  }, []);
  return <DepartureContext.Provider value={{ region, choose, open }}>
    {children}
    {storageWarning && <p className="departure-storage-note" role="status">Trình duyệt không cho lưu khu vực; lựa chọn chỉ áp dụng trong phiên này.</p>}
    <dialog ref={dialog} className="departure-dialog" aria-labelledby="departure-title" aria-describedby="departure-description"
      onCancel={event => { event.preventDefault(); choose(sessionChoice.current); }}>
      <button className="departure-close" type="button" aria-label="Đóng chọn khu vực" onClick={() => choose(sessionChoice.current)}><Icon name="close" /></button>
      <span className="kicker">KHÁM PHÁ VIỆT NAM CÙNG SÀIHÀNH</span>
      <h2 id="departure-title">Bạn muốn khởi hành từ đâu?</h2>
      <p id="departure-description">Chọn điểm xuất phát để tìm tour nội địa phù hợp. Bạn có thể đổi lựa chọn bất cứ lúc nào.</p>
      <div className="departure-options">{regions.map(item => <button type="button" key={item.id} className="departure-option"
        aria-pressed={region === item.id} onClick={() => choose(item.id)}><Icon name="map" /><span>{item.label}</span><Icon name="arrow" size={16} /></button>)}</div>
      <p className="departure-help">Đông Nam Bộ bao gồm TP.HCM. Một số khu vực có thể chưa có tour khởi hành.</p>
      <button className="btn btn-outline departure-skip" type="button" onClick={() => choose("all")}>Bỏ qua – Xem tất cả tour</button>
    </dialog>
  </DepartureContext.Provider>;
}

export function DepartureButton() {
  const { region, open } = useDeparture();
  return <button type="button" className="departure-trigger" onClick={open} aria-haspopup="dialog"
    title={"Đổi khu vực khởi hành: " + regionLabel(region || "all")}
    aria-label={"Đổi khu vực khởi hành: " + regionLabel(region || "all")}>
    <Icon name="map" size={18} /><span>{region === "all" || region === null ? "Khởi hành" : regionLabel(region)}</span>
  </button>;
}
