# FLAME DRAGON HUB — repository notes

Static site (GitHub Pages / Cloudflare Pages) plus a separate Chrome MV3
extension. No build step: pages are plain HTML/CSS/JS served as-is.

## Layout

- Site pages live at the repo root (`index.html`, `evolutions.html`, `skins.html`, …).
- `motion.css` + `site-motion.js` hold the shared motion/visual layer and are
  linked by most pages.
- `cursor-glow.js` owns the pointer glow and the 3D card tilt (single source of
  truth for tilt — do not add a second tilt implementation elsewhere).
- `preferences.js` is injected on every page: language dock, theme, custom
  background, YouTube prompt, visitor analytics.
- `sw.js` is the service worker; `CACHE_NAME` must be bumped whenever cached
  assets change so returning visitors pick up the new files.
- `extension/` is the unpacked Chrome extension (its own `manifest.json`).
  The published ZIP is a *different* tree built from `tools/`; it is not
  produced from this folder.

## Conventions

- Card selectors vary by page: `.orbit-card` (home), `.evolution-card`,
  `.vault-card` (skins), `.fav-card`, `.guide-card`, `.settings-card`,
  `.about-card`, `.dev-card`, `.profile-card`, `.contact-layout > *`.
  JavaScript-built grids (skins, favourites) render after load, so anything
  that decorates cards must also observe DOM mutations.
- localStorage keys are namespaced `flameDragon*` (e.g. `flameDragonBg`,
  `flameDragonAccent`, `flameDragonFavorites`, `flameDragonLanguage`).
- The in-app version label must match the release tag. Check `preferences.js`,
  `extension-update.json`, `extension/manifest.json`,
  `extension/background.js`, `extension/site-download-bridge.js`.

## Gotchas

- `.fdh-reveal { transform: ... !important }` (two classes) overrides
  single-class transform rules. Any tilt/transform rule must match or exceed
  that specificity and appear later in the cascade.
- The first-visit YouTube prompt (`#fdh-yt-overlay`, z-index 1000000) covers the
  whole viewport. It is not a layout bug, but it does intercept the pointer
  until dismissed, which makes hover effects look broken during testing.
- Headless Chrome reports `hover: none` / `pointer: coarse`; override
  `window.matchMedia` when testing pointer-driven behaviour.
- GitHub tokens in this environment are read-only: deliver via
  git bundle / patch / zip artifacts rather than pushing.

## Local checks

```sh
node -c cursor-glow.js          # syntax check
python3 -m http.server 13000    # serve the site for manual review
```
