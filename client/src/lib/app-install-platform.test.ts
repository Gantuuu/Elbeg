import assert from "node:assert/strict";
import { test } from "node:test";
import { getChromeInstallIntent, getInstallContext, getInstallPageUrl } from "./app-install-platform";

const identify = (userAgent: string, platform = "Linux armv8l", maxTouchPoints = 5) => getInstallContext({ userAgent, platform, maxTouchPoints });

test("Android Chrome can install directly while Facebook and WebView need external-browser help", () => {
  const chrome = identify("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36");
  assert.equal(chrome.platform, "android");
  assert.equal(chrome.isChrome, true);
  assert.equal(chrome.isEmbedded, false);
  assert.equal(identify("Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36 [FBAN/FB4A;FBAV/123]").isEmbedded, true);
  assert.equal(identify("Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36").isChrome, false);
});

test("Samsung Internet and Edge are not mistaken for Chrome", () => {
  assert.equal(identify("Android 14 Chrome/130.0 Mobile Safari/537.36 SamsungBrowser/26.0").isChrome, false);
  assert.equal(identify("Android 14 Chrome/130.0 Mobile Safari/537.36 EdgA/130.0").isChrome, false);
});

test("iPhone and desktop-identifying iPads receive iOS instructions", () => {
  const iphone = identify("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1", "iPhone");
  assert.equal(iphone.platform, "ios");
  assert.equal(iphone.isSafari, true);
  assert.equal(identify("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15", "MacIntel", 5).platform, "ios");
});

test("iOS embedded browsers and Chrome do not receive desktop guidance", () => {
  assert.equal(identify("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350").isEmbedded, true);
  const chrome = identify("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1");
  assert.equal(chrome.platform, "ios");
  assert.equal(chrome.isSafari, false);
  assert.equal(chrome.isEmbedded, false);
});

test("Mac Safari receives Add to Dock instructions; other desktop browsers use browser menus", () => {
  assert.equal(identify("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", "MacIntel", 0).platform, "macos");
  assert.equal(identify("Mozilla/5.0 (Windows NT 10.0) Firefox/130.0", "Win32", 0).platform, "desktop");
});

test("install links strip checkout paths, preview flags, credentials and fragments", () => {
  assert.equal(getInstallPageUrl("https://user:password@arvijix.kr/checkout?token=private#order"), "https://arvijix.kr/");
  assert.equal(getInstallPageUrl("http://localhost:5174/?preview=design#products"), "http://localhost:5174/");
  assert.equal(getInstallPageUrl("javascript:alert(1)"), undefined);
  assert.equal(getInstallPageUrl("not a URL"), undefined);
});

test("Android intent opens Chrome on the same store origin with a safe web fallback", () => {
  const intent = getChromeInstallIntent("https://arvijix.kr/auth?token=private");
  assert.equal(intent, "intent://arvijix.kr/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Farvijix.kr%2F;end");
  assert.equal(getChromeInstallIntent("data:text/html,example"), undefined);
});
