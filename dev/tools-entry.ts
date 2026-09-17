/* ==================================================================
   DRAFT entry for newportfolio/data/tools.ts

   Parked here, wired to nothing. Paste the object into the `tools`
   array in newportfolio/data/tools.ts, from a session started in
   newportfolio.

   Both links below are live: v1.0.0 is released and postcard.zip is
   attached.

   The install steps and the first two callouts are lifted verbatim
   from the xtime entry so the two tool pages read as one voice. The
   blurb and description are a draft. Rewrite anything that isn't you.
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
    "Turns a post on X into an image, not a screenshot of one.",
    "Exports at the exact size Instagram wants, so it stops chewing the file.",
  ],
  description: [
    "I kept screenshotting posts to put on Instagram and they kept coming out looking like screenshots. Grey bars, wrong crop, text gone soft. So I built the thing that doesn't do that.",
    "A button sits at the end of every post's action row, after share. Click it and the post opens in a studio tab on a gradient. Pick a size, download it.",
    "1:1, 4:5, 9:16 and 16:9 export at 1080×1080, 1080×1350, 1080×1920 and 1920×1080. That's the whole reason those numbers are hard-coded. Instagram recompresses anything that isn't one of its own sizes, and that's where the mush comes from.",
    "The default gradient isn't a list of colour stops. I fitted a polynomial to a reference image, one per colour channel, and it lands within 1.6 of 255 of the original. The best single linear gradient I could get was off by 7.4, and you can see that one. It also re-flows properly going from a wide frame to a tall one instead of stretching.",
    "No backend, no AI, no account, no telemetry. It reads the post out of the page, goes back for the avatar and photos at full resolution, and draws the whole thing on your machine.",
  ],
  /* NOTE — same rule as xtime. /releases/latest/ resolves the RELEASE
     automatically, but the asset filename after it is literal. Every
     release has to attach a zip still named postcard.zip, or this
     404s. dev/package.sh in the postcard repo hard-codes that name. */
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
