// Run with node --test scripts/test-order-read-migrations.cjs. Miniflare isolates all bindings.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { test, before } = require('node:test');
const { build } = require('esbuild');
const { unstable_splitSqlQuery: splitSQL } = require('wrangler');
const { Miniflare } = createRequire(require.resolve('wrangler'))('miniflare');

const files = ['0001_order_read_indexes.sql', '0002_pending_order_count.sql'];
const totalFile = '0003_order_total_count.sql';
const totalSQL = splitSQL(readFileSync('migrations/' + totalFile, 'utf8'));
const verifyTotal = readFileSync('scripts/verify-order-total-count.sql', 'utf8');
const verify = readFileSync('scripts/verify-order-read-migrations.sql', 'utf8');
const migrations = files.map(name => splitSQL(readFileSync('migrations/' + name, 'utf8')));
const origin = 'https://arvijix.kr';
const route = '/api/admin/pending-orders-count';
const start = Date.parse('2026-11-24T00:00:00Z');
const end = Date.parse('2026-12-01T00:00:00Z');
let bundle;

// The test harness controls the clock and waits for scheduled work before reporting queries.
// Both named Workers receive the same ephemeral D1 database, but have independent module state.
const entry = `
  import app from './worker.js';
  export default { async fetch(request, env) {
    Date.now = () => Number(request.headers.get('x-fixture-clock'));
    const queries = [], pending = [];
    const fail = request.headers.get('x-fixture-failure');
    const race = request.headers.get('x-fixture-index-race');
    const db = new Proxy(env.DB, { get(target, prop) {
      if (prop === 'batch' && race) return async statements => {
        // Simulate a separate writer after the Worker's schema read, before D1 begins its transaction.
        if (race === 'replace') await target.prepare('DROP INDEX idx_orders_status').run();
        await target.prepare('CREATE INDEX idx_orders_status ON orders(customer_name)').run();
        return target.batch(statements);
      };
      if (prop === 'prepare') return sql => {
        queries.push(sql);
        if (fail && sql.toLowerCase().includes(fail)) throw new Error('fixture database error');
        return target.prepare(sql);
      };
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }});
    const response = await app.fetch(request, {...env, DB: db}, {waitUntil: task => pending.push(task)});
    await Promise.all(pending);
    return Response.json({status: response.status, body: await response.json(), queries});
  }};`;

before(async () => {
  const result = await build({entryPoints: ['worker/index.ts'], bundle: true, format: 'esm',
    platform: 'browser', external: ['node:*'], write: false});
  bundle = result.outputFiles[0].text;
});

async function fixture(t) {
  const workers = ['first', 'cold'].map(name => ({name, modules: [
    {type: 'ESModule', path: 'harness.js', contents: entry},
    {type: 'ESModule', path: 'worker.js', contents: bundle},
  ], d1Databases: {DB: 'order-migration-fixture'}, compatibilityDate: '2024-09-23',
  compatibilityFlags: ['nodejs_compat'], bindings: {SESSION_SECRET: 'only-for-ephemeral-regression'}}));
  const runtime = new Miniflare({workers});
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database('DB', 'first');
  const run = sql => db.prepare(sql).run();
  await db.batch(splitSQL(readFileSync('drizzle/0000_uneven_the_watchers.sql', 'utf8')).map(s => db.prepare(s)));
  await run('ALTER TABLE products ADD COLUMN thumbnail_url TEXT');
  await run("INSERT INTO products(name, description, category, price, image_url) VALUES ('fixture', '', 'a', 1, '')");
  await run(`INSERT INTO orders(customer_name,customer_email,customer_phone,customer_address,total_amount,status)
    VALUES ('a','a','a','a',5,'pending'),('b','b','b','b',10,'done')`);
  await run('INSERT INTO order_items(order_id,product_id,quantity,price) VALUES (1,1,1,5)');

  async function request({path = route, host = origin, now = start, token, body, failure, race, isolate = 'first'} = {}) {
    const worker = await runtime.getWorker(isolate);
    const headers = {'x-fixture-clock': String(now)};
    if (token) headers.authorization = `Bearer ${token}`;
    if (failure) headers['x-fixture-failure'] = failure;
    if (race) headers['x-fixture-index-race'] = race;
    if (body) headers['content-type'] = 'application/json';
    const response = await worker.fetch(host + path, {headers, method: body ? 'POST' : 'GET', body: body && JSON.stringify(body)});
    return response.json();
  }
  async function register(name) {
    const result = await request({path: '/api/register', body: {
      username: name, email: name + '@example.invalid', password: 'only-an-isolated-fixture',
    }, now: start - 60000});
    assert.equal(result.status, 201);
    return result.body.token;
  }
  const admin = await register('test-admin');
  await run("UPDATE users SET is_admin=1 WHERE username='test-admin'");
  const customer = await register('test-customer');
  return {db, run, request, admin, customer};
}

