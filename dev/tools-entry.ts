/* ==================================================================
   DRAFT entry for newportfolio/data/tools.ts

   Parked here, wired to nothing. Paste the object into the `tools`
   array in newportfolio/data/tools.ts, from a session started in
   newportfolio.

   Both links below are live: v1.0.0 is released and postcard.zip is
   attached.

   The install steps and the first two callouts are lifted verbatim
   from the xtime entry. The blurb and description are left empty on
   purpose, with the facts listed above them. That copy is yours.
   ================================================================== */

{
  slug: "postcard",
  name: "Postcard",
  meta: [
    { label: "Type", value: "Chrome extension" },
    { label: "Licence", value: "MIT" },
    { label: "Price", value: "Free" },
  ],
  // WRITE THESE TWO YOURSELF. Facts to work from, not copy:
  //   - a button at the end of every post's action row, after share
  //   - opens a studio tab, pick a size, download a PNG
  //   - 1:1, 4:5, 9:16, 16:9 export at 1080x1080, 1080x1350, 1080x1920, 1920x1080
  //   - Instagram recompresses anything that isn't one of its own sizes
  //   - the default gradient is a polynomial fitted to a reference image,
  //     one per colour channel, within 1.6 of 255; best linear fit was 7.4
  //   - six gradients, three card themes, adjustable margin
  //   - no backend, no account, no telemetry, everything on your machine
  blurb: [
    "",
    "",
  ],
  description: [
    "",
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
