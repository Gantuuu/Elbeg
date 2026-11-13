export type InstallPlatform = "ios" | "android" | "macos" | "desktop";

interface BrowserIdentity {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

export function getInstallContext(identity: BrowserIdentity) {
  const ua = identity.userAgent;
  const isIOS = /iPad|iPhone|iPod/i.test(ua) ||
    (identity.platform === "MacIntel" && identity.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isEmbedded = /FBAN|FBAV|Instagram|KAKAOTALK|NAVER|MicroMessenger|Line\/|; wv\)/i.test(ua) ||
    (isIOS && /AppleWebKit/i.test(ua) && !/Safari|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua));
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|SamsungBrowser/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua) && !isEmbedded;
  const platform: InstallPlatform = isIOS ? "ios" : isAndroid ? "android" :
    /Macintosh|MacIntel/i.test(`${ua} ${identity.platform}`) && isSafari ? "macos" : "desktop";
  return { platform, isEmbedded, isSafari, isChrome };
}

// Share the shop's home page, never a checkout/auth URL, preview query or token.
export function getInstallPageUrl(currentHref: string): string | undefined {
  try {
    const url = new URL(currentHref);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    return new URL("/", url.origin).href;
  } catch {
    return undefined;
  }
}

export function getChromeInstallIntent(currentHref: string): string | undefined {
  const home = getInstallPageUrl(currentHref);
  if (!home) return undefined;
  const url = new URL(home);
  return `intent://${url.host}/#Intent;scheme=${url.protocol.slice(0, -1)};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(home)};end`;
}
