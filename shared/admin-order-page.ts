export const orderPageSize = 20;

export type SummaryRow = {
  id: number;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: number | null; // Epoch seconds, as stored in D1.
};

export type OrderPageFilters = {
  q: string;
  status: string | null;
  start: number | null;
  end: number | null;
  cursor: { time: number | null; id: number } | null;
};

export function parseOrderPage(params: URLSearchParams): OrderPageFilters | null {
  const date = (key: string) => {
    const value = params.get(key);
    return value ? Math.floor(Date.parse(value) / 1000) : null;
  };
  const start = date('startDate');
  const end = date('endDate');
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  let cursor: OrderPageFilters['cursor'] = null;
  if (params.has('cursor')) {
    const parts = /^(null|-?\d+):([1-9]\d*)$/.exec(params.get('cursor')!);
    if (!parts) return null;
    const time = parts[1] === 'null' ? null : Number(parts[1]);
    const id = Number(parts[2]);
    if (!Number.isSafeInteger(id) || (time !== null &&
        (!Number.isSafeInteger(time) || !Number.isFinite(new Date(time * 1000).getTime())))) return null;
    cursor = { time, id };
  }
  const status = params.get('status');
  return { q: (params.get('q') || '').toLowerCase(), status: status && status !== 'all' ? status : null, start, end, cursor };
}

export function orderPageResult(rows: SummaryRow[], total: number, revision: string | null) {
  const page = rows.slice(0, orderPageSize);
  const last = page.at(-1);
  return {
    orders: page.map(row => ({ ...row, createdAt: row.createdAt === null ? null : new Date(row.createdAt * 1000).toJSON() })),
    total,
    nextCursor: rows.length > orderPageSize && last ? `${last.createdAt}:${last.id}` : null,
    revision,
  };
}

// SQLite's lower() is ASCII-only. Use the browser's Unicode substring semantics for
// explicit searches, and count all matches independently of the current cursor.
// Input is already sorted by timestamp descending, id ascending, with nulls last.
export function searchOrderSummaries(rows: SummaryRow[], filters: OrderPageFilters, revision: string | null) {
  const page: SummaryRow[] = [];
  let total = 0;
  const cursor = filters.cursor;
  for (const row of rows) {
    if (filters.q && !row.customerName.toLowerCase().includes(filters.q) &&
        !`#ord-${String(row.id).padStart(4, '0')}`.includes(filters.q)) continue;
    total++;
    if (page.length > orderPageSize) continue;
    if (cursor) {
      if (row.createdAt === cursor.time && row.id <= cursor.id) continue;
      if (row.createdAt !== null && (cursor.time === null || row.createdAt > cursor.time)) continue;
    }
    page.push(row);
  }
  return orderPageResult(page, total, revision);
}
