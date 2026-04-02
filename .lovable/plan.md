

## Plan: Improve PWABuilder Score (25 → Higher)

From the screenshot, two main areas need attention:

### 1. Service Worker Not Detected
PWABuilder says it "did not find a Service Worker." The `vite-plugin-pwa` generates the service worker at build time, but PWABuilder's crawler may not detect it if the SW file isn't being served or registered properly on the published site. We need to ensure the SW registers on the production host.

**Fix in `src/main.tsx`**: The current guard only unregisters in preview/iframe — but it doesn't explicitly *register* the SW in production. `vite-plugin-pwa` with `registerType: "autoUpdate"` should auto-register via the virtual module, but we should verify the import exists. We may need to explicitly import `virtual:pwa-register` to ensure registration happens.

### 2. Optional Manifest Fields (Yellow Warnings)
Add commonly expected optional fields to boost the score:

**In `vite.config.ts` manifest**:
- `shortcuts` — Quick actions (e.g., "New Lookup")
- `share_target` — Allow receiving shared files
- `launch_handler` — Control launch behavior (`"client_mode": "navigate-existing"`)
- `display_override` — Fallback display modes (`["standalone", "minimal-ui"]`)
- `related_applications` — Empty array to indicate none
- `iarc_rating_id` — Can be omitted (truly optional)
- `protocol_handlers` — Can add a custom protocol

### Changes

**`src/main.tsx`** — Add explicit `import { registerSW } from 'virtual:pwa-register'` and call `registerSW()` in production context to ensure the service worker registers.

**`vite.config.ts`** — Add these manifest fields:
- `shortcuts`: One shortcut to open the app
- `display_override`: `["standalone", "minimal-ui"]`  
- `launch_handler`: `{ "client_mode": "navigate-existing" }`
- `related_applications`: `[]`
- `share_target`: Basic share target config

This should raise the score significantly and resolve the Service Worker detection issue.

