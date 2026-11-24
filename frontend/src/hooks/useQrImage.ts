"use client";

import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";

/** Pixels of the rendered QR; large enough for a phone camera at arm's length and for print. */
const QR_SIZE = 280;
const QR_MARGIN = 2;

type QrImage = { status: "loading" } | { status: "ready"; src: string } | { status: "error" };

/** Draws `payload` as a QR PNG in the browser; the payload never leaves the page for this. */
export function useQrImage(payload: string): QrImage {
  const [image, setImage] = useState<{ payload: string; value: QrImage } | null>(null);
  useEffect(() => {
    let active = true;
    toDataURL(payload, { width: QR_SIZE, margin: QR_MARGIN, errorCorrectionLevel: "M" })
      .then(src => { if (active) setImage({ payload, value: { status: "ready", src } }); })
      .catch(() => { if (active) setImage({ payload, value: { status: "error" } }); });
    return () => { active = false; };
  }, [payload]);
  return image?.payload === payload ? image.value : { status: "loading" };
}
