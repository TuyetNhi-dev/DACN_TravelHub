"use client";

import { FieldShell } from "@/components/services/ServiceFields";
import type { TourForm } from "@/lib/admin-forms";
import { branchOptions } from "@/lib/admin-tours";
import type { AdminLookups, Lookup } from "@/types/admin";

interface TourInfoFieldsProps {
  form: TourForm;
  lookups: AdminLookups;
  /** Branch the tour runs from today; kept in the select even when the operator cannot manage it. */
  currentBranchId?: string;
  errorOf: (key: string) => string | undefined;
  onChange: (key: keyof TourForm, value: string) => void;
}

/** "Thông tin chung" of a tour. Limits mirror AdminTourValidator; the server checks them again. */
export function TourInfoFields({ form, lookups, currentBranchId, errorOf, onChange }: TourInfoFieldsProps) {
  const text = (key: keyof TourForm) => ({ value: form[key], onChange: (value: string) => onChange(key, value) });
  return (
    <div className="svc-grid">
      <TextField fieldKey="code" label="Mã tour" hint="Chữ in hoa, số hoặc dấu gạch ngang, ví dụ SH-MB-021"
        maxLength={40} error={errorOf("code")} {...text("code")} />
      <TextField fieldKey="title" label="Tên tour" maxLength={255} error={errorOf("title")} {...text("title")} />
      <SelectField fieldKey="destinationId" label="Điểm đến" options={lookups.destinations}
        error={errorOf("destinationId")} {...text("destinationId")} />
      <SelectField fieldKey="operatingBranchId" label="Chi nhánh điều hành"
        options={branchOptions(lookups.branches, currentBranchId)} error={errorOf("operatingBranchId")}
        {...text("operatingBranchId")} />
      <SelectField fieldKey="categoryId" label="Dòng tour" options={lookups.categories} optional
        error={errorOf("categoryId")} {...text("categoryId")} />
      <TextField fieldKey="basePrice" label="Giá từ (VND / khách)" inputMode="numeric"
        hint="Giá hiển thị khi tour chưa có lịch khởi hành" error={errorOf("basePrice")} {...text("basePrice")} />
      <TextField fieldKey="durationDays" label="Số ngày" type="number" min={1} max={60}
        error={errorOf("durationDays")} {...text("durationDays")} />
      <TextField fieldKey="durationNights" label="Số đêm" type="number" min={0} max={60}
        error={errorOf("durationNights")} {...text("durationNights")} />
      <div className="svc-grid-wide">
        <FieldShell fieldKey="description" label="Mô tả" required={false} hint="Tối đa 5.000 ký tự"
          error={errorOf("description")}>
          {a11y => (
            <textarea {...a11y} rows={5} maxLength={5000} value={form.description}
              onChange={event => onChange("description", event.target.value)} />
          )}
        </FieldShell>
      </div>
    </div>
  );
}

interface FieldProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

interface TextFieldProps extends FieldProps {
  type?: "text" | "number";
  inputMode?: "numeric";
  maxLength?: number;
  min?: number;
  max?: number;
}

function TextField({ fieldKey, label, value, onChange, error, hint, type = "text", ...input }: TextFieldProps) {
  return (
    <FieldShell fieldKey={fieldKey} label={label} required hint={hint} error={error}>
      {a11y => <input {...a11y} {...input} type={type} value={value} onChange={e => onChange(e.target.value)} />}
    </FieldShell>
  );
}

interface SelectFieldProps extends FieldProps {
  options: Lookup[];
  optional?: boolean;
}

function SelectField({ fieldKey, label, value, onChange, error, hint, options, optional }: SelectFieldProps) {
  return (
    <FieldShell fieldKey={fieldKey} label={label} required={!optional} hint={hint} error={error}>
      {a11y => (
        <select {...a11y} value={value} onChange={event => onChange(event.target.value)}>
          <option value="">{optional ? "Không chọn" : "Chọn…"}</option>
          {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      )}
    </FieldShell>
  );
}
