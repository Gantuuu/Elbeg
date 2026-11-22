const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { test } = require("node:test");
const { build } = require("esbuild");
const { unstable_splitSqlQuery: splitSQL } = require("wrangler");
const { Miniflare } = createRequire(require.resolve("wrangler"))("miniflare");

test("public listing publishes only successful unfiltered reads; R2 failure leaves the API usable", async () => {
  const bundle = await build({
    entryPoints: ["worker/index.ts"], bundle: true, format: "esm", platform: "browser",
    external: ["node:*"], write: false,
  });
  const runtime = new Miniflare({
    modules: [
      { type: "ESModule", path: "test-entry.js", contents: `
        import worker from "./worker.js";
        export default { async fetch(request, env) {
          const pending = [];
          if (request.headers.has("x-fixture-r2-error")) {
            env = { ...env, BUCKET: { head() { throw new Error("fixture outage"); } } };
          }
          const response = await worker.fetch(request, env, {waitUntil(task) { pending.push(task); }});
          await Promise.all(pending);
          return response;
        }};` },
      { type: "ESModule", path: "worker.js", contents: bundle.outputFiles[0].text },
    ],
    d1Databases: ["DB"], r2Buckets: ["BUCKET"],
    compatibilityDate: "2024-09-23", compatibilityFlags: ["nodejs_compat"],
  });
  try {
    const db = await runtime.getD1Database("DB");
    const bucket = await runtime.getR2Bucket("BUCKET");
    const { publicCatalogKey } = await import("../worker/public-catalog.ts");
    const fetchPath = (path, init) => runtime.dispatchFetch("https://store.example" + path, init);
    const publish = () => fetchPath("/api/products");
    const snapshot = async () => (await bucket.get(publicCatalogKey)).json();

    const productSchema = splitSQL(readFileSync("drizzle/0000_uneven_the_watchers.sql", "utf8"))
      .find(sql => /CREATE TABLE `products`/.test(sql));
    await db.prepare(productSchema).run();
    await db.prepare("ALTER TABLE products ADD COLUMN thumbnail_url TEXT").run();
    await db.prepare("INSERT INTO products(name,description,category,price,image_url) VALUES ('fixture','','beef',7,'')").run();
    assert.equal((await fetchPath("/api/products?category=beef")).status, 200);
    assert.equal(await bucket.head(publicCatalogKey), null);
    assert.equal((await fetchPath("/api/products", { headers: { "x-fixture-r2-error": "1" } })).status, 200);
    assert.equal(await bucket.head(publicCatalogKey), null);
    const original = await (await publish()).json();
    const first = await snapshot();
    assert.equal(await bucket.put(publicCatalogKey, "competing fixture", {
      onlyIf: { etagDoesNotMatch: "*" },
    }), null, "create-only condition must protect an existing R2 object");
    assert.equal(first.version, 1);
    assert.ok(first.savedAt > 0);
    assert.deepEqual(first.products, original);
    const direct = await fetchPath("/uploads/" + publicCatalogKey);
    assert.equal(direct.headers.get("cache-control"), "no-store");
    assert.deepEqual(await direct.json(), first);
    await publish();
    assert.equal((await snapshot()).savedAt, first.savedAt);
    // Destroy only the in-memory test fixture. An empty result replaces old stock immediately.
    await db.prepare("DELETE FROM products").run();
    await publish();
    assert.deepEqual((await snapshot()).products, []);
    await db.prepare("INSERT INTO products(name,description,category,price,image_url) VALUES ('restocked','','beef',8,'')").run();
    await publish();
    const restored = await snapshot();
    assert.equal(restored.products[0].name, "restocked");
    await db.prepare("DROP TABLE products").run();
    assert.equal((await publish()).status, 500);
    assert.deepEqual(await snapshot(), restored);
  } finally {
    await runtime.dispose();
  }
});

test("a writer losing a creation race preserves a newer snapshot; unknown fields stay private", async () => {
  const { savePublicCatalog } = await import("../worker/public-catalog.ts");
  let current = null;
  let captured;
  const bucket = {
    head: async () => current,
    put: async (_key, body, options) => {
      assert.ok(!current, "an older writer cannot overwrite the winning object");
      assert.equal(options.onlyIf.etagDoesNotMatch, "*");
      captured = JSON.parse(body);
      current = { etag: "newer", customMetadata: { savedAt: "2000", empty: "true" } };
      return null;
    },
  };
  await savePublicCatalog(bucket, [{ id: 1, name: "fixture", privateField: "private-fixture" }], 1000);
  assert.deepEqual(captured.products, [{ id: 1, name: "fixture" }]);
});
