// The renderer. Preview and export run through this same function at
// different scales, so the download is exactly what you saw.

import { paintBackground } from './backgrounds.js';

export const ASPECTS = [
  { id: 'auto', label: 'Auto',     note: 'fits the post', ratio: null, size: null },
  { id: '1x1',  label: '1:1',      note: 'Instagram post',    ratio: 1,      size: [1080, 1080] },
  { id: '4x5',  label: '4:5',      note: 'Instagram portrait', ratio: 4 / 5,  size: [1080, 1350] },
  { id: '9x16', label: '9:16',     note: 'Story and Reels',   ratio: 9 / 16, size: [1080, 1920] },
  { id: '16x9', label: '16:9',     note: 'X and LinkedIn',    ratio: 16 / 9, size: [1920, 1080] },
];

export const THEMES = [
  { id: 'dim',   name: 'Dim',   bg: '#1b1d21', text: '#e7e9ea', muted: '#8b9098', link: '#5ba6f7', border: null },
  { id: 'black', name: 'Black', bg: '#000000', text: '#e7e9ea', muted: '#71767b', link: '#1d9bf0', border: 'rgba(255,255,255,0.12)' },
  { id: 'light', name: 'Light', bg: '#ffffff', text: '#0f1419', muted: '#536471', link: '#1d9bf0', border: 'rgba(0,0,0,0.08)' },
];

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

// Every number below is a logical unit. Scale is applied once, at the top.
const M = {
  cardW: 620,
  pad: 30,
  radius: 26,
  avatar: 48,
  avatarGap: 13,
  nameSize: 17,
  nameLh: 21,
  handleSize: 15,
  badgeSize: 18.5,
  headGap: 18,
  textSize: 21,
  textLh: 29,
  mediaGap: 18,
  mediaRadius: 16,
  mediaCellGap: 4,
  metaGap: 18,
  metaSize: 15,
  metaLh: 20,
  linkInset: 13,
  linkTitleSize: 14.5,
  linkTitlePadX: 10,
  linkTitlePadY: 6.5,
  linkTitleRadius: 6,
  linkDomainSize: 14.5,
  linkDomainGap: 9,
  linkDomainLh: 19,
};

const VERIFIED_PATH = new Path2D(
  'M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z'
);

/* ---------- text ---------- */

