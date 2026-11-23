import type { D1Database } from '@cloudflare/workers-types';
import { orderPageResult, orderPageSize, searchOrderSummaries, type OrderPageFilters, type SummaryRow } from '../shared/admin-order-page';

const projection = `SELECT id, customer_name AS customerName, customer_phone AS customerPhone,
  total_amount AS totalAmount, status, created_at AS createdAt FROM orders`;

export async function orderPageTag(db: D1Database, userId: number, filters: OrderPageFilters) {
  let revision: string | null = null;
  try {
    revision = await db.prepare('SELECT version FROM order_list_revision WHERE id = 1').first<string>('version');
  } catch (error) {
    if (!(error instanceof Error) || !/no such table: (?:main\.)?order_list_revision\b/i.test(error.message)) throw error;
  }
  if (!revision) return { revision, tag: null };
  // Keep customer search terms out of response headers, and scope validators to the admin and page.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([userId, filters, revision])));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return { revision, tag: `W/"order-page-v1-${hash}"` };
}

export async function getAdminOrderPage(db: D1Database, filters: OrderPageFilters, revision: string | null) {
  const base: string[] = [];
  const args: (string | number)[] = [];
  if (filters.status !== null) { base.push('status = ?'); args.push(filters.status); }
  if (filters.start !== null) { base.push('created_at >= ?'); args.push(filters.start); }
  if (filters.end !== null) { base.push('created_at <= ?'); args.push(filters.end); }
  const where = (conditions: string[]) => conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const select = (...extra: string[]) => projection + where([...base, ...extra]);
  const order = ' ORDER BY createdAt DESC, id ASC';

  if (filters.q) {
    // One consistent read of summaries only. A Unicode search can span the full list.
    const summaries = await db.prepare(select() + order).bind(...args).all<SummaryRow>();
    return searchOrderSummaries(summaries.results, filters, revision);
  }

  let sql = select();
  const bindings = [...args];
  const cursor = filters.cursor;
  if (cursor && cursor.time === null) {
    sql = select('created_at IS NULL', 'id > ?');
    bindings.push(cursor.id);
  } else if (cursor && cursor.time !== null) {
    // The first inequality also seeks into the existing date index for deep pages.
    sql = select('created_at <= ?', '(created_at < ? OR id > ?)');
    bindings.push(cursor.time, cursor.time, cursor.id);
    if (filters.start === null && filters.end === null) {
      sql += ' UNION ALL ' + select('created_at IS NULL');
      bindings.push(...args);
    }
  }
  const page = db.prepare(sql + order + ' LIMIT ?').bind(...bindings, orderPageSize + 1);
  const exact = db.prepare('SELECT COUNT(*) AS total FROM orders' + where(base)).bind(...args);
  const unfiltered = !base.length;
  const count = unfiltered ? db.prepare(`SELECT COALESCE(
    (SELECT total_count FROM order_total_count WHERE id=1), (SELECT COUNT(*) FROM orders)) AS total`) : exact;
  let batch;
  try {
    batch = await db.batch([page, count]);
  } catch (error) {
    if (!unfiltered || !(error instanceof Error) || !/no such table: (?:main\.)?order_total_count\b/i.test(error.message)) throw error;
    // Old deployments can serve a consistent page and exact total while the migration is pending.
    batch = await db.batch([page, exact]);
  }
  const [countRow] = batch[1].results as { total: number }[];
  return orderPageResult(batch[0].results as SummaryRow[], countRow.total, revision);
}
