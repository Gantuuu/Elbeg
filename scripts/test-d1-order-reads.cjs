// Run with npm run test:d1-reads. All data and provider responses are synthetic.
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { build } = require("esbuild");
const { unstable_splitSqlQuery: splitSQL } = require("wrangler");
const { Miniflare } = createRequire(require.resolve("wrangler"))("miniflare");

// Count statements issued by the built Worker on real route requests. Only the
// test bundle exposes this header. The underlying D1 binding runs the SQL.
const testEntrypoint = `
  import worker from "./worker.js";
  export default {
    async fetch(request, env, ctx) {
      const queries = [];
      const batchReads = [];
      const db = new Proxy(env.DB, {
        get(target, prop) {
          if (prop === "batch") return async statements => {
            const results = await target.batch(statements);
            batchReads.push(results.map(result => result.meta.rows_read));
            return results;
          };
          if (prop === "prepare") return sql => {
            queries.push(sql);
            return target.prepare(sql);
          };
          const value = target[prop];
          return typeof value === "function" ? value.bind(target) : value;
        }
      });
      const response = await worker.fetch(request, { ...env, DB: db }, ctx);
      const result = new Response(response.body, response);
      result.headers.set("X-Test-Queries", JSON.stringify(queries));
      result.headers.set("X-Test-Batch-Reads", JSON.stringify(batchReads));
      return result;
    }
  };`;

