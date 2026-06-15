// 네이티브 앱(Capacitor) 전용 전역 fetch 래퍼.
//
// 앱의 origin은 https://localhost 이므로:
//  1) 코드 곳곳의 raw fetch("/api/...") / "/uploads/..." 상대경로를 운영 도메인으로 돌리고,
//  2) 모든 API 요청에 Authorization: Bearer <token> 을 붙여 로그인 세션을 유지한다.
//     (cross-site 쿠키가 WebView에서 막히므로 토큰 방식 사용)
//
// VITE_API_BASE_URL이 설정된 빌드(= --mode capacitor 앱 빌드)에서만 동작한다.
// 웹(Cloudflare Pages) 빌드에서는 BASE가 빈 문자열이라 아무것도 하지 않는다(쿠키 방식 유지).

import { getAuthToken } from "./auth-token";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function isApiPath(path: string): boolean {
  return path.startsWith("/api") || path.startsWith("/uploads");
}

// API 요청에 인증/CORS 옵션을 병합
function withApiOptions(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers || {});
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return {
    ...init,
    headers,
    credentials: "include",
    mode: "cors",
  };
}

if (API_BASE && typeof window !== "undefined" && typeof window.fetch === "function") {
  const nativeFetch = window.fetch.bind(window);
  const origin = window.location.origin;

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string") {
        // (a) 상대경로: "/api/...", "/uploads/..."  → 운영 도메인으로 재작성 + 옵션
        if (input.startsWith("/") && isApiPath(input)) {
          return nativeFetch(API_BASE + input, withApiOptions(init));
        }
        // (b) 이미 운영 도메인 절대경로 (apiRequest 등) → 옵션만 추가
        if (input.startsWith(API_BASE + "/")) {
          return nativeFetch(input, withApiOptions(init));
        }
        // (c) 같은-오리진 절대경로 (https://localhost/api/...) → 재작성 + 옵션
        if (input.startsWith(origin + "/")) {
          const path = input.slice(origin.length);
          if (isApiPath(path)) {
            return nativeFetch(API_BASE + path, withApiOptions(init));
          }
        }
      } else if (input instanceof Request) {
        const url = input.url;
        let target: string | null = null;
        if (url.startsWith(API_BASE + "/")) {
          target = url;
        } else if (url.startsWith(origin + "/") && isApiPath(url.slice(origin.length))) {
          target = API_BASE + url.slice(origin.length);
        }
        if (target) {
          const headers = new Headers(input.headers);
          const token = getAuthToken();
          if (token) headers.set("Authorization", `Bearer ${token}`);
          const rebuilt = new Request(target, input);
          // Request 객체는 헤더가 불변일 수 있어, init으로 헤더/옵션을 덮어쓴다
          return nativeFetch(rebuilt, {
            headers,
            credentials: "include",
            mode: "cors",
          });
        }
      }
    } catch {
      // 문제가 생기면 원래 fetch로 폴백
    }
    return nativeFetch(input as any, init);
  }) as typeof window.fetch;
}

export {};
