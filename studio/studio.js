import { ASPECTS, THEMES, render, frame } from './render.js';
import { BACKGROUNDS } from './backgrounds.js';

const SAMPLE = {
  name: 'Alex Greenland',
  handle: '@ajrgd',
  verified: true,
  avatar: '',
  text: 'try @everyone, it looks nicer 😉\n\nalso notifies everybody, no matter if they\'re in the channel 😂',
  time: '2026-09-16T18:34:00.000Z',
  media: [],
  card: null,
  views: '90',
  url: '',
};

const el = {
  canvas: document.getElementById('preview'),
  dims: document.getElementById('dims'),
  formats: document.getElementById('formats'),
  backgrounds: document.getElementById('backgrounds'),
  themes: document.getElementById('themes'),
  padding: document.getElementById('padding'),
  paddingValue: document.getElementById('padding-value'),
  download: document.getElementById('download'),
  copy: document.getElementById('copy'),
  status: document.getElementById('status'),
  source: document.getElementById('source'),
};

let post = SAMPLE;
let images = { avatar: null, media: [], card: null };

const opts = {
  aspect: '4x5',
  background: BACKGROUNDS[0],
  theme: THEMES[0],
  padding: 0.236, // the reference image, measured: 140px margin on a 594px card
  scale: 2,
  exact: false,
};

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ---------- controls ---------- */

function buildFormats() {
  el.formats.innerHTML = '';
  for (const a of ASPECTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = a.id;
    b.innerHTML = `<span class="label">${a.label}</span><span class="note">${a.note}</span>`;
    b.addEventListener('click', () => {
      opts.aspect = a.id;
      sync();
      draw();
      save();
    });
    el.formats.appendChild(b);
  }
}

function buildBackgrounds() {
  el.backgrounds.innerHTML = '';
  for (const bg of BACKGROUNDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = bg.id;
    b.title = bg.name;
    b.setAttribute('aria-label', bg.name);

    // Draw the swatch with the real renderer, so it never lies about the colour.
    const cv = document.createElement('canvas');
    cv.width = cv.height = 80;
    import('./backgrounds.js').then(({ paintBackground }) => {
      paintBackground(cv.getContext('2d'), 80, 80, bg);
    });
    b.appendChild(cv);

    b.addEventListener('click', () => {
      opts.background = bg;
      sync();
      draw();
      save();
    });
    el.backgrounds.appendChild(b);
  }
}

function buildThemes() {
  el.themes.innerHTML = '';
  for (const t of THEMES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = t.id;
    b.innerHTML = `<span class="dot" style="background:${t.bg}"></span>${t.name}`;
    b.addEventListener('click', () => {
      opts.theme = t;
      sync();
      draw();
      save();
    });
    el.themes.appendChild(b);
  }
}

function sync() {
  for (const b of el.formats.children) {
    b.setAttribute('aria-pressed', String(b.dataset.id === opts.aspect));
  }
  for (const b of el.backgrounds.children) {
    b.setAttribute('aria-pressed', String(b.dataset.id === opts.background.id));
  }
  for (const b of el.themes.children) {
    b.setAttribute('aria-pressed', String(b.dataset.id === opts.theme.id));
  }
  el.padding.value = String(Math.round(opts.padding * 100));
  el.paddingValue.textContent = `${Math.round(opts.padding * 100)}%`;
}

/* ---------- drawing ---------- */

function exportSize() {
  const a = ASPECTS.find((x) => x.id === opts.aspect);
  if (a && a.size) return a.size;
  const probe = document.createElement('canvas').getContext('2d');
  const f = frame(probe, post, images, opts);
  return [f.w * 2, f.h * 2];
}

function draw() {
  const probe = el.canvas.getContext('2d');
  const f = frame(probe, post, images, opts);

  const stage = document.querySelector('.stage-inner').getBoundingClientRect();
  const fit = Math.min(stage.width / f.w, stage.height / f.h, 1.1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  render(el.canvas, post, images, { ...opts, exact: false, scale: Math.max(fit * dpr, 0.5) });
  el.canvas.style.width = `${Math.round(f.w * fit)}px`;
  el.canvas.style.height = `${Math.round(f.h * fit)}px`;

  const [ew, eh] = exportSize();
  el.dims.textContent = `${ew} × ${eh}`;
}

function renderFull() {
  const out = document.createElement('canvas');
  const a = ASPECTS.find((x) => x.id === opts.aspect);
  render(out, post, images, { ...opts, exact: !!(a && a.size), scale: 2 });
  return out;
}

function toBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function say(message) {
  el.status.textContent = message;
  clearTimeout(say._t);
  say._t = setTimeout(() => {
    el.status.textContent = '';
  }, 2400);
}

async function download() {
  const blob = await toBlob(renderFull());
  const slug = (post.handle || 'post').replace(/^@/, '') || 'post';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `postcard-${slug}-${opts.aspect}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  say('Saved');
}

async function copy() {
  try {
    // Hand ClipboardItem the promise, not the blob. The write has to start
    // inside the click's activation window or Chrome rejects it.
    const item = new ClipboardItem({ 'image/png': toBlob(renderFull()) });
    await navigator.clipboard.write([item]);
    say('Copied to clipboard');
  } catch {
    say('Copy failed. Use Download.');
  }
}

/* ---------- settings ---------- */

async function save() {
  try {
    await chrome.storage.local.set({
      pc_settings: {
        aspect: opts.aspect,
        background: opts.background.id,
        theme: opts.theme.id,
        padding: opts.padding,
      },
    });
  } catch {}
}

async function restore() {
  try {
    const { pc_settings: s } = await chrome.storage.local.get('pc_settings');
    if (!s) return;
    if (ASPECTS.some((a) => a.id === s.aspect)) opts.aspect = s.aspect;
    const bg = BACKGROUNDS.find((b) => b.id === s.background);
    if (bg) opts.background = bg;
    const th = THEMES.find((t) => t.id === s.theme);
    if (th) opts.theme = th;
    if (typeof s.padding === 'number') opts.padding = s.padding;
  } catch {}
}

/* ---------- boot ---------- */

async function boot() {
  buildFormats();
  buildBackgrounds();
  buildThemes();
  await restore();

  const id = new URLSearchParams(location.search).get('id');
  if (id) {
    try {
      const store = await chrome.storage.local.get(id);
      if (store[id]) post = store[id];
    } catch {}
  }

  if (post.url) {
    el.source.href = post.url;
    el.source.hidden = false;
  }

  images.avatar = await loadImage(post.avatar);
  images.media = (await Promise.all((post.media || []).map(loadImage))).filter(Boolean);
  images.card = post.card ? await loadImage(post.card.image) : null;

  await document.fonts.ready;
  sync();
  draw();
}

el.padding.addEventListener('input', () => {
  opts.padding = Number(el.padding.value) / 100;
  el.paddingValue.textContent = `${el.padding.value}%`;
  draw();
});
el.padding.addEventListener('change', save);

el.download.addEventListener('click', download);
el.copy.addEventListener('click', copy);

window.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey)) return;
  if (e.key === 's') { e.preventDefault(); download(); }
  if (e.key === 'c' && !window.getSelection().toString()) { e.preventDefault(); copy(); }
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(draw, 80);
});

boot();
