export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "travelhub-theme";
export const THEME_EVENT = "travelhub-theme-change";

/** Runs in the document head before the first paint. No system-theme override. */
export const themeInitScript = `(function(){var theme="light";try{if(localStorage.getItem("travelhub-theme")==="dark")theme="dark";}catch(e){}document.documentElement.dataset.theme=theme;})();`;

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* Storage may be blocked. */ }
  window.dispatchEvent(new Event(THEME_EVENT));
}
export function subscribeTheme(callback: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
      callback();
    }
  };
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", sync);
  };
}