async function assertVerified(db) {
  assert.deepEqual(await db.prepare(verify).first(), {
    expected_4_indexes: 4, expected_12_triggers: 12, revision_ok: 1, pending_count_ok: 1,
  });
  const entries = await db.prepare('SELECT name FROM d1_migrations ORDER BY name').all();
  assert.deepEqual(entries.results.map(row => row.name), [...files, totalFile]);
  assert.deepEqual(await db.prepare(verifyTotal).first(), {expected_2_triggers: 2, total_count_ok: 1});
}

function businessRows(db) {
  return Promise.all(['users', 'orders', 'order_items', 'products'].map(async table =>
    (await db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()).results));
}

test('deployed SQL matches all three version-controlled migrations and verification queries', () => {
  const deployed = JSON.parse(readFileSync('worker/order-read-migrations.generated.json', 'utf8'));
  const normalize = sql => sql.replace(/\r\n/g, '\n').trim();
  for (const [index, name] of files.entries()) {
    assert.deepEqual(deployed[name].map(normalize), migrations[index].map(normalize));
  }
  assert.equal(normalize(deployed.verify), normalize(verify));
  assert.deepEqual(deployed[totalFile].map(normalize), totalSQL.map(normalize));
  assert.equal(normalize(deployed.verifyTotal), normalize(verifyTotal));
});

test('authorized production badge read reconciles concurrent first runs and preserves business records', async t => {
  const {db, request, admin} = await fixture(t);
  const original = await businessRows(db);
  const results = await Promise.all(['first', 'cold'].map(isolate => request({token: admin, isolate})));
  for (const result of results) { assert.equal(result.status, 200); assert.deepEqual(result.body, {count: 1}); }
  await assertVerified(db);
  assert.deepEqual(await businessRows(db), original);
  const journal = await db.prepare('SELECT * FROM d1_migrations ORDER BY id').all();
  const steady = await request({token: admin, now: start + 3600000});
  assert.deepEqual(steady.body, {count: 1});
  assert.ok(steady.queries.length <= 2, 'hot polling only reads the user and singleton pending count');
  assert.deepEqual((await db.prepare('SELECT * FROM d1_migrations ORDER BY id').all()).results, journal.results);
});

test('preview, customer, public, non-HTTPS, and out-of-window reads never schedule migrations', async t => {
  const {db, request, admin, customer} = await fixture(t);
  const checks = [
    [{token: admin, host: 'https://preview.elbeg.pages.dev'}, 200],
    [{token: admin, host: 'http://arvijix.kr'}, 200],
    [{token: admin, now: start - 1}, 200],
    [{token: admin, now: end}, 200],
    [{token: customer}, 403], [{}, 401], [{path: '/api/categories'}, 200],
    [{token: admin, failure: 'pending_count from pending_order_count'}, 500],
  ];
  for (const [input, status] of checks) {
    const result = await request(input);
    assert.equal(result.status, status, JSON.stringify({...input, token: !!input.token}));
    assert.ok(!result.queries.some(s => /sqlite_schema|d1_migrations|create (index|trigger|table)/i.test(s)));
  }
  assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE name='idx_orders_status'").first('n'), 0);
});

test('background failure leaves successful badge response intact and allows later repair', async t => {
  const {db, request, admin} = await fixture(t);
  const failed = await request({token: admin, failure: 'd1_migrations'});
  assert.equal(failed.status, 200); assert.deepEqual(failed.body, {count: 1});
  assert.ok(failed.queries.some(s => /d1_migrations/i.test(s)), 'the injected background failure must run');
  const paused = await request({token: admin, now: start + 15000});
  assert.deepEqual(paused.body, {count: 1});
  assert.ok(!paused.queries.some(s => /d1_migrations/i.test(s)), 'the next badge poll must respect retry backoff');
  const retry = await request({token: admin, now: start + 3600000});
  assert.equal(retry.status, 200);
  await assertVerified(db);
});

