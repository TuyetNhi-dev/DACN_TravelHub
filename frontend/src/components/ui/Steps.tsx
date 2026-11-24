import { Icon } from "./Icon";

/** The tour booking journey. Hotel and flight orders follow a different path (partner confirmation first). */
export const TOUR_CHECKOUT_STEPS = ["Chọn tour", "Giữ chỗ", "Thanh toán", "Hoàn tất"] as const;

/** Step indicator. `current` is the index of the active step; earlier steps show a check mark. */
export function Steps({ current, steps = TOUR_CHECKOUT_STEPS, label = "Các bước đặt tour" }: {
  current: number;
  steps?: readonly string[];
  label?: string;
}) {
  return (
    <nav className="ui-steps" aria-label={label}>
      <ol>
        {steps.map((step, index) => {
          const state = index < current ? "is-done" : index === current ? "is-current" : "";
          return (
            <li key={step} className={state} aria-current={index === current ? "step" : undefined}>
              <span className="ui-steps-dot" aria-hidden="true">
                {index < current ? <Icon name="check" size={14} /> : index + 1}
              </span>
              <span className="ui-steps-label">{step}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
