"use client";

import type { ReactNode } from "react";
import { LIMITS, detailKey, type DetailField } from "@/lib/service-request-form";

const idOf = (key: string) => "svc-" + key.replace(/\./g, "-");

interface ShellProps {
  fieldKey: string;
  label: string;
  required: boolean;
  hint?: string;
  error?: string;
  children: (props: InputA11y) => ReactNode;
}

export interface InputA11y {
  id: string;
  name: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  "aria-required": boolean;
}

/** Label, input, hint and the error right under the field; the input is wired to both by aria-describedby. */
export function FieldShell({ fieldKey, label, required, hint, error, children }: ShellProps) {
  const id = idOf(fieldKey);
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={error ? "svc-field has-error" : "svc-field"}>
      <label htmlFor={id}>
        {label}{required ? <span className="svc-required" aria-hidden="true"> *</span> : <small> (không bắt buộc)</small>}
      </label>
      {children({ id, name: fieldKey, "aria-invalid": !!error, "aria-describedby": describedBy, "aria-required": required })}
      {hint && <small id={`${id}-hint`} className="svc-hint">{hint}</small>}
      {error && <p id={`${id}-error`} className="svc-field-error">{error}</p>}
    </div>
  );
}

interface DetailInputProps {
  field: DetailField;
  values: Record<string, string>;
  today: string;
  maxDate: string;
  errorOf: (key: string) => string | undefined;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string) => void;
}

/** One service-specific field, rendered from its definition in service-request-form.ts. */
export function DetailInput({ field, values, today, maxDate, errorOf, onChange, onBlur }: DetailInputProps) {
  const key = detailKey(field.name);
  const common = {
    value: values[key] ?? "",
    onChange: (event: { target: { value: string } }) => onChange(key, event.target.value),
    onBlur: () => onBlur(key),
  };
  return (
    <FieldShell fieldKey={key} label={field.label} required={field.required} hint={field.hint} error={errorOf(key)}>
      {a11y => {
        switch (field.kind) {
          case "select":
            return (
              <select {...a11y} {...common}>
                {field.required && <option value="">Chọn…</option>}
                {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            );
          case "number":
            return <input {...a11y} {...common} type="number" inputMode="numeric" min={field.min} max={field.max} step={1} />;
          case "date": {
            const start = field.after ? values[detailKey(field.after.field)] : "";
            return <input {...a11y} {...common} type="date" min={start || today} max={maxDate} />;
          }
          default:
            return (
              <input {...a11y} {...common} type="text" maxLength={LIMITS.maxPlace} placeholder={field.placeholder}
                autoComplete="off" />
            );
        }
      }}
    </FieldShell>
  );
}
