import type { D1Database, D1PreparedStatement, ExecutionContext } from '@cloudflare/workers-types';
import migrationSql from './order-read-migrations.generated.json';

// The regression suite compares these statements against the two release SQL files
// using Wrangler's own splitter, including the multi-statement trigger bodies.
const indexMigration = '0001_order_read_indexes.sql';
const countMigration = '0002_pending_order_count.sql';
const approvedSql = [...migrationSql[indexMigration], ...migrationSql[countMigration]];
const journal = 'd1_migrations';
const createJournal = `CREATE TABLE IF NOT EXISTS d1_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
)`;
const expectedDefinitions = new Map<string, string>();
for (const statement of [...approvedSql, createJournal]) {
    const match = /^CREATE (?:TABLE|INDEX|TRIGGER) IF NOT EXISTS (\w+)/i.exec(statement);
    if (match) expectedDefinitions.set(match[1], statement);
}
const checkSql = migrationSql.verify.replace(/;\s*$/, '');
const ready = 'expected_4_indexes = 4 AND expected_12_triggers = 12 AND revision_ok = 1 AND pending_count_ok = 1';
const journalCount = '(SELECT count(*) FROM d1_migrations WHERE name IN (?, ?))';
const start = Date.parse('2026-11-24T00:00:00Z');
const end = Date.parse('2026-12-01T00:00:00Z');
const retryDelay = 10 * 60_000;
let busy = false;
let nextAttempt = 0;

// sqlite_schema omits IF NOT EXISTS and may reformat DDL. Preserve quoted literals.
function normalizedDefinition(sql: string) {
    const tokens = sql.replace(/^((?:CREATE) (?:TABLE|INDEX|TRIGGER)) IF NOT EXISTS /i, '$1 ')
        .trim().replace(/;$/, '').match(/'(?:[^']|'')*'|[a-z_][\w]*|\d+|[^\s]/gi) ?? [];
    return tokens.map(token => token.startsWith("'") ? token : token.toLowerCase()).join(' ');
}

async function reconcile(db: D1Database) {
    const names = Array.from(expectedDefinitions.keys());
    const schema = await db.prepare(
        `SELECT name, sql FROM sqlite_schema WHERE name COLLATE NOCASE IN (${names.map(() => '?').join(', ')})`
    ).bind(...names).all<{name: string; sql: string}>();
    const present = new Map<string, string>();
    for (const row of schema.results) {
        const name = row.name.toLowerCase();
        if (normalizedDefinition(row.sql) !== normalizedDefinition(expectedDefinitions.get(name)!)) {
            throw new Error('Existing migration object has an unexpected definition');
        }
        present.set(name, row.sql);
    }
    const missing = names.filter(name => !present.has(name));
    const hasJournal = present.has(journal);
    const checkRevision = 'EXISTS (SELECT 1 FROM order_list_revision WHERE id = 1 AND length(version) = 32)';
    const checkCounter = `EXISTS (SELECT 1 FROM pending_order_count
        WHERE id = 1 AND pending_count = (SELECT count(*) FROM orders WHERE status = 'pending'))`;
    const preflight = await db.prepare(`SELECT
        ${present.has('order_list_revision') ? checkRevision : '0'} AS revision_ok,
        ${present.has('pending_order_count') ? checkCounter : '0'} AS counter_ok,
        ${hasJournal ? journalCount : '0'} AS recorded`
    ).bind(...(hasJournal ? [indexMigration, countMigration] : [])).first<{
        revision_ok: number; counter_ok: number; recorded: number;
    }>();
    if (!preflight) throw new Error('Could not check order-read migration state');
    if (!missing.length && preflight.revision_ok && preflight.counter_ok && preflight.recorded === 2) return;

    const lostRevisionTrigger = missing.some(name => name.startsWith('refresh_order_list_after_'));
    const lostCountTrigger = missing.some(name => name.startsWith('count_pending_order_'));
    // Another administrator may have changed a definition since preflight. Compare
    // the exact raw DDL in the transaction before any seed or IF NOT EXISTS runs.
    const changes: D1PreparedStatement[] = [db.prepare(`
        WITH observed(name, ddl) AS (VALUES ${names.map(() => '(?, ?)').join(', ')}),
        current_objects AS MATERIALIZED (
            SELECT lower(name) AS name, sql FROM sqlite_schema
            WHERE name COLLATE NOCASE IN (SELECT name FROM observed)
        )
        SELECT CASE WHEN NOT EXISTS (
            SELECT 1 FROM observed LEFT JOIN current_objects USING (name)
            WHERE observed.ddl IS NOT current_objects.sql
               OR (observed.ddl IS NULL AND current_objects.name IS NOT NULL)
        ) THEN 1 ELSE json_extract('schema changed after preflight', '$') END AS unchanged_schema
    `).bind(...names.flatMap(name => [name, present.get(name) ?? null]))];
    for (const name of missing) changes.push(db.prepare(expectedDefinitions.get(name)!));
    for (const statement of approvedSql) {
        if ((!preflight.revision_ok && statement.startsWith('INSERT OR IGNORE INTO order_list_revision')) ||
            ((!preflight.counter_ok || lostCountTrigger) && statement.startsWith('INSERT OR REPLACE INTO pending_order_count'))) {
            changes.push(db.prepare(statement));
        }
    }
    // An ETag could have missed an order change while one of its triggers was absent.
    if (present.has('order_list_revision') && (lostRevisionTrigger || !preflight.revision_ok)) {
        changes.push(db.prepare(`UPDATE order_list_revision SET version = hex(randomblob(16))
            WHERE id = 1${lostRevisionTrigger ? '' : ' AND length(version) <> 32'}`));
    }
    if (preflight.recorded !== 2) {
        changes.push(db.prepare(`
            WITH approved(name) AS (VALUES (?), (?))
            INSERT INTO d1_migrations (name) SELECT name FROM approved
            WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE d1_migrations.name = approved.name)
        `).bind(indexMigration, countMigration));
    }
    // RAISE() only works inside a trigger. SQLite evaluates CASE lazily: malformed JSON
    // raises a statement error on a failed check and D1 rolls back this entire batch.
    changes.push(db.prepare(`SELECT CASE WHEN ${ready} AND ${journalCount} = 2
        THEN 1 ELSE json_extract('invalid postcondition', '$') END AS verified FROM (${checkSql})`
    ).bind(indexMigration, countMigration));
    const results = await db.batch(changes);
    if (results.some(result => result.meta.changed_db)) {
        console.info('Order-read migrations reconciled and verified.');
    }
}

export function scheduleOrderReadMigrations(
    url: string, db: D1Database, ctx: Pick<ExecutionContext, 'waitUntil'>, now = Date.now()
) {
    if (now < start || now >= end || busy || now < nextAttempt || new URL(url).origin !== 'https://arvijix.kr') return;
    busy = true;
    ctx.waitUntil(reconcile(db).then(() => {
        nextAttempt = end;
    }).catch(() => {
        nextAttempt = now + retryDelay;
        console.warn('Order-read migrations could not be verified; will retry after backoff.');
    }).finally(() => { busy = false; }));
}
