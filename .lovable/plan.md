

## Plan: Fix PWABuilder Remaining Issues (30/45 → Higher + Service Worker Detection)

### Two Core Problems

**1. Service Worker Still Not Detected (+0)**
The `vite-plugin-pwa` with `registerType: "autoUpdate"` uses an auto-generated virtual module to register the SW. However, PWABuilder's crawler may not be finding the `sw.js` file. The issue is that `registerType: "autoUpdate"` injects the registration inline — the crawler needs to find an actual `/sw.js` file at the root. We should add `selfDestroying: false` and ensure the `navigateFallback` is set to `index.html` so the SW file is properly generated and served.

Additionally, the published domain (`lovable-vlookup-cloud.lovable.app`) needs to be checked — the service worker may not be deploying because the build output isn't including it. We'll add `injectRegister: 'script'` to ensure a `<script>` tag is injected into the HTML that registers `/sw.js`, making it crawlable.

**2. Manifest Score 30/45 — Missing Optional Fields**
From the screenshot, the action items and capabilities suggest adding:
- `file_handlers` — Register to handle CSV/Excel files
- `protocol_handlers` — Register a custom protocol
- `edge_side_panel` — For sidebar pinning (Windows)
- `handle_links` — Declare link handling preference

### Changes

**File: `vite.config.ts`**
- Change `injectRegister` to `'script'` so the SW registration is visible in HTML source (crawlable)
- Add `file_handlers` to handle `.csv` and `.xlsx` files natively
- Add `protocol_handlers` for a `web+vlookup` protocol
- Add `"window-controls-overlay"` to `display_override`
- Add `edge_side_panel` with `preferred_width`
- Add `handle_links: "preferred"` to declare link handling

**File: `src/main.tsx`**
- Remove the manual `registerSW` import and call since `injectRegister: 'script'` will handle registration automatically via an injected script tag in the HTML. Keep the preview/iframe guard to unregister SWs in dev contexts.

### Technical Details

```typescript
// New manifest fields to add:
file_handlers: [
  {
    action: "/",
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
    }
  }
],
protocol_handlers: [
  { protocol: "web+vlookup", url: "/?url=%s" }
],
handle_links: "preferred",
edge_side_panel: { preferred_width: 480 }

// display_override updated:
display_override: ["window-controls-overlay", "standalone", "minimal-ui"]
```

The `injectRegister: 'script'` change ensures a `<script>` tag appears in the built `index.html` that registers `/sw.js`, making it discoverable by PWABuilder's crawler.

