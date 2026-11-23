"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SectionMessage } from "@/components/admin/tours/SectionMessage";
import { useSectionSave } from "@/hooks/useSectionSave";
import { bulkResultMessage, departuresOfTourHref, newTermsForm } from "@/lib/admin-departures";
import { toTerms, type TermsForm } from "@/lib/admin-forms";
import { addDays } from "@/lib/flight-calendar";
import { formatDate, vietnamToday } from "@/lib/format";
import { createDeparture, createWeeklyDepartures } from "@/services/admin-catalog";
import type { AdminLookups, AdminTourDetail } from "@/types/admin";
import { DepartureScheduleFields, type Schedule } from "./DepartureScheduleFields";
import { DepartureTermsFields } from "./DepartureTermsFields";

const EMPTY_SCHEDULE: Schedule = { mode: "one", date: "", fromDate: "", toDate: "", weekdays: [] };

interface SectionProps {
  tour: AdminTourDetail;
  lookups: AdminLookups;
}

/** "Thêm lịch khởi hành" of one tour: one date, or every chosen weekday in a range (dates already used are skipped). */
export function TourDeparturesSection({ tour, lookups }: SectionProps) {
  const [schedule, setSchedule] = useState<Schedule>(EMPTY_SCHEDULE);
  const [terms, setTerms] = useState<TermsForm>(() => newTermsForm(tour));
  const { busy, fieldErrors, message, save } = useSectionSave();
  const errorOf = (key: string) => fieldErrors[key]?.[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toTerms(terms);
    const { date, fromDate, toDate, weekdays } = schedule;
    const done = schedule.mode === "one"
      ? await save(() => createDeparture(tour.id, date, input), `Đã thêm lịch ${formatDate(date)}.`)
      : await save(() => createWeeklyDepartures(tour.id, { fromDate, toDate, weekdays }, input), bulkResultMessage);
    if (done !== null) setSchedule(EMPTY_SCHEDULE);
  }

  if (!tour.canEdit) return <DeparturesLinkOnly tourId={tour.id} />;
  return (
    <form className="adm-panel" noValidate aria-busy={busy} aria-labelledby="tour-departures-title"
      onSubmit={event => void submit(event)}>
      <div className="adm-panel-head">
        <h2 id="tour-departures-title">Thêm lịch khởi hành</h2>
        <Link href={departuresOfTourHref(tour.id)}>Xem các lịch của tour</Link>
      </div>
      <fieldset className="adm-fieldset">
        <DepartureScheduleFields schedule={schedule} minDate={addDays(vietnamToday(), 1)} errorOf={errorOf}
          onChange={patch => setSchedule(current => ({ ...current, ...patch }))} />
        <DepartureTermsFields idPrefix="new-dep" form={terms} lookups={lookups} withLocation errorOf={errorOf}
          onChange={(key, value) => setTerms(current => ({ ...current, [key]: value }))} />
        <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
          {busy ? "Đang tạo…" : "Tạo lịch"}
        </button>
      </fieldset>
      <SectionMessage message={message} />
    </form>
  );
}

/** Operators who cannot edit the tour still reach its departures. */
function DeparturesLinkOnly({ tourId }: { tourId: string }) {
  return (
    <section className="adm-panel" aria-labelledby="tour-departures-title">
      <h2 id="tour-departures-title">Lịch khởi hành</h2>
      <Link href={departuresOfTourHref(tourId)}>Xem các lịch của tour</Link>
    </section>
  );
}
