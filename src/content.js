// Postcard — adds one button to every post's action row on X.
// Clicking it reads the post out of the DOM and opens the studio in a new tab.

const BTN = 'postcard-btn';

const ICON = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M4.5 4.25h15A2.75 2.75 0 0 1 22.25 7v10a2.75 2.75 0 0 1-2.75 2.75h-15A2.75 2.75 0 0 1 1.75 17V7A2.75 2.75 0 0 1 4.5 4.25Zm0 1.75c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h15c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1h-15Z"></path>
  <rect x="6.25" y="8.9" width="11.5" height="2.2" rx="1.1"></rect>
  <rect x="6.25" y="12.9" width="7" height="2.2" rx="1.1"></rect>
</svg>`;

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
  btn.innerHTML = `<span class="postcard-btn-ring">${ICON}</span>`;

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
