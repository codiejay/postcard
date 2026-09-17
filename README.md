# Postcard

Turn a post on X into an image you can put on Instagram.

Adds one button to the end of every post's action row. Click it and the post
opens in a studio tab, sitting on a gradient, ready to download at the size you
need.

## Install

1. Go to `chrome://extensions`.
2. Turn on Developer mode.
3. Click "Load unpacked" and pick this folder.

## What it does

The button reads the post out of the page: name, handle, verified badge, text,
emoji, timestamp, view count, and up to four photos. Avatars and photos are
refetched at full resolution, so the export is sharp rather than a scaled-up
thumbnail.

The studio gives you:

- **Format** — Auto, 1:1, 4:5, 9:16, 16:9. The fixed formats export at exact
  Instagram pixel sizes (1080×1080, 1080×1350, 1080×1920) and 1920×1080 for
  landscape.
- **Background** — six gradients. Dusk is the default.
- **Card** — Dim, Black, or Light.
- **Margin** — how much gradient sits around the card.

Download saves a PNG. Copy puts it on the clipboard. ⌘S and ⌘C do the same.
Your last choices are remembered for the next post.

## About the Dusk gradient

Dusk is not a hand-written set of colour stops. It is a degree-4 polynomial
colour field, one polynomial per channel, fitted to a reference image over
normalised coordinates:

```
channel(u, v) = Σ c · u^i · v^j     for i + j ≤ 4
```

Mean error against the source is 1.6 out of 255, which is below what an eye can
see. The coefficients live in `studio/backgrounds.js`.

Fitting it this way rather than eyeballing stops buys two things. The gradient
is diagonal and slightly curved, which no single linear gradient reproduces. And
because the field is defined on normalised coordinates, it re-flows correctly
from a wide 16:9 frame to a tall 9:16 one instead of being stretched.

A little grain is composited on top. The source image has it, and it keeps large
exports from banding.

## How it renders

There is one renderer, `studio/render.js`, and it draws to a canvas. The preview
is that canvas at screen scale; the download is the same call at export scale.
There is no second code path, so the file you get is the thing you were looking
at.

## Files

```
manifest.json
src/content.js       injects the button, reads the post
src/content.css      button styling, matched to X's action row
src/background.js    fetches images, stashes the post, opens the studio
studio/render.js     canvas renderer: layout, text wrapping, media grids
studio/backgrounds.js  the gradients and the fitted colour field
studio/studio.js     controls, export, settings
```

## Known gaps

- Quote tweets, polls, and threads are not rendered. A quoted post is dropped.
- Videos use their poster frame.
- View counts only exist on a post's own page, not in the timeline.
