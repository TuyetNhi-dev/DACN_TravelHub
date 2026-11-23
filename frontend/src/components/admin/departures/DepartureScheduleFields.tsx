"use client";

import { FieldShell } from "@/components/services/ServiceFields";
import { MAX_BULK_DATES, weeklyDates } from "@/lib/admin-forms";
import { WEEKDAYS } from "@/lib/admin-labels";

export type ScheduleMode = "one" | "weekly";

export interface Schedule {
  mode: ScheduleMode;
  date: string;
  fromDate: string;
  toDate: string;
  weekdays: number[];
}

interface ScheduleFieldsProps {
  schedule: Schedule;
  /** First day sales may open (tomorrow in Vietnam); the server refuses earlier dates. */
  minDate: string;
  errorOf: (key: string) => string | undefined;
  onChange: (patch: Partial<Schedule>) => void;
}

const MODES: { value: ScheduleMode; label: string }[] = [
  { value: "one", label: "Một ngày" }, { value: "weekly", label: "Theo thứ trong tuần" },
];

/** "Một ngày" or "theo thứ trong tuần" (native radios, so arrow keys work as screen readers expect). */
export function DepartureScheduleFields(props: ScheduleFieldsProps) {
  const { schedule, onChange } = props;
  return (
    <div className="adm-subsection">
      <fieldset className="adm-choices">
        <legend>Cách tạo lịch</legend>
        {MODES.map(mode => (
          <label key={mode.value}>
            <input type="radio" name="dep-mode" value={mode.value} checked={schedule.mode === mode.value}
              onChange={() => onChange({ mode: mode.value })} />
            {mode.label}
          </label>
        ))}
      </fieldset>
      {schedule.mode === "one"
        ? <div className="svc-grid"><DateField {...props} field="date" label="Ngày khởi hành" /></div>
        : <WeeklyFields {...props} />}
    </div>
  );
}

function WeeklyFields(props: ScheduleFieldsProps) {
  const { schedule, errorOf, onChange } = props;
  const count = weeklyDates(schedule.fromDate, schedule.toDate, schedule.weekdays).length;
  const toggle = (day: number) => onChange({
    weekdays: schedule.weekdays.includes(day) ? schedule.weekdays.filter(d => d !== day) : [...schedule.weekdays, day],
  });
  return (
    <>
      <div className="svc-grid">
        <DateField {...props} field="fromDate" label="Từ ngày" />
        <DateField {...props} field="toDate" label="Đến ngày" />
      </div>
      <fieldset className="adm-choices" aria-describedby={errorOf("weekdays") ? "dep-weekdays-error" : undefined}>
        <legend>Các thứ khởi hành</legend>
        {WEEKDAYS.map(day => (
          <label key={day.value}>
            <input type="checkbox" checked={schedule.weekdays.includes(day.value)} onChange={() => toggle(day.value)} />
            {day.label}
          </label>
        ))}
      </fieldset>
      {errorOf("weekdays") && <p id="dep-weekdays-error" className="svc-field-error">{errorOf("weekdays")}</p>}
      <p className="adm-note" role="status">
        {count > MAX_BULK_DATES
          ? `Quá ${MAX_BULK_DATES} ngày, hãy rút ngắn khoảng thời gian.`
          : `Sẽ tạo ${count} lịch.`}
      </p>
    </>
  );
}

interface DateFieldProps extends ScheduleFieldsProps {
  field: "date" | "fromDate" | "toDate";
  label: string;
}

/** The one-day form posts "departureDate", so its server error key differs from the field name. */
function DateField({ schedule, minDate, errorOf, onChange, field, label }: DateFieldProps) {
  return (
    <FieldShell fieldKey={`dep-${field}`} label={label} required
      error={errorOf(field === "date" ? "departureDate" : field)}>
      {a11y => (
        <input {...a11y} type="date" min={minDate} value={schedule[field]}
          onChange={e => onChange({ [field]: e.target.value })} />
      )}
    </FieldShell>
  );
}
