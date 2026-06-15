// 네이티브 앱(Capacitor) 전용 전역 fetch 래퍼.
//
// 앱의 origin은 https://localhost 이므로, 코드 곳곳의 raw fetch("/api/...") /
// "/uploads/..." 같은 상대경로 호출은 그대로면 localhost로 가서 실패한다.
// (apiRequest()는 이미 VITE_API_BASE_URL을 붙이지만, use-auth/footer 등 일부는
//  raw fetch를 직접 쓴다.) 이 래퍼가 그런 상대경로 요청을 운영 도메인으로 돌리고
// 쿠키(credentials)와 CORS를 자동으로 붙인다.
//
// VITE_API_BASE_URL이 설정된 빌드(= --mode capacitor 앱 빌드)에서만 동작한다.
// 웹(Cloudflare Pages) 빌드에서는 BASE가 빈 문자열이라 이 코드는 아무것도 하지 않는다.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function shouldRewrite(path: string): boolean {
  return path.startsWith("/api") || path.startsWith("/uploads");
}

if (API_BASE && typeof window !== "undefined" && typeof window.fetch === "function") {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      // 1) 문자열 상대경로: fetch("/api/...")
      if (typeof input === "string" && input.startsWith("/") && shouldRewrite(input)) {
        return nativeFetch(API_BASE + input, {
          credentials: "include",
          ...init,
          mode: "cors",
        });
      }

      // 2) Request 객체로 들어온 같은-오리진 상대경로
      if (input instanceof Request) {
        const origin = window.location.origin;
        if (input.url.startsWith(origin + "/")) {
          const path = input.url.slice(origin.length); // "/api/..."
          if (shouldRewrite(path)) {
            const rebuilt = new Request(API_BASE + path, input);
            return nativeFetch(rebuilt, {
              credentials: "include",
              ...init,
              mode: "cors",
            });
          }
        }
      }
    } catch {
      // 문제가 생기면 원래 fetch로 폴백
    }
    return nativeFetch(input as any, init);
  }) as typeof window.fetch;
}

export {};
