/* Poster capture harness.
 *
 * Drives the installed Chrome over the DevTools protocol with Node's built-in
 * WebSocket — no puppeteer, no downloaded browser. Headful on purpose: the three
 * 3D demos want the real GPU, and Emulation.setDeviceMetricsOverride pins the
 * capture to exactly 1600x900 regardless of the window the user sees.
 *
 * Usage: node shoot.mjs <slug> [<slug>...]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const ORIGIN = 'http://localhost:4173';
const OUT = join(HERE, 'shots');
const W = 1600;
const H = 900;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HIDE_CHROME = `(() => { const b = document.querySelector('.pf-badge'); if (b) b.style.display = 'none'; return 'ok'; })()`;

/* ---------- per-demo recipes ------------------------------------------ */

const RECIPES = {
  'canvas-studio': {
    path: '/demos/canvas-studio/index.html',
    settle: 1400,
    steps: [
      { js: `document.getElementById('sampleButton').click(); 'artwork'`, wait: 1000 },
      // Circle last, and left selected: the handles are the cue that it is a live
      // canvas rather than a picture of one.
      { js: `document.getElementById('circleButton').click(); 'circle'`, wait: 900 },
    ],
  },

  'orbital-slice': {
    path: '/demos/orbital-slice/index.html',
    settle: 5000,
    steps: [
      { js: `localStorage.setItem('firstTry','1'); 'skip-howto'`, wait: 200 },
      {
        js: `document.querySelector('.play').dispatchEvent(new PointerEvent('pointerup',
              {pointerId:1,pointerType:'mouse',isPrimary:true,bubbles:true,cancelable:true,button:0,buttons:0})); 'play'`,
        wait: 2600,
      },
      // Keep the blade moving. The laser trail has a 150 ms particle lifespan, so a
      // one-shot swipe is gone before the capture round-trip completes — this leaves a
      // rAF loop running that chases whatever planet is on screen, which both keeps the
      // trail alive and lands real slices.
      {
        js: `(() => {
          const g = globalThis.__PHASER_GAME__;
          const space = g.scene.getScene('SpaceScene');
          const findPlanet = () => space.children.list.find(
            o => o.active && o.visible && o.texture && /^planet/.test(o.texture.key));
          let x = 800, y = 450, on = false;
          globalThis.__sweepStop = false;
          const tick = () => {
            if (globalThis.__sweepStop) return;
            const p = findPlanet();
            const tx = p ? p.x : 800 + Math.sin(Date.now() / 400) * 500;
            const ty = p ? p.y : 450;
            x += (tx - x) * 0.35;
            y += (ty - y) * 0.35;
            if (!on) { space.input.emit('pointerdown', {x, y}); on = true; }
            else { space.input.emit('pointermove', {x, y}); }
            requestAnimationFrame(tick);
          };
          tick();
          return 'sweeping';
        })()`,
        wait: 2000,
      },
    ],
    burst: 6,
    burstGap: 450,
  },

  'joinery-configurator': {
    path: '/demos/joinery-configurator/index.html',
    settle: 7000,
    steps: [
      { click: [1168, 165], wait: 4000 },   // Product type -> Door
      { click: [1157, 501], wait: 1200 },   // Colour inside  -> dark charcoal
      { click: [1157, 591], wait: 2000 },   // Colour outside -> dark charcoal
    ],
  },

  'boat-configurator': {
    path: '/demos/boat-configurator/index.html',
    settle: 7000,
    steps: [
      // Native <select>: set it directly rather than driving the OS dropdown.
      {
        js: `(() => {
          const s = document.querySelector('select');
          const opts = [...s.options].map(o => o.text);
          const big = s.options[s.options.length - 1];
          s.value = big.value;
          s.dispatchEvent(new Event('change', {bubbles:true}));
          return JSON.stringify({picked: big.text, all: opts});
        })()`,
        wait: 3500,
      },
      { click: [1391, 289], wait: 1200 },   // interior colour -> tan, off the default graphite
      { click: [1509, 425], wait: 2500 },   // Full view
    ],
  },

  'stairs-generator': {
    path: '/demos/stairs-generator/index.html',
    settle: 6000,
    steps: [
      { click: [1393, 538], wait: 2500 },   // Floor 1 direction -> E, giving the quarter turn
      // The default camera is near top-down, which flattens the turn into a stray
      // side branch. Orbit down to a three-quarter view so the switchback reads.
      { drag: [620, 420, 668, 478], wait: 1200 },
      { wheel: [620, 450, -420], wait: 900 },
      { wheel: [620, 450, -300], wait: 1200 },
      // Three more azimuth steps: looking along the L flattens it into a straight
      // run, and the turn is the whole point of the shot.
      { drag: [620, 450, 740, 450], wait: 1200 },
      { drag: [620, 450, 740, 450], wait: 1200 },
      { drag: [620, 450, 740, 450], wait: 1200 },
    ],
  },

  'tv-course-browser': {
    path: '/demos/tv-course-browser/index.html',
    settle: 4500,
    steps: [
      { click: [1266, 844], wait: 900 },    // dismiss the arrow-keys hint
      // Down out of the hero CTA and into the course row: the focus ring on a card is
      // the whole point of the demo, and it lives below the fold until focus scrolls it up.
      { key: 'ArrowDown', code: 40, wait: 1000 },
      { key: 'ArrowDown', code: 40, wait: 1200 },
      { key: 'ArrowRight', code: 39, wait: 1200 },
      // Two downs overshoot the hero entirely; nudge back so the carousel dots and a
      // focused card are both in frame.
      { js: `(() => { const s = document.scrollingElement || document.documentElement;
              const t = [...document.querySelectorAll('*')].find(e => e.scrollTop > 0);
              (t || s).scrollTop -= 150; return 'nudged'; })()`, wait: 900 },
    ],
  },
};

