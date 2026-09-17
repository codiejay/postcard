# Postcard

A Chrome extension that turns a post on X into an image you can put on
Instagram, at the exact pixel size Instagram wants so it stops chewing the file.

![A post rendered on the Dusk gradient](docs/hero.jpg)

One button, last in the post's action row, after share. Click it and the post
opens in a studio tab on a gradient. Pick a size, download it.

The default gradient, Dusk, is fitted to a reference image rather than picked
out of a palette. More on that below, because it's the part I actually enjoyed.

---

## Install

Not on the Chrome Web Store. Four steps:

1. Grab [`postcard.zip`](https://github.com/codiejay/postcard/releases/latest/download/postcard.zip)
   from Releases and unzip it.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. **Load unpacked** → pick the unzipped folder.

**Leave that folder where it is.** Chrome loads the extension from the path you
picked. Move it or delete it and the extension goes with it. Put it somewhere
you won't tidy up, not in Downloads.

No auto-updates either. New version means downloading it again and hitting the
refresh icon on the card.

---

## The studio

![The studio, with format, background, card and margin controls](docs/studio.jpg)

The button reads the post straight out of the page: name, handle, verified
badge, text, emoji, timestamp, view count, and up to four photos. It then goes
back for the avatar and the photos at full resolution, so what you export is the
real image and not a blown-up thumbnail.

| Control | Options |
|---|---|
| Format | Auto, 1:1, 4:5, 9:16, 16:9 |
| Background | six gradients, Dusk by default |
| Card | Dim, Black, Light |
| Margin | how much gradient sits around the card |

Download saves a PNG. Copy puts it on the clipboard. `⌘S` and `⌘C` do the same.
Whatever you picked last time is what loads next time.

---

## Sizes

![The same post at 1:1, 4:5, 9:16 and 16:9](docs/formats.webp)

| Format | Exports at | For |
|---|---|---|
| 1:1 | 1080 × 1080 | Instagram post |
| 4:5 | 1080 × 1350 | Instagram portrait |
| 9:16 | 1080 × 1920 | Story and Reels |
| 16:9 | 1920 × 1080 | X and LinkedIn |
| Auto | fits the post | anywhere |

This is the whole reason the sizes are hard-coded. Instagram recompresses
anything that isn't one of its own sizes, and that's where the mush comes from.
Hit the number exactly and it leaves the file alone.

---

## Samples

![One post rendered five ways](docs/samples.webp)

Same post, five settings. Dusk at 9:16 and 1:1, Paper with a light card, Slate
with a black card at 16:9, Plum at 4:5. The 9:16 one came straight out of the
extension and nothing happened to it afterwards.

---

## Dusk

Dusk isn't a list of colour stops. It's a degree-4 polynomial colour field, one
polynomial per channel, fitted to a reference image over normalised coordinates:

```
channel(u, v) = Σ c · u^i · v^j     for i + j ≤ 4
```

Mean error against the source is **1.6 out of 255**, which is under what an eye
resolves. The coefficients sit in `studio/backgrounds.js`.

Two reasons to fit it instead of eyeballing stops. The gradient is diagonal
*and* slightly curved, and the best single linear gradient I could fit was off
by 7.4, which you can see. And because the field lives on normalised
coordinates, it re-flows when you switch a wide 16:9 frame to a tall 9:16 one
instead of stretching.

There's grain over the top at 3.5% opacity. The source image has it, and it
stops a 1080 × 1920 export from banding.

---

## One renderer

`studio/render.js` draws to a canvas. The preview is that canvas at screen
scale. The download is the same call at export scale. There is no second code
path, so the file you get is the thing you were looking at.

```
manifest.json
src/content.js         injects the button, reads the post
src/content.css        button styling, matched to X's action row
src/background.js      fetches images, stashes the post, opens the studio
studio/render.js       layout, text wrapping, media grids, the draw
studio/backgrounds.js  the gradients and the fitted colour field
studio/studio.js       controls, export, settings
dev/package.sh         builds the release zip
```

---

## Cutting a release

```
./dev/package.sh
```

The asset is always called `postcard.zip` and never carries a version. GitHub's
permanent link is `/releases/latest/download/postcard.zip`, which resolves the
release but takes the filename literally, so a versioned asset quietly breaks
every link pointing at it. The version lives in the manifest and the tag.

---

## What it doesn't do

- Quote tweets, polls and threads. A quoted post gets dropped.
- Video. It uses the poster frame.
- View counts in the timeline. X only renders those on the post's own page.

---

MIT. The post in the samples is real. The one in the hero and the studio shot is
a mock-up, made with the extension.
