export type SectionMessageValue = { kind: "error" | "success"; text: string } | null;

/** Result line under an admin section: errors are announced at once, successes politely. */
export function SectionMessage({ message }: { message: SectionMessageValue }) {
  if (!message) return null;
  return message.kind === "error"
    ? <p className="sh-error" role="alert">{message.text}</p>
    : <p className="sh-success" role="status">{message.text}</p>;
}
