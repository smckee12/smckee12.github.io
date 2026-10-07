// Browser regression checks for loading failures and the plain Jekyll pages.
// No dependencies: Node 22+ supplies WebSocket; Chromium supplies the browser.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.PORTFOLIO_TEST_URL ||
  (process.env.REPLIT_DEV_DOMAIN && `https://${process.env.REPLIT_DEV_DOMAIN}`);
assert(base, "Set PORTFOLIO_TEST_URL to the running Jekyll preview URL.");
const origin = new URL(base).origin;
const pages = [
  { path: "/", heading: "Ideas into action.", last: "Good conversations start somewhere." },
  { path: "/about/", heading: "More than a job title.", last: "A few other things." },
  { path: "/experience/", heading: "Work that moves things forward.", last: "United States Army" },
  { path: "/contact/", heading: "Let's start a conversation.", last: "Connect on LinkedIn" }
];
const profile = await mkdtemp(join(tmpdir(), "portfolio-fallback-"));
const browser = spawn(process.env.CHROMIUM_PATH || "chromium", [
  "--headless", "--no-sandbox", "--disable-dev-shm-usage",
  "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"
], { stdio: ["ignore", "ignore", "pipe"] });
let browserErrors = "";
browser.stderr.on("data", chunk => { browserErrors += chunk; });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function until(check, description, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await check();
    if (result) return result;
    await sleep(50);
  }
  throw new Error(`Timed out: ${description}`);
}

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
        else pending.resolve(message.result);
      } else {
        for (const callback of this.listeners.get(message.method) || []) {
          callback(message.params);
        }
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 15000);
      this.pending.set(id, {
        resolve: result => { clearTimeout(timer); resolve(result); },
        reject: error => { clearTimeout(timer); reject(error); }
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, callback) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), callback]);
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true
    });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
}

