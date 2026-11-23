import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  methodOrUrl: string,
  urlOrData?: string | unknown,
  data?: unknown | undefined,
): Promise<any> {
  // Handle overloaded function signature to support both usage patterns:
  // 1. apiRequest('GET', '/api/endpoint')
  // 2. apiRequest('/api/endpoint', 'GET')
  // 3. apiRequest('/api/endpoint', { data })
  let method: string;
  let url: string;
  let requestData: unknown | undefined;

  // Use environment variable for API base URL or default to empty (relative)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  if (urlOrData === undefined) {
    // Pattern: apiRequest('/api/endpoint')
    method = "GET";
    url = apiBaseUrl + methodOrUrl;
    requestData = undefined;
  } else if (typeof urlOrData === "string") {
    // Pattern: apiRequest('GET', '/api/endpoint', data)
    method = methodOrUrl;
    url = apiBaseUrl + urlOrData;
    requestData = data;
  } else {
    // Pattern: apiRequest('/api/endpoint', data)
    method = "POST";
    url = apiBaseUrl + methodOrUrl;
    requestData = urlOrData;
  }

  const headers: Record<string, string> = requestData
    ? { "Content-Type": "application/json" }
    : {};

  // Enhanced mobile cookie handling for API requests
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  if (isMobile) {
    // The admin list must retain its private response to revalidate its ETag on each poll.
    const path = url.split("?")[0];
    const revalidateOrders = method === "GET" && (
      path === apiBaseUrl + "/api/orders" || path === apiBaseUrl + "/api/admin/order-summaries"
    );
    if (!revalidateOrders) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      headers["Pragma"] = "no-cache";
      headers["Expires"] = "0";
    }
    headers["X-Requested-With"] = "XMLHttpRequest";
  }

  // Add explicit cookie header if available for mobile compatibility
  if (typeof document !== "undefined" && document.cookie) {
    headers["Cookie"] = document.cookie;
  }

  const options: RequestInit = {
    method,
    headers,
    body: requestData ? JSON.stringify(requestData) : undefined,
    credentials: "include", // Important for cookies/session
    cache: "no-cache", // Prevent caching issues
    // "cors" allows cross-origin calls from the native app (origin https://localhost)
    // to the Cloudflare API domain. Same-origin web requests still work under "cors".
    mode: "cors",
  };

  const res = await fetch(url, options);
  await throwIfResNotOk(res);

  if (res.status === 204) return undefined;

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json();

  await res.text();
  return { success: true, status: res.status };
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    // Only prepend if it's a relative path starting with /
    const key = queryKey[0] as string;
    const url = key.startsWith("/") ? apiBaseUrl + key : key;

    // Enhanced mobile cookie handling
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isMobile) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      headers["Pragma"] = "no-cache";
      headers["Expires"] = "0";
      headers["X-Requested-With"] = "XMLHttpRequest";
    }

    // Add explicit cookie header if available for mobile compatibility
    if (typeof document !== "undefined" && document.cookie) {
      headers["Cookie"] = document.cookie;
    }

    const options: RequestInit = {
      headers,
      credentials: "include", // Important for cookies/session
      cache: "no-cache", // Prevent caching issues
      // "cors" allows cross-origin calls from the native app to the Cloudflare API domain.
      mode: "cors",
    };

    const res = await fetch(url, options);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetch when window regains focus
      staleTime: 30000, // Set stale time to 30 seconds instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
