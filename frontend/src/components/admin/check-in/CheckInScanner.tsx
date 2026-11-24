"use client";

import { Icon } from "@/components/ui/Icon";
import { useQrScanner, type ScannerStatus } from "@/hooks/useQrScanner";

const STATUS_TEXT: Record<ScannerStatus, string> = {
  idle: "Mở camera rồi đưa mã QR trên vé vào giữa khung.",
  starting: "Đang mở camera…",
  scanning: "Đang quét. Giữ mã QR trong khung, đủ sáng và không rung.",
  denied: "Trình duyệt chưa được phép dùng camera. Cho phép trong cài đặt trang, hoặc tìm theo mã đơn bên dưới.",
  unavailable: "Không mở được camera trên thiết bị này. Hãy tìm theo mã đơn bên dưới.",
};

interface CheckInScannerProps {
  disabled: boolean;
  onDetect: (text: string) => void;
}

/** Camera QR reader; the search below it always works, with or without a camera. */
export function CheckInScanner({ disabled, onDetect }: CheckInScannerProps) {
  const { video, status, start, stop } = useQrScanner(onDetect);
  const live = status === "scanning" || status === "starting";
  const problem = status === "denied" || status === "unavailable";
  return (
    <section className="adm-panel checkin-scanner" aria-labelledby="checkin-scan-title">
      <div className="adm-panel-head">
        <h2 id="checkin-scan-title"><Icon name="scan" size={20} />Quét mã QR</h2>
        {live && <button type="button" className="btn btn-outline btn-small" onClick={stop}>Tắt camera</button>}
      </div>
      <div className={live ? "checkin-viewfinder is-live" : "checkin-viewfinder"}>
        {/* muted + playsInline: iOS Safari only plays an inline camera stream that way. */}
        <video ref={video} muted playsInline aria-label="Hình camera để quét mã QR" />
        {live && <span className="checkin-reticle" aria-hidden="true" />}
        {!live && (
          <button type="button" className="checkin-start" disabled={disabled} onClick={() => void start()}>
            <Icon name="camera" size={28} />
            <span>{disabled ? "Đang tắt quét mã" : "Mở camera để quét"}</span>
          </button>
        )}
      </div>
      <p className={problem ? "adm-note checkin-scan-problem" : "adm-note"} role="status">
        {disabled ? "Quét mã chỉ dùng được khi check-in đang mở và máy chủ có khóa vé." : STATUS_TEXT[status]}
      </p>
    </section>
  );
}
