// Runs inside test-d1-order-reads.cjs with its synthetic admin session and isolated D1 binding.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { unstable_splitSqlQuery: splitSQL } = require('wrangler');

module.exports = async function checkOrderSummaries({ db, get, call, run }) {
  const base = '/admin/order-summaries';
  const url = params => `${base}?${new URLSearchParams(params)}`;
  const json = async (path, tag) => {
    const response = await get(path, tag);
    assert.equal(response.status, 200, path);
    return response.json();
  };
  const ids = page => page.orders.map(order => order.id);
  assert.equal((await call(base)).status, 401);
  assert.equal((await json(base)).total, 670, 'missing total singleton has an exact fallback');
  const migration = readFileSync('migrations/0003_order_total_count.sql', 'utf8');
  await db.batch(splitSQL(migration).map(sql => db.prepare(sql)));
  await run("UPDATE orders SET customer_name='ӨЛЗИЙ_%', created_at=NULL WHERE id=2");
  await run('UPDATE orders SET created_at=1700000660 WHERE id BETWEEN 630 AND 670');

  const response = await get(base);
  assert.equal(response.status, 200);
  const page = await response.json();
  const tag = response.headers.get('etag');
  assert.ok(tag);
  assert.equal(page.total, 670);
  assert.equal(page.orders.length, 20);
  assert.ok(page.nextCursor);
  const keys = ['createdAt','customerName','customerPhone','id','status','totalAmount'];
  assert.deepEqual(Object.keys(page.orders[0]).sort(), keys);
  assert.ok(Number.isFinite(Date.parse(page.orders[0].createdAt)));
  const statements = JSON.parse(response.headers.get('x-test-queries'));
  assert.ok(!statements.some(s => /\b(?:order_items|products)\b/i.test(s)));
  assert.ok(statements.some(s => /order_total_count/i.test(s)), 'read the exact maintained total');
  const batchCosts = JSON.parse(response.headers.get('x-test-batch-reads')).flat();
  assert.equal(batchCosts.length,2);
  assert.equal(batchCosts[1],1,'the healthy counter must skip the SQL fallback count');
  assert.ok(batchCosts.reduce((a,b) => a+b, 0) <= 30, 'bounded default page read budget');

  for (let i=0; i<6; i++) {
    const unchanged = await get(base,tag);
    assert.equal(unchanged.status,304);
    assert.equal(await unchanged.text(),'');
    assert.ok(!JSON.parse(unchanged.headers.get('x-test-queries')).some(s => /from\s+["`]?orders\b/i.test(s)));
  }
  const seen = [...ids(page)];
  let cursor = page.nextCursor;
  while (cursor) {
    const next = await json(url({cursor}), tag);
    seen.push(...ids(next));
    assert.ok(seen.length <= 670, 'cursor always progresses');
    cursor = next.nextCursor;
  }
  assert.equal(seen.length,670);
  assert.equal(new Set(seen).size,670,'timestamp ties must not lose or repeat any order');
  assert.equal(seen.at(-1),2,'undated orders remain reachable');
  assert.deepEqual(ids(await json(url({q:'өлзий_%'}),tag)),[2]);
  assert.deepEqual(ids(await json(url({q:'ord-0002'}))),[2]);
  assert.equal((await json(url({status:'pending'}))).total,33);
  assert.equal((await json(url({q:'ӨлЗиЙ_%',status:'pending'}))).total,0);
  const day = await json(url({startDate:new Date(1700000010*1000).toISOString(),endDate:new Date(1700000012*1000).toISOString()}));
  assert.deepEqual(new Set(ids(day)),new Set([10,11,12]));
  assert.equal((await get(url({cursor:'invalid'}))).status,400);
  assert.equal((await get(url({startDate:'not-a-date'}))).status,400);
  const detail=await json('/orders/2');
  assert.equal(detail.customerName,'ӨЛЗИЙ_%');
  assert.ok(detail.items.length);
  await run("UPDATE users SET is_admin=0 WHERE username='tester'");
  assert.equal((await get(base,tag)).status,403);
  await run("UPDATE users SET is_admin=1 WHERE username='tester'");
  await run("UPDATE orders SET customer_name='test', created_at=1700000000+id WHERE id=2 OR id BETWEEN 630 AND 670");
  const changed=await json(base,tag);
  assert.equal(changed.total,670);
  assert.notEqual(changed.revision,page.revision);
  console.log('PASS: admin cursor pages, maintained totals, Unicode search, filters, revalidation and detail access');
};