test('repairs partially applied Wrangler history, missing schema and incorrect pending tally', async t => {
  const {db, run, request, admin} = await fixture(t);
  await db.batch(migrations.flat().map(s => db.prepare(s)));
  await run(`CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  await db.prepare("INSERT INTO d1_migrations(name,applied_at) VALUES (?, '2026-10-01')").bind(files[0]).run();
  await run('DROP INDEX idx_order_items_order_id');
  await run('DROP TRIGGER count_pending_order_status_change');
  await run('UPDATE pending_order_count SET pending_count=22 WHERE id=1');
  const original = await businessRows(db);
  assert.equal((await request({token: admin, path:'/api/orders/pending-count'})).status, 200);
  await assertVerified(db);
  assert.deepEqual(await businessRows(db), original);
});

test('already migrated database verifies once per isolate and leaves Wrangler history intact', async t => {
  const {db, run, request, admin} = await fixture(t);
  await db.batch(migrations.flat().map(s => db.prepare(s)));
  await run(`CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  for (const file of files) await db.prepare("INSERT INTO d1_migrations(name,applied_at) VALUES (?, '2026-10-01')").bind(file).run();
  const initial = (await db.prepare('SELECT * FROM d1_migrations ORDER BY id').all()).results;
  // A prior journal entry alone does not prove the counter is in sync with orders.
  await run('UPDATE pending_order_count SET pending_count=9 WHERE id=1');
  assert.equal((await request({token: admin})).status, 200);
  await assertVerified(db);
  const cold = await request({token: admin, isolate: 'cold'});
  assert.deepEqual(cold.body, {count: 1});
  assert.ok(cold.queries.filter(s => /count\(\*\)\s+from\s+orders\s+where\s+status\s*=/i.test(s)).length <= 1);
  const hot = await request({token: admin, isolate: 'cold', now: start + 60000});
  assert.ok(hot.queries.length <= 2, 'a repeated healthy read cannot rescan orders or migration history');
  assert.deepEqual((await db.prepare('SELECT * FROM d1_migrations WHERE name <> ? ORDER BY id').bind(totalFile).all()).results, initial);
});

test('0003 seeds all existing orders and tracks committed inserts and deletes exactly', async t => {
  const {db, run, request, admin} = await fixture(t);
  const before = await businessRows(db);
  assert.equal((await request({token: admin})).status, 200);
  await assertVerified(db);
  assert.deepEqual(await businessRows(db), before);
  const total = () => db.prepare('SELECT total_count FROM order_total_count WHERE id=1').first('total_count');
  const bulk = `INSERT INTO orders(customer_name,customer_email,customer_phone,customer_address,total_amount,status)
    VALUES ('new','a','a','a',7,'pending'),('new','a','a','a',3,'done')`;
  assert.equal(await total(), 2);
  await run(bulk); assert.equal(await total(), 4);
  await run("UPDATE orders SET status='pending' WHERE status='done'"); assert.equal(await total(), 4);
  await assert.rejects(db.batch([db.prepare(bulk), db.prepare('INSERT INTO order_total_count VALUES(1,1)')]));
  assert.equal(await total(), 4);
  await run("DELETE FROM orders WHERE customer_name='new'"); assert.equal(await total(), 2);
  await run('DELETE FROM orders'); assert.equal(await total(), 0);
  await run(bulk); assert.equal(await total(), 2);
  await db.batch(totalSQL.map(sql => db.prepare(sql))); assert.equal(await total(), 2);
  assert.deepEqual(await db.prepare(verifyTotal).first(), {expected_2_triggers: 2, total_count_ok: 1});
});

test('wrong total singleton or a missing trigger is repaired using current orders and preserves the journal', async t => {
  const {db, run, request, admin} = await fixture(t);
  await request({token:admin});
  const journal = (await db.prepare('SELECT * FROM d1_migrations ORDER BY id').all()).results;
  await run('DROP TRIGGER count_order_total_delete');
  await run('UPDATE order_total_count SET total_count=10 WHERE id=1');
  await request({token:admin, isolate:'cold'});
  await assertVerified(db);
  assert.deepEqual((await db.prepare('SELECT * FROM d1_migrations ORDER BY id').all()).results, journal);
});

test('a failed 0003 postcondition rolls back its own changes and preserves the earlier migrations', async t => {
  const {db, run, request, admin} = await fixture(t);
  await run(totalSQL[0]);
  await run(`CREATE TRIGGER fixture_wrong_total AFTER INSERT ON order_total_count BEGIN
    UPDATE order_total_count SET total_count=99 WHERE id=1; END`);
  const before = await businessRows(db);
  const response = await request({token:admin}); assert.equal(response.status, 200);
  assert.deepEqual(await businessRows(db), before);
  assert.deepEqual(await db.prepare(verify).first(), {expected_4_indexes:4,expected_12_triggers:12,revision_ok:1,pending_count_ok:1});
  assert.deepEqual((await db.prepare('SELECT name FROM d1_migrations ORDER BY name').all()).results.map(x=>x.name),files);
  assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM order_total_count').first('n'),0);
  assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE name LIKE 'count_order_total_%'").first('n'),0);
});

test('only the missing pending-count migration is executed on an installation with a healthy order revision', async t => {
  const {db, run, request, admin} = await fixture(t);
  await db.batch(migrations[0].map(s => db.prepare(s)));
  await run(`CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  await db.prepare("INSERT INTO d1_migrations(name,applied_at) VALUES (?, '2026-10-01')").bind(files[0]).run();
  const revision = await db.prepare('SELECT version FROM order_list_revision WHERE id=1').first('version');
  const response = await request({token: admin});
  assert.deepEqual(response.body, {count: 1});
  await assertVerified(db);
  const firstMigration = new Set(migrations[0].map(sql => sql.trim()));
  assert.ok(!response.queries.some(sql => firstMigration.has(sql.trim()) || /^\s*UPDATE\s+order_list_revision\b/i.test(sql)),
    'healthy 0001 objects and revision must not be recreated or rewritten when only 0002 is missing');
  assert.equal(await db.prepare('SELECT version FROM order_list_revision WHERE id=1').first('version'), revision);
});

test('a conflicting existing schema definition is preserved and no completion is recorded', async t => {
  const {db, run, request, admin} = await fixture(t);
  await run('CREATE INDEX idx_orders_status ON orders(customer_name)');
  const snapshot = () => db.prepare("SELECT type,name,sql FROM sqlite_schema ORDER BY name").all();
  const original = (await snapshot()).results;
  const response = await request({token: admin});
  assert.equal(response.status, 200); assert.deepEqual(response.body, {count: 1});
  assert.deepEqual((await snapshot()).results, original);
});

test('repair of one secondary index preserves the valid revision and skips the counter seed', async t => {
  const {db, run, request, admin} = await fixture(t);
  await db.batch(migrations.flat().map(s => db.prepare(s)));
  await run('DROP INDEX idx_orders_created');
  const revision = await db.prepare('SELECT version FROM order_list_revision WHERE id=1').first('version');
  const result = await request({token: admin});
  assert.deepEqual(result.body, {count: 1});
  await assertVerified(db);
  assert.equal(await db.prepare('SELECT version FROM order_list_revision WHERE id=1').first('version'), revision);
  const writes = result.queries.map(sql => sql.trim()).filter(sql => /^(INSERT(?: OR \w+)? INTO|UPDATE) pending_order_count\b/i.test(sql));
  assert.deepEqual(writes, []);
});

test('a failed postcondition rolls back all migration writes in the transaction', async t => {
  const {db, run, request, admin} = await fixture(t);
  await run(migrations[1][0]);
  // Synthetic unrelated trigger creates a real DB-side verification failure after the seeding statement succeeds.
  await run(`CREATE TRIGGER fixture_counter_failure AFTER INSERT ON pending_order_count BEGIN
    UPDATE pending_order_count SET pending_count=0 WHERE id=NEW.id; END`);
  const snapshot = () => db.prepare('SELECT type,name,sql FROM sqlite_schema ORDER BY name').all();
  const original = (await snapshot()).results;
  const response = await request({token: admin});
  assert.equal(response.status, 200); assert.deepEqual(response.body, {count: 1});
  assert.deepEqual((await snapshot()).results, original);
  assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM pending_order_count').first('n'), 0);
});

for (const race of ['create', 'replace']) {
  test(`concurrent external index ${race} between preflight and batch prevents journal and schema writes`, async t => {
    const {db, run, request, admin} = await fixture(t);
    if (race === 'replace') await run('CREATE INDEX idx_orders_status ON orders(status)');
    const otherObjects = () => db.prepare("SELECT type,name,sql FROM sqlite_schema WHERE name <> 'idx_orders_status' ORDER BY name").all();
    const schemaBefore = (await otherObjects()).results;
    const rowsBefore = await businessRows(db);
    const result = await request({token: admin, race});
    assert.equal(result.status, 200); assert.deepEqual(result.body, {count: 1});
    assert.equal(await db.prepare("SELECT sql FROM sqlite_schema WHERE name='idx_orders_status'").first('sql'),
      'CREATE INDEX idx_orders_status ON orders(customer_name)');
    assert.deepEqual((await otherObjects()).results, schemaBefore, 'migration writes and journal must roll back');
    assert.deepEqual(await businessRows(db), rowsBefore);
    const retry = await request({token: admin, now: start + 3600000});
    assert.deepEqual(retry.body, {count: 1});
    assert.deepEqual((await otherObjects()).results, schemaBefore, 'retry must also reject the incompatible index');
  });
}
