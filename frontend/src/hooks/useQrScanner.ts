"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export type ScannerStatus = "idle" | "starting" | "scanning" | "denied" | "unavailable";

/** Frames are shrunk to this width before decoding: enough for a ticket QR, light on a phone CPU. */
const MAX_FRAME_WIDTH = 640;
/** Decode about seven frames a second instead of every animation frame. */
const DECODE_INTERVAL_MS = 150;

const NOT_ALLOWED = "NotAllowedError";

/**
 * Rear camera + jsQR. Decoding happens in the browser; only the decoded text reaches `onDetect`. The camera stops
 * after a read so one ticket is not reported again and again; `start` resumes it.
 */
export function useQrScanner(onDetect: (text: string) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const cancelLoop = useRef<(() => void) | null>(null);
  const detect = useRef(onDetect);
  const [status, setStatus] = useState<ScannerStatus>("idle");

  useEffect(() => { detect.current = onDetect; });

  const stop = useCallback(() => {
    cancelLoop.current?.();
    cancelLoop.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setStatus(current => (current === "scanning" || current === "starting" ? "idle" : current));
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setStatus("unavailable");
    setStatus("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const element = video.current;
      // The page unmounted while the permission prompt was open: release the camera at once.
      if (!element) return stop();
      element.srcObject = stream.current;
      await element.play();
      setStatus("scanning");
      cancelLoop.current = runDecodeLoop(() => video.current, text => {
        stop();
        detect.current(text);
      });
    } catch (error) {
      stop();
      setStatus(error instanceof DOMException && error.name === NOT_ALLOWED ? "denied" : "unavailable");
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { video, status, start, stop };
}

/** Decodes frames until one holds a QR; returns a function that cancels the loop. */
function runDecodeLoop(getVideo: () => HTMLVideoElement | null, onText: (text: string) => void): () => void {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let last = 0;
  let frame = 0;
  let cancelled = false;
  const tick = (now: number) => {
    if (cancelled) return;
    const video = getVideo();
    if (context && video && video.readyState >= video.HAVE_ENOUGH_DATA && now - last >= DECODE_INTERVAL_MS) {
      last = now;
      const text = decodeFrame(video, canvas, context);
      if (text) return onText(text);
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}

function decodeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D): string | null {
  const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" })?.data || null;
}
