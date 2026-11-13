import { useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { Check, Copy, Download, ExternalLink, Share2, Smartphone, X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { appInstall } from "@/lib/app-install";
import { getChromeInstallIntent, getInstallContext, getInstallPageUrl } from "@/lib/app-install-platform";
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

export function AppInstallBanner() {
  const [location] = useLocation();
  const { language } = useLanguage();
  const copy = installCopy[language];
  const installState = useSyncExternalStore(appInstall.subscribe, appInstall.getSnapshot);
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);
  const [guideOpen, setGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"copied" | "manual" | null>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const context = getInstallContext(navigator);
  const { platform } = context;
  const installUrl = getInstallPageUrl(window.location.href);
  const chromeIntent = getChromeInstallIntent(window.location.href);

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

  const copyInstallLink = async () => {
    if (!installUrl) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(installUrl);
      setCopyStatus("copied");
    } catch {
      urlInput.current?.focus();
      urlInput.current?.select();
      setCopyStatus("manual");
    }
  };

  return (
    <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
      <aside className="app-install-banner" aria-label={copy.title}>
        <div className="app-install-inner">
          <button type="button" className="app-install-dismiss" aria-label={copy.close} onClick={dismiss}>
            <X size={16} aria-hidden="true" />
          </button>
          <DialogTrigger asChild>
            <button type="button" className="app-install-launch" disabled={installing} aria-label={copy.install} aria-busy={installing}
              onClick={(event) => {
                // Read the controller on every tap: a native prompt may have
                // become available since the banner's last React render.
                event.preventDefault();
                void install();
              }}>
              <img src="/icons/app-192.png" width={38} height={38} alt="" className="app-install-icon" />
              <span className="app-install-copy">
                <span className="app-install-caption">{copy.caption}</span>
                <strong>{copy.headline}</strong>
              </span>
              <span className="app-install-action">{installing ? copy.installing : copy.action}</span>
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
        {context.isEmbedded && <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <Smartphone className="h-4 w-4 shrink-0 text-[#3c8fb8]" aria-hidden="true" />{copy.embedded}
        </p>}
        {platform === "ios" && !context.isEmbedded && <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <Share2 className="h-4 w-4 shrink-0 text-[#3c8fb8]" aria-hidden="true" />{copy.iosNote}
        </p>}
        {installState.canPrompt || installing ? (
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3c8fb8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={installing} onClick={() => void install()}>
            <Download size={16} aria-hidden="true" />{installing ? copy.installing : copy.install}
          </button>
        ) : platform === "android" && !context.isChrome && chromeIntent ? (
          <a className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3c8fb8] px-5 py-3 text-sm font-semibold text-white" href={chromeIntent}>
            <ExternalLink size={16} aria-hidden="true" />{copy.openChrome}
          </a>
        ) : null}
        <ol className="space-y-4 py-3">
          {copy[platform].map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3c8fb8]/10 text-[#287397] font-bold" aria-hidden="true">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {installUrl && <div className="rounded-xl border border-slate-200 p-3">
          <label htmlFor="app-install-url" className="mb-2 block text-xs font-semibold text-slate-600">{copy.linkLabel}</label>
          <div className="flex min-w-0 gap-2">
            <input id="app-install-url" ref={urlInput} value={installUrl} readOnly onFocus={(event) => event.currentTarget.select()} className="w-0 min-w-0 flex-1 rounded-lg bg-slate-50 px-2 py-2 text-xs text-slate-600" />
            <button type="button" className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#3c8fb8]/25 px-3 py-2 text-xs font-semibold text-[#287397]" onClick={() => void copyInstallLink()}>
              {copyStatus === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copyStatus === "copied" ? copy.copied : copy.copyLink}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#287397]" role="status">{copyStatus === "copied" ? copy.copied : copyStatus === "manual" ? copy.copyFailed : ""}</p>
        </div>}
        <DialogClose asChild>
          <button type="button" className="min-h-11 rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">{copy.done}</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
