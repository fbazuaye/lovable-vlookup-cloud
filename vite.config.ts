import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Extended manifest with experimental PWA fields
const pwaManifest = {
  id: "/",
  name: "VLOOKUP Web App",
  short_name: "VLOOKUP",
  description: "Free browser-based VLOOKUP tool that replicates Excel's VLOOKUP function. Upload CSVs, match columns, merge data, and export results instantly.",
  theme_color: "#2539d0",
  background_color: "#f8f8fa",
  display: "standalone",
  display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
  orientation: "any",
  scope: "/",
  start_url: "/",
  lang: "en",
  dir: "ltr",
  prefer_related_applications: false,
  related_applications: [] as unknown[],
  categories: ["productivity", "utilities"],
  launch_handler: {
    client_mode: "navigate-existing",
  },
  handle_links: "preferred",
  edge_side_panel: {
    preferred_width: 480,
  },
  file_handlers: [
    {
      action: "/",
      accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.ms-excel": [".xls"],
      },
    },
  ],
  protocol_handlers: [
    {
      protocol: "web+vlookup",
      url: "/?url=%s",
    },
  ],
  widgets: [
    {
      name: "VLOOKUP Quick Lookup",
      description: "Quick lookup widget for VLOOKUP Web App",
      tag: "vlookup-widget",
      ms_ac_template: "widget/template",
      screenshots: [
        { src: "screenshot-wide.png", sizes: "1280x720", label: "VLOOKUP Widget" },
      ],
      icons: [{ src: "pwa-icon-192.png", sizes: "192x192" }],
    },
  ],
  tabbed_display: {
    tab_strip: {
      home_tab: {
        url: "/",
        icons: [{ src: "pwa-icon-192.png", sizes: "192x192" }],
      },
    },
  },
  note_taking: {
    new_note_url: "/",
  },
  shortcuts: [
    {
      name: "New Lookup",
      short_name: "Lookup",
      url: "/",
      description: "Start a new VLOOKUP operation",
      icons: [{ src: "pwa-icon-192.png", sizes: "192x192" }],
    },
  ],
  share_target: {
    action: "/",
    method: "GET",
    params: {
      title: "title",
      text: "text",
      url: "url",
    },
  },
  icons: [
    {
      src: "pwa-icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "pwa-icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "pwa-icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  screenshots: [
    {
      src: "screenshot-wide.png",
      sizes: "1280x720",
      type: "image/png",
      form_factor: "wide",
      label: "VLOOKUP Web App Desktop View",
    },
    {
      src: "screenshot-narrow.png",
      sizes: "512x844",
      type: "image/png",
      form_factor: "narrow",
      label: "VLOOKUP Web App Mobile View",
    },
  ],
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      strategies: "generateSW",
      devOptions: {
        enabled: false,
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      includeAssets: ["pwa-icon-192.png", "pwa-icon-512.png", "placeholder.svg"],
      // Cast to any to allow experimental manifest fields
      manifest: pwaManifest as any,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
