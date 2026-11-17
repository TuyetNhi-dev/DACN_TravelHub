/**
 * Minimal typing and loader for Google Identity Services (https://accounts.google.com/gsi/client).
 * The browser gets a signed ID token from Google; only the backend decides whether to trust it.
 */
const SCRIPT_URL = "https://accounts.google.com/gsi/client";

export type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

interface CredentialResponse {
  credential?: string;
}

interface GoogleIdentityApi {
  initialize(options: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    context?: "signin" | "signup" | "use";
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

let loading: Promise<GoogleIdentityApi> | null = null;

/** Loads the script once per page; later calls reuse the same promise. */
export function loadGoogleIdentity(): Promise<GoogleIdentityApi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => window.google?.accounts?.id
      ? resolve(window.google.accounts.id)
      : reject(new Error("Google Identity Services unavailable"));
    script.onerror = () => {
      loading = null;
      reject(new Error("Google Identity Services failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function readCredential(response: CredentialResponse): string | null {
  return typeof response.credential === "string" && response.credential ? response.credential : null;
}
