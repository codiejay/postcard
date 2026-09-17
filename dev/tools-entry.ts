/* ==================================================================
   DRAFT entry for newportfolio/data/tools.ts

   This file is a draft parked here in the postcard repo. It is not
   wired to anything. Paste the object into the `tools` array in
   newportfolio/data/tools.ts, from a session started in newportfolio.

   The copy is a first pass. That file says the copy is James's and is
   rendered verbatim, so rewrite anything that doesn't sound like you
   before it ships.

   Blocked on two things that don't exist yet:
     - github.com/codiejay/postcard
     - a release with postcard.zip attached
   Both links below 404 until then.
   ================================================================== */

{
  slug: "postcard",
  name: "Postcard",
  meta: [
    { label: "Type", value: "Chrome extension" },
    { label: "Licence", value: "MIT" },
    { label: "Price", value: "Free" },
  ],
  blurb: [
    "Turns a post on X into an image you'd actually post.",
    "Instagram sizes, exact to the pixel.",
  ],
  description: [
    "Screenshotting a post for Instagram always looked like a screenshot. Wrong crop, grey bars down the side, text softened by the time it came out the other end.",
    "A button sits at the end of every post's action row, after share. Click it and the post opens in a studio tab, on a gradient, ready to go.",
    "Pick 1:1, 4:5, 9:16 or 16:9 and it exports at 1080×1080, 1080×1350, 1080×1920 or 1920×1080. Instagram recompresses anything that isn't one of its own sizes, and that's where the mush comes from. Hit the size exactly and it leaves the file alone.",
    "The default gradient isn't a preset. I fitted a polynomial colour field to an image I liked, one polynomial per colour channel, and it reproduces the original to within 1.6 of 255. It's diagonal and slightly curved, which no single linear gradient can do, and because it's defined on normalised coordinates it re-flows when you switch from a wide frame to a tall one instead of stretching.",
    "No backend, no account, no telemetry. It reads the post out of the page, pulls the avatar and photos at full resolution so the export is sharp, and draws the whole thing on your machine.",
  ],
  /* NOTE — same rule as xtime. /releases/latest/ resolves the RELEASE
     automatically, but the asset filename after it is literal. Every
     release has to attach a zip still named postcard.zip or this 404s.
     dev/package.sh in the postcard repo hard-codes that name. */
  download:
    "https://github.com/codiejay/postcard/releases/latest/download/postcard.zip",
  repo: "https://github.com/codiejay/postcard",
  install: [
    "Download the zip and unzip it somewhere permanent — not Downloads.",
    "Open `chrome://extensions`",
    "Turn on Developer mode, top right.",
    "Load unpacked → pick the folder you unzipped.",
  ],
  callouts: [
    "Keep that folder where it is. Chrome loads the extension from that exact path — move it and it's gone.",
    "It isn't on the Chrome Web Store, so there are no auto-updates.",
    "Quote tweets, polls and threads aren't rendered yet. A quoted post gets dropped.",
  ],
},
