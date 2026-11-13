import { Capacitor } from "@capacitor/core";

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallState {
  canPrompt: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isNative: boolean;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

// Capture the one-use browser event before React mounts. Browser eligibility
// can arrive at any time, including while the instructions are already open.
export function createAppInstallController(target?: Window, isNative = false) {
  const displayMode = target?.matchMedia("(display-mode: standalone)");
  const isStandalone = () => Boolean(
    displayMode?.matches ||
    (target?.navigator as Navigator & { standalone?: boolean })?.standalone,
  );
  let deferredPrompt: InstallPromptEvent | null = null;
  let snapshot: InstallState = {
    canPrompt: false,
    isInstalled: false,
    isStandalone: isStandalone(),
    isNative,
  };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<InstallState>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  const onPrompt = (event: Event) => {
    if (isNative || isStandalone() || snapshot.isInstalled) return;
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    update({ canPrompt: true });
  };
  const onInstalled = () => {
    deferredPrompt = null;
    update({ isInstalled: true, canPrompt: false });
  };
  const onDisplayModeChange = () => {
    const standalone = isStandalone();
    if (standalone) deferredPrompt = null;
    update({ isStandalone: standalone, canPrompt: Boolean(deferredPrompt) });
  };

  target?.addEventListener("beforeinstallprompt", onPrompt);
  target?.addEventListener("appinstalled", onInstalled);
  displayMode?.addEventListener("change", onDisplayModeChange);

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async install(): Promise<InstallOutcome> {
      if (!deferredPrompt || snapshot.isNative || snapshot.isStandalone || snapshot.isInstalled) {
        return "unavailable";
      }
      const prompt = deferredPrompt;
      // Consume it synchronously: rapid clicks must never invoke it twice.
      deferredPrompt = null;
      update({ canPrompt: false });
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") onInstalled();
        return outcome;
      } catch {
        // Embedded/unsupported browsers get instructions instead of a dead CTA.
        return "unavailable";
      }
    },
    dispose() {
      target?.removeEventListener("beforeinstallprompt", onPrompt);
      target?.removeEventListener("appinstalled", onInstalled);
      displayMode?.removeEventListener("change", onDisplayModeChange);
      listeners.clear();
    },
  };
}

export const appInstall = createAppInstallController(
  typeof window === "undefined" ? undefined : window,
  Capacitor.isNativePlatform(),
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => appInstall.dispose());
}
