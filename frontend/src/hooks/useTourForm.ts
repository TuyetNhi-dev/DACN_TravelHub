"use client";

import { useState, type FormEvent } from "react";
import { ApiError, type FieldErrors } from "@/lib/api-client";
import { EMPTY_TOUR_FORM, toSaveTourInput, type TourForm } from "@/lib/admin-forms";
import type { AdminTourDetail, SaveTourInput } from "@/types/admin";

const BAD_REQUEST = 400;

/**
 * State of the "thông tin chung" tour form. Field messages come from the server's 400 response (it owns the
 * rules); any other failure becomes one message above the submit button.
 */
export function useTourForm(initial: TourForm = EMPTY_TOUR_FORM) {
  const [form, setForm] = useState<TourForm>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function change(key: keyof TourForm, value: string) {
    setForm(current => ({ ...current, [key]: value }));
    setFieldErrors(current => (current[key] ? { ...current, [key]: [] } : current));
  }

  const errorOf = (key: string) => fieldErrors[key]?.[0];

  async function submit(event: FormEvent<HTMLFormElement>, save: (input: SaveTourInput) => Promise<AdminTourDetail>) {
    event.preventDefault();
    if (busy) return null;
    setBusy(true);
    setFormError(null);
    try {
      const saved = await save(toSaveTourInput(form));
      setFieldErrors({});
      return saved;
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setFieldErrors(error.status === BAD_REQUEST ? error.fieldErrors : {});
      setFormError(error.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { form, setForm, busy, formError, errorOf, change, submit };
}
