# FLAME DRAGON HUB — repository notes

Static site (GitHub Pages / Cloudflare Pages) plus a separate Chrome MV3
extension. No build step: pages are plain HTML/CSS/JS served as-is.

## Layout

- Site pages live at the repo root (`index.html`, `evolutions.html`, `skins.html`, …).
- `motion.css` + `site-motion.js` hold the shared motion/visual layer and are
  linked by most pages.
- `cursor-glow.js` owns the pointer glow and the 3D card tilt (single source of
  truth for tilt — do not add a second tilt implementation elsewhere). Max lean
  is 7deg. Cards containing an `iframe`/`video` are skipped on purpose: the
  embedded document swallows `pointermove`, so such a card would freeze mid-lean.
- `preferences.js` is injected on every page: language dock, custom background,
  accent colour, light level, YouTube prompt, visitor analytics.
- `favorites.html` is the "App & Extension" page (the file name is legacy).
  It is self-contained: an inline `<script>` holds the `PACKS` list of the 15
  `assets/texture-packs/*.webp` backgrounds and renders the grid, the cursor
  gallery, and a five-screen mock of the extension popup. Both the card grid and
  the popup use one shared lightbox/slider; favourites go to
  `flameDragonTextureFavorites` (pack ids, not skin names).
- `contact.html` renders the public reviews itself (inline module): it reads
  `publicReviews` and `publicReviewSettings/global`. Only the verified owner
  (`ymw3372@gmail.com`, see `ADMIN_EMAILS`) sees the Pin button; the pin lives in
  `publicReviewSettings/global.pinnedId` with a `fdhPinnedReviewId` localStorage
  fallback. Keep `firestore.rules` in step when that document grows fields.
- Background light is controlled by the `--fdh-glow` CSS variable on `body`
  (`motion.css`). `body[data-glow="calm|medium|bright"]` sets it, and both
  `.fdh-sunlight-layer` and `.fdh-bg-layer` multiply their opacity by it, so the
  whole backdrop dims from one place. Default is `calm`.
- `sw.js` is the service worker; `CACHE_NAME` must be bumped whenever cached
  assets change so returning visitors pick up the new files.
- `skins.html` builds its grid from `skins-data.js`; image files live in
  `assets/skins/<folder>/`. The extension ships its own catalog
  (`skins.json` + a `skins/` tree inside the published ZIP), which can hold
  skins the site is missing. When the two drift, diff them by skin *name*
  (the extension sometimes misspells a filename, e.g. `ninga.png` vs the
  site's `ninja.png`, and renames others from camelCase to kebab-case) and copy
  any genuinely new images into `assets/skins/` before adding the entry.
- `extension/` is the unpacked Chrome extension (its own `manifest.json`).
  The published ZIP is a *different* tree built from `tools/`; it is not
  produced from this folder.
- Signed-in state for the UI is the `fdhHasAccountSession` localStorage flag,
  written only by `auth.js` on `account.html`. Two prompts must hide when it is
  `"1"`: the right-side account reminder (`site-motion.js`, `addAccountReminder`)
  and the Home "CREATE ACCOUNT" shortcut (`preferences.js`). Both listen for the
  cross-tab `storage` event plus `visibilitychange`, so signing in on the account
  page clears them without a reload. Hide the reminder with inline
  `display`/`style.display`, not `hidden`, because the author rules set
  `display:flex`.

## Conventions

- Card selectors vary by page: `.orbit-card` (home), `.evolution-card`,
  `.vault-card` (skins), `.tp-card` (favorites / App & Extension), `.fav-card`,
  `.guide-card`, `.settings-card`, `.about-card`, `.dev-card`,
  `.profile-card`, `.contact-layout > *`.
  JavaScript-built grids (skins, favourites) render after load, so anything
  that decorates cards must also observe DOM mutations.
- localStorage keys are namespaced `flameDragon*` (e.g. `flameDragonBg`,
  `flameDragonAccent`, `flameDragonFavorites`, `flameDragonLanguage`).
- The in-app version label must match the release tag. Check `preferences.js`,
  `extension-update.json`, `extension/manifest.json`,
  `extension/background.js`, `extension/site-download-bridge.js`.
- Every download link points at the GitHub release asset
  `releases/download/<version>/FLAME_DRAGON_HUB_v<version>.zip`, so bumping the
  version means editing the URL *and* the filename in `index.html` (announcement
  button + orbit card), `extension-update.html`, `install-guide.html`,
  `extension-update.json`, and the `FDH_UPDATE_*` constants in
  `extension/background.js`.
- The downloaded-update flags (`data-fdh-v<digits>-downloaded`) are version
  encoded: `1.6.0` → `data-fdh-v160-downloaded`. Rename it in both
  `index.html` and `extension/site-download-bridge.js` or the announcement card
  never hides.
- The home announcement card (`.update-announcement`) is a light frosted panel
  on the dark page: white gradient, dark `#141a24` heading, `#4a566a` body, and
  a silver button. Keep it light — the page-level motion layer multiplies
  opacity, so dark-on-light text is what stays readable.

## Gotchas

- `.fdh-reveal { transform: ... !important }` (two classes) overrides
  single-class transform rules. Any tilt/transform rule must match or exceed
  that specificity and appear later in the cascade.
- The first-visit YouTube prompt (`#fdh-yt-overlay`, z-index 1000000) covers the
  whole viewport. It is not a layout bug, but it does intercept the pointer
  until dismissed, which makes hover effects look broken during testing.
- `motion.css` clips `img` elements with a `fdh-image-draw` reveal. Small images
  inside a mock UI (extension popup tiles, cursor swatches) look broken under it,
  so they carry `fdh-no-draw`.
- Headless Chrome reports `hover: none` / `pointer: coarse`; override
  `window.matchMedia` when testing pointer-driven behaviour.
- GitHub tokens in this environment are read-only: deliver via
  git bundle / patch / zip artifacts rather than pushing.

## Local checks

```sh
node -c cursor-glow.js          # syntax check
python3 -m http.server 13000    # serve the site for manual review
```
