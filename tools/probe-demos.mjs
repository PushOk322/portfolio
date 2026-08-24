/* Play-test harness: same CDP plumbing as tools/capture-posters.mjs, but it runs a
 * labelled sequence of interactions and dumps a screenshot after each one so the
 * result can actually be looked at. Viewport pinned to 1600x900.
 *
 * Usage: node probe.mjs <demo>
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const ORIGIN = process.env.PROBE_ORIGIN || 'http://localhost:4173';
const W = 1600, H = 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pickEngine = (text) => `(async () => {
  const sel = document.querySelector('select');
  const o = [...sel.options].find(o => o.text === ${JSON.stringify(text)});
  if (!o) return 'NO SUCH OPTION: ' + ${JSON.stringify(text)};
  sel.value = o.value;
  sel.dispatchEvent(new Event('change', {bubbles:true}));
  return 'engine -> ' + o.text;
})()`;

const PLANS = {
  boat: {
    path: '/demos/boat-configurator/index.html',
    settle: 7000,
    steps: [
      { label: 'loaded, default (no engine)', shot: true },
      { label: 'fit a 300 hp', js: pickEngine('300 hp'), wait: 3000, shot: true },
      { label: 'swap to 15 hp tiller', js: pickEngine('15 hp · tiller'), wait: 3000, shot: true },
      { label: 'swap to V8', js: pickEngine('250–300 hp · V8'), wait: 3000, shot: true },
      { label: 'back to no engine', js: pickEngine('No engine'), wait: 2500, shot: true },
      { label: 'refit V8 for the rest', js: pickEngine('250–300 hp · V8'), wait: 3000 },
      { label: 'upholstery -> Leather', click: [1397, 214], wait: 2000, shot: true },
      { label: 'upholstery -> Vinyl', click: [1467, 214], wait: 2000, shot: true },
      { label: 'interior colour -> red', click: [1433, 289], wait: 1800, shot: true },
      { label: 'hull colour -> tan', click: [1391, 365], wait: 1800, shot: true },
      { label: 'Console view (GSAP tween)', click: [1361, 425], wait: 3000, shot: true },
      { label: 'Full view (GSAP tween)', click: [1509, 425], wait: 3000, shot: true },
      { label: 'Reset', click: [1361, 486], wait: 3000, shot: true },
    ],
  },

  boat2: {
    path: '/demos/boat-configurator/index.html',
    settle: 7000,
    steps: [
      { label: 'Console view first', click: [1361, 425], wait: 3500, shot: true },
      { label: 'interior colour -> navy', click: [1349, 289], wait: 2000, shot: true },
      { label: 'interior colour -> tan', click: [1391, 289], wait: 2000, shot: true },
      { label: 'interior colour -> red', click: [1433, 289], wait: 2000, shot: true },
      { label: 'interior colour -> cream', click: [1517, 289], wait: 2000, shot: true },
      { label: 'upholstery -> Leather', click: [1397, 214], wait: 2500, shot: true },
      { label: 'upholstery -> Vinyl', click: [1467, 214], wait: 2500, shot: true },
      { label: 'upholstery -> Carpet', click: [1323, 214], wait: 2500, shot: true },
    ],
  },

  joinery: {
    path: '/demos/joinery-configurator/index.html',
    settle: 8000,
    steps: [
      { label: 'loaded (window, default)', shot: true },
      { label: 'colour inside -> charcoal', click: [1157, 501], wait: 1800, shot: true },
      { label: 'colour outside -> black', click: [1221, 591], wait: 1800, shot: true },
      { label: 'colour outside -> white', click: [1285, 591], wait: 1800, shot: true },
      { label: 'profile material -> PVC', click: [1166, 241], wait: 3000, shot: true },
      { label: 'profile model -> 120', click: [1232, 317], wait: 3000, shot: true },
      { label: 'product -> Door', click: [1168, 165], wait: 4000, shot: true },
      { label: 'door colour inside -> charcoal', click: [1157, 501], wait: 2000, shot: true },
      { label: 'design -> Type 5', click: [1270, 730], wait: 3000, shot: true },
      { label: 'design -> Type 11', click: [1470, 785], wait: 3000, shot: true },
      { label: 'product -> Back door', click: [1376, 165], wait: 4000, shot: true },
      { label: 'product -> Window again', click: [1263, 165], wait: 4000, shot: true },
      { label: 'frame width slider -> min', drag: [1332, 367, 1200, 367], wait: 2500, shot: true },
      { label: 'frame width slider -> max', drag: [1240, 367, 1470, 367], wait: 2500, shot: true },
    ],
  },

  joinery2: {
    path: '/demos/joinery-configurator/index.html',
    settle: 8000,
    steps: [
      { label: 'product -> Door', click: [1168, 165], wait: 4500 },
      { label: 'material -> PVC', click: [1166, 241], wait: 3500, shot: true },
      { label: 'design -> Type 5', click: [1270, 639], wait: 3000, shot: true },
      { label: 'design -> Type 11', click: [1470, 694], wait: 3000, shot: true },
      { label: 'design -> Type 20', click: [1178, 859], wait: 3000, shot: true },
      { label: 'PVC colour -> black', click: [1221, 501], wait: 2000, shot: true },
      { label: 'PVC colour -> white', click: [1285, 501], wait: 2000, shot: true },
    ],
  },

  stairs: {
    path: '/demos/stairs-generator/index.html',
    settle: 6000,
    steps: [
      { label: 'loaded (defaults)', shot: true },
      { label: 'total height -> min', drag: [1362, 103, 1250, 103], wait: 1200, shot: true },
      { label: 'total height -> max', drag: [1284, 103, 1600, 103], wait: 1200, shot: true },
      { label: 'step height -> min', drag: [1349, 172, 1250, 172], wait: 1200, shot: true },
      { label: 'step height -> max', drag: [1284, 172, 1600, 172], wait: 1200, shot: true },
      { label: 'step run -> min', drag: [1466, 240, 1250, 240], wait: 1200, shot: true },
      { label: 'step run -> max', drag: [1284, 240, 1600, 240], wait: 1200, shot: true },
      { label: 'step length -> min', drag: [1408, 310, 1250, 310], wait: 1200, shot: true },
      { label: 'step length -> max', drag: [1284, 310, 1600, 310], wait: 1200, shot: true },
      { label: 'step width -> min', drag: [1430, 379, 1250, 379], wait: 1200, shot: true },
      { label: 'step width -> max', drag: [1284, 379, 1600, 379], wait: 1200, shot: true },
      { label: 'flights -> 1', click: [1356, 456], wait: 2000, shot: true },
      { label: 'flights -> 2', click: [1505, 456], wait: 2000, shot: true },
      { label: 'direction -> W', click: [1541, 538], wait: 2000, shot: true },
      { label: 'direction -> S', click: [1467, 538], wait: 2000, shot: true },
      { label: 'Reset', click: [1213, 33], wait: 2000, shot: true },
    ],
  },

  stairs2: {
    path: '/demos/stairs-generator/index.html',
    settle: 6000,
    steps: [
      { label: 'focus total height', js: `(() => { const i=document.getElementById('control-totalHeight'); i.focus(); return i.min+'..'+i.max+' now '+i.value; })()`, wait: 300 },
      { label: 'total height -> MAX (End)', key: 'End', code: 35, wait: 1200, shot: true },
      { label: 'total height value', js: `document.getElementById('control-totalHeight').value`, wait: 200 },
      { label: 'total height -> MIN (Home)', key: 'Home', code: 36, wait: 1200, shot: true },
      { label: 'total height value', js: `document.getElementById('control-totalHeight').value`, wait: 200 },
      { label: 'restore total height', key: 'End', code: 35, wait: 800 },
      { label: 'focus step height', js: `(() => { const i=document.getElementById('control-stepHeight'); i.focus(); return i.min+'..'+i.max+' now '+i.value; })()`, wait: 300 },
      { label: 'step height -> MAX (End)', key: 'End', code: 35, wait: 1200, shot: true },
      { label: 'step height value', js: `document.getElementById('control-stepHeight').value`, wait: 200 },
      { label: 'step height -> MIN (Home)', key: 'Home', code: 36, wait: 1200, shot: true },
      { label: 'step height value', js: `document.getElementById('control-stepHeight').value`, wait: 200 },
      { label: 'restore step height', key: 'End', code: 35, wait: 800 },
      { label: 'focus step run', js: `(() => { const i=document.getElementById('control-stepGoing'); i.focus(); return i.min+'..'+i.max+' now '+i.value; })()`, wait: 300 },
      { label: 'step run -> MAX (End)', key: 'End', code: 35, wait: 1200, shot: true },
      { label: 'step run value', js: `document.getElementById('control-stepGoing').value`, wait: 200 },
      { label: 'step run -> MIN (Home)', key: 'Home', code: 36, wait: 1200, shot: true },
      { label: 'step run value', js: `document.getElementById('control-stepGoing').value`, wait: 200 },
      { label: 'restore step run', key: 'End', code: 35, wait: 800 },
      { label: 'focus step length', js: `(() => { const i=document.getElementById('control-stepLength'); i.focus(); return i.min+'..'+i.max+' now '+i.value; })()`, wait: 300 },
      { label: 'step length -> MAX (End)', key: 'End', code: 35, wait: 1200, shot: true },
      { label: 'step length value', js: `document.getElementById('control-stepLength').value`, wait: 200 },
      { label: 'step length -> MIN (Home)', key: 'Home', code: 36, wait: 1200, shot: true },
      { label: 'step length value', js: `document.getElementById('control-stepLength').value`, wait: 200 },
      { label: 'restore step length', key: 'End', code: 35, wait: 800 },
      { label: 'focus step width', js: `(() => { const i=document.getElementById('control-stepWidth'); i.focus(); return i.min+'..'+i.max+' now '+i.value; })()`, wait: 300 },
      { label: 'step width -> MAX (End)', key: 'End', code: 35, wait: 1200, shot: true },
      { label: 'step width value', js: `document.getElementById('control-stepWidth').value`, wait: 200 },
      { label: 'step width -> MIN (Home)', key: 'Home', code: 36, wait: 1200, shot: true },
      { label: 'step width value', js: `document.getElementById('control-stepWidth').value`, wait: 200 },
      { label: 'restore step width', key: 'End', code: 35, wait: 800 },
    ],
  },

  tv2: {
    path: '/demos/tv-course-browser/index.html',
    settle: 4500,
    steps: [
      { label: 'dismiss hint', click: [1266, 844], wait: 900 },
      { label: 'where', js: `(() => { const a=document.activeElement; return location.pathname + location.hash + '  focus=' + (a ? a.tagName + '.' + (a.className||'').split(' ')[0] + ' "' + (a.textContent||'').trim().slice(0,40) + '"' : 'none'); })()`, wait: 200 },
      { label: 'Down -> hero CTA', key: 'ArrowDown', code: 40, wait: 900 },
      { label: 'where', js: `(() => { const a=document.activeElement; return location.pathname + location.hash + '  focus=' + (a ? a.tagName + '.' + (a.className||'').split(' ')[0] + ' "' + (a.textContent||'').trim().slice(0,40) + '"' : 'none'); })()`, wait: 200 },
      { label: 'Enter on the hero CTA', key: 'Enter', code: 13, wait: 3500, shot: true },
      { label: 'where', js: `(() => { const a=document.activeElement; return location.pathname + location.hash + '  focus=' + (a ? a.tagName + '.' + (a.className||'').split(' ')[0] + ' "' + (a.textContent||'').trim().slice(0,40) + '"' : 'none'); })()`, wait: 200 },
      { label: 'Down into a lesson', key: 'ArrowDown', code: 40, wait: 1000, shot: true },
      { label: 'where', js: `(() => { const a=document.activeElement; return location.pathname + location.hash + '  focus=' + (a ? a.tagName + '.' + (a.className||'').split(' ')[0] + ' "' + (a.textContent||'').trim().slice(0,40) + '"' : 'none'); })()`, wait: 200 },
      { label: 'Enter on the lesson', key: 'Enter', code: 13, wait: 4000, shot: true },
      { label: 'where', js: `(() => { const a=document.activeElement; return location.pathname + location.hash + '  focus=' + (a ? a.tagName + '.' + (a.className||'').split(' ')[0] + ' "' + (a.textContent||'').trim().slice(0,40) + '"' : 'none'); })()`, wait: 200 },
      { label: 'settle on whatever opened', wait: 4000, shot: true },
      { label: 'where', js: `(() => { const a=document.activeElement; return location.pathname + location.hash + '  focus=' + (a ? a.tagName + '.' + (a.className||'').split(' ')[0] + ' "' + (a.textContent||'').trim().slice(0,40) + '"' : 'none'); })()`, wait: 200 },
      { label: 'video element state', js: `(() => { const v=document.querySelector('video'); if(!v) return 'NO <video> ON PAGE'; return JSON.stringify({src:(v.currentSrc||v.src||'(none)').slice(-60), readyState:v.readyState, networkState:v.networkState, error:v.error?v.error.code:null, poster:(v.poster||'(none)').slice(-40), w:v.videoWidth, h:v.videoHeight}); })()`, wait: 300 },
    ],
  },

  tv3: {
    path: '/demos/tv-course-browser/index.html#/courses/1',
    settle: 5000,
    steps: [
      { label: 'dismiss hint if shown', click: [1266, 844], wait: 900, shot: true },
      { label: 'Enter -> Watch intro', key: 'Enter', code: 13, wait: 4000, shot: true },
      { label: 'where', js: `location.hash`, wait: 200 },
      { label: 'video state', js: `(() => { const v=document.querySelector('video'); if(!v) return 'NO <video>'; return JSON.stringify({src:(v.currentSrc||v.src||'(none)').slice(-70), readyState:v.readyState, networkState:v.networkState, errorCode:v.error?v.error.code:null, errorMsg:v.error?v.error.message:null, poster:(v.poster||'(none)').slice(-50), paused:v.paused, w:v.videoWidth, h:v.videoHeight}); })()`, wait: 300 },
      { label: 'settle 5s', wait: 5000, shot: true },
      { label: 'video state again', js: `(() => { const v=document.querySelector('video'); if(!v) return 'NO <video>'; return JSON.stringify({src:(v.currentSrc||v.src||'(none)').slice(-70), readyState:v.readyState, networkState:v.networkState, errorCode:v.error?v.error.code:null, errorMsg:v.error?v.error.message:null, poster:(v.poster||'(none)').slice(-50), paused:v.paused, w:v.videoWidth, h:v.videoHeight}); })()`, wait: 300 },
      { label: 'what is rendered', js: `(() => { const r=document.getElementById('root')||document.body; return r.innerText.replace(/\s+/g,' ').slice(0,300); })()`, wait: 200 },
    ],
  },

  tvcold: {
    path: '/demos/tv-course-browser/index.html#/home',
    settle: 5000,
    steps: [
      { label: 'cold #/home renders?', js: `((document.getElementById('root')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0,80)) || 'EMPTY'`, wait: 200, shot: true },
      { label: 'reload at #/courses/preview/1', js: `location.hash = '#/courses/preview/1'; location.reload(); 'reloading'`, wait: 6000 },
      { label: 'cold preview renders?', js: `((document.getElementById('root')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0,80)) || 'EMPTY'`, wait: 200, shot: true },
      { label: 'reload at #/courses/1', js: `location.hash = '#/courses/1'; location.reload(); 'reloading'`, wait: 6000 },
      { label: 'cold course renders?', js: `((document.getElementById('root')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0,80)) || 'EMPTY'`, wait: 200, shot: true },
    ],
  },

  cold_home: {
    path: '/demos/tv-course-browser/index.html',
    settle: 6000,
    steps: [
      { label: 'renders?', js: `((document.getElementById('root')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0,100)) || 'EMPTY - WHITE SCREEN'`, wait: 200, shot: true },
    ],
  },

  cold_hash_home: {
    path: '/demos/tv-course-browser/index.html#/home',
    settle: 6000,
    steps: [
      { label: 'renders?', js: `((document.getElementById('root')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0,100)) || 'EMPTY - WHITE SCREEN'`, wait: 200, shot: true },
    ],
  },

  cold_preview: {
    path: '/demos/tv-course-browser/index.html#/courses/preview/1',
    settle: 6000,
    steps: [
      { label: 'renders?', js: `((document.getElementById('root')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0,100)) || 'EMPTY - WHITE SCREEN'`, wait: 200, shot: true },
    ],
  },

  cold_course: {
    path: '/demos/tv-course-browser/index.html#/courses/1',
    settle: 6000,
    steps: [
      { label: 'renders?', js: `((document.getElementById('root')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0,100)) || 'EMPTY - WHITE SCREEN'`, wait: 200, shot: true },
    ],
  },

  tv4: {
    path: '/demos/tv-course-browser/index.html',
    settle: 5000,
    steps: [
      { label: 'dismiss hint', click: [1266, 844], wait: 900 },
      { label: 'Down to hero CTA', key: 'ArrowDown', code: 40, wait: 900 },
      { label: 'Enter -> course preview', key: 'Enter', code: 13, wait: 3000 },
      { label: 'where', js: `location.hash`, wait: 200 },
      { label: 'Down', key: 'ArrowDown', code: 40, wait: 900 },
      { label: 'Enter -> course', key: 'Enter', code: 13, wait: 3000 },
      { label: 'where', js: `location.hash`, wait: 200, shot: true },
      { label: 'Down to Watch intro', key: 'ArrowDown', code: 40, wait: 900, shot: true },
      { label: 'Enter -> play', key: 'Enter', code: 13, wait: 4000, shot: true },
      { label: 'where', js: `location.hash`, wait: 200 },
      { label: 'video state', js: `(() => { const v=document.querySelector('video'); if(!v) return 'NO <video>'; return JSON.stringify({src:(v.currentSrc||v.src||'(none)').slice(-70), readyState:v.readyState, networkState:v.networkState, errorCode:v.error?v.error.code:null, poster:(v.poster||'(none)').slice(-50), paused:v.paused, w:v.videoWidth, h:v.videoHeight}); })()`, wait: 300 },
      { label: 'settle', wait: 5000, shot: true },
      { label: 'network + DOM audit', js: `(() => {
  const here = location.origin;
  const res = performance.getEntriesByType('resource').map(e => e.name);
  const thirdParty = [...new Set(res.filter(u => { try { return new URL(u).origin !== here; } catch { return false; } }).map(u => new URL(u).origin))];
  return JSON.stringify({
    totalRequests: res.length,
    thirdPartyOrigins: thirdParty,
    iframes: [...document.querySelectorAll('iframe')].map(f => (f.src||'(no src)').slice(0,60)),
    videos: document.querySelectorAll('video').length,
    playerNodes: document.querySelectorAll('.player, .video-page__player-wrapper').length,
    bodyText: (document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,120) || '(empty)'
  });
})()`, wait: 300 },
      { label: 'video state again', js: `(() => { const v=document.querySelector('video'); if(!v) return 'NO <video>'; return JSON.stringify({src:(v.currentSrc||v.src||'(none)').slice(-70), readyState:v.readyState, networkState:v.networkState, errorCode:v.error?v.error.code:null, poster:(v.poster||'(none)').slice(-50), paused:v.paused, w:v.videoWidth, h:v.videoHeight}); })()`, wait: 300 },
    ],
  },

  indexcard: {
    path: '/index.html',
    settle: 2500,
    steps: [
      { label: 'scroll to TV card', js: `(() => { const tv=[...document.querySelectorAll('.entry')].find(e=>/TV Course/i.test(e.textContent)); tv.scrollIntoView({block:'center'}); return 'ok'; })()`, wait: 1200, shot: true },
    ],
  },

  pagesroot: {
    path: '/portfolio/index.html',
    settle: 2500,
    steps: [
      { label: 'scroll through every card', js: `(async () => {
          for (const img of document.querySelectorAll('.entry__poster')) {
            img.scrollIntoView({block:'center'});
            await new Promise(r=>setTimeout(r,350));
          }
          await new Promise(r=>setTimeout(r,1500));
          const res = performance.getEntriesByType('resource');
          return JSON.stringify({
            total: res.length,
            failures: res.filter(e => e.responseStatus >= 400).map(e => e.responseStatus + ' ' + e.name),
            postersOk: [...document.querySelectorAll('.entry__poster')].filter(i => i.complete && i.naturalWidth > 0).length
                       + ' / ' + document.querySelectorAll('.entry__poster').length
          });
        })()`, wait: 500, shot: true },
    ],
  },

  pagesdemo: {
    path: '/portfolio/tv-course-browser.html',
    settle: 6000,
    steps: [
      { label: 'iframe + assets', js: `(() => {
          const f = document.querySelector('.stage__frame');
          const res = performance.getEntriesByType('resource');
          return JSON.stringify({
            iframeSrc: f ? f.getAttribute('src') : '(no iframe)',
            backLink: document.querySelector('.back')?.getAttribute('href'),
            openLink: [...document.querySelectorAll('a')].map(a=>a.getAttribute('href')).find(h=>h && h.includes('/demos/')),
            failures: res.filter(e => e.responseStatus >= 400).map(e => e.responseStatus + ' ' + e.name)
          });
        })()`, wait: 500, shot: true },
    ],
  },

  live: {
    path: '/portfolio/index.html',
    settle: 3000,
    steps: [
      { label: 'index audit', js: `(async () => {
          for (const img of document.querySelectorAll('.entry__poster')) {
            img.scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,350));
          }
          await new Promise(r=>setTimeout(r,1500));
          const res = performance.getEntriesByType('resource');
          return JSON.stringify({
            failures: res.filter(e => e.responseStatus >= 400).map(e => e.responseStatus + ' ' + e.name),
            postersOk: [...document.querySelectorAll('.entry__poster')].filter(i => i.complete && i.naturalWidth > 0).length
                       + ' / ' + document.querySelectorAll('.entry__poster').length,
            cv: document.querySelector('.masthead__link[href$="cv.pdf"]')?.getAttribute('href') || 'CV LINK OFF'
          });
        })()`, wait: 500, shot: true },
    ],
  },

  livegame: {
    path: '/portfolio/demos/orbital-slice/index.html',
    settle: 7000,
    steps: [
      { label: 'game boots?', js: `(() => { const g=globalThis.__PHASER_GAME__; return JSON.stringify({ running: !!g && g.isRunning, size: g ? [g.scale.width, g.scale.height] : null, scenes: g ? g.scene.scenes.map(x=>x.scene.key) : null }); })()`, wait: 300, shot: true },
    ],
  },

  tv: {
    path: '/demos/tv-course-browser/index.html',
    settle: 4500,
    steps: [
      { label: 'loaded, hint shown', shot: true },
      { label: 'dismiss hint', click: [1266, 844], wait: 900, shot: true },
      { label: 'ArrowDown x1', key: 'ArrowDown', code: 40, wait: 900, shot: true },
      { label: 'ArrowDown x2 (into row)', key: 'ArrowDown', code: 40, wait: 1100, shot: true },
      { label: 'ArrowRight', key: 'ArrowRight', code: 39, wait: 900, shot: true },
      { label: 'ArrowRight again', key: 'ArrowRight', code: 39, wait: 900, shot: true },
      { label: 'Enter on a session', key: 'Enter', code: 13, wait: 3500, shot: true },
      { label: 'wait on the video page', wait: 4000, shot: true },
      { label: 'Back out', key: 'Escape', code: 27, wait: 2500, shot: true },
    ],
  },
};

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      } else for (const l of this.listeners) l(m);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((res, rej) => {
      this.pending.set(id, { resolve: res, reject: rej });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout: ' + method)); } }, 60000);
    });
  }
  once(name, sid, timeout = 45000) {
    return new Promise((res, rej) => {
      const to = setTimeout(() => { this.listeners = this.listeners.filter(l => l !== h); rej(new Error('timeout ' + name)); }, timeout);
      const h = (m) => { if (m.method === name && (!sid || m.sessionId === sid)) { clearTimeout(to); this.listeners = this.listeners.filter(l => l !== h); res(m.params); } };
      this.listeners.push(h);
    });
  }
}

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try { const j = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl; } catch {}
    await sleep(500);
  }
  throw new Error('no debugging port');
}

async function drag(cdp, sid, x0, y0, x1, y1) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: y0, buttons: 0 }, sid);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', buttons: 1, clickCount: 1 }, sid);
  const n = 16;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, button: 'left', buttons: 1 }, sid);
    await sleep(16);
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', buttons: 0, clickCount: 1 }, sid);
}

async function click(cdp, sid, x, y) {
  const b = { x, y, button: 'left', clickCount: 1 };
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...b, buttons: 0 }, sid); await sleep(60);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...b, buttons: 1 }, sid); await sleep(60);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...b, buttons: 0 }, sid);
}

const which = process.argv[2];
const plan = PLANS[which];
if (!plan) { console.error('plans: ' + Object.keys(PLANS).join(', ')); process.exit(1); }

const OUT = join(HERE, 'shots', 'probe', which);
mkdirSync(OUT, { recursive: true });
const profile = join(tmpdir(), `probe-${Date.now()}`);
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--hide-scrollbars', '--force-device-scale-factor=1',
  '--window-size=1680,1000', '--window-position=0,0', 'about:blank',
], { stdio: 'ignore' });

try {
  const ws = new WebSocket(await wsUrl());
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  const cdp = new Cdp(ws);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: sid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sid);
  await cdp.send('Runtime.enable', {}, sid);
  await cdp.send('Log.enable', {}, sid).catch(() => {});
  await cdp.send('Network.enable', {}, sid).catch(() => {});
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false }, sid);

  const errors = [];
  cdp.listeners.push((m) => {
    if (m.sessionId !== sid) return;
    if (m.method === 'Runtime.exceptionThrown') errors.push('EXCEPTION: ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('LOG ERROR: ' + m.params.entry.text + (m.params.entry.url ? ' <- ' + m.params.entry.url : ''));
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errors.push(`HTTP ${m.params.response.status}: ${m.params.response.url}`);
    if (m.method === 'Network.loadingFailed') errors.push('LOAD FAILED: ' + (m.params.errorText || ''));
  });

  const loaded = cdp.once('Page.loadEventFired', sid);
  await cdp.send('Page.navigate', { url: ORIGIN + plan.path }, sid);
  await loaded;
  await sleep(plan.settle);
  await cdp.send('Runtime.evaluate', { expression: `(() => { const b=document.querySelector('.pf-badge'); if(b) b.style.display='none'; })()` }, sid);

  let n = 0;
  for (const step of plan.steps) {
    if (step.js) {
      const r = await cdp.send('Runtime.evaluate', { expression: step.js, awaitPromise: true, returnByValue: true }, sid);
      if (r.exceptionDetails) console.log(`  ! ${step.label}: ${r.exceptionDetails.text}`);
      else console.log(`  ${step.label}: ${r.result?.value}`);
    } else {
      console.log(`  ${step.label}`);
    }
    if (step.click) await click(cdp, sid, ...step.click);
    if (step.drag) await drag(cdp, sid, ...step.drag);
    if (step.key) {
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, key: step.key, code: step.key, windowsVirtualKeyCode: step.code, nativeVirtualKeyCode: step.code }, sid);
        await sleep(40);
      }
    }
    await sleep(step.wait ?? 500);
    if (step.shot) {
      const s = await cdp.send('Page.captureScreenshot', { format: 'png' }, sid);
      const name = `${String(n).padStart(2, '0')}-${step.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
      writeFileSync(join(OUT, name), Buffer.from(s.data, 'base64'));
      n++;
    }
  }

  console.log('\nconsole errors: ' + (errors.length ? '\n  ' + errors.join('\n  ') : 'none'));
  console.log('shots in: ' + OUT);
} finally {
  try { chrome.kill(); } catch {}
  await sleep(400);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
