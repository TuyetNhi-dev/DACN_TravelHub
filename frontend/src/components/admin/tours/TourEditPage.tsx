"use client";

import { useState, type FormEvent } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { useTourForm } from "@/hooks/useTourForm";
import { tourFormFrom } from "@/lib/admin-forms";
import { TOUR_LIST_HREF } from "@/lib/admin-tours";
import { getAdminLookups, getAdminTour, updateTour } from "@/services/admin-catalog";
import type { AdminLookups, AdminTourDetail } from "@/types/admin";
import { TourDeparturesSection } from "../departures/TourDeparturesSection";
import { TourImagesEditor } from "./TourImagesEditor";
import { TourInclusionsEditor } from "./TourInclusionsEditor";
import { TourInfoFields } from "./TourInfoFields";
import { TourItineraryEditor } from "./TourItineraryEditor";
import { TourStatusActions } from "./TourStatusActions";

export function TourEditPage({ tourId }: { tourId: string }) {
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <Breadcrumb items={[{ label: "Tour", href: TOUR_LIST_HREF }, { label: "Sửa tour" }]} />
        <h1>Sửa tour</h1>
      </div>
      <TourEditor tourId={tourId} />
    </main>
  );
}

function TourEditor({ tourId }: { tourId: string }) {
  const tour = useResource(`admin-tour:${tourId}`, signal => getAdminTour(tourId, signal));
  const lookups = useResource("admin:lookups", getAdminLookups);
  if (tour.state.status === "error") {
    return <ErrorState error={tour.state.error} onRetry={tour.retry} backHref={TOUR_LIST_HREF}
      backLabel="Danh sách tour" />;
  }
  if (lookups.state.status === "error") return <ErrorState error={lookups.state.error} onRetry={lookups.retry} />;
  if (tour.state.status === "loading" || lookups.state.status === "loading") {
    return <LoadingState label="Đang tải tour…" />;
  }
  return <TourEditorReady tour={tour.state.data} lookups={lookups.state.data} onChanged={tour.replace} />;
}

interface ReadyProps {
  tour: AdminTourDetail;
  lookups: AdminLookups;
  onChanged: (tour: AdminTourDetail) => void;
}

/** Each section saves on its own; the response replaces the shared tour so badges and counts stay current. */
function TourEditorReady({ tour, lookups, onChanged }: ReadyProps) {
  return (
    <div className="adm-editor">
      <div className="adm-editor-main">
        <TourInfoForm tour={tour} lookups={lookups} onChanged={onChanged} />
        <TourImagesEditor tour={tour} onChanged={onChanged} />
        <TourItineraryEditor tour={tour} onChanged={onChanged} />
        <TourInclusionsEditor tour={tour} onChanged={onChanged} />
        <TourDeparturesSection tour={tour} lookups={lookups} />
      </div>
      {tour.canEdit && <TourStatusActions tour={tour} onChanged={onChanged} />}
    </div>
  );
}

function TourInfoForm({ tour, lookups, onChanged }: ReadyProps) {
  const { form, setForm, busy, formError, errorOf, change, submit } = useTourForm(tourFormFrom(tour));
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    setSaved(false);
    const next = await submit(event, input => updateTour(tour.id, input));
    if (!next) return;
    onChanged(next);
    setForm(tourFormFrom(next));
    setSaved(true);
  }

  return (
    <form className="adm-panel" noValidate aria-busy={busy} aria-labelledby="tour-info-title"
      onSubmit={event => void onSubmit(event)}>
      <h2 id="tour-info-title">Thông tin chung</h2>
      {!tour.canEdit && <p className="adm-note">Tour thuộc chi nhánh ngoài phạm vi sửa của bạn, chỉ được xem.</p>}
      <fieldset disabled={!tour.canEdit} className="adm-fieldset">
        <TourInfoFields form={form} lookups={lookups} currentBranchId={tour.branchId} errorOf={errorOf}
          onChange={(key, value) => { setSaved(false); change(key, value); }} />
      </fieldset>
      {formError && <p className="sh-error" role="alert">{formError}</p>}
      {saved && <p className="sh-success" role="status">Đã lưu thông tin tour.</p>}
      {tour.canEdit && (
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      )}
    </form>
  );
}