/* ---------- CDP plumbing ---------------------------------------------- */

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else {
        for (const l of this.listeners) l(msg);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 60000);
    });
  }

  once(eventName, sessionId, timeout = 45000) {
    return new Promise((resolve, reject) => {
      const to = setTimeout(() => {
        this.listeners = this.listeners.filter((l) => l !== handler);
        reject(new Error(`timeout waiting for ${eventName}`));
      }, timeout);
      const handler = (msg) => {
        if (msg.method === eventName && (!sessionId || msg.sessionId === sessionId)) {
          clearTimeout(to);
          this.listeners = this.listeners.filter((l) => l !== handler);
          resolve(msg.params);
        }
      };
      this.listeners.push(handler);
    });
  }
}

async function browserWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error('Chrome did not expose a debugging port');
}

/* ---------- input helpers ---------------------------------------------- */

async function click(cdp, sid, x, y) {
  const base = { x, y, button: 'left', buttons: 1, clickCount: 1 };
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...base, buttons: 0 }, sid);
  await sleep(60);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...base }, sid);
  await sleep(60);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base, buttons: 0 }, sid);
}

async function drag(cdp, sid, x0, y0, x1, y1) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: y0, buttons: 0 }, sid);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', buttons: 1, clickCount: 1 }, sid);
  const steps = 18;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, button: 'left', buttons: 1,
    }, sid);
    await sleep(16);
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', buttons: 0, clickCount: 1 }, sid);
}

async function wheel(cdp, sid, x, y, deltaY) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 }, sid);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY }, sid);
}

async function key(cdp, sid, name, code) {
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', {
      type, key: name, code: name, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code,
    }, sid);
    await sleep(40);
  }
}

/* ---------- run -------------------------------------------------------- */

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('usage: node shoot.mjs <slug> [<slug>...]');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const profile = join(tmpdir(), `poster-profile-${Date.now()}`);

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1680,1000',
  '--window-position=0,0',
  'about:blank',
], { stdio: 'ignore', detached: false });

try {
  const wsUrl = await browserWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const cdp = new Cdp(ws);

  for (const slug of slugs) {
    const recipe = RECIPES[slug];
    if (!recipe) { console.error(`no recipe for ${slug}`); continue; }

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: sid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sid);
    await cdp.send('Runtime.enable', {}, sid);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false }, sid);

    const loaded = cdp.once('Page.loadEventFired', sid);
    await cdp.send('Page.navigate', { url: ORIGIN + recipe.path }, sid);
    await loaded;
    await sleep(recipe.settle);
    await cdp.send('Runtime.evaluate', { expression: HIDE_CHROME }, sid);

    let midShot = 0;
    for (const step of recipe.steps) {
      if (step.shot) {
        const s = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sid);
        const n = `${slug}-mid${midShot++}.png`;
        writeFileSync(join(OUT, n), Buffer.from(s.data, 'base64'));
        console.log(`  ${slug} -> ${n}`);
      }
      if (step.js) {
        const r = await cdp.send('Runtime.evaluate', { expression: step.js, awaitPromise: true, returnByValue: true }, sid);
        if (r.exceptionDetails) console.error(`  ${slug}: step threw ${r.exceptionDetails.text}`);
        else if (r.result?.value !== undefined) console.log(`  ${slug}: ${r.result.value}`);
      }
      if (step.click) await click(cdp, sid, ...step.click);
      if (step.drag) await drag(cdp, sid, ...step.drag);
      if (step.wheel) await wheel(cdp, sid, ...step.wheel);
      if (step.key) await key(cdp, sid, step.key, step.code);
      await sleep(step.wait ?? 300);
    }

    const shots = recipe.burst ?? 1;
    for (let i = 0; i < shots; i++) {
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sid);
      const name = shots > 1 ? `${slug}-${i}.png` : `${slug}.png`;
      writeFileSync(join(OUT, name), Buffer.from(shot.data, 'base64'));
      console.log(`${slug} -> ${name}`);
      if (i < shots - 1) await sleep(recipe.burstGap ?? 400);
    }

    await cdp.send('Target.closeTarget', { targetId });
  }
} finally {
  try { chrome.kill(); } catch {}
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
