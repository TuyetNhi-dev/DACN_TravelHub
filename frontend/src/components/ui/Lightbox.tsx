"use client";

import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { MediaImage } from "@/lib/media";
import { Icon } from "./Icon";

const SWIPE_THRESHOLD_PX = 50;

interface LightboxProps {
  images: MediaImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Fullscreen viewer on a native modal <dialog>: the browser traps focus, Esc closes it and focus
 * returns to the opener. Arrow keys and horizontal swipes change the photo.
 */
export function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<number | null>(null);
  const image = images[index];
  const step = (delta: number) => onIndexChange((index + delta + images.length) % images.length);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    // A modal dialog does not stop the page behind it from scrolling (touch scroll leaks through on phones).
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
      element?.close();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(distance) >= SWIPE_THRESHOLD_PX) step(distance < 0 ? 1 : -1);
  }

  return (
    // The close event is async: after a dev StrictMode remount it arrives while the dialog is open again,
    // and must not shut the lightbox the user just opened.
    <dialog ref={dialog} className="ui-lightbox" aria-label="Xem ảnh toàn màn hình"
      onClose={() => { if (!dialog.current?.open) onClose(); }}
      onKeyDown={onKeyDown}>
      <div className="ui-lightbox-stage" onPointerDown={event => { swipeStart.current = event.clientX; }}
        onPointerUp={onPointerUp}>
        <Image key={image.src} src={image.src} alt={image.alt} fill sizes="100vw" />
      </div>
      <p className="ui-lightbox-caption" aria-live="polite">
        {index + 1} / {images.length} · {image.alt}
        {image.illustrative && " · Ảnh minh họa"}
        {image.author && ` · Ảnh: ${image.author} (Unsplash)`}
      </p>
      {images.length > 1 && <Thumbnails images={images} index={index} onSelect={onIndexChange} />}
      <button type="button" className="ui-lightbox-close" onClick={() => dialog.current?.close()}
        aria-label="Đóng">
        <Icon name="close" />
      </button>
      <button type="button" className="ui-lightbox-nav ui-lightbox-nav--prev" onClick={() => step(-1)}
        aria-label="Ảnh trước">
        <span className="ui-flip"><Icon name="arrow" /></span>
      </button>
      <button type="button" className="ui-lightbox-nav ui-lightbox-nav--next" onClick={() => step(1)}
        aria-label="Ảnh tiếp theo">
        <Icon name="arrow" />
      </button>
    </dialog>
  );
}

interface ThumbnailsProps {
  images: MediaImage[];
  index: number;
  onSelect: (index: number) => void;
}

/** Strip of small photos; the current one is highlighted and kept in view. */
function Thumbnails({ images, index, onSelect }: ThumbnailsProps) {
  const current = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    current.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [index]);

  return (
    <div className="ui-lightbox-thumbs" role="group" aria-label="Chọn ảnh">
      {images.map((image, position) => (
        <button key={image.src} type="button" ref={position === index ? current : undefined}
          className={position === index ? "is-current" : undefined} aria-current={position === index}
          aria-label={`Ảnh ${position + 1}`} onClick={() => onSelect(position)}>
          <Image src={image.src} alt="" fill sizes="96px" />
        </button>
      ))}
    </div>
  );
}
