const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

test("admin polling resumes at the UTC reset after a D1 daily read limit error", async (t) => {
  const { getOrderPollInterval } = await import("../client/src/lib/order-polling.ts");
  const failure = Date.parse("2026-12-31T20:00:00Z");
  const reset = Date.parse("2027-01-01T00:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now: failure });
  const state = { error: null, errorUpdatedAt: 0 };
  const interval = () => getOrderPollInterval({ state });

  assert.equal(interval(), 15_000, "normal refresh");
  state.error = new Error("500: Internal Server Error");
  state.errorUpdatedAt = failure;
  assert.equal(interval(), 15_000, "unrelated failures retain their existing behavior");
  state.error = new Error("500: D1_ERROR: Your account has exceeded D1's free tier daily row read limit.");
  assert.equal(interval(), reset - failure);
  t.mock.timers.setTime(reset - 60_000);
  assert.equal(interval(), 60_000, "a render before midnight must keep the original deadline");
  t.mock.timers.setTime(reset - 1);
  assert.equal(interval(), 15_000, "avoid fast retries at the boundary");
  t.mock.timers.setTime(reset + 1);
  assert.equal(interval(), 15_000, "an old failure must not push the retry into another day");
  state.error = null;
  assert.equal(interval(), 15_000, "resume the normal cadence after success");
});

test("both periodic admin order queries use the quota-aware interval", () => {
  for (const file of ["hooks/use-order-notifications.ts", "pages/admin/orders.tsx"]) {
    const source = readFileSync(path.join(__dirname, "../client/src", file), "utf8");
    assert.match(source, /refetchInterval:\s*getOrderPollInterval\b/, file);
  }
});
