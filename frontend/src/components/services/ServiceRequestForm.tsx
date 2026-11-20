"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useServiceRequestForm } from "@/hooks/useServiceRequestForm";
import { addDays } from "@/lib/flight-calendar";
import { DETAIL_FIELDS, LIMITS, PRIVACY_HINT } from "@/lib/service-request-form";
import type { ServiceRequestCreated, ServiceRequestType } from "@/types/service-request";
import { DetailInput, FieldShell } from "./ServiceFields";

/** "Gửi yêu cầu tư vấn": no sign-in needed. */
export function ServiceRequestForm({ type }: { type: ServiceRequestType }) {
  const {
    values, consent, busy, formError, created, formRef, today, errorOf, change, changeConsent, blur, submit, reset,
  } = useServiceRequestForm(type);
  if (created) return <RequestSuccess created={created} onAnother={reset} />;
  const maxDate = addDays(today, LIMITS.maxDaysAhead);
  return (
    <form ref={formRef} className="svc-form" noValidate onSubmit={event => void submit(event)}
      aria-labelledby="svc-form-title" aria-busy={busy}>
      <div className="svc-form-head">
        <h2 id="svc-form-title">Gửi yêu cầu tư vấn</h2>
        <p>Không cần đăng nhập. Nhân viên sẽ liên hệ trong 24 giờ.</p>
      </div>

      <fieldset>
        <legend>Thông tin chuyến đi</legend>
        {type === "visa" && <p className="svc-privacy"><Icon name="shield" size={16} />{PRIVACY_HINT}</p>}
        <div className="svc-grid">
          {DETAIL_FIELDS[type].map(field => (
            <DetailInput key={field.name} field={field} values={values} today={today} maxDate={maxDate}
              errorOf={errorOf} onChange={change} onBlur={blur} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Thông tin liên hệ</legend>
        <ContactFields values={values} errorOf={errorOf} onChange={change} onBlur={blur} />
      </fieldset>

      <ConsentField checked={consent} error={errorOf("consent")} onChange={changeConsent} />
      <Honeypot value={values.website} onChange={value => change("website", value)} />

      {formError && <p className="sh-error" role="alert">{formError}</p>}
      <button className="btn btn-primary svc-submit" type="submit" disabled={busy}>
        {busy ? <><span className="btn-spinner" aria-hidden="true" />Đang gửi…</> : "Gửi yêu cầu"}
      </button>
    </form>
  );
}

interface ContactProps {
  values: Record<string, string>;
  errorOf: (key: string) => string | undefined;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string) => void;
}

function ContactFields({ values, errorOf, onChange, onBlur }: ContactProps) {
  const bind = (key: string) => ({
    value: values[key], onChange: (event: { target: { value: string } }) => onChange(key, event.target.value),
    onBlur: () => onBlur(key),
  });
  return (
    <div className="svc-grid">
      <FieldShell fieldKey="fullName" label="Họ tên" required error={errorOf("fullName")}>
        {a11y => <input {...a11y} {...bind("fullName")} type="text" autoComplete="name" maxLength={LIMITS.maxName} />}
      </FieldShell>
      <FieldShell fieldKey="phone" label="Số điện thoại" required error={errorOf("phone")}>
        {a11y => <input {...a11y} {...bind("phone")} type="tel" autoComplete="tel" inputMode="tel" maxLength={20} />}
      </FieldShell>
      <FieldShell fieldKey="email" label="Email" required={false} error={errorOf("email")}>
        {a11y => <input {...a11y} {...bind("email")} type="email" autoComplete="email" maxLength={LIMITS.maxEmail} />}
      </FieldShell>
      <div className="svc-grid-wide">
        <FieldShell fieldKey="note" label="Ghi chú" required={false} error={errorOf("note")}
          hint={`${PRIVACY_HINT} Tối đa ${LIMITS.maxNote} ký tự.`}>
          {a11y => <textarea {...a11y} {...bind("note")} rows={3} maxLength={LIMITS.maxNote} />}
        </FieldShell>
      </div>
    </div>
  );
}

function ConsentField({ checked, error, onChange }: { checked: boolean; error?: string; onChange: (v: boolean) => void }) {
  return (
    <div className={error ? "svc-consent has-error" : "svc-consent"}>
      <label className="sh-check">
        <input type="checkbox" name="consent" checked={checked} onChange={event => onChange(event.target.checked)}
          aria-invalid={!!error} aria-describedby={error ? "svc-consent-error" : undefined} />
        <span>Tôi đồng ý để nhân viên SàiHành liên hệ qua điện thoại hoặc email để tư vấn yêu cầu này.</span>
      </label>
      {error && <p id="svc-consent-error" className="svc-field-error">{error}</p>}
    </div>
  );
}

/**
 * Honeypot for bots. Moved off-screen rather than display:none (some bots skip hidden inputs), removed from
 * the accessibility tree (aria-hidden) and from the tab order (tabIndex -1), and never autofilled.
 */
function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="svc-honeypot" aria-hidden="true">
      <label htmlFor="svc-website">Website</label>
      <input id="svc-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={value}
        onChange={event => onChange(event.target.value)} />
    </div>
  );
}

function RequestSuccess({ created, onAnother }: { created: ServiceRequestCreated; onAnother: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <div className="svc-success" role="status">
      <span className="svc-success-icon" aria-hidden="true"><Icon name="check" size={28} /></span>
      <h2 ref={headingRef} tabIndex={-1}>Đã gửi yêu cầu tư vấn</h2>
      <p>Mã yêu cầu của bạn</p>
      <strong className="svc-code">{created.code}</strong>
      <p>Nhân viên SàiHành sẽ liên hệ trong 24 giờ. Vui lòng giữ mã này khi trao đổi với chúng tôi.</p>
      <div className="sh-state-actions">
        <ButtonLink href="/">Về trang chủ</ButtonLink>
        <button type="button" className="btn btn-outline" onClick={onAnother}>Gửi yêu cầu khác</button>
      </div>
    </div>
  );
}
