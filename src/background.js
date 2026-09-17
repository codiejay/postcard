// Fetches the images with host permissions (no CORS, no tainted canvas),
// stashes the post, and opens the studio.

async function toDataURL(url) {
  if (!url) return '';
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'postcard:open') return;

  (async () => {
    const post = msg.post;
    post.avatar = await toDataURL(post.avatar);
    post.media = (await Promise.all((post.media || []).map(toDataURL))).filter(Boolean);

    const id = `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await chrome.storage.local.set({ [id]: post });

    // Keep the drawer tidy: only the last 20 posts survive.
    const all = await chrome.storage.local.get(null);
    const keys = Object.keys(all).filter((k) => k.startsWith('pc_')).sort();
    if (keys.length > 20) await chrome.storage.local.remove(keys.slice(0, keys.length - 20));

    await chrome.tabs.create({ url: chrome.runtime.getURL(`studio/studio.html?id=${id}`) });
    sendResponse({ ok: true });
  })();

  return true;
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('studio/studio.html') });
});