async function main() {
  const bundle = await build({
    entryPoints: ["worker/index.ts"], bundle: true, format: "esm",
    platform: "browser", external: ["node:*"], write: false,
  });
  let googleEmail = "tester@example.invalid";
  const runtime = new Miniflare({
    modules: [
      { type: "ESModule", path: "test-entry.js", contents: testEntrypoint },
      { type: "ESModule", path: "worker.js", contents: bundle.outputFiles[0].text },
    ],
    d1Databases: ["DB"], compatibilityDate: "2024-09-23",
    compatibilityFlags: ["nodejs_compat"],
    bindings: {
      SESSION_SECRET: "only-for-this-in-memory-test",
      ADMIN_USERNAME: "rotation-fixture", ADMIN_PASSWORD: "fixture-new-password",
      GOOGLE_CLIENT_ID: "fixture-client", GOOGLE_CLIENT_SECRET: "fixture-secret",
    },
    outboundService: async request => {
      if (request.url === "https://oauth2.googleapis.com/token" && request.method === "POST") {
        return Response.json({ access_token: "fixture-token" });
      }
      if (request.url === "https://www.googleapis.com/oauth2/v2/userinfo" &&
          request.headers.get("authorization") === "Bearer fixture-token") {
        return Response.json({ id: googleEmail, email: googleEmail, name: "Test user" });
      }
      throw new Error("Unexpected outbound request in isolated OAuth test");
    },
  });
  try {
    const db = await runtime.getD1Database("DB");
    const run = query => db.prepare(query).run();
    const call = (route, init) => runtime.dispatchFetch("http://localhost/api" + route, {
      ...init, redirect: "manual",
    });
    const post = (route, data) => call(route, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    });

    const schema = readFileSync("drizzle/0000_uneven_the_watchers.sql", "utf8");
    for (const query of splitSQL(schema)) await run(query);
    // Column present in the deployed product schema after the original baseline.
    await run("ALTER TABLE products ADD COLUMN thumbnail_url TEXT");
    await run(`INSERT INTO products(name, name_en, description, category, price, image_url, thumbnail_url, stock, min_order_quantity, store_id, created_at)
      VALUES ('test', 'test EN', 'sample', 'x', 0, '/image', '/thumb', 12, 2, 3, 1700000000)`);
    await run(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<670)
      INSERT INTO orders(user_id,customer_name,customer_email,customer_phone,customer_address,total_amount,status,created_at)
      SELECT x,'test','test','0','test',1,CASE WHEN x%20=0 THEN 'pending' ELSE 'done' END, 1700000000+x FROM n`);
    await run(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<2580)
      INSERT INTO order_items(order_id,product_id,quantity,price) SELECT 1+(x%670),1,1,1 FROM n`);

    const credentials = { username: "tester", email: googleEmail, password: "local-test-password" };
    const registration = await post("/register", credentials);
    assert.equal(registration.status, 201);
    const login = await post("/login", credentials);
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const passwordUserId = (await login.json()).id;
    const get = (route, etag) => call(route, {
      headers: etag ? { cookie, "if-none-match": etag } : { cookie },
    });
    assert.equal((await get("/orders")).status, 403);
    assert.equal((await get("/orders?view=recent")).status, 403);
    assert.equal((await call("/orders")).status, 401);
    await run("UPDATE users SET is_admin=1 WHERE username='tester'");

    const original = await get("/orders");
    assert.equal(original.status, 200, "orders must still work before applying migrations");
    assert.equal(original.headers.get("etag"), null);
    const originalOrders = await original.json();
    assert.equal(originalOrders.length, 670);
    assert.deepEqual(originalOrders[0].items[0].product, {
      id: 1, name: "test", nameRu: null, nameEn: null, description: "sample",
      descriptionRu: null, descriptionEn: null, category: "x", price: 1,
      imageUrl: "/image", thumbnailUrl: "/thumb", stock: 12, minOrderQuantity: 1,
      storeId: 3, createdAt: new Date(1700000000 * 1000).toISOString(),
    }, "preserve the order API's product fields and historical price/language fallbacks");
    assert.deepEqual(await (await get("/orders/pending-count")).json(), { count: 33 });
    // A lower bound before all seeded timestamps exercises the existing joined
    // route for the same data and the same public response shape as a full read.
    const reference = await get("/orders?startDate=1970-01-01");
    assert.equal(reference.status, 200);
    assert.deepEqual(originalOrders, await reference.json());
    const filteredJoin = JSON.parse(reference.headers.get("x-test-queries")).find(q => /left join/i.test(q));
    const fixtureLowerBound = / where "orders"\."created_at" >= \?(?= order by)/i;
    assert.match(filteredJoin, fixtureLowerBound);
    // Restore the exact unfiltered legacy SELECT so its execution plan and
    // D1 row cost can be measured against the new batch on this same database.
    const join = filteredJoin.replace(fixtureLowerBound, "");
    const lookups = {
      fullList: join,
      items: "SELECT * FROM order_items WHERE order_id=1",
      history: "SELECT * FROM orders WHERE user_id=1 ORDER BY created_at DESC",
      pending: "SELECT * FROM orders WHERE status='pending'",
    };
    async function measure(queries) {
      const values = {};
      for (const [name, sql] of Object.entries(queries)) {
        values[name] = (await run(sql)).meta.rows_read;
        const plan = (await run("EXPLAIN QUERY PLAN " + sql)).results;
        console.log(name, values[name], plan.map(row => row.detail).join(" / "));
      }
      return values;
    }
    async function compareFullList(response, legacyReads) {
      const batches = JSON.parse(response.headers.get("x-test-batch-reads"));
      assert.equal(batches.length, 1, "an uncached full list reads one consistent D1 batch");
      assert.equal(batches[0].length, 3, "one scan each for orders, items and products");
      const reads = batches[0].reduce((sum, n) => sum + n, 0);
      const queries = JSON.parse(response.headers.get("x-test-queries"));
      assert.ok(!queries.some(q => /left join/i.test(q)), "an unfiltered list cannot re-run the historical join");
      for (const table of ["orders", "order_items", "products"]) {
        const sql = queries.find(q => q.includes(`from "${table}"`));
        assert.ok(sql, `missing batch read from ${table}`);
        const plan = await run("EXPLAIN QUERY PLAN " + sql);
        console.log(table, plan.results.map(row => row.detail).join(" / "));
      }
      console.log(`Full order data: legacy JOIN = ${legacyReads} rows (1 statement), batch = ${reads} rows (3 statements)`);
      // D1 also charges a scan of the sorter or created_at index for the 670 orders.
      assert.ok(reads <= 4000 && reads < legacyReads * 0.65,
        "the full batch should avoid repeated order and product lookups for each item");
    }
    console.log("Pre-migration D1 rows read per SQL statement");
    const before = await measure(lookups);
    await compareFullList(original, before.fullList);
    const legacyPage = await get('/admin/order-summaries');
    assert.equal(legacyPage.status, 200, 'a deployment can serve orders before migrations run');
    assert.equal((await legacyPage.json()).total, 670);
    const migrations = ["0001_order_read_indexes.sql", "0002_pending_order_count.sql"];
    for (let pass = 0; pass < 2; pass++) {
      for (const file of migrations) {
        const queries = splitSQL(readFileSync("migrations/" + file, "utf8"));
        await db.batch(queries.map(query => db.prepare(query)));
      }
    }
    console.log("Post-migration D1 rows read per SQL statement");
    const after = await measure({
      ...lookups,
      revision: "SELECT version FROM order_list_revision WHERE id=1",
      pending: "SELECT pending_count FROM pending_order_count WHERE id=1",
    });
    assert.ok(after.fullList < before.fullList && after.fullList <= 7000);
    assert.ok(after.items <= 5 && after.history <= 2);
    assert.equal(after.revision, 1);
    assert.equal(after.pending, 1);

    await require('./check-admin-order-summaries.cjs')({ db, get, call, run });

    const full = await get("/orders");
    assert.equal(full.status, 200);
    await compareFullList(full, after.fullList);
    assert.deepEqual(await full.json(), originalOrders);
    let tag = full.headers.get("etag");
    assert.ok(tag);
    const dashboard = await get("/orders?view=recent", tag);
    assert.equal(dashboard.status, 200, "full-list validator cannot validate a dashboard response");
    assert.deepEqual(await dashboard.json(), originalOrders.slice(0, 5));
    assert.equal((await get("/orders?view=recent", dashboard.headers.get("etag"))).status, 304);
    const dashboardSql = JSON.parse(dashboard.headers.get("x-test-queries")).find(q => /left join/i.test(q));
    const dashboardReads = (await db.prepare(dashboardSql).bind(5).run()).meta.rows_read;
    console.log("Five most recent orders with all their items:", dashboardReads, "D1 rows read");
    assert.ok(dashboardReads <= 100, "dashboard cost should depend on the five displayed orders");
    assert.match(full.headers.get("cache-control"), /private/);
    // Replay 60 polling decisions immediately (15 min worth at the UI's 15s interval).
    for (let i = 0; i < 60; i++) {
      const fresh = await get("/orders", tag);
      assert.equal(fresh.status, 304);
      assert.equal(await fresh.text(), "");
      assert.deepEqual(JSON.parse(fresh.headers.get("x-test-batch-reads")), [], "304 must skip the full-list batch");
      const queries = JSON.parse(fresh.headers.get("x-test-queries"));
      assert.equal(queries.length, 2, "one user PK lookup and one generation lookup");
      assert.ok(queries.some(q => /from "users"/i.test(q)));
      assert.ok(queries.some(q => /from order_list_revision/i.test(q)));
    }
    const filtered = await get("/orders?startDate=2100-01-01", tag);
    assert.equal(filtered.status, 200);
    assert.deepEqual(await filtered.json(), []);
    assert.notEqual(filtered.headers.get("etag"), tag);
    await run("UPDATE users SET is_admin=0 WHERE username='tester'");
    assert.equal((await get("/orders", tag)).status, 403, "re-check authorization even for a matching ETag");
    await run("UPDATE users SET is_admin=1 WHERE username='tester'");

    async function mutate(sql, expectedCount) {
      await run(sql);
      const response = await get("/orders", tag);
      assert.equal(response.status, 200, sql);
      const next = response.headers.get("etag");
      assert.ok(next && next !== tag, sql);
      tag = next;
      await response.arrayBuffer();
      for (const route of ["/orders/pending-count", "/admin/pending-orders-count"]) {
        const badge = await get(route);
        assert.equal(badge.status, 200);
        assert.deepEqual(await badge.json(), { count: expectedCount });
        const queries = JSON.parse(badge.headers.get("x-test-queries"));
        assert.ok(queries.some(q => /from\s+["`]?pending_order_count/i.test(q)), "use maintained count");
        assert.equal(queries.length, 2, "badge reads user and singleton only");
      }
    }
    await mutate(`INSERT INTO orders(id,customer_name,customer_email,customer_phone,customer_address,total_amount)
      VALUES (9999,'guest','guest@example.invalid','0','test',1)`, 34);
    const emptyOrder = (await (await get("/orders")).json()).find(order => order.id === 9999);
    assert.deepEqual(emptyOrder.items, [], "a full list includes orders with no items");
    await mutate("UPDATE orders SET status='done' WHERE id=9999", 33);
    await mutate("UPDATE orders SET status='pending' WHERE id=9999", 34);
    await mutate("UPDATE orders SET status='pending' WHERE id=9999", 34);
    await mutate("DELETE FROM orders WHERE id=9999", 33);
    await mutate("INSERT INTO products(id,name,description,category,price,image_url) VALUES (2,'new','','x',1,'')", 33);
    await mutate("INSERT INTO order_items(id,order_id,product_id,quantity,price) VALUES (9999,1,2,1,1)", 33);
    await mutate("UPDATE products SET name='new name' WHERE id=2", 33);
    await mutate("UPDATE order_items SET quantity=3 WHERE id=9999", 33);
    await mutate("DELETE FROM products WHERE id=2", 33);
    async function getOrphanItem(route) {
      const response = await get(route);
      assert.equal(response.status, 200);
      const orders = await response.json();
      const item = orders.find(order => order.id === 1).items.find(item => item.id === 9999);
      // The existing API gives deleted products the current time at read time.
      assert.ok(Math.abs(Date.now() - Date.parse(item.product.createdAt)) < 60_000);
      const { createdAt, ...product } = item.product;
      return { ...item, product };
    }
    assert.deepEqual(await getOrphanItem("/orders"), await getOrphanItem("/orders?startDate=1970-01-01"));
    await mutate("DELETE FROM order_items WHERE id=9999", 33);
    await mutate("UPDATE orders SET status='pending'", 670);
    assert.equal((await run("SELECT pending_count FROM pending_order_count WHERE id=1")).meta.rows_read, 1);
    assert.deepEqual((await (await call("/products")).json()).map(p => p.name), ["test"]);

    const purchase = await post("/orders", {
      customerName: "Guest", customerEmail: "guest@example.invalid", customerPhone: "0",
      customerAddress: "test", totalAmount: 1, items: [{ productId: 1, quantity: 1, price: 1 }],
    });
    assert.equal(purchase.status, 201);
    const guestOrder = await purchase.json();
    assert.equal(guestOrder.userId, null);
    assert.deepEqual(await (await get("/orders/pending-count")).json(), { count: 671 });
    const update = await call("/orders/" + guestOrder.id + "/status", {
      method: "PATCH", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).status, "completed");
    assert.deepEqual(await (await get("/orders/pending-count")).json(), { count: 670 });
    const remove = await call("/orders/" + guestOrder.id, { method: "DELETE", headers: { cookie } });
    assert.equal(remove.status, 200);
    assert.deepEqual(await (await get("/orders/pending-count")).json(), { count: 670 });

    const authorization = await call("/auth/google");
    assert.equal(authorization.status, 302);
    assert.equal(new URL(authorization.headers.get("location")).hostname, "accounts.google.com");
    async function googleLogin() {
      const callback = await call("/auth/google/callback?code=fixture&state=web");
      assert.equal(callback.status, 302);
      assert.equal(callback.headers.get("location"), "/");
      const sessionCookie = callback.headers.get("set-cookie").split(";")[0];
      const user = await (await call("/user", { headers: { cookie: sessionCookie } })).json();
      assert.equal(user.email, googleEmail);
      return user.id;
    }
    const linkedId = await googleLogin();
    assert.equal(linkedId, passwordUserId);
    assert.equal(await googleLogin(), linkedId);
    googleEmail = "new@example.invalid";
    assert.notEqual(await googleLogin(), linkedId);
    assert.equal((await run("SELECT count(*) AS n FROM users")).results[0].n, 2);
    const managed = { username: "rotation-fixture", email: "rotation@example.invalid", password: "fixture-old-password" };
    assert.equal((await post("/register", managed)).status, 201);
    await run("UPDATE users SET is_admin=1 WHERE username='rotation-fixture'");
    const readStoredPassword = () => db.prepare("SELECT password FROM users WHERE username=?").bind(managed.username).first("password");
    const oldHash = await readStoredPassword();
    const routes = ["/login", "/admin/login"];
    for (const username of [managed.username, managed.email]) {
      for (const route of routes) {
        const denied = await post(route, { username, password: managed.password });
        assert.equal(denied.status, 401);
        assert.equal(denied.headers.has("set-cookie"), false);
      }
    }
    assert.equal(await readStoredPassword(), oldHash);
    const replacement = { username: managed.username, password: "fixture-new-password" };
    await run("CREATE TRIGGER block_fixture_sync BEFORE UPDATE OF password ON users BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
    const failure = await post("/admin/login", replacement);
    assert.equal(failure.status, 500);
    assert.equal(failure.headers.has("set-cookie"), false);
    await run("DROP TRIGGER block_fixture_sync");
    const firstLogin = await post("/admin/login", replacement);
    assert.equal(firstLogin.status, 200);
    assert.equal((await firstLogin.json()).isAdmin, true);
    assert.equal(firstLogin.headers.has("set-cookie"), true);
    const newHash = await readStoredPassword();
    assert.ok(newHash && newHash !== oldHash && newHash !== replacement.password);
    for (const username of [managed.username, managed.email]) {
      for (const route of routes) {
        const valid = await post(route, { ...replacement, username });
        assert.equal(valid.status, 200);
        assert.equal(JSON.parse(valid.headers.get("x-test-queries")).some(q => /^\s*UPDATE/i.test(q)), false);
        assert.equal((await post(route, { ...managed, username })).status, 401);
      }
    }
    assert.equal(await readStoredPassword(), newHash);
    assert.equal((await call("/setup-admin")).status, 404);
    console.log("PASS: admin identity rotation for both sign-in routes and identifiers");
    console.log("PASS: SQL budgets, conditional polls, migrations, triggers, badges, authorization and mock Google login");
  } finally {
    await runtime.dispose();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
