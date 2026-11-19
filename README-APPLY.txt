# FLAME DRAGON HUB — Texture Pack & Extension page package

This package contains a proposed replacement for the current `favorites.html` page plus the exact artwork used by the new gallery.

## Included
- `favorites.html` — replacement page named **Texture Pack & Extension**.
- `assets/texture-packs/` — 15 original cover previews (10 world themes + 5 holiday arenas).
- `assets/cursors/` — 10 original PC cursor PNG previews.
- `assets/extension-preview/icon128.png` — original extension toolbar icon used in the visual preview.

## Apply to the repository
Copy `favorites.html` to the repository root, replacing the current page, and merge the included `assets/` subfolders into the repository's existing `assets/` folder.

The page keeps the existing `favorites.html` URL so existing links continue to open it. Its navigation label is updated on this page; to rename the label site-wide, run `python3 rename-navigation-labels.py` from the repository root. The script changes only the visible label on anchors already pointing to `favorites.html`; it preserves the existing URL.

## Safety / scope
- No files under `extension/` are included or changed.
- No automatic installation, game activation, pointer replacement, or skin application.
- Cursor previews are images only.
- The popup panel is a static reconstruction from the original uploaded `popup.html`; its illustrative controls do not perform extension actions.
- Gallery hearts use the separate `flameDragonTextureFavorites` localStorage key, so the existing skin favorites key (`flameDragonFavorites`) is not overwritten.
- The uploaded archive's root folder is named `FLAME_DRAGON_HUB_v1.2.0`, while its `manifest.json` reports version `1.2.1` and the calm visual notes identify the package as v1.2.1.
