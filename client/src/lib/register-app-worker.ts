import { Capacitor } from "@capacitor/core";

export function registerAppWorker() {
  if (Capacitor.isNativePlatform() || !window.isSecureContext || !("serviceWorker" in navigator)) return;

  const register = () => {
    // Only an offline fallback is cached; store pages and API requests stay live.
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => { /* Browsers that block service workers still get manual install help. */ });
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