function isLink(s) {
  return (
    /^[@#][\wÀ-ɏ]/.test(s) ||
    /^https?:\/\//i.test(s) ||
    /^[\w-]+\.(com|org|net|io|co|ai|app|dev|gg|so|xyz|me)\b/i.test(s)
  );
}

// X shows a trimmed URL, not the raw one. Matching that reads better and
// stops a long link from being chopped mid-word by the wrapper.
function shortenUrl(s) {
  const m = s.match(/^(https?:\/\/)?(www\.)?([^\s]+)$/i);
  if (!m) return s;
  const rest = m[3];
  return rest.length > 28 ? rest.slice(0, 27) + '…' : rest;
}

function font(weight, size) {
  return `${weight} ${size}px ${FONT}`;
}

// Greedy wrap over coloured runs. Returns an array of lines; a line is an
// array of runs, and an empty line is a blank paragraph break.
function wrap(ctx, text, maxW) {
  ctx.font = font(400, M.textSize);
  const lines = [];

  for (const para of text.split('\n')) {
    if (!para.trim()) {
      lines.push([]);
      continue;
    }
    const tokens = para.split(/(\s+)/).filter((s) => s !== '');
    let line = [];
    let x = 0;

    const push = () => {
      while (line.length && /^\s+$/.test(line[line.length - 1].t)) line.pop();
      lines.push(line);
      line = [];
      x = 0;
    };

    for (let t of tokens) {
      const link = isLink(t);
      if (link && /^https?:\/\//i.test(t)) t = shortenUrl(t);
      let w = ctx.measureText(t).width;

      // A single token wider than the line (a long URL) gets split by character.
      if (w > maxW && !/^\s+$/.test(t)) {
        if (line.length) push();
        let chunk = '';
        for (const ch of t) {
          const cw = ctx.measureText(chunk + ch).width;
          if (cw > maxW && chunk) {
            lines.push([{ t: chunk, link, w: ctx.measureText(chunk).width }]);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        if (chunk) {
          line = [{ t: chunk, link, w: ctx.measureText(chunk).width }];
          x = ctx.measureText(chunk).width;
        }
        continue;
      }

      if (x + w > maxW && line.length) push();
      if (!line.length && /^\s+$/.test(t)) continue;
      line.push({ t, link, w });
      x += w;
    }
    push();
  }

  while (lines.length && !lines[lines.length - 1].length) lines.pop();
  return lines;
}

function ellipsize(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
  return out + '…';
}

function metaParts(post) {
  const parts = [];
  if (post.time) {
    const d = new Date(post.time);
    if (!isNaN(d)) {
      // ICU uses a narrow no-break space before AM/PM; it renders too tight.
      const clock = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        .replace(/[\u202f\u00a0]/g, ' ');
      parts.push({ t: clock });
      parts.push({ t: ' · ' });
      parts.push({ t: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
    }
  }
  if (post.views) {
    if (parts.length) parts.push({ t: ' · ' });
    parts.push({ t: post.views, strong: true });
    parts.push({ t: ' Views' });
  }
  return parts;
}

/* ---------- layout ---------- */

function mediaBoxes(count, w, images) {
  const g = M.mediaCellGap;
  if (count === 1) {
    const img = images[0];
    const ratio = img && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 16 / 9;
    const h = Math.max(w * 0.42, Math.min(w / ratio, w * 1.28));
    return { h, cells: [{ x: 0, y: 0, w, h }] };
  }
  if (count === 2) {
    const h = w * 0.56;
    const cw = (w - g) / 2;
    return { h, cells: [{ x: 0, y: 0, w: cw, h }, { x: cw + g, y: 0, w: cw, h }] };
  }
  if (count === 3) {
    const h = w * 0.56;
    const cw = (w - g) / 2;
    const ch = (h - g) / 2;
    return {
      h,
      cells: [
        { x: 0, y: 0, w: cw, h },
        { x: cw + g, y: 0, w: cw, h: ch },
        { x: cw + g, y: ch + g, w: cw, h: ch },
      ],
    };
  }
  const h = w * 0.56;
  const cw = (w - g) / 2;
  const ch = (h - g) / 2;
  return {
    h,
    cells: [
      { x: 0, y: 0, w: cw, h: ch },
      { x: cw + g, y: 0, w: cw, h: ch },
      { x: 0, y: ch + g, w: cw, h: ch },
      { x: cw + g, y: ch + g, w: cw, h: ch },
    ],
  };
}

export function layout(ctx, post, images) {
  const photos = images.media || [];
  const inner = M.cardW - M.pad * 2;
  let y = M.pad;

  const headerY = y;
  y += M.avatar;

  const lines = post.text ? wrap(ctx, post.text, inner) : [];
  let textY = 0;
  if (lines.length) {
    y += M.headGap;
    textY = y;
    y += lines.length * M.textLh;
  }

  let media = null;
  if (photos.length) {
    y += M.mediaGap;
    const box = mediaBoxes(photos.length, inner, photos);
    media = { y, h: box.h, cells: box.cells };
    y += box.h;
  }

  // A link preview sits where photos would, in its own shape: one image, a
  // title pill laid over it, and the domain on a line of its own underneath.
  let link = null;
  if (images.card) {
    y += M.mediaGap;
    const img = images.card;
    const ratio = img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.91;
    const h = inner / Math.min(Math.max(ratio, 1.2), 2.4);
    link = { y, h, domainY: 0 };
    y += h;
    if (post.card && post.card.domain) {
      y += M.linkDomainGap;
      link.domainY = y;
      y += M.linkDomainLh;
    }
  }

  const meta = metaParts(post);
  let metaY = 0;
  if (meta.length) {
    y += M.metaGap;
    metaY = y;
    y += M.metaLh;
  }

  y += M.pad;
  return { cardW: M.cardW, cardH: Math.round(y), headerY, lines, textY, media, link, meta, metaY };
}

/* ---------- drawing ---------- */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.naturalWidth / img.naturalHeight;
  const br = w / h;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  if (ir > br) {
    sw = sh * br;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw / br;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawCard(ctx, post, images, L, theme) {
  const inner = M.cardW - M.pad * 2;

  // Header
  const ax = M.pad;
  const ay = L.headerY;
  if (images.avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + M.avatar / 2, ay + M.avatar / 2, M.avatar / 2, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, images.avatar, ax, ay, M.avatar, M.avatar);
    ctx.restore();
  } else {
    ctx.fillStyle = theme.id === 'light' ? '#cfd9de' : '#2f3336';
    ctx.beginPath();
    ctx.arc(ax + M.avatar / 2, ay + M.avatar / 2, M.avatar / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tx = ax + M.avatar + M.avatarGap;
  const blockH = M.nameLh * 2;
  const top = ay + (M.avatar - blockH) / 2;

  const nameRoom = M.cardW - M.pad - tx - (post.verified ? M.badgeSize + 4 : 0);

  ctx.textBaseline = 'middle';
  ctx.font = font(700, M.nameSize);
  ctx.fillStyle = theme.text;
  const name = ellipsize(ctx, post.name, nameRoom);
  const nameW = ctx.measureText(name).width;
  ctx.fillText(name, tx, top + M.nameLh / 2);

  if (post.verified) {
    const s = M.badgeSize / 24;
    ctx.save();
    ctx.translate(tx + nameW + 4, top + M.nameLh / 2 - M.badgeSize / 2);
    ctx.scale(s, s);
    ctx.fillStyle = '#1d9bf0';
    ctx.fill(VERIFIED_PATH);
    ctx.restore();
  }

  ctx.font = font(400, M.handleSize);
  ctx.fillStyle = theme.muted;
  ctx.fillText(ellipsize(ctx, post.handle, M.cardW - M.pad - tx), tx, top + M.nameLh + M.nameLh / 2);

  // Body
  if (L.lines.length) {
    ctx.font = font(400, M.textSize);
    let y = L.textY + M.textLh / 2;
    for (const line of L.lines) {
      let x = M.pad;
      for (const run of line) {
        ctx.fillStyle = run.link ? theme.link : theme.text;
        ctx.fillText(run.t, x, y);
        x += run.w;
      }
      y += M.textLh;
    }
  }

  // Media
  if (L.media) {
    ctx.save();
    roundRect(ctx, M.pad, L.media.y, inner, L.media.h, M.mediaRadius);
    ctx.clip();
    ctx.fillStyle = theme.id === 'light' ? '#eff3f4' : '#16181c';
    ctx.fillRect(M.pad, L.media.y, inner, L.media.h);
    L.media.cells.forEach((cell, i) => {
      const img = images.media[i];
      if (!img) return;
      drawCover(ctx, img, M.pad + cell.x, L.media.y + cell.y, cell.w, cell.h);
    });
    ctx.restore();
  }

  // Link preview
  if (L.link) {
    const c = L.link;
    ctx.save();
    roundRect(ctx, M.pad, c.y, inner, c.h, M.mediaRadius);
    ctx.clip();
    ctx.fillStyle = theme.id === 'light' ? '#eff3f4' : '#16181c';
    ctx.fillRect(M.pad, c.y, inner, c.h);
    drawCover(ctx, images.card, M.pad, c.y, inner, c.h);
    ctx.restore();

    const title = post.card && post.card.title;
    if (title) {
      ctx.font = font(400, M.linkTitleSize);
      const room = inner - M.linkInset * 2 - M.linkTitlePadX * 2;
      const label = ellipsize(ctx, title, room);
      const w = ctx.measureText(label).width + M.linkTitlePadX * 2;
      const h = M.linkTitleSize + M.linkTitlePadY * 2;
      const x = M.pad + M.linkInset;
      const y = c.y + c.h - M.linkInset - h;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.77)';
      roundRect(ctx, x, y, w, h, M.linkTitleRadius);
      ctx.fill();
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + M.linkTitlePadX, y + h / 2);
    }

    if (c.domainY) {
      ctx.textBaseline = 'middle';
      ctx.font = font(400, M.linkDomainSize);
      ctx.fillStyle = theme.muted;
      ctx.fillText(
        ellipsize(ctx, `From ${post.card.domain}`, inner),
        M.pad,
        c.domainY + M.linkDomainLh / 2
      );
    }
  }

  // Meta
  if (L.meta.length) {
    let x = M.pad;
    const y = L.metaY + M.metaLh / 2;
    for (const part of L.meta) {
      ctx.font = font(part.strong ? 700 : 400, M.metaSize);
      ctx.fillStyle = part.strong ? theme.text : theme.muted;
      ctx.fillText(part.t, x, y);
      x += ctx.measureText(part.t).width;
    }
  }
}

/* ---------- top level ---------- */

// Returns the logical canvas size for a post, before any scaling.
export function frame(ctx, post, images, opts) {
  const L = layout(ctx, post, images);
  const pad = M.cardW * opts.padding;
  let w = M.cardW + pad * 2;
  let h = L.cardH + pad * 2;

  const aspect = ASPECTS.find((a) => a.id === opts.aspect);
  if (aspect && aspect.ratio) {
    if (w / h > aspect.ratio) h = w / aspect.ratio;
    else w = h * aspect.ratio;
  }
  return { w: Math.round(w), h: Math.round(h), L };
}

export function render(canvas, post, images, opts) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const { w, h, L } = frame(ctx, post, images, opts);

  const aspect = ASPECTS.find((a) => a.id === opts.aspect);
  const target = opts.exact && aspect && aspect.size ? aspect.size : [w * opts.scale, h * opts.scale];
  canvas.width = Math.round(target[0]);
  canvas.height = Math.round(target[1]);

  const s = canvas.width / w;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paintBackground(ctx, canvas.width, canvas.height, opts.background);

  ctx.scale(s, s);
  const theme = opts.theme;
  const cx = (w - M.cardW) / 2;
  const cy = (h - L.cardH) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 54;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = theme.bg;
  roundRect(ctx, cx, cy, M.cardW, L.cardH, M.radius);
  ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, cx, cy, M.cardW, L.cardH, M.radius);
  ctx.clip();
  ctx.translate(cx, cy);
  drawCard(ctx, post, images, L, theme);
  ctx.restore();

  if (theme.border) {
    ctx.save();
    roundRect(ctx, cx + 0.5, cy + 0.5, M.cardW - 1, L.cardH - 1, M.radius);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  return { w: canvas.width, h: canvas.height };
}
