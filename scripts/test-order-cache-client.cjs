const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { inspect } = require("node:util");
const vm = require("node:vm");
const { transformSync } = require("esbuild");

const source = readFileSync(path.join(__dirname, "../client/src/lib/queryClient.ts"), "utf8");

for (const apiBase of ["", "https://api.example.invalid"]) {
  test(`mobile order polling revalidates with ${apiBase || "same-origin"} URLs`, async () => {
    const { code } = transformSync(source, {
      loader: "ts",
      format: "cjs",
      define: { "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBase) },
    });
    const calls = [];
    const clientModule = { exports: {} };
    vm.runInNewContext(code, {
      module: clientModule,
      require,
      navigator: { userAgent: "Mozilla/5.0 (iPhone; Mobile)" },
      console: { log() {}, error: console.error },
      fetch: async (url, options) => {
        calls.push({ url, options });
        return Response.json([]);
      },
    });

    for (const [method, url, revalidates] of [
      ["GET", "/api/orders", true],
      ["GET", "/api/orders?startDate=2026-01-01", true],
      ["GET", "/api/admin/order-summaries", true],
      ["GET", "/api/admin/order-summaries?status=pending", true],
      ["GET", "/api/orders/1", false],
      ["POST", "/api/orders", false],
      ["GET", "/api/user", false],
    ]) {
      await clientModule.exports.apiRequest(method, url);
      const call = calls.pop();
      assert.equal(call.url, apiBase + url);
      assert.equal(call.options.credentials, "include");
      assert.equal(call.options.cache, "no-cache");
      assert.equal(call.options.headers["X-Requested-With"], "XMLHttpRequest");
      const directive = call.options.headers["Cache-Control"] || "";
      assert.equal(directive.includes("no-store"), !revalidates, method + " " + url);
    }
  });
}

test("login and session requests keep credentials and responses out of console messages", async () => {
  const markers = {
    username: "fixture-username-canary",
    password: "fixture-password-canary",
    cookie: "fixture-cookie-canary",
    token: "fixture-token-canary",
    header: "fixture-header-canary",
    detail: "fixture-error-body-canary",
  };
  const credentials = { username: markers.username, password: markers.password };
  const messages = [];
  const capture = (...args) => messages.push(inspect(args, { depth: null }));
  const clientModule = { exports: {} };
  let status = 200;
  const { code } = transformSync(source, {
    loader: "ts", format: "cjs", define: { "import.meta.env.VITE_API_BASE_URL": '""' },
  });
  vm.runInNewContext(code, {
    module: clientModule, require,
    navigator: { userAgent: "Mozilla/5.0 (iPhone; Mobile)" },
    document: { cookie: "session=" + markers.cookie },
    console: { log: capture, info: capture, debug: capture, warn: capture, error: capture },
    fetch: async (url, options) => {
      if (url === "/api/admin/login") {
        assert.deepEqual(JSON.parse(options.body), credentials);
      }
      return Response.json(status === 200 ? { token: markers.token } : { error: markers.detail }, {
        status, headers: { "x-fixture-response": markers.header },
      });
    },
  });

  const { apiRequest, getQueryFn } = clientModule.exports;
  const login = () => apiRequest("POST", "/api/admin/login", credentials);
  const session = () => getQueryFn({ on401: "throw" })({ queryKey: ["/api/user"] });
  assert.equal((await login()).token, markers.token);
  assert.equal((await session()).token, markers.token);
  status = 500;
  await assert.rejects(login);
  await assert.rejects(session);
  for (const [field, marker] of Object.entries(markers)) {
    assert.ok(messages.every(message => !message.includes(marker)), field + " leaked to console");
  }
});
