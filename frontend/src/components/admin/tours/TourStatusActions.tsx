"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api-client";
import { statusActionsFor, tourEditHref } from "@/lib/admin-tours";
import { cloneTour, setTourStatus } from "@/services/admin-catalog";
import type { AdminTourDetail, TourStatus } from "@/types/admin";
import { SectionMessage, type SectionMessageValue } from "./SectionMessage";
import { TourStatusBadge } from "./TourStatusBadge";

type Message = SectionMessageValue;
type Busy = TourStatus | "clone" | null;

interface TourStatusActionsProps {
  tour: AdminTourDetail;
  onChanged: (tour: AdminTourDetail) => void;
}

/** Status switch and "Nhân bản". The copy is a draft with a new code and no departures (AdminTourService). */
export function TourStatusActions({ tour, onChanged }: TourStatusActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message>(null);

  async function run(kind: Exclude<Busy, null>, action: () => Promise<void>) {
    setBusy(kind);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setMessage({ kind: "error", text: error.message });
    } finally {
      setBusy(null);
    }
  }

  const changeStatus = (status: TourStatus, done: string) => run(status, async () => {
    onChanged(await setTourStatus(tour.id, status));
    setMessage({ kind: "success", text: done });
  });
  const clone = () => run("clone", async () => router.push(tourEditHref((await cloneTour(tour.id)).id)));

  return (
    <section className="adm-panel" aria-labelledby="tour-status-title">
      <h2 id="tour-status-title">Trạng thái</h2>
      <p><TourStatusBadge status={tour.status} /></p>
      <div className="adm-actions">
        {statusActionsFor(tour.status).map(action => (
          <Button key={action.status} variant="outline" size="sm" disabled={busy !== null}
            loading={busy === action.status} onClick={() => void changeStatus(action.status, action.done)}>
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" disabled={busy !== null} loading={busy === "clone"}
          onClick={() => void clone()}>Nhân bản</Button>
      </div>
      <SectionMessage message={message} />
    </section>
  );
}
