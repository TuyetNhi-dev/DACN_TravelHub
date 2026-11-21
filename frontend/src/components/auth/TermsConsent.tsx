import Link from "next/link";

export const DATA_PROTECTION_PATH = "/bao-ve-du-lieu-ca-nhan";
export const TERMS_PATH = "/terms";

interface TermsConsentProps {
  name: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

/**
 * The agreement box used on sign-up and on "Hoàn tất đăng ký". It must be ticked actively: the server refuses
 * the request otherwise and stores the time it was ticked. Links open in a new tab so the form is not lost.
 */
export function TermsConsent({ name, checked, onChange }: TermsConsentProps) {
  return (
    <label className="auth-terms">
      <input type="checkbox" name={name} required
        {...(onChange ? { checked, onChange: event => onChange(event.target.checked) } : {})} />
      <span>
        Tôi đồng ý với{" "}
        <Link href={DATA_PROTECTION_PATH} target="_blank">Chính sách bảo vệ dữ liệu cá nhân</Link> và{" "}
        <Link href={TERMS_PATH} target="_blank">Thỏa thuận sử dụng</Link> của SàiHành.
      </span>
    </label>
  );
}
