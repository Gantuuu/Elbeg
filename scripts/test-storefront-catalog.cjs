const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { transformSync } = require("esbuild");

const source = readFileSync(path.join(__dirname, "../client/src/lib/storefront-catalog.ts"), "utf8");
const product = {
  id: 1, name: "Fixture", category: "Beef", description: "Catalog fixture",
  price: 14000, stock: 5, imageUrl: "/fixture.jpg", minOrderQuantity: 1,
  nameEn: null, nameRu: null, descriptionEn: null, descriptionRu: null,
  thumbnailUrl: null, storeId: 1, createdAt: null,
};

function makeStorage() {
  const entries = new Map();
  return {
    getItem(key) { return entries.get(key) ?? null; },
    setItem(key, value) { entries.set(key, value); },
    removeItem(key) { entries.delete(key); },
  };
}

function reload(storage, apiBase = "", fetch) {
  const { code } = transformSync(source, {
    loader: "ts", format: "cjs",
    define: { "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBase) },
  });
  const catalog = { exports: {} };
  vm.runInNewContext(code, {
    module: catalog, require, window: { localStorage: storage, location: { origin: "https://shop.example.invalid" } },
    localStorage: storage, Date, URL, fetch,
  });
  return catalog.exports;
}

test("a successful catalog survives a page reload; the next successful response replaces it", () => {
  const storage = makeStorage();
  const firstPage = reload(storage);
  assert.equal(firstPage.readCatalogSnapshot(), undefined);
  firstPage.saveCatalogSnapshot(firstPage.parseCatalogProducts([product]));
  const nextPage = reload(storage);
  assert.equal(nextPage.readCatalogSnapshot().products[0].price, 14000);
  assert.throws(() => nextPage.parseCatalogProducts({ message: "D1 failure" }));
  assert.equal(nextPage.readCatalogSnapshot().products.length, 1);
  nextPage.saveCatalogSnapshot(nextPage.parseCatalogProducts([{ ...product, price: 20000 }]));
  assert.equal(reload(storage).readCatalogSnapshot().products[0].price, 20000);
  nextPage.saveCatalogSnapshot(nextPage.parseCatalogProducts([]));
  assert.equal(reload(storage).readCatalogSnapshot()?.products.length ?? 0, 0);
});

test("a page starts with a live fetch, uses its last success on failure and recovers even to a truly empty catalog", async () => {
  const storage = makeStorage();
  const signal = new AbortController().signal;
  let response = Response.json([product]);
  const fetch = async (url, options) => {
    assert.equal(url.pathname, "/api/products");
    assert.equal(options.credentials, "omit");
    return response;
  };
  const first = await reload(storage, "", fetch).fetchStorefrontCatalog(signal);
  assert.equal(first.readOnly, false);
  response = new Response(null, { status: 500 });
  const afterReload = reload(storage, "", fetch);
  const saved = await afterReload.fetchStorefrontCatalog(signal);
  assert.equal(saved.readOnly, true);
  assert.equal(saved.products[0].name, product.name);
  response = Response.json([]);
  const recovered = await afterReload.fetchStorefrontCatalog(signal);
  assert.equal(recovered.readOnly, false);
  assert.equal(recovered.products.length, 0);
});

test("first-time visitors use a validated public snapshot only when the live catalog fails", async () => {
  let fallback = Response.json({ version: 1, savedAt: Date.now(), products: [product] });
  const paths = [];
  const fetch = async (url, options) => {
    paths.push(url.pathname);
    assert.equal(options.credentials, "omit");
    return url.pathname === "/api/products" ? new Response(null, { status: 500 }) : fallback;
  };
  const load = () => reload(makeStorage(), "", fetch).fetchStorefrontCatalog(new AbortController().signal);
  const saved = await load();
  assert.deepEqual(paths, ["/api/products", "/uploads/public-catalog/last-success-v1.json"]);
  assert.equal(saved.readOnly, true);
  assert.equal(saved.products[0].id, product.id);
  fallback = new Response(null, { status: 404 });
  await assert.rejects(load(), "a complete outage must reach the explicit error UI");
});

test("only public catalog fields are accepted in the stored copy", () => {
  const storage = makeStorage();
  const api = reload(storage);
  api.saveCatalogSnapshot([{ ...product, privateCanary: "fixture-private-marker" }]);
  assert.equal(reload(storage).readCatalogSnapshot().products[0].privateCanary, undefined);
  assert.doesNotMatch(storage.getItem("elbeg:public-catalog:v1:same-origin"), /fixture-private-marker/);
  assert.throws(() => api.parseCatalogProducts([{ ...product, price: "invalid price" }]));
});

test("the public snapshot requires its schema version and a usable timestamp", () => {
  const api = reload(makeStorage());
  const now = Date.now();
  const snapshot = { version: 1, savedAt: now, products: [product] };
  assert.equal(api.parseCatalogSnapshot(snapshot).products[0].id, product.id);
  assert.throws(() => api.parseCatalogSnapshot({ ...snapshot, version: 2 }));
  assert.throws(() => api.parseCatalogSnapshot({ ...snapshot, savedAt: now + 60000 }));
  assert.throws(() => api.parseCatalogSnapshot({ ...snapshot, savedAt: now - api.CATALOG_SNAPSHOT_TTL_MS }));
  assert.throws(() => api.parseCatalogSnapshot({ ...snapshot, products: { error: "Quota" } }));
});

test("expired, corrupt, differently scoped and inaccessible storage do not supply a catalog", (t) => {
  const storage = makeStorage();
  const api = reload(storage);
  const now = Date.parse("2026-01-01T00:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now });
  const page = reload(storage);
  page.saveCatalogSnapshot([product]);
  assert.equal(reload(storage, "https://other.example.invalid").readCatalogSnapshot(), undefined);
  t.mock.timers.setTime(now + api.CATALOG_SNAPSHOT_TTL_MS + 1);
  assert.equal(reload(storage).readCatalogSnapshot(), undefined);

  assert.equal(reload({ getItem: () => "invalid json", removeItem() {} }).readCatalogSnapshot(), undefined);
  const denied = reload({
    getItem() { throw new Error("Storage disabled"); },
    setItem() { throw new Error("Storage disabled"); },
    removeItem() { throw new Error("Storage disabled"); },
  });
  assert.equal(denied.readCatalogSnapshot(), undefined);
  assert.doesNotThrow(() => denied.saveCatalogSnapshot([product]));
});
