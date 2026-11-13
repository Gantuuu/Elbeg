import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppInstallController } from "./app-install";

function browser({ standalone = false, iosStandalone = false, native = false } = {}) {
  const displayMode = Object.assign(new EventTarget(), { matches: standalone });
  const target = Object.assign(new EventTarget(), {
    navigator: { standalone: iosStandalone },
    matchMedia: () => displayMode,
  });
  const controller = createAppInstallController(target as unknown as Window, native);
  return { target, displayMode, controller };
}

function installEvent(outcome: "accepted" | "dismissed" = "accepted") {
  let calls = 0;
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: async () => { calls++; },
    userChoice: Promise.resolve({ outcome }),
  });
  return { event, calls: () => calls };
}

test("retains an install event received before the banner subscribes", () => {
  const { target, controller } = browser();
  const { event } = installEvent();
  target.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(controller.getSnapshot().canPrompt, true);
  controller.dispose();
});

test("rapid clicks consume a prompt once and acceptance hides the banner", async () => {
  const { target, controller } = browser();
  const { event, calls } = installEvent();
  target.dispatchEvent(event);
  const [first, second] = await Promise.all([controller.install(), controller.install()]);
  assert.equal(first, "accepted");
  assert.equal(second, "unavailable");
  assert.equal(calls(), 1);
  assert.equal(controller.getSnapshot().isInstalled, true);
  assert.equal(controller.getSnapshot().canPrompt, false);
  controller.dispose();
});

test("cancelling installation does not claim success and permits a fresh browser event", async () => {
  const { target, controller } = browser();
  target.dispatchEvent(installEvent("dismissed").event);
  assert.equal(await controller.install(), "dismissed");
  assert.equal(controller.getSnapshot().isInstalled, false);
  assert.equal(await controller.install(), "unavailable");
  target.dispatchEvent(installEvent().event);
  assert.equal(await controller.install(), "accepted");
  controller.dispose();
});

test("a rejected browser prompt falls back to instructions", async () => {
  const { target, controller } = browser();
  const { event } = installEvent();
  event.prompt = async () => { throw new Error("Browser does not allow installation"); };
  target.dispatchEvent(event);
  assert.equal(await controller.install(), "unavailable");
  assert.equal(controller.getSnapshot().isInstalled, false);
  assert.equal(controller.getSnapshot().canPrompt, false);
  controller.dispose();
});

test("installation through browser chrome also hides the banner", async () => {
  const { target, controller } = browser();
  target.dispatchEvent(installEvent().event);
  target.dispatchEvent(new Event("appinstalled"));
  assert.equal(controller.getSnapshot().isInstalled, true);
  assert.equal(await controller.install(), "unavailable");
  const lateEvent = installEvent().event;
  target.dispatchEvent(lateEvent);
  assert.equal(lateEvent.defaultPrevented, false);
  controller.dispose();
});

test("standalone and native apps do not offer installation", async () => {
  for (const options of [{ standalone: true }, { iosStandalone: true }, { native: true }]) {
    const { target, controller } = browser(options);
    const { event, calls } = installEvent();
    target.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    assert.equal(controller.getSnapshot().canPrompt, false);
    assert.equal(await controller.install(), "unavailable");
    assert.equal(calls(), 0);
    controller.dispose();
  }
});

test("switching into standalone mode clears an outstanding install prompt", () => {
  const { target, displayMode, controller } = browser();
  target.dispatchEvent(installEvent().event);
  displayMode.matches = true;
  displayMode.dispatchEvent(new Event("change"));
  assert.equal(controller.getSnapshot().isStandalone, true);
  assert.equal(controller.getSnapshot().canPrompt, false);
  controller.dispose();
});

test("unsubscribing and HMR cleanup remove observers", () => {
  const { target, controller } = browser();
  let updates = 0;
  const unsubscribe = controller.subscribe(() => updates++);
  target.dispatchEvent(installEvent().event);
  assert.equal(updates, 1);
  unsubscribe();
  target.dispatchEvent(new Event("appinstalled"));
  assert.equal(updates, 1);
  controller.dispose();
  const event = installEvent().event;
  target.dispatchEvent(event);
  assert.equal(event.defaultPrevented, false);
});
