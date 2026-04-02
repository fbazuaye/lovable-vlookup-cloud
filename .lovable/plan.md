

## Plan: Fix PWA Manifest for PWABuilder Store Readiness

### What's Needed

PWABuilder commonly flags these missing/incorrect manifest fields:

1. **`id`** field — Required unique identifier for the app
2. **`screenshots`** — At least one wide (desktop) and one narrow (mobile) screenshot required for store listings
3. **Icon `purpose` separation** — The same icon file should not be used for both `any` and `maskable`; PWABuilder wants them as separate entries (we already have this but the 512 maskable should ideally be a different file with safe-zone padding)
4. **`lang`** and **`dir`** fields — Recommended for internationalization
5. **`prefer_related_applications`** — Recommended field

### Changes

**File: `vite.config.ts`** — Update the manifest object to add:
- `id: "/"` 
- `lang: "en"`
- `dir: "ltr"`
- `prefer_related_applications: false`
- `screenshots` array with at least one wide (1280x720) and one narrow (390x844) screenshot
- Split the 512px icon into separate `any` and `maskable` entries with explicit `purpose` values

**Files: `public/screenshot-wide.png` and `public/screenshot-narrow.png`** — Generate placeholder screenshot images (1280x720 and 390x844) for the manifest. These are simple branded placeholder images with the app name.

### Technical Details

The manifest `screenshots` array will look like:
```json
"screenshots": [
  { "src": "screenshot-wide.png", "sizes": "1280x720", "type": "image/png", "form_factor": "wide", "label": "VLOOKUP Web App Desktop View" },
  { "src": "screenshot-narrow.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow", "label": "VLOOKUP Web App Mobile View" }
]
```

Icons will be updated to have explicit `purpose: "any"` on the first 512px entry and `purpose: "maskable"` on the second.

