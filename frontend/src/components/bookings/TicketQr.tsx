"use client";

import { Icon } from "@/components/ui/Icon";
import { useQrImage } from "@/hooks/useQrImage";
import { ticketQrFileName } from "@/lib/check-in";

/** The QR on a white plate (cameras need the light quiet zone, dark theme included) and the code under it. */
export function TicketQr({ payload, code }: { payload: string; code: string }) {
  const image = useQrImage(payload);
  return (
    <figure className="ticket-qr">
      <div className="ticket-qr-plate">
        {image.status === "ready" && (
          // A generated data URL: next/image adds nothing for it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.src} alt={`Mã QR của vé ${code}`} width={200} height={200} />
        )}
        {image.status === "loading" && <span className="ticket-qr-placeholder" role="status">Đang tạo mã QR…</span>}
        {image.status === "error" && (
          <span className="ticket-qr-placeholder" role="alert">Không tạo được mã QR. Hãy đọc mã vé bên dưới.</span>
        )}
      </div>
      <figcaption>
        <span>Mã vé</span>
        <strong>{code}</strong>
      </figcaption>
      {image.status === "ready" && (
        <a className="btn btn-outline btn-small ticket-no-print" href={image.src} download={ticketQrFileName(code)}>
          <Icon name="download" size={16} />Tải mã QR
        </a>
      )}
    </figure>
  );
}