let cdp;
try {
  const port = await until(async () => {
    assert(browser.exitCode === null, `Chromium exited: ${browserErrors}`);
    try {
      return Number((await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]);
    } catch { return false; }
  }, "Chromium debugging port");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  cdp = new CDP(socket);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280, height: 900, deviceScaleFactor: 1, mobile: false
  });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }]
  });
  let failure = null;
  let intercepted = 0;
  const documents = [];
  const exceptions = [];
  const interceptionErrors = [];
  cdp.on("Runtime.exceptionThrown", event => exceptions.push(event.exceptionDetails));
  cdp.on("Network.requestWillBeSent", event => {
    if (event.type === "Document") documents.push(event.request.url);
  });
  cdp.on("Fetch.requestPaused", event => {
    const path = new URL(event.request.url).pathname;
    const block = failure && path === failure.path &&
      ["Fetch", "XHR"].includes(event.resourceType);
    const operation = !block
      ? cdp.send("Fetch.continueRequest", { requestId: event.requestId })
      : failure.kind === "network"
        ? cdp.send("Fetch.failRequest", { requestId: event.requestId, errorReason: "Failed" })
        : cdp.send("Fetch.fulfillRequest", {
          requestId: event.requestId,
          responseCode: failure.kind === "http" ? 503 : 200,
          responseHeaders: [{ name: "Content-Type", value: "text/html" }],
          body: Buffer.from("<html><body>Simulated unavailable section</body></html>").toString("base64")
        });
    if (block) intercepted++;
    operation.catch(error => interceptionErrors.push(error.message));
  });
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });

  const panel = index => `document.querySelector('#portfolio-section-${index + 1}')`;
  const text = expression => `(${expression}).textContent.replace(/\\s+/g, ' ').trim()`;
  async function navigate(path, enhanced = true) {
    const result = await cdp.send("Page.navigate", { url: origin + path });
    assert(!result.errorText, result.errorText);
    await until(() => cdp.evaluate(`location.pathname === ${JSON.stringify(path)} &&
      document.readyState === 'complete' &&
      ${enhanced ? "document.querySelector('.horizontal-ready')" : "document.querySelector('#main > .page-shell')"} !== null`),
    `render ${path}`);
  }
  async function click(selector) {
    await cdp.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Missing click target');
      el.scrollIntoView({behavior:'instant',block:'center',inline:'nearest'});
    })()`);
    let previous;
    const rect = await until(async () => {
      const current = await cdp.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = r.x+r.width/2, y = r.y+r.height/2;
        const hit = document.elementFromPoint(x, y);
        if (r.width <= 0 || r.height <= 0 || x < 0 || y < 0 ||
            x >= innerWidth || y >= innerHeight ||
            !(hit === el || el.contains(hit))) return null;
        return {x, y};
      })()`);
      const stable = current && previous &&
        Math.abs(current.x - previous.x) < 0.5 &&
        Math.abs(current.y - previous.y) < 0.5;
      previous = current;
      return stable ? current : false;
    }, `stationary, hit-testable click target ${selector}`);
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...rect });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...rect });
  }
  async function exposeFailure(index, kind) {
    failure = { path: pages[index].path, kind };
    const before = intercepted;
    await navigate(index === 0 ? "/about/" : "/");
    await until(() => cdp.evaluate(`${panel(index)}?.querySelector('.horizontal-load-state') !== null`), "loading error");
    assert(intercepted > before, "Must actually simulate a failed fetch.");
    await click(`.horizontal-section-nav a[data-index="${index}"]`);
    await until(() => cdp.evaluate(`${panel(index)}?.getAttribute('aria-hidden') === 'false' &&
      location.pathname === ${JSON.stringify(pages[index].path)}`), "error section active");
    assert.equal(await cdp.evaluate(`${panel(index)}.getAttribute('aria-busy')`), "false");
    assert.match(await cdp.evaluate(text(panel(index))), /SECTION UNAVAILABLE.*could not be loaded.*Retry loading.*Open section page/);
    assert.equal(await cdp.evaluate(`${panel(index)}.querySelector('[data-full-navigation]').getAttribute('href')`), origin + pages[index].path);
    assert(await cdp.evaluate(`${panel(index === 0 ? 1 : 0)}.querySelector('.page-shell') !== null`),
      "Initial server-rendered section must remain intact.");
  }

  // Exercise all three rejection branches for every original section.
  for (const [index, entry] of pages.entries()) {
    for (const kind of ["http", "network", "markup"]) {
      await exposeFailure(index, kind);
      failure = null;
      await click(`#portfolio-section-${index + 1} button`);
      await until(() => cdp.evaluate(`${panel(index)}?.querySelector('h1')?.textContent === ${JSON.stringify(entry.heading)}`),
        `retry ${entry.path} after ${kind} failure`);
      assert.equal(await cdp.evaluate(`${panel(index)}.getAttribute('aria-busy')`), "false");
      assert.equal(await cdp.evaluate(`${panel(index)}.querySelector('.horizontal-load-state')`), null);
      const renderedTitle = await (await fetch(origin + entry.path)).text()
        .then(html => html.match(/<title>(.*?)<\/title>/s)[1]);
      assert.equal(await cdp.evaluate("document.title"), renderedTitle);
      console.log(`PASS Retry loading: ${entry.path} (${kind})`);
    }
    await exposeFailure(index, "network");
    await cdp.evaluate("window.__oldPortfolioDocument = true");
    const before = documents.length;
    await click(`#portfolio-section-${index + 1} [data-full-navigation]`);
    await until(() => documents.slice(before).includes(origin + entry.path), "normal document request");
    await until(() => cdp.evaluate(`document.readyState === 'complete' &&
      window.__oldPortfolioDocument === undefined &&
      ${panel(index)}?.querySelector('h1')?.textContent === ${JSON.stringify(entry.heading)}`), "new document content");
    console.log(`PASS Open section page: ${entry.path} (new document request; fetch still blocked)`);
    failure = null;
  }

  // Disable actual page script execution, not just the portfolio script.
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  for (const entry of pages) {
    await navigate(entry.path, false);
    assert.equal(await cdp.evaluate(text("document.querySelector('#main h1')")), entry.heading);
    assert.equal(await cdp.evaluate("document.querySelector('.horizontal-ready, .horizontal-stage, .horizontal-skeleton')"), null);
    const state = await cdp.evaluate(`(() => {
      const shell = document.querySelector('#main > .page-shell');
      const r = shell.getBoundingClientRect();
      return {visible: r.width > 0 && r.height > 0 && getComputedStyle(shell).display !== 'none',
        inert: !!shell.closest('[inert], [aria-hidden="true"]'),
        text: shell.innerText, links: [...document.querySelectorAll('.nav-list a')].map(a => a.getAttribute('href'))};
    })()`);
    assert(state.visible && !state.inert, "Plain page must be readable.");
    assert(state.text.replace(/\s+/g, " ").includes(entry.last), "Final content must exist without scripts.");
    assert.deepEqual(state.links, pages.map(page => page.path));
    await cdp.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    assert(await cdp.evaluate("document.querySelector('.site-footer').getBoundingClientRect().top < innerHeight"),
      "Plain-page footer must be reachable by scrolling.");
    if (entry.path === "/contact/") {
      assert(await cdp.evaluate("document.querySelector('.contact-options a[href^=\"mailto:\"]') !== null"));
      assert(await cdp.evaluate("document.querySelector('.contact-options a[href^=\"https://www.linkedin.com/\"]') !== null"));
    }
    console.log(`PASS JavaScript disabled: ${entry.path} (content, navigation, footer)`);
  }
  await navigate("/", false);
  for (const entry of [...pages.slice(1), pages[0]]) {
    const before = documents.length;
    await click(`.nav-list a[href="${entry.path}"]`);
    await until(() => documents.slice(before).includes(origin + entry.path), "no-JavaScript document navigation");
    await until(() => cdp.evaluate(`document.readyState === 'complete' &&
      location.pathname === ${JSON.stringify(entry.path)} &&
      document.querySelector('#main h1')?.textContent === ${JSON.stringify(entry.heading)}`), "no-JavaScript destination content");
    console.log(`PASS JavaScript-disabled navigation: ${entry.path}`);
  }
  assert.deepEqual(interceptionErrors, [], "Request interception failed.");
  assert.deepEqual(exceptions, [], "Unexpected uncaught browser exceptions.");
  console.log("PASS All loading-failure and non-JavaScript checks.");
} finally {
  if (cdp && browser.exitCode === null) {
    await cdp.send("Browser.close").catch(() => {});
  }
  cdp?.socket.close();
  if (browser.exitCode === null) {
    browser.kill("SIGTERM");
    await Promise.race([
      new Promise(resolve => browser.once("exit", resolve)),
      sleep(3000).then(() => browser.kill("SIGKILL"))
    ]);
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
