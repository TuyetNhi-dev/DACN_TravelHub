"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-client";
import { vietnamToday } from "@/lib/format";
import {
  buildPayload, initialValues, submitErrorMessage, validateForm, type FormErrors, type FormValues,
} from "@/lib/service-request-form";
import { createServiceRequest } from "@/services/service-requests";
import type { ServiceRequestCreated, ServiceRequestType } from "@/types/service-request";

/**
 * State of the consultation form. Errors show under a field once it was left (blur) or after a submit
 * attempt, and server field errors (same keys) show until that field changes.
 */
export function useServiceRequestForm(type: ServiceRequestType) {
  const [values, setValues] = useState<FormValues>(() => initialValues(type));
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<ServiceRequestCreated | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const today = vietnamToday();
  const errors = validateForm(type, values, consent, today);

  const errorOf = (key: string): string | undefined =>
    serverErrors[key] ?? (submitted || touched.has(key) ? errors[key] : undefined);

  function change(key: string, value: string) {
    setValues(current => ({ ...current, [key]: value }));
    setServerErrors(current => withoutKey(current, key));
  }

  function changeConsent(value: boolean) {
    setConsent(value);
    setServerErrors(current => withoutKey(current, "consent"));
  }

  function blur(key: string) {
    setTouched(current => (current.has(key) ? current : new Set(current).add(key)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(formRef.current, errors);
      return;
    }
    setBusy(true);
    try {
      setCreated(await createServiceRequest(buildPayload(type, values, consent)));
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError("Không gửi được yêu cầu. Vui lòng thử lại.");
      const fieldErrors = firstMessages(apiError.fieldErrors);
      setServerErrors(fieldErrors);
      setFormError(submitErrorMessage(apiError));
      focusFirstInvalid(formRef.current, fieldErrors);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setValues(initialValues(type));
    setConsent(false);
    setTouched(new Set());
    setSubmitted(false);
    setServerErrors({});
    setFormError(null);
    setCreated(null);
  }

  return { values, consent, busy, formError, created, formRef, today, errorOf, change, changeConsent, blur, submit, reset };
}

function withoutKey(errors: FormErrors, key: string): FormErrors {
  if (!(key in errors)) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}

function firstMessages(fieldErrors: Record<string, string[]>): FormErrors {
  return Object.fromEntries(Object.entries(fieldErrors)
    .filter(([, messages]) => messages.length > 0)
    .map(([key, messages]) => [key, messages[0]]));
}

/** Moves focus to the first field (in page order) that has an error. */
function focusFirstInvalid(form: HTMLFormElement | null, errors: FormErrors) {
  if (!form) return;
  const target = Array.from(form.elements)
    .find((element): element is HTMLInputElement => element instanceof HTMLElement && "name" in element
      && typeof element.name === "string" && element.name in errors);
  target?.focus();
}
