import { useState, useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { appInstall } from "@/lib/app-install";
import { installCopy } from "./app-install-copy";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DISMISSED_KEY = "elbeg:install-banner-dismissed-at:v1";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

function wasRecentlyDismissed() {
  try {
    const timestamp = Number(localStorage.getItem(DISMISSED_KEY));
    const age = Date.now() - timestamp;
    return timestamp > 0 && age >= 0 && age < DISMISS_DURATION;
  } catch {
    return false;
  }
}

function getPlatform(): "ios" | "android" | "desktop" {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  return /Android/i.test(navigator.userAgent) ? "android" : "desktop";
}

export function AppInstallBanner() {
  const [location] = useLocation();
  const { language } = useLanguage();
  const copy = installCopy[language];
  const installState = useSyncExternalStore(appInstall.subscribe, appInstall.getSnapshot);
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);
  const [guideOpen, setGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const platform = getPlatform();

  if (dismissed || installState.isInstalled || installState.isStandalone || installState.isNative ||
    /^\/(admin|store)(\/|$)/.test(location)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Dismissing still works for this visit when storage is unavailable.
    }
  };

  const install = async () => {
    if (installing) return;
    setInstalling(true);
    const outcome = await appInstall.install();
    setInstalling(false);
    if (outcome === "unavailable") setGuideOpen(true);
    else setGuideOpen(false);
  };

  return (
    <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
      <aside className="app-install-banner" aria-label={copy.title}>
        <div className="app-install-inner">
          <button type="button" className="app-install-dismiss" aria-label={copy.close} onClick={dismiss}>
            <X size={16} aria-hidden="true" />
          </button>
          <img src="/icons/app-192.png" width={38} height={38} alt="" className="app-install-icon" />
          <div className="app-install-copy">
            <p>{copy.caption}</p>
            <strong>{copy.headline}</strong>
          </div>
          <DialogTrigger asChild>
            <button type="button" className="app-install-action" disabled={installing}
              onClick={(event) => {
                if (installState.canPrompt) {
                  event.preventDefault();
                  void install();
                }
              }}>
              {installing ? copy.installing : copy.action}
            </button>
          </DialogTrigger>
        </div>
      </aside>

      <DialogContent className="max-w-md rounded-2xl p-6" data-testid="app-install-guide">
        <DialogHeader className="text-left pr-5">
          <img src="/icons/app-192.png" width={56} height={56} alt="" className="rounded-2xl mb-3" />
          <DialogTitle className="text-xl leading-snug text-slate-900">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">{copy.description}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-4 py-3">
          {copy[platform].map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3c8fb8]/10 text-[#287397] font-bold" aria-hidden="true">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          {platform === "ios" ? <Share2 className="h-4 w-4 shrink-0 text-[#3c8fb8]" aria-hidden="true" /> : <Smartphone className="h-4 w-4 shrink-0 text-[#3c8fb8]" aria-hidden="true" />}
          {copy.embedded}
        </p>
        {installState.canPrompt ? (
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3c8fb8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={installing} onClick={() => void install()}>
            <Download size={16} aria-hidden="true" />{installing ? copy.installing : copy.install}
          </button>
        ) : (
          <DialogClose asChild>
            <button type="button" className="min-h-11 rounded-full bg-[#3c8fb8] px-5 py-3 text-sm font-semibold text-white">{copy.done}</button>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}
