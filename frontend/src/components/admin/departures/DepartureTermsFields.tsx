"use client";

import { FieldShell } from "@/components/services/ServiceFields";
import type { TermsForm } from "@/lib/admin-forms";
import { MAX_CAPACITY } from "@/lib/admin-departures";
import { branchOptions } from "@/lib/admin-tours";
import type { AdminLookups } from "@/types/admin";

interface DepartureTermsFieldsProps {
  idPrefix: string;
  form: TermsForm;
  lookups: AdminLookups;
  /** The departure point is fixed once created, so the edit form hides it. */
  withLocation: boolean;
  errorOf: (key: string) => string | undefined;
  onChange: (key: keyof TermsForm, value: string) => void;
}

/** Seats, minimum group and prices of a departure; shared by "thêm lịch" and "sửa lịch". */
export function DepartureTermsFields(props: DepartureTermsFieldsProps) {
  const { idPrefix, form, lookups, withLocation, errorOf, onChange } = props;
  const id = (key: string) => `${idPrefix}-${key}`;
  const number = (key: keyof TermsForm, label: string, required = true, hint?: string) => (
    <FieldShell fieldKey={id(key)} label={label} required={required} hint={hint} error={errorOf(key)}>
      {a11y => <input {...a11y} inputMode="numeric" value={form[key]} onChange={e => onChange(key, e.target.value)} />}
    </FieldShell>
  );
  return (
    <div className="svc-grid">
      {withLocation && (
        <FieldShell fieldKey={id("departureLocationId")} label="Điểm khởi hành" required
          error={errorOf("departureLocationId")}>
          {a11y => (
            <select {...a11y} value={form.departureLocationId}
              onChange={e => onChange("departureLocationId", e.target.value)}>
              <option value="">Chọn…</option>
              {lookups.departureLocations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}
        </FieldShell>
      )}
      <FieldShell fieldKey={id("operatingBranchId")} label="Chi nhánh điều hành" required
        error={errorOf("operatingBranchId")}>
        {a11y => (
          <select {...a11y} value={form.operatingBranchId}
            onChange={e => onChange("operatingBranchId", e.target.value)}>
            <option value="">Chọn…</option>
            {branchOptions(lookups.branches, form.operatingBranchId)
              .map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        )}
      </FieldShell>
      {number("capacity", "Số chỗ", true, `Từ 1 đến ${MAX_CAPACITY}`)}
      {number("minGuests", "Số khách tối thiểu", true, "Dưới số này, lịch được báo chưa đủ khách")}
      {number("adultPrice", "Giá người lớn (VND)")}
      {number("childPrice", "Giá trẻ em (VND)", false, "Để trống nếu bằng giá người lớn")}
    </div>
  );
}
