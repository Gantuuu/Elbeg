var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _worker.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context2.finalized === false && onNotFound) {
          res = await onNotFound(context2);
        }
      }
      if (res && (context2.finalized === false || isError)) {
        context2.res = res;
      }
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app7) {
    const subApp = this.basePath(path);
    app7.routes.map((r) => {
      let handler;
      if (app7.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app7.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context2, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context2.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context2, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  static {
    __name(this, "_Node2");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono2");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");
function getColorEnabled() {
  const { process: process2, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process2 !== void 0 ? (
    // eslint-disable-next-line no-unsafe-optional-chaining
    "NO_COLOR" in process2?.env
  ) : false;
  return !isNoColor;
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
__name(getColorEnabledAsync, "getColorEnabledAsync");
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
}, "humanize");
var time3 = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
}, "colorStatus");
async function log3(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
__name(log3, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log3(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log3(fn, "-->", method, path, c.res.status, time3(start));
  }, "logger2");
}, "logger");
var createMiddleware = /* @__PURE__ */ __name((middleware) => middleware, "createMiddleware");
var algorithm = { name: "HMAC", hash: "SHA-256" };
var getCryptoKey = /* @__PURE__ */ __name(async (secret) => {
  const secretBuf = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  return await crypto.subtle.importKey("raw", secretBuf, algorithm, false, ["sign", "verify"]);
}, "getCryptoKey");
var makeSignature = /* @__PURE__ */ __name(async (value, secret) => {
  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign(algorithm.name, key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}, "makeSignature");
var verifySignature = /* @__PURE__ */ __name(async (base64Signature, value, secret) => {
  try {
    const signatureBinStr = atob(base64Signature);
    const signature = new Uint8Array(signatureBinStr.length);
    for (let i = 0, len = signatureBinStr.length; i < len; i++) {
      signature[i] = signatureBinStr.charCodeAt(i);
    }
    return await crypto.subtle.verify(algorithm, secret, signature, new TextEncoder().encode(value));
  } catch {
    return false;
  }
}, "verifySignature");
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.trim().split(";");
  const parsedCookie = {};
  for (let pairStr of pairs) {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      continue;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = cookieValue.indexOf("%") !== -1 ? tryDecode(cookieValue, decodeURIComponent_) : cookieValue;
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var parseSigned = /* @__PURE__ */ __name(async (cookie, secret, name) => {
  const parsedCookie = {};
  const secretKey = await getCryptoKey(secret);
  for (const [key, value] of Object.entries(parse(cookie, name))) {
    const signatureStartPos = value.lastIndexOf(".");
    if (signatureStartPos < 1) {
      continue;
    }
    const signedValue = value.substring(0, signatureStartPos);
    const signature = value.substring(signatureStartPos + 1);
    if (signature.length !== 44 || !signature.endsWith("=")) {
      continue;
    }
    const isVerified = await verifySignature(signature, signedValue, secretKey);
    parsedCookie[key] = isVerified ? signedValue : false;
  }
  return parsedCookie;
}, "parseSigned");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");
var serializeSigned = /* @__PURE__ */ __name(async (name, value, secret, opt = {}) => {
  const signature = await makeSignature(value, secret);
  value = `${value}.${signature}`;
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serializeSigned");
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var getSignedCookie = /* @__PURE__ */ __name(async (c, secret, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = await parseSigned(cookie, secret, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = await parseSigned(cookie, secret);
  return obj;
}, "getSignedCookie");
var generateCookie = /* @__PURE__ */ __name((name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
}, "generateCookie");
var setCookie = /* @__PURE__ */ __name((c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
}, "setCookie");
var generateSignedCookie = /* @__PURE__ */ __name(async (name, value, secret, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = await serializeSigned("__Secure-" + name, value, secret, {
      path: "/",
      ...opt,
      secure: true
    });
  } else if (opt?.prefix === "host") {
    cookie = await serializeSigned("__Host-" + name, value, secret, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = await serializeSigned(name, value, secret, { path: "/", ...opt });
  }
  return cookie;
}, "generateSignedCookie");
var setSignedCookie = /* @__PURE__ */ __name(async (c, name, value, secret, opt) => {
  const cookie = await generateSignedCookie(name, value, secret, opt);
  c.header("set-cookie", cookie, { append: true });
}, "setSignedCookie");
var deleteCookie = /* @__PURE__ */ __name((c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
}, "deleteCookie");
var SupabaseStorage = class {
  static {
    __name(this, "SupabaseStorage");
  }
  supabaseUrl;
  supabaseAnonKey;
  supabaseServiceKey;
  constructor(supabaseUrl, supabaseAnonKey, supabaseServiceKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.supabaseServiceKey = supabaseServiceKey;
  }
  get supabaseKey() {
    return this.supabaseServiceKey || this.supabaseAnonKey;
  }
  isPlainObject(obj) {
    return typeof obj === "object" && obj !== null && !Array.isArray(obj) && obj.constructor === Object;
  }
  toCamel(obj) {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.toCamel(v));
    } else if (this.isPlainObject(obj)) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [key.replace(/(_\w)/g, (m) => m[1].toUpperCase())]: this.toCamel(obj[key])
        }),
        {}
      );
    }
    return obj;
  }
  toSnake(obj) {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.toSnake(v));
    } else if (this.isPlainObject(obj)) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]: this.toSnake(obj[key])
        }),
        {}
      );
    }
    return obj;
  }
  async fetch(path, options) {
    const url = `${this.supabaseUrl}/rest/v1/${path}`;
    let body = options?.body;
    if (body && typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        if (this.isPlainObject(parsed)) {
          const snaked = {};
          for (const key of Object.keys(parsed)) {
            const snakedKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            snaked[snakedKey] = parsed[key];
          }
          body = JSON.stringify(snaked);
        }
      } catch (e) {
      }
    }
    const headers = {
      "apikey": this.supabaseKey,
      "Authorization": `Bearer ${this.supabaseKey}`,
      "Content-Type": "application/json",
      ...options?.headers || {}
    };
    const response = await fetch(url, { ...options, body, headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase error: ${response.status} ${text}`);
    }
    if (response.status === 204) return {};
    const data = await response.json();
    return this.toCamel(data);
  }
  // Storage/Upload operations
  async uploadFile(bucket, path, file) {
    const url = `${this.supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch(url, {
      method: "POST",
      body: arrayBuffer,
      headers: {
        "apikey": this.supabaseKey,
        "Authorization": `Bearer ${this.supabaseKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true"
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase Storage error: ${response.status} ${text}`);
    }
    return `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
  // User operations
  async getAllUsers() {
    return await this.fetch("users?select=*&order=created_at.desc");
  }
  async getUser(id) {
    const users = await this.fetch(`users?id=eq.${id}&select=*`);
    return users[0];
  }
  async getUserByUsername(username) {
    const users = await this.fetch(`users?username=eq.${username}&select=*`);
    return users[0];
  }
  async getUserByEmail(email) {
    const users = await this.fetch(`users?email=eq.${encodeURIComponent(email)}&select=*`);
    return users[0];
  }
  async getUserByGoogleId(googleId) {
    const users = await this.fetch(`users?google_id=eq.${googleId}&select=*`);
    return users[0];
  }
  async updateUserGoogleId(userId, googleId, profileImageUrl) {
    const data = { googleId };
    if (profileImageUrl) data.profileImageUrl = profileImageUrl;
    const users = await this.fetch(`users?id=eq.${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Prefer": "return=representation" }
    });
    return users[0];
  }
  async createUser(user) {
    const users = await this.fetch(`users`, {
      method: "POST",
      body: JSON.stringify({ ...user, isAdmin: false }),
      headers: { "Prefer": "return=representation" }
    });
    return users[0];
  }
  async getUserOrders(userId) {
    const orders = await this.fetch(`orders?select=*,items:order_items(*,product:products(*))&user_id=eq.${userId}&order=created_at.desc`);
    return orders;
  }
  async getPendingOrdersCount() {
    const url = `${this.supabaseUrl}/rest/v1/orders?status=eq.pending`;
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "apikey": this.supabaseKey,
        "Authorization": `Bearer ${this.supabaseKey}`,
        "Prefer": "count=exact"
      }
    });
    const countRange = response.headers.get("content-range");
    if (countRange) {
      return parseInt(countRange.split("/")[1]);
    }
    return 0;
  }
  // Bank Account operations
  async getBankAccounts() {
    return await this.fetch("bank_accounts?select=*");
  }
  async getDefaultBankAccount() {
    const accounts = await this.fetch("bank_accounts?is_default=eq.true&select=*");
    return accounts[0];
  }
  async getBankAccount(id) {
    const accounts = await this.fetch(`bank_accounts?id=eq.${id}&select=*`);
    return accounts[0];
  }
  async createBankAccount(bankAccount) {
    const accounts = await this.fetch("bank_accounts", {
      method: "POST",
      body: JSON.stringify(bankAccount),
      headers: { "Prefer": "return=representation" }
    });
    return accounts[0];
  }
  async updateBankAccount(id, bankAccount) {
    const accounts = await this.fetch(`bank_accounts?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(bankAccount),
      headers: { "Prefer": "return=representation" }
    });
    return accounts[0];
  }
  async deleteBankAccount(id) {
    const account = await this.getBankAccount(id);
    if (!account) return false;
    await this.fetch(`bank_accounts?id=eq.${id}`, {
      method: "DELETE"
    });
    return true;
  }
  async setDefaultBankAccount(id) {
    await this.fetch("bank_accounts?is_default=eq.true", {
      method: "PATCH",
      body: JSON.stringify({ isDefault: false })
    });
    const accounts = await this.fetch(`bank_accounts?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isDefault: true }),
      headers: { "Prefer": "return=representation" }
    });
    return !!accounts[0];
  }
  // Category operations
  async getCategories() {
    return await this.fetch("categories?select=*&order=order.asc");
  }
  async getCategory(id) {
    const items = await this.fetch(`categories?id=eq.${id}`);
    return items[0];
  }
  async getCategoryBySlug(slug) {
    const items = await this.fetch(`categories?slug=eq.${slug}`);
    return items[0];
  }
  async createCategory(category) {
    const items = await this.fetch("categories", {
      method: "POST",
      body: JSON.stringify(category),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateCategory(id, category) {
    const items = await this.fetch(`categories?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(category),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateCategoriesOrder(categoryIds) {
    for (let i = 0; i < categoryIds.length; i++) {
      await this.fetch(`categories?id=eq.${categoryIds[i]}`, {
        method: "PATCH",
        body: JSON.stringify({ order: i })
      });
    }
    return true;
  }
  async deleteCategory(id) {
    await this.fetch(`categories?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Stubs for other methods (implement as needed/lazy)
  // Product operations
  async getProducts() {
    return await this.fetch("products?select=*&order=created_at.desc");
  }
  async getProductsByCategory(category) {
    return await this.fetch(`products?category=eq.${category}&select=*`);
  }
  async getProduct(id) {
    const items = await this.fetch(`products?id=eq.${id}&select=*`);
    return items[0];
  }
  async createProduct(product) {
    const items = await this.fetch("products", {
      method: "POST",
      body: JSON.stringify(product),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateProduct(id, product) {
    const items = await this.fetch(`products?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(product),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteProduct(id) {
    await this.fetch(`products?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Order operations
  async getOrders(startDate, endDate) {
    let query = "orders?select=*&order=created_at.desc";
    if (startDate) {
      query += `&created_at=gte.${startDate.toISOString()}`;
    }
    if (endDate) {
      query += `&created_at=lte.${endDate.toISOString()}`;
    }
    return await this.fetch(query);
  }
  async getOrdersWithItems(startDate, endDate) {
    let query = "orders?select=*,items:order_items(*,product:products(*))&order=created_at.desc";
    if (startDate) {
      query += `&created_at=gte.${startDate.toISOString()}`;
    }
    if (endDate) {
      query += `&created_at=lte.${endDate.toISOString()}`;
    }
    return await this.fetch(query);
  }
  async getOrder(id) {
    const items = await this.fetch(`orders?id=eq.${id}&select=*`);
    return items[0];
  }
  async getOrderWithItems(id) {
    const items = await this.fetch(`orders?id=eq.${id}&select=*,items:order_items(*,product:products(*))`);
    return items[0];
  }
  async createOrder(order, items) {
    const newOrders = await this.fetch("orders", {
      method: "POST",
      body: JSON.stringify({ ...order, status: "pending", userId: order.userId || null }),
      headers: { "Prefer": "return=representation" }
    });
    const newOrder = newOrders[0];
    if (items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        ...item,
        orderId: newOrder.id
      }));
      await this.fetch("order_items", {
        method: "POST",
        body: JSON.stringify(itemsToInsert)
      });
      for (const item of items) {
        const products = await this.fetch(`products?id=eq.${item.productId}`);
        if (products[0]) {
          const newStock = Math.max(0, products[0].stock - item.quantity);
          await this.fetch(`products?id=eq.${item.productId}`, {
            method: "PATCH",
            body: JSON.stringify({ stock: newStock })
          });
        }
      }
    }
    return newOrder;
  }
  async updateOrderStatus(id, status) {
    const items = await this.fetch(`orders?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  // Site Content
  async getSiteContents() {
    return await this.fetch("site_content?select=*");
  }
  async getSiteContentByKey(key) {
    const items = await this.fetch(`site_content?key=eq.${key}&select=*`);
    return items[0];
  }
  async createSiteContent(content) {
    const items = await this.fetch("site_content", {
      method: "POST",
      body: JSON.stringify(content),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateSiteContent(id, content) {
    const items = await this.fetch(`site_content?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...content, updatedAt: /* @__PURE__ */ new Date() }),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteSiteContent(id) {
    await this.fetch(`site_content?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Navigation
  async getNavigationItems() {
    return await this.fetch("navigation_items?select=*&order=order.asc");
  }
  async getNavigationItemsTree() {
    const items = await this.getNavigationItems();
    const topLevelItems = items.filter((item) => !item.parentId);
    const buildTree = /* @__PURE__ */ __name((parentItems) => {
      return parentItems.map((item) => {
        const children = items.filter((i) => i.parentId === item.id);
        return {
          ...item,
          children: children.length > 0 ? buildTree(children) : []
        };
      });
    }, "buildTree");
    return buildTree(topLevelItems);
  }
  async getNavigationItem(id) {
    const items = await this.fetch(`navigation_items?id=eq.${id}`);
    return items[0];
  }
  async createNavigationItem(item) {
    const items = await this.fetch("navigation_items", {
      method: "POST",
      body: JSON.stringify(item),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateNavigationItem(id, item) {
    const items = await this.fetch(`navigation_items?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateNavigationItemsOrder(itemIds) {
    for (let i = 0; i < itemIds.length; i++) {
      await this.fetch(`navigation_items?id=eq.${itemIds[i]}`, {
        method: "PATCH",
        body: JSON.stringify({ order: i })
      });
    }
    return true;
  }
  async deleteNavigationItem(id) {
    await this.fetch(`navigation_items?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Media
  async getMediaItems() {
    return await this.fetch("media_library?select=*&order=created_at.desc");
  }
  async getMediaItem(id) {
    const items = await this.fetch(`media_library?id=eq.${id}&select=*`);
    return items[0];
  }
  async createMediaItem(media) {
    const items = await this.fetch("media_library", {
      method: "POST",
      body: JSON.stringify(media),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateMediaItem(id, media) {
    const items = await this.fetch(`media_library?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(media),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteMediaItem(id) {
    await this.fetch(`media_library?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Site Settings methods
  async getSiteSettings() {
    return await this.fetch("site_settings?select=*");
  }
  async getSiteSettingByKey(key) {
    const settings = await this.fetch(`site_settings?key=eq.${key}&select=*`);
    return settings[0];
  }
  async createSiteSetting(setting) {
    const settings = await this.fetch("site_settings", {
      method: "POST",
      body: JSON.stringify(setting),
      headers: { "Prefer": "return=representation" }
    });
    return settings[0];
  }
  async updateSiteSetting(id, setting) {
    const settings = await this.fetch(`site_settings?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...setting, updatedAt: /* @__PURE__ */ new Date() }),
      headers: { "Prefer": "return=representation" }
    });
    return settings[0];
  }
  async updateSiteSettingByKey(key, value) {
    const settings = await this.fetch(`site_settings?key=eq.${key}`, {
      method: "PATCH",
      body: JSON.stringify({ value, updatedAt: /* @__PURE__ */ new Date() }),
      headers: { "Prefer": "return=representation" }
    });
    return settings[0];
  }
  // Meal Kits
  async getMealKits() {
    return await this.fetch("meal_kits?select=*");
  }
  async getMealKit(id) {
    const items = await this.fetch(`meal_kits?id=eq.${id}&select=*,components:meal_kit_components(*,product:products(*))`);
    return items[0];
  }
  async createMealKit(mealKit) {
    const items = await this.fetch("meal_kits", {
      method: "POST",
      body: JSON.stringify(mealKit),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateMealKit(id, mealKit) {
    const items = await this.fetch(`meal_kits?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(mealKit),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteMealKit(id) {
    await this.fetch(`meal_kits?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Meal Kit Components
  async getMealKitComponents(mealKitId) {
    const items = await this.fetch(`meal_kit_components?meal_kit_id=eq.${mealKitId}&select=*,product:products(*)`);
    return items;
  }
  async createMealKitComponent(component) {
    const items = await this.fetch("meal_kit_components", {
      method: "POST",
      body: JSON.stringify(component),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateMealKitComponent(id, component) {
    const items = await this.fetch(`meal_kit_components?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(component),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteMealKitComponent(id) {
    await this.fetch(`meal_kit_components?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Generated Meal Kits (Simplifying for now, might need RPC for complexity)
  async getGeneratedMealKits(userId, sessionId) {
    let query = "generated_meal_kits?select=*&order=created_at.desc";
    if (userId) query += `&user_id=eq.${userId}`;
    if (sessionId) query += `&session_id=eq.${sessionId}`;
    return await this.fetch(query);
  }
  // Stubs for complex generated meal kits which are less critical for daily admin
  getGeneratedMealKit(id) {
    throw new Error("Method not implemented.");
  }
  createGeneratedMealKit(mealKit, components) {
    throw new Error("Method not implemented.");
  }
  updateGeneratedMealKit(id, mealKit) {
    throw new Error("Method not implemented.");
  }
  deleteGeneratedMealKit(id) {
    throw new Error("Method not implemented.");
  }
  getGeneratedMealKitComponents(mealKitId) {
    throw new Error("Method not implemented.");
  }
  generateMealKit(params) {
    throw new Error("Method not implemented.");
  }
  // Service Categories
  async getServiceCategories() {
    return await this.fetch("service_categories?select=*");
  }
  async getServiceCategoryBySlug(slug) {
    const items = await this.fetch(`service_categories?slug=eq.${slug}`);
    return items[0];
  }
  async createServiceCategory(category) {
    const items = await this.fetch("service_categories", {
      method: "POST",
      body: JSON.stringify(category),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateServiceCategory(id, category) {
    const items = await this.fetch(`service_categories?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(category),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteServiceCategory(id) {
    await this.fetch(`service_categories?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Stores
  async getStores() {
    return await this.fetch("stores?select=*");
  }
  async getStoresByCategory(categoryId) {
    return await this.fetch(`stores?category_id=eq.${categoryId}`);
  }
  async getStoresByCategorySlug(slug) {
    const category = await this.getServiceCategoryBySlug(slug);
    if (!category) return [];
    return await this.getStoresByCategory(category.id);
  }
  async getStore(id) {
    const items = await this.fetch(`stores?id=eq.${id}`);
    return items[0];
  }
  async getStoreWithProducts(id) {
    const items = await this.fetch(`stores?id=eq.${id}&select=*,products(*)`);
    return items[0];
  }
  async createStore(store) {
    const items = await this.fetch("stores", {
      method: "POST",
      body: JSON.stringify(store),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateStore(id, store) {
    const items = await this.fetch(`stores?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(store),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteStore(id) {
    await this.fetch(`stores?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Non-Delivery Days
  async getNonDeliveryDays() {
    return await this.fetch("non_delivery_days?select=*&order=date.asc");
  }
  async getNonDeliveryDay(id) {
    const items = await this.fetch(`non_delivery_days?id=eq.${id}`);
    return items[0];
  }
  async createNonDeliveryDay(day) {
    const items = await this.fetch("non_delivery_days", {
      method: "POST",
      body: JSON.stringify(day),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateNonDeliveryDay(id, day) {
    const items = await this.fetch(`non_delivery_days?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(day),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteNonDeliveryDay(id) {
    await this.fetch(`non_delivery_days?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
  // Delivery Settings
  async getDeliverySettings() {
    const items = await this.fetch("delivery_settings?select=*");
    return items[0];
  }
  async updateDeliverySettings(settings) {
    const existing = await this.getDeliverySettings();
    if (existing) {
      const items = await this.fetch(`delivery_settings?id=eq.${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify(settings),
        headers: { "Prefer": "return=representation" }
      });
      return items[0];
    } else {
      const items = await this.fetch("delivery_settings", {
        method: "POST",
        body: JSON.stringify(settings),
        headers: { "Prefer": "return=representation" }
      });
      return items[0];
    }
  }
  // Footer Settings
  async getFooterSettings() {
    const items = await this.fetch("footer_settings?select=*");
    return items[0];
  }
  async updateFooterSettings(settings) {
    const existing = await this.getFooterSettings();
    if (existing) {
      const items = await this.fetch(`footer_settings?id=eq.${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify(settings),
        headers: { "Prefer": "return=representation" }
      });
      return items[0];
    } else {
      const items = await this.fetch("footer_settings", {
        method: "POST",
        body: JSON.stringify(settings),
        headers: { "Prefer": "return=representation" }
      });
      return items[0];
    }
  }
  // Reviews
  async getReviews() {
    return await this.fetch("reviews?select=*&order=created_at.desc");
  }
  async getApprovedReviews() {
    return await this.fetch("reviews?is_approved=eq.true&select=*&order=created_at.desc");
  }
  async getReview(id) {
    const items = await this.fetch(`reviews?id=eq.${id}`);
    return items[0];
  }
  async createReview(review) {
    const items = await this.fetch("reviews", {
      method: "POST",
      body: JSON.stringify(review),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async updateReview(id, review) {
    const items = await this.fetch(`reviews?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(review),
      headers: { "Prefer": "return=representation" }
    });
    return items[0];
  }
  async deleteReview(id) {
    await this.fetch(`reviews?id=eq.${id}`, { method: "DELETE" });
    return true;
  }
};
var authMiddleware = createMiddleware(async (c, next) => {
  const supabaseUrl = c.env.VITE_SUPABASE_URL || c.env.SUPABASE_URL;
  const supabaseKey = c.env.VITE_SUPABASE_ANON_KEY || c.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = c.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in middleware");
    c.set("user", null);
    await next();
    return;
  }
  const storage = new SupabaseStorage(supabaseUrl, supabaseKey, supabaseServiceKey);
  c.set("storage", storage);
  const sessionSecret = c.env.SESSION_SECRET || "gerinmah-secret-key";
  const userIdCookie = await getSignedCookie(c, sessionSecret, "auth_user_id");
  if (userIdCookie) {
    const userId = parseInt(userIdCookie);
    if (!isNaN(userId)) {
      const user = await storage.getUser(userId);
      if (user) {
        c.set("user", user);
        await next();
        return;
      }
    }
  }
  c.set("user", null);
  await next();
});
var requireAuth = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "\u04AE\u0439\u043B\u0434\u043B\u0438\u0439\u0433 \u0433\u04AF\u0439\u0446\u044D\u0442\u0433\u044D\u0445\u0438\u0439\u043D \u0442\u0443\u043B\u0434 \u043D\u044D\u0432\u0442\u0440\u044D\u0445 \u0448\u0430\u0430\u0440\u0434\u043B\u0430\u0433\u0430\u0442\u0430\u0439" }, 401);
  }
  await next();
});
var requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "\u04AE\u0439\u043B\u0434\u043B\u0438\u0439\u0433 \u0433\u04AF\u0439\u0446\u044D\u0442\u0433\u044D\u0445\u0438\u0439\u043D \u0442\u0443\u043B\u0434 \u043D\u044D\u0432\u0442\u0440\u044D\u0445 \u0448\u0430\u0430\u0440\u0434\u043B\u0430\u0433\u0430\u0442\u0430\u0439" }, 401);
  }
  if (!user.isAdmin) {
    return c.json({ message: "\u0417\u04E9\u0432\u0445\u04E9\u043D \u0430\u0434\u043C\u0438\u043D \u0445\u0430\u043D\u0434\u0430\u0445 \u0431\u043E\u043B\u043E\u043C\u0436\u0442\u043E\u0439" }, 403);
  }
  await next();
});
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const hashHex = Array.from(new Uint8Array(exportedKey)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hashHex}.${saltHex}`;
}
__name(hashPassword, "hashPassword");
async function comparePasswords(supplied, stored) {
  try {
    if (!stored || !stored.includes(".")) return false;
    const [storedHash, storedSaltHex] = stored.split(".");
    if (!storedHash || !storedSaltHex) return false;
    const salt = new Uint8Array(storedSaltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(supplied),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 1e5,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exportedKey = await crypto.subtle.exportKey("raw", key);
    const derivedHashHex = Array.from(new Uint8Array(exportedKey)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return derivedHashHex === storedHash;
  } catch (error3) {
    console.error("Error comparing passwords:", error3);
    return false;
  }
}
__name(comparePasswords, "comparePasswords");
var app = new Hono2();
async function setUserSession(c, userId) {
  const secret = c.env.SESSION_SECRET || "gerinmah-secret-key";
  await setSignedCookie(c, "auth_user_id", userId.toString(), secret, {
    path: "/",
    secure: true,
    // Always true in Cloudflare (HTTPS)
    domain: void 0,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60,
    // 30 days
    sameSite: "Lax"
  });
  c.header("Set-Cookie", `sessionActive=true; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax`, { append: true });
}
__name(setUserSession, "setUserSession");
app.post("/login", async (c) => {
  try {
    const storage = c.get("storage");
    const body = await c.req.json().catch((e) => null);
    if (!body) {
      return c.json({ success: false, message: "Invalid JSON body" }, 400);
    }
    const { username, password } = body;
    console.log(`[Login] Attempt for username: ${username}`);
    if (!username || !password) {
      return c.json({ success: false, message: "Username and password are required" }, 400);
    }
    let user = await storage.getUserByUsername(username);
    if (!user && username.includes("@")) {
      user = await storage.getUserByEmail(username);
    }
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 401);
    }
    let isValid = false;
    try {
      isValid = await comparePasswords(password, user.password);
    } catch (e) {
      return c.json({
        success: false,
        message: "Password verification crashed",
        error: e.message
      }, 500);
    }
    if (!isValid) {
      return c.json({
        success: false,
        message: "Invalid password",
        debug: {
          storedHashPrefix: user.password.substring(0, 15)
        }
      }, 401);
    }
    await setUserSession(c, user.id);
    const { password: _, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error3) {
    console.error("[Login] Unexpected error:", error3);
    return c.json({
      success: false,
      message: "Internal Server Error",
      error: error3.message,
      stack: error3.stack
    }, 500);
  }
});
app.post("/admin/login", async (c) => {
  try {
    const storage = c.get("storage");
    const body = await c.req.json().catch((e) => null);
    if (!body) {
      return c.json({ success: false, message: "Invalid JSON body" }, 400);
    }
    const { username, password } = body;
    console.log(`[Admin Login] Attempt for username: ${username}`);
    if (!username || !password) {
      return c.json({ success: false, message: "Username and password are required" }, 400);
    }
    let user = await storage.getUserByUsername(username);
    if (!user && username.includes("@")) {
      user = await storage.getUserByEmail(username);
    }
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 401);
    }
    let isValid = false;
    try {
      isValid = await comparePasswords(password, user.password);
    } catch (e) {
      return c.json({
        success: false,
        message: "Password verification crashed",
        error: e.message
      }, 500);
    }
    if (!isValid) {
      return c.json({ success: false, message: "Invalid password" }, 401);
    }
    if (!user.isAdmin) {
      console.log(`[Admin Login] User ${username} is not an admin`);
      return c.json({ success: false, message: "Not authorized as admin" }, 403);
    }
    await setUserSession(c, user.id);
    const { password: _, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error3) {
    console.error("[Admin Login] Unexpected error:", error3);
    return c.json({
      success: false,
      message: "Internal Server Error",
      error: error3.message
    }, 500);
  }
});
app.get("/admin/check-auth", (c) => {
  const user = c.get("user");
  if (user && user.isAdmin) {
    return c.json({ authenticated: true, user });
  }
  return c.json({ authenticated: false }, 401);
});
app.post("/auth/sync-session", async (c) => {
  try {
    const body = await c.req.json().catch((e) => null);
    if (!body || !body.access_token) {
      return c.json({ success: false, message: "Missing access token" }, 400);
    }
    const { access_token } = body;
    const supabaseUrl = c.env.VITE_SUPABASE_URL || c.env.SUPABASE_URL;
    const supabaseAnonKey = c.env.VITE_SUPABASE_ANON_KEY || c.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = c.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase credentials missing in Worker env");
      return c.json({ success: false, message: "Server configuration error" }, 500);
    }
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${access_token}`
      }
    });
    if (!authResponse.ok) {
      const error3 = await authResponse.text();
      console.error("Supabase token verification failed:", error3);
      return c.json({ success: false, message: "Invalid token" }, 401);
    }
    const authData = await authResponse.json();
    if (!authData || !authData.email) {
      return c.json({ success: false, message: "Invalid token data" }, 401);
    }
    const dbAuthHeader = supabaseServiceKey ? `Bearer ${supabaseServiceKey}` : `Bearer ${access_token}`;
    console.log(`[Sync Session] Checking user ${authData.email} with ${supabaseServiceKey ? "Service Key" : "Access Token"}`);
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(authData.email)}&select=id,username,email,name,is_admin`,
      {
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": dbAuthHeader,
          "Content-Type": "application/json"
        }
      }
    );
    if (!dbResponse.ok) {
      const error3 = await dbResponse.text();
      console.error("Supabase DB query failed:", error3);
      if (dbResponse.status === 401 || dbResponse.status === 403) {
        return c.json({ success: false, message: "Database permission denied (RLS). Please contact admin." }, 403);
      }
      return c.json({ success: false, message: "Database error" }, 500);
    }
    const users = await dbResponse.json();
    if (!users || users.length === 0) {
      console.warn(`[Sync Session] User ${authData.email} authenticated but not found in public.users table.`);
      return c.json({ success: false, message: "User record not found in system (public.users)" }, 401);
    }
    const localUser = users[0];
    if (!localUser.is_admin) {
      console.warn(`[Sync Session] User ${authData.email} is not an admin.`);
      return c.json({ success: false, message: "Not authorized as admin" }, 403);
    }
    await setUserSession(c, localUser.id);
    return c.json({ success: true, user: localUser });
  } catch (e) {
    console.error("Sync session error:", e);
    return c.json({ success: false, message: "Internal Error", error: e.message }, 500);
  }
});
app.post("/register", async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  if (!body.username || !body.email || !body.password) {
    return c.json({ success: false, message: "Required fields missing" }, 400);
  }
  const existingUser = await storage.getUserByUsername(body.username);
  if (existingUser) {
    return c.json({ success: false, message: "\u042D\u043D\u044D \u0445\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447\u0438\u0439\u043D \u043D\u044D\u0440 \u0430\u043B\u044C \u0445\u044D\u0434\u0438\u0439\u043D \u0431\u04AF\u0440\u0442\u0433\u044D\u0433\u0434\u0441\u044D\u043D \u0431\u0430\u0439\u043D\u0430" }, 400);
  }
  const existingEmail = await storage.getUserByEmail(body.email);
  if (existingEmail) {
    return c.json({ success: false, message: "\u042D\u043D\u044D \u0438-\u043C\u044D\u0439\u043B \u0445\u0430\u044F\u0433 \u0430\u043B\u044C \u0445\u044D\u0434\u0438\u0439\u043D \u0431\u04AF\u0440\u0442\u0433\u044D\u0433\u0434\u0441\u044D\u043D \u0431\u0430\u0439\u043D\u0430" }, 400);
  }
  const hashedPassword = await hashPassword(body.password);
  const newUser = await storage.createUser({
    username: body.username,
    email: body.email,
    password: hashedPassword,
    name: body.name || "",
    phone: body.phone || null
  });
  await setUserSession(c, newUser.id);
  const { password: _, ...userWithoutPassword } = newUser;
  console.log(`Welcome email would be sent to ${newUser.email}`);
  return c.json({
    success: true,
    user: userWithoutPassword,
    message: "\u0411\u04AF\u0440\u0442\u0433\u044D\u043B \u0430\u043C\u0436\u0438\u043B\u0442\u0442\u0430\u0439 \u04AF\u04AF\u0441\u0433\u044D\u0433\u0434\u043B\u044D\u044D"
  }, 201);
});
app.post("/logout", async (c) => {
  deleteCookie(c, "auth_user_id", { path: "/" });
  deleteCookie(c, "sessionActive", { path: "/" });
  deleteCookie(c, "gerinmah.sid", { path: "/" });
  return c.json({ success: true, message: "\u0410\u043C\u0436\u0438\u043B\u0442\u0442\u0430\u0439 \u0433\u0430\u0440\u043B\u0430\u0430" });
});
app.get("/user", (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "\u04AE\u0439\u043B\u0434\u043B\u0438\u0439\u0433 \u0433\u04AF\u0439\u0446\u044D\u0442\u0433\u044D\u0445\u0438\u0439\u043D \u0442\u0443\u043B\u0434 \u043D\u044D\u0432\u0442\u0440\u044D\u0445 \u0448\u0430\u0430\u0440\u0434\u043B\u0430\u0433\u0430\u0442\u0430\u0439" }, 401);
  }
  const { password: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword);
});
app.get("/setup-admin", async (c) => {
  try {
    const storage = c.get("storage");
    const NEW_PASSWORD = "admin123";
    const hashedPassword = await hashPassword(NEW_PASSWORD);
    const result = await c.env.DB.prepare(
      "UPDATE users SET password = ? WHERE email = 'jaytour247@gmail.com'"
    ).bind(hashedPassword).run();
    const user = await storage.getUserByEmail("jaytour247@gmail.com");
    return c.json({
      message: "Admin password reset successfully",
      success: result.success,
      newHashPrefix: hashedPassword.substring(0, 10),
      storedHashPrefix: user?.password.substring(0, 10),
      match: user ? user.password === hashedPassword : false
    });
  } catch (err) {
    return c.json({ error: err.message, stack: err.stack }, 500);
  }
});
app.get("/user/orders", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "\u0417\u0430\u0445\u0438\u0430\u043B\u0433\u044B\u043D \u0442\u04AF\u04AF\u0445\u0438\u0439\u0433 \u0445\u0430\u0440\u0430\u0445\u044B\u043D \u0442\u0443\u043B\u0434 \u043D\u044D\u0432\u0442\u0440\u044D\u0445 \u0448\u0430\u0430\u0440\u0434\u043B\u0430\u0433\u0430\u0442\u0430\u0439" }, 401);
  }
  const storage = c.get("storage");
  const orders = await storage.getUserOrders(user.id);
  return c.json(orders);
});
var auth_default = app;
var app2 = new Hono2();
app2.get("/", async (c) => {
  const storage = c.get("storage");
  const category = c.req.query("category");
  if (category) {
    const products2 = await storage.getProductsByCategory(category);
    return c.json(products2);
  }
  const products = await storage.getProducts();
  return c.json(products);
});
app2.get("/:id", async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const product = await storage.getProduct(id);
  if (!product) {
    return c.json({ message: "Product not found" }, 404);
  }
  return c.json(product);
});
app2.post("/", requireAdmin, async (c) => {
  const storage = c.get("storage");
  let body = {};
  let parsedData = {};
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("application/json")) {
    parsedData = await c.req.json();
  } else if (contentType.includes("multipart/form-data")) {
    body = await c.req.parseBody();
    if (body["productData"] && typeof body["productData"] === "string") {
      parsedData = JSON.parse(body["productData"]);
    }
  }
  const file = body["image"] || body["file"];
  let imageUrl = "";
  if (file && file instanceof File) {
    const fileName = `products/${Date.now()}_${file.name}`;
    imageUrl = await storage.uploadFile("media", fileName, file);
  } else if (typeof body["imageUrl"] === "string") {
    imageUrl = body["imageUrl"];
  }
  try {
    const productData = {
      name: parsedData.name || body["name"],
      nameRu: parsedData.nameRu || parsedData.name_ru || body["nameRu"] || body["name_ru"] || "",
      nameEn: parsedData.nameEn || parsedData.name_en || body["nameEn"] || body["name_en"] || "",
      description: parsedData.description || body["description"] || "",
      descriptionRu: parsedData.descriptionRu || parsedData.description_ru || body["descriptionRu"] || body["description_ru"] || "",
      descriptionEn: parsedData.descriptionEn || parsedData.description_en || body["descriptionEn"] || body["description_en"] || "",
      price: parseFloat(parsedData.price || body["price"] || "0"),
      category: parsedData.category || body["category"],
      imageUrl: imageUrl || parsedData.imageUrl || parsedData.image_url || body["imageUrl"] || body["image_url"] || "",
      stock: parseInt(parsedData.stock || body["stock"] || "999"),
      minOrderQuantity: parseFloat(parsedData.minOrderQuantity || parsedData.min_order_quantity || body["minOrderQuantity"] || body["min_order_quantity"] || "1"),
      storeId: parsedData.storeId ? parseInt(parsedData.storeId) : parsedData.store_id ? parseInt(parsedData.store_id) : body["storeId"] ? parseInt(body["storeId"]) : body["store_id"] ? parseInt(body["store_id"]) : void 0
    };
    console.log("Creating product with data:", JSON.stringify(productData));
    if (!productData.name || !productData.category) {
      return c.json({ message: "Product name and category are required" }, 400);
    }
    const newProduct = await storage.createProduct(productData);
    return c.json(newProduct, 201);
  } catch (error3) {
    console.error("Error creating product:", error3);
    return c.json({
      message: "Error creating product",
      error: error3.message,
      stack: error3.stack
    }, 500);
  }
});
app2.put("/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  let body = {};
  let parsedData = {};
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("application/json")) {
    parsedData = await c.req.json();
  } else if (contentType.includes("multipart/form-data")) {
    body = await c.req.parseBody();
    if (body["productData"] && typeof body["productData"] === "string") {
      parsedData = JSON.parse(body["productData"]);
    }
  }
  const file = body["image"] || body["file"];
  const updateData = {
    name: parsedData.name || body["name"],
    nameRu: parsedData.nameRu || body["nameRu"] || "",
    nameEn: parsedData.nameEn || body["nameEn"] || "",
    description: parsedData.description || body["description"] || "",
    descriptionRu: parsedData.descriptionRu || body["descriptionRu"] || "",
    descriptionEn: parsedData.descriptionEn || body["descriptionEn"] || "",
    category: parsedData.category || body["category"],
    imageUrl: parsedData.imageUrl || body["imageUrl"] || ""
  };
  if (parsedData.price || body["price"]) {
    updateData.price = parseFloat(parsedData.price || body["price"]);
  }
  if (parsedData.stock || body["stock"]) {
    updateData.stock = parseInt(parsedData.stock || body["stock"]);
  }
  if (parsedData.minOrderQuantity || parsedData.min_order_quantity || body["minOrderQuantity"] || body["min_order_quantity"]) {
    updateData.minOrderQuantity = parseFloat(parsedData.minOrderQuantity || parsedData.min_order_quantity || body["minOrderQuantity"] || body["min_order_quantity"]);
  }
  if (parsedData.storeId || parsedData.store_id || body["storeId"] || body["store_id"]) {
    updateData.storeId = parseInt(parsedData.storeId || parsedData.store_id || body["storeId"] || body["store_id"]);
  }
  try {
    if (file && file instanceof File) {
      const fileName = `products/${Date.now()}_${file.name}`;
      updateData.imageUrl = await storage.uploadFile("media", fileName, file);
    }
    const updatedProduct = await storage.updateProduct(id, updateData);
    if (!updatedProduct) {
      return c.json({ message: "Product not found" }, 404);
    }
    return c.json(updatedProduct);
  } catch (error3) {
    console.error("Error updating product:", error3);
    return c.json({
      message: "Error updating product",
      error: error3.message,
      stack: error3.stack
    }, 500);
  }
});
app2.delete("/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteProduct(id);
  if (!success) {
    return c.json({ message: "Product not found" }, 404);
  }
  return c.json({ success: true });
});
var products_default = app2;
var app3 = new Hono2();
app3.get("/categories", async (c) => {
  const storage = c.get("storage");
  const categories = await storage.getCategories();
  return c.json(categories);
});
app3.get("/categories/:slug", async (c) => {
  const storage = c.get("storage");
  const slug = c.req.param("slug");
  const category = await storage.getCategoryBySlug(slug);
  if (!category) {
    return c.json({ message: "Category not found" }, 404);
  }
  return c.json(category);
});
app3.post("/categories", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const category = await storage.createCategory(body);
  return c.json(category, 201);
});
app3.patch("/categories/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const category = await storage.updateCategory(id, body);
  if (!category) return c.json({ message: "Category not found" }, 404);
  return c.json(category);
});
app3.delete("/categories/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteCategory(id);
  if (!success) return c.json({ message: "Category not found" }, 404);
  return c.json({ success: true });
});
app3.post("/categories/reorder", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const { ids } = await c.req.json();
  const success = await storage.updateCategoriesOrder(ids);
  return c.json({ success });
});
app3.get("/meal-kits", async (c) => {
  const storage = c.get("storage");
  const mealKits = await storage.getMealKits();
  return c.json(mealKits);
});
app3.get("/meal-kits/:id", async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const mealKit = await storage.getMealKit(id);
  if (!mealKit) return c.json({ message: "Meal kit not found" }, 404);
  return c.json(mealKit);
});
app3.post("/meal-kits", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const mealKit = await storage.createMealKit(body);
  return c.json(mealKit, 201);
});
app3.patch("/meal-kits/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const mealKit = await storage.updateMealKit(id, body);
  if (!mealKit) return c.json({ message: "Meal kit not found" }, 404);
  return c.json(mealKit);
});
app3.delete("/meal-kits/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteMealKit(id);
  if (!success) return c.json({ message: "Meal kit not found" }, 404);
  return c.json({ success: true });
});
app3.post("/meal-kit-components", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const component = await storage.createMealKitComponent(body);
  return c.json(component, 201);
});
app3.patch("/meal-kit-components/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const component = await storage.updateMealKitComponent(id, body);
  if (!component) return c.json({ message: "Component not found" }, 404);
  return c.json(component);
});
app3.delete("/meal-kit-components/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteMealKitComponent(id);
  if (!success) return c.json({ message: "Component not found" }, 404);
  return c.json({ success: true });
});
app3.post("/generated-meal-kits/generate", async (c) => {
  const storage = c.get("storage");
  const user = c.get("user");
  const body = await c.req.json();
  const generatedKit = await storage.generateMealKit({
    ...body,
    userId: user?.id
  });
  return c.json(generatedKit, 201);
});
app3.get("/generated-meal-kits", async (c) => {
  const storage = c.get("storage");
  const user = c.get("user");
  const sessionId = c.req.query("sessionId");
  const kits = await storage.getGeneratedMealKits(user?.id, sessionId);
  return c.json(kits);
});
app3.get("/generated-meal-kits/:id", async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const kit = await storage.getGeneratedMealKit(id);
  if (!kit) return c.json({ message: "Generated meal kit not found" }, 404);
  return c.json(kit);
});
app3.get("/service-categories", async (c) => {
  const storage = c.get("storage");
  const categories = await storage.getServiceCategories();
  return c.json(categories);
});
app3.get("/service-categories/:slug", async (c) => {
  const storage = c.get("storage");
  const slug = c.req.param("slug");
  const category = await storage.getServiceCategoryBySlug(slug);
  if (!category) return c.json({ message: "Category not found" }, 404);
  return c.json(category);
});
app3.get("/stores", async (c) => {
  const storage = c.get("storage");
  const categoryId = c.req.query("categoryId");
  if (categoryId) {
    const stores2 = await storage.getStoresByCategory(parseInt(categoryId));
    return c.json(stores2);
  }
  const stores = await storage.getStores();
  return c.json(stores);
});
app3.get("/stores/:id", async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const store = await storage.getStoreWithProducts(id);
  if (!store) return c.json({ message: "Store not found" }, 404);
  return c.json(store);
});
app3.get("/reviews", async (c) => {
  const storage = c.get("storage");
  const reviews = await storage.getApprovedReviews();
  return c.json(reviews);
});
app3.post("/reviews", requireAuth, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const user = c.get("user");
  const review = await storage.createReview({
    ...body,
    userId: user.id
  });
  return c.json(review, 201);
});
app3.get("/admin/reviews", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const reviews = await storage.getReviews();
  return c.json(reviews);
});
app3.patch("/admin/reviews/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const review = await storage.updateReview(id, body);
  if (!review) return c.json({ message: "Review not found" }, 404);
  return c.json(review);
});
app3.delete("/admin/reviews/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteReview(id);
  if (!success) return c.json({ message: "Review not found" }, 404);
  return c.json({ success: true });
});
var shop_default = app3;
var app4 = new Hono2();
app4.get("/orders", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const startDateStr = c.req.query("startDate");
  const endDateStr = c.req.query("endDate");
  const startDate = startDateStr ? new Date(startDateStr) : void 0;
  const endDate = endDateStr ? new Date(endDateStr) : void 0;
  const orders = await storage.getOrdersWithItems(startDate, endDate);
  return c.json(orders);
});
app4.get("/orders/:id", requireAuth, async (c) => {
  const storage = c.get("storage");
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  const order = await storage.getOrderWithItems(id);
  if (!order) {
    return c.json({ message: "Order not found" }, 404);
  }
  if (!user.isAdmin && order.userId !== user.id) {
    return c.json({ message: "Unauthorized" }, 403);
  }
  return c.json(order);
});
app4.post("/orders", async (c) => {
  const storage = c.get("storage");
  const user = c.get("user");
  const body = await c.req.json();
  let orderData;
  let items;
  if (body.orderData && body.cartItems) {
    orderData = body.orderData;
    items = body.cartItems;
  } else if (body.items) {
    const { items: bodyItems, ...rest } = body;
    orderData = rest;
    items = bodyItems;
  } else {
    return c.json({ message: "Order must have items" }, 400);
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return c.json({ message: "Order must have items" }, 400);
  }
  try {
    const order = await storage.createOrder({
      ...orderData,
      userId: user?.id || null
      // Allow guest checkout if userId provided or null
    }, items);
    return c.json(order, 201);
  } catch (error3) {
    console.error("Order creation failed:", error3);
    return c.json({ message: "Order creation failed" }, 500);
  }
});
app4.patch("/orders/:id/status", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const { status } = await c.req.json();
  const order = await storage.updateOrderStatus(id, status);
  if (!order) return c.json({ message: "Order not found" }, 404);
  return c.json(order);
});
app4.get("/bank-accounts", async (c) => {
  const storage = c.get("storage");
  const accounts = await storage.getBankAccounts();
  return c.json(accounts);
});
app4.get("/bank-accounts/default", async (c) => {
  const storage = c.get("storage");
  const account = await storage.getDefaultBankAccount();
  if (!account) return c.json({ message: "No default account" }, 404);
  return c.json(account);
});
app4.post("/bank-accounts", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const account = await storage.createBankAccount(body);
  return c.json(account, 201);
});
app4.patch("/bank-accounts/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const account = await storage.updateBankAccount(id, body);
  if (!account) return c.json({ message: "Account not found" }, 404);
  return c.json(account);
});
app4.delete("/bank-accounts/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteBankAccount(id);
  if (!success) return c.json({ message: "Account not found or is default" }, 400);
  return c.json({ success: true });
});
app4.post("/bank-accounts/:id/set-default", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.setDefaultBankAccount(id);
  if (!success) return c.json({ message: "Failed to set default" }, 500);
  return c.json({ success: true });
});
app4.get("/delivery-settings", async (c) => {
  const storage = c.get("storage");
  const settings = await storage.getDeliverySettings();
  if (!settings) return c.json({
    cutoffHour: 18,
    cutoffMinute: 30,
    processingDays: 1
  });
  return c.json(settings);
});
app4.put("/delivery-settings", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const settings = await storage.updateDeliverySettings(body);
  return c.json(settings);
});
app4.get("/non-delivery-days", async (c) => {
  const storage = c.get("storage");
  const days = await storage.getNonDeliveryDays();
  return c.json(days);
});
app4.post("/non-delivery-days", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const day = await storage.createNonDeliveryDay(body);
  return c.json(day, 201);
});
app4.delete("/non-delivery-days/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteNonDeliveryDay(id);
  if (!success) return c.json({ message: "Day not found" }, 404);
  return c.json({ success: true });
});
var orders_default = app4;
var app5 = new Hono2();
app5.get("/site-content", async (c) => {
  const storage = c.get("storage");
  const content = await storage.getSiteContents();
  return c.json(content);
});
app5.get("/site-content/:key", async (c) => {
  const storage = c.get("storage");
  const key = c.req.param("key");
  const content = await storage.getSiteContentByKey(key);
  if (!content) return c.json({ message: "Content not found" }, 404);
  return c.json(content);
});
app5.post("/site-content", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const content = await storage.createSiteContent(body);
  return c.json(content, 201);
});
app5.patch("/site-content/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const content = await storage.updateSiteContent(id, body);
  if (!content) return c.json({ message: "Content not found" }, 404);
  return c.json(content);
});
app5.delete("/site-content/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteSiteContent(id);
  if (!success) return c.json({ message: "Content not found" }, 404);
  return c.json({ success: true });
});
app5.get("/navigation", async (c) => {
  const storage = c.get("storage");
  const items = await storage.getNavigationItemsTree();
  return c.json(items);
});
app5.post("/navigation", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const item = await storage.createNavigationItem(body);
  return c.json(item, 201);
});
app5.patch("/navigation/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const item = await storage.updateNavigationItem(id, body);
  if (!item) return c.json({ message: "Item not found" }, 404);
  return c.json(item);
});
app5.delete("/navigation/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteNavigationItem(id);
  if (!success) return c.json({ message: "Item not found" }, 404);
  return c.json({ success: true });
});
app5.post("/navigation/reorder", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const { ids } = await c.req.json();
  const success = await storage.updateNavigationItemsOrder(ids);
  return c.json({ success });
});
app5.get("/site-settings", async (c) => {
  const storage = c.get("storage");
  const settings = await storage.getSiteSettings();
  return c.json(settings);
});
app5.get("/site-settings/:key", async (c) => {
  const storage = c.get("storage");
  const key = c.req.param("key");
  const setting = await storage.getSiteSettingByKey(key);
  if (!setting) return c.json({ message: "Setting not found" }, 404);
  return c.json(setting);
});
app5.post("/site-settings", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const setting = await storage.createSiteSetting(body);
  return c.json(setting, 201);
});
app5.patch("/site-settings/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const setting = await storage.updateSiteSetting(id, body);
  if (!setting) return c.json({ message: "Setting not found" }, 404);
  return c.json(setting);
});
app5.get("/settings/footer", async (c) => {
  const storage = c.get("storage");
  const settings = await storage.getFooterSettings();
  return c.json(settings || {});
});
app5.put("/settings/footer", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const settings = await storage.updateFooterSettings(body);
  return c.json(settings);
});
app5.get("/settings/site-name", async (c) => {
  const storage = c.get("storage");
  const setting = await storage.getSiteSettingByKey("site_name");
  if (!setting) {
    return c.json({ siteName: "Nice Meat \u043C\u0430\u0445\u043D\u044B \u0434\u044D\u043B\u0433\u04AF\u04AF\u0440" });
  }
  return c.json({ siteName: setting.value });
});
app5.put("/settings/site-name", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const { siteName } = body;
  const existing = await storage.getSiteSettingByKey("site_name");
  if (existing) {
    await storage.updateSiteSettingByKey("site_name", siteName);
  } else {
    await storage.createSiteSetting({ key: "site_name", value: siteName });
  }
  return c.json({ siteName });
});
app5.get("/settings/shipping-fee", async (c) => {
  const storage = c.get("storage");
  const setting = await storage.getSiteSettingByKey("shipping_fee");
  if (!setting) {
    return c.json({ value: "0" });
  }
  return c.json({ value: setting.value });
});
app5.put("/settings/shipping-fee", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();
  const { value } = body;
  const existing = await storage.getSiteSettingByKey("shipping_fee");
  if (existing) {
    await storage.updateSiteSettingByKey("shipping_fee", value);
  } else {
    await storage.createSiteSetting({
      key: "shipping_fee",
      value,
      description: "\uBC30\uC1A1\uBE44 \uC124\uC815"
    });
  }
  return c.json({ value });
});
app5.get("/media", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const items = await storage.getMediaItems();
  return c.json(items);
});
app5.get("/settings/hero", async (c) => {
  const storage = c.get("storage");
  const setting = await storage.getSiteSettingByKey("hero_settings");
  if (!setting) {
    return c.json({
      title: "",
      text: "",
      imageUrl: ""
    });
  }
  try {
    return c.json(JSON.parse(setting.value));
  } catch (e) {
    return c.json({});
  }
});
app5.put("/settings/hero", requireAdmin, async (c) => {
  const storage = c.get("storage");
  try {
    const body = await c.req.json();
    if (!body.slides || !Array.isArray(body.slides)) {
    }
    const heroData = {
      slides: body.slides
      // Array of { title, text, imageUrl }
    };
    const existing = await storage.getSiteSettingByKey("hero_settings");
    if (existing) {
      await storage.updateSiteSettingByKey("hero_settings", JSON.stringify(heroData));
    } else {
      await storage.createSiteSetting({
        key: "hero_settings",
        value: JSON.stringify(heroData)
      });
    }
    return c.json(heroData);
  } catch (error3) {
    console.error("Error updating hero settings:", error3);
    return c.json({
      message: "Failed to update hero settings",
      error: error3.message
    }, 500);
  }
});
app5.post("/media", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    return c.json({ message: "No file uploaded" }, 400);
  }
  const fileName = `media/${Date.now()}_${file.name}`;
  const url = await storage.uploadFile("media", fileName, file);
  const mediaItem = await storage.createMediaItem({
    name: file.name,
    url,
    type: file.type,
    size: file.size
  });
  return c.json(mediaItem, 201);
});
app5.delete("/media/:id", requireAdmin, async (c) => {
  const storage = c.get("storage");
  const id = parseInt(c.req.param("id"));
  const success = await storage.deleteMediaItem(id);
  if (!success) return c.json({ message: "Item not found" }, 404);
  return c.json({ success: true });
});
var cms_default = app5;
var app6 = new Hono2();
app6.use("*", logger());
app6.use("*", cors({
  origin: /* @__PURE__ */ __name((origin) => origin, "origin"),
  // Allow all origins for now
  credentials: true
}));
app6.use("/api/*", authMiddleware);
app6.route("/api", auth_default);
app6.route("/api/products", products_default);
app6.route("/api", shop_default);
app6.route("/api", orders_default);
app6.route("/api", cms_default);
app6.get("/uploads/*", (c) => {
  return c.text("Not Found (Use Supabase Storage URLs)", 404);
});
app6.onError((err, c) => {
  console.error("Global Error Handler:", err);
  return c.json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: true ? err.stack : void 0
  }, 500);
});
app6.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});
var index_default = app6;

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../../.wrangler/tmp/bundle-1pK937/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../../.wrangler/tmp/bundle-1pK937/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=bundledWorker-0.5972139588365672.mjs.map
