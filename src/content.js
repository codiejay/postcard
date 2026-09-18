// Postcard — adds one button to every post's action row on X.
// Clicking it reads the post out of the DOM and opens the studio in a new tab.

const BTN = 'postcard-btn';

// The button is a swatch of the default background, not a glyph. Keep this in
// sync with the `dusk` swatch in studio/backgrounds.js, which is the source of
// truth for the colour. The chip itself is painted in content.css.
const CHIP = '<span class="postcard-chip"></span>';

/* ---------- reading the post ---------- */

// X renders emoji as <img alt="😉">, so walk the tree instead of using textContent.
function readText(el) {
  if (!el) return '';
  let out = '';
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) out += child.data;
      else if (child.nodeName === 'IMG') out += child.getAttribute('alt') || '';
      else if (child.nodeName === 'BR') out += '\n';
      else walk(child);
    }
  };
  walk(el);
  return out;
}

function biggerAvatar(url) {
  return url.replace(/_(normal|bigger|mini|x96|200x200)\.(jpg|jpeg|png|webp)/, '_400x400.$2');
}

function biggerMedia(url) {
  return url.replace(/([?&]name=)[a-z0-9]+/, '$1large');
}

function readPost(article) {
  const nameBlock = article.querySelector('[data-testid="User-Name"]');
  let name = '';
  let handle = '';

  if (nameBlock) {
    const links = nameBlock.querySelectorAll('a[role="link"]');
    if (links[0]) name = readText(links[0]).trim();
    for (const span of nameBlock.querySelectorAll('span')) {
      const t = span.textContent.trim();
      if (t.startsWith('@') && !t.includes(' ')) { handle = t; break; }
    }
    if (!name) name = readText(nameBlock).split('\n')[0].trim();
  }

  const verified = !!nameBlock?.querySelector(
    '[data-testid="icon-verified"], svg[aria-label*="Verified" i]'
  );

  const avatarImg =
    article.querySelector('[data-testid^="Tweet-User-Avatar"] img') ||
    article.querySelector('[data-testid^="UserAvatar-Container"] img') ||
    article.querySelector('img[src*="profile_images"]');

  const timeEl = article.querySelector('time');

  const media = [];
  for (const img of article.querySelectorAll('[data-testid="tweetPhoto"] img[src]')) {
    if (media.length < 4) media.push(biggerMedia(img.src));
  }
  if (!media.length) {
    const poster = article.querySelector('[data-testid="videoPlayer"] video[poster]');
    if (poster) media.push(poster.getAttribute('poster'));
  }

/* ---------- link preview cards ---------- */

// A link preview is not a photo. X puts it in its own wrapper with no
// tweetPhoto anywhere, which is why these used to vanish from the postcard.
// The layout is an image, a title pill sitting on the image, and a "From
// <domain>" line underneath it.
function readCard(article) {
  const wrap = article.querySelector('[data-testid="card.wrapper"]');
  if (!wrap) return null;

  // The image is usually an <img>, but X sometimes paints it as a CSS
  // background instead, so check both before giving up.
  let src = wrap.querySelector('img[src]')?.src || '';
  if (!src) {
    for (const el of wrap.querySelectorAll('*')) {
      const m = getComputedStyle(el).backgroundImage.match(/url\(["']?(.+?)["']?\)/);
      if (m && m[1].startsWith('http')) { src = m[1]; break; }
    }
  }
  if (!src) return null;

  const title = readText(
    wrap.querySelector('[data-testid$=".detail"]') ||
    wrap.querySelector('[data-testid$=".media"] span') ||
    wrap
  ).trim().split('\n')[0];

  return { image: biggerMedia(src), title, domain: readDomain(article, wrap) };
}

// X prints the domain as "From example.com" in a sibling of the card, which is
// English-only. Falling back to the first link in the post text covers the rest,
// since a card almost always comes from a link that is in the post.
function readDomain(article, wrap) {
  const near = wrap.parentElement?.parentElement || article;
  for (const el of near.querySelectorAll('span')) {
    if (el.children.length) continue;
    const m = el.textContent.trim().match(/^(?:From\s+)?([a-z0-9.-]+\.[a-z]{2,})$/i);
    if (m) return m[1];
  }
  const link = article.querySelector('[data-testid="tweetText"] a[href]');
  const shown = link?.textContent.trim().replace(/^https?:\/\//, '');
  const host = shown?.split('/')[0];
  return host && host.includes('.') ? host : '';
}

  // Views only exist on the post detail page.
  let views = '';
  const analytics = article.querySelector('a[href$="/analytics"]');
  if (analytics) {
    const label = analytics.getAttribute('aria-label') || analytics.textContent;
    const n = label.match(/([\d.,KMB]+)\s*(view|View)/);
    if (n) views = n[1];
  }

  let url = '';
  const permalink = timeEl?.closest('a[href*="/status/"]');
  if (permalink) url = new URL(permalink.getAttribute('href'), location.origin).href;

  return {
    name: name || 'Unknown',
    handle: handle || '@unknown',
    verified,
    avatar: avatarImg ? biggerAvatar(avatarImg.src) : '',
    text: readText(article.querySelector('[data-testid="tweetText"]')).replace(/\s+$/, ''),
    time: timeEl?.getAttribute('datetime') || '',
    media,
    card: readCard(article),
    views,
    url,
  };
}

/* ---------- the button ---------- */

function makeButton(article) {
  const wrap = document.createElement('div');
  wrap.className = BTN;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Make a postcard');
  btn.title = 'Make a postcard';
  btn.innerHTML = `<span class="postcard-btn-ring">${CHIP}</span>`;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.classList.add('is-busy');
    try {
      await chrome.runtime.sendMessage({ type: 'postcard:open', post: readPost(article) });
    } catch (err) {
      console.error('[Postcard]', err);
    }
    setTimeout(() => btn.classList.remove('is-busy'), 600);
  });

  wrap.appendChild(btn);
  return wrap;
}

function inject(article) {
  if (article.querySelector(`.${BTN}`)) return;
  const group = article.querySelector('[role="group"]');
  if (!group || group.children.length < 2) return;
  group.appendChild(makeButton(article));
}

function scan() {
  for (const article of document.querySelectorAll('article[data-testid="tweet"]')) inject(article);
}

const observer = new MutationObserver(() => {
  clearTimeout(scan._t);
  scan._t = setTimeout(scan, 120);
});
observer.observe(document.body, { childList: true, subtree: true });
scan();
