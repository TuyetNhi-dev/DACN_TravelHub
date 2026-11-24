import { formatCurrency } from "@/lib/format";

export const QUOTE_LABEL = "Giá hợp đồng, chờ xác nhận chỗ";

interface PriceTagProps {
  amount: number | null;
  /** Text above the amount, e.g. "Giá từ". */
  prefix?: string;
  /** Text after the amount, e.g. "/ khách". */
  unit?: string;
  /** Partner quotes (hotel, flight) must never read as a confirmed price. */
  quote?: boolean;
  size?: "md" | "lg";
}

export function PriceTag({ amount, prefix, unit, quote = false, size = "md" }: PriceTagProps) {
  return (
    <div className={`ui-price ui-price--${size}`}>
      {prefix && <small className="ui-price-prefix">{prefix}</small>}
      <span className="ui-price-line">
        <strong>{formatCurrency(amount)}</strong>
        {unit && amount !== null && <span className="ui-price-unit">{unit}</span>}
      </span>
      {quote && <span className="ui-price-quote">{QUOTE_LABEL}</span>}
    </div>
  );
}
