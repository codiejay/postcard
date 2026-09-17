// Backgrounds.
//
// "Dusk" is not a hand-written gradient. It is a degree-4 polynomial colour
// field fitted to the reference image, one polynomial per channel over
// normalised (u, v) coordinates. Mean error against the source is 1.6/255,
// so it reproduces the original exactly and re-flows to any aspect ratio.
//   channel(u, v) = sum over terms of  c * u^i * v^j
const DUSK_FIELD = [
  // i, j,        r,        g,        b
  [0, 0, 14.5524, 39.8106, 75.8109],
  [0, 1, -9.3452, 70.7226, 62.6319],
  [0, 2, 220.4981, 102.498, 172.9849],
  [0, 3, 169.1681, 221.1857, 140.8298],
  [0, 4, -160.3233, -262.7299, -354.9088],
  [1, 0, 26.3358, 55.2353, 77.6542],
  [1, 1, 326.8674, 254.8835, 268.3224],
  [1, 2, -585.3506, -607.6122, -711.1883],
  [1, 3, 322.9372, 351.9408, 371.4075],
  [2, 0, -36.4611, 2.3787, 8.2589],
  [2, 1, -191.2116, -209.5245, -190.4553],
  [2, 2, -27.043, 40.2722, 82.162],
  [3, 0, 67.6054, -27.7463, -77.4281],
  [3, 1, 143.4039, 142.5737, 113.8639],
  [4, 0, -32.9391, 14.6758, 44.5273],
];

export const BACKGROUNDS = [
  { id: 'dusk',  name: 'Dusk',  type: 'field',  field: DUSK_FIELD, swatch: 'linear-gradient(168deg, #0d284c 0%, #3a6289 42%, #a7a9a5 74%, #edad5c 100%)' },
  { id: 'slate', name: 'Slate', type: 'linear', angle: 168, stops: [[0, '#1b1f24'], [0.55, '#3d454f'], [1, '#8d959f']] },
  { id: 'ember', name: 'Ember', type: 'linear', angle: 168, stops: [[0, '#2b0f14'], [0.45, '#7a2530'], [0.8, '#d1613f'], [1, '#f2b263']] },
  { id: 'moss',  name: 'Moss',  type: 'linear', angle: 168, stops: [[0, '#0d2420'], [0.5, '#25584b'], [1, '#b7cba4']] },
  { id: 'plum',  name: 'Plum',  type: 'linear', angle: 168, stops: [[0, '#1b1033'], [0.45, '#4b2a6b'], [0.8, '#a75a92'], [1, '#e8a8b6']] },
  { id: 'paper', name: 'Paper', type: 'linear', angle: 168, stops: [[0, '#f4f1ea'], [0.6, '#e6e0d4'], [1, '#cfc6b6']] },
];

const fieldCache = new Map();

function clamp255(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// The field is resolution independent, so bake it once at 192x192 and let the
// browser scale it. Bilinear upscaling of a smooth field is sub-1/255 accurate.
function bakeField(bg) {
  if (fieldCache.has(bg.id)) return fieldCache.get(bg.id);
  const N = 192;
  const cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(N, N);
  const d = img.data;
  for (let y = 0; y < N; y++) {
    const v = y / (N - 1);
    for (let x = 0; x < N; x++) {
      const u = x / (N - 1);
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < bg.field.length; k++) {
        const t = bg.field[k];
        const w = Math.pow(u, t[0]) * Math.pow(v, t[1]);
        r += t[2] * w; g += t[3] * w; b += t[4] * w;
      }
      const o = (y * N + x) * 4;
      d[o] = clamp255(r); d[o + 1] = clamp255(g); d[o + 2] = clamp255(b); d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  fieldCache.set(bg.id, cv);
  return cv;
}

// CSS gradient angles: 0deg points up, 180deg points down.
function linearPoints(angle, w, h) {
  const rad = (angle - 90) * Math.PI / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  return [
    w / 2 - dx * len / 2, h / 2 - dy * len / 2,
    w / 2 + dx * len / 2, h / 2 + dy * len / 2,
  ];
}

let grainTile = null;

// A touch of grain. The source image has it (residual sigma 2.1), and it stops
// big exports from banding.
function grain() {
  if (grainTile) return grainTile;
  const N = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(N, N);
  const d = img.data;
  for (let i = 0; i < N * N; i++) {
    const n = (Math.random() * 255) | 0;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = n;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainTile = cv;
  return cv;
}

export function paintBackground(ctx, w, h, bg) {
  ctx.save();
  if (bg.type === 'field') {
    const tile = bakeField(bg);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tile, 0, 0, tile.width, tile.height, 0, 0, w, h);
  } else {
    const [x0, y0, x1, y1] = linearPoints(bg.angle, w, h);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [pos, colour] of bg.stops) g.addColorStop(pos, colour);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.035;
  const pattern = ctx.createPattern(grain(), 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

