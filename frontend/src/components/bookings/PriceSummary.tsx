import { formatCurrency } from "@/lib/format";

export interface SummaryLine {
  label: string;
  value: string;
}

interface PriceSummaryProps {
  lines: SummaryLine[];
  total: number | null;
  totalLabel?: string;
}

export function PriceSummary({ lines, total, totalLabel = "Tổng tạm tính" }: PriceSummaryProps) {
  return (
    <dl className="sh-summary">
      {lines.map(line => (
        <div key={line.label}>
          <dt>{line.label}</dt>
          <dd>{line.value}</dd>
        </div>
      ))}
      <div className="sh-total">
        <dt>{totalLabel}</dt>
        <dd>{formatCurrency(total)}</dd>
      </div>
    </dl>
  );
}
