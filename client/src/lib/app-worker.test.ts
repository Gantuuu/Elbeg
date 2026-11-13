import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

function worker({ offline = false } = {}) {
  const events = new Map<string, (event: any) => void>();
  const added: string[] = [];
  const removed: string[] = [];
  const cache = {
    async addAll(urls: string[]) { added.push(...urls); },
    async match(url: string) { return new Response(url === "/offline.html" ? "offline page" : "app icon"); },
  };
  runInNewContext(source, {
    URL, Response,
    self: { location: { origin: "https://arvijix.kr" }, clients: { claim: async () => {} }, addEventListener: (type: string, handler: (event: any) => void) => events.set(type, handler) },
    caches: {
      open: async () => cache,
      keys: async () => ["arvijikh-offline-v0", "arvijikh-offline-v1", "unrelated-app-cache"],
      delete: async (name: string) => { removed.push(name); },
    },
    fetch: async () => { if (offline) throw new Error("offline"); return new Response("live page"); },
  });
  return {
    added, removed,
    async lifecycle(type: string) {
      let lifetime: Promise<unknown> | undefined;
      events.get(type)?.({ waitUntil: (promise: Promise<unknown>) => { lifetime = promise; } });
      await lifetime;
    },
    request(path: string, mode = "navigate", method = "GET") {
      let response: Promise<Response> | undefined;
      events.get("fetch")?.({ request: { url: new URL(path, "https://arvijix.kr").href, mode, method }, respondWith: (promise: Promise<Response>) => { response = promise; } });
      return response;
    },
  };
}

test("only the public offline page and brand icon are precached", async () => {
  const instance = worker();
  await instance.lifecycle("install");
  assert.deepEqual(instance.added, ["/offline.html", "/icons/app-192.png"]);
});

test("cache cleanup is limited to older versions owned by this worker", async () => {
  const instance = worker();
  await instance.lifecycle("activate");
  assert.deepEqual(instance.removed, ["arvijikh-offline-v0"]);
});

test("normal store pages always come from the live network", async () => {
  assert.equal(await (await worker().request("/products/1"))?.text(), "live page");
});

test("offline navigation receives a usable branded page and cached icon", async () => {
  const instance = worker({ offline: true });
  assert.equal(await (await instance.request("/cart"))?.text(), "offline page");
  assert.equal(await (await instance.request("/icons/app-192.png", "cors"))?.text(), "app icon");
});

test("API, uploads, cross-origin content and mutations are never intercepted", () => {
  const instance = worker();
  assert.equal(instance.request("/api/user"), undefined);
  assert.equal(instance.request("/api/orders", "cors", "POST"), undefined);
  assert.equal(instance.request("/uploads/product.jpg", "cors"), undefined);
  assert.equal(instance.request("https://other.example/"), undefined);
  assert.equal(instance.request("/checkout", "navigate", "POST"), undefined);
});
