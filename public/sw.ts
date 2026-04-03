/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope & typeof globalThis & {
  __WB_MANIFEST: Array<{
    revision: string | null;
    url: string;
  }>;
};

type SyncLikeEvent = ExtendableEvent & { tag?: string };
type PushPayload = {
  body?: string;
  title?: string;
  url?: string;
};
type PushLikeEvent = ExtendableEvent & {
  data?: {
    json: () => PushPayload;
    text: () => string;
  };
};
type NotificationClickLikeEvent = ExtendableEvent & {
  notification: Notification;
};

const APP_SHELL_URLS = ["/", "/manifest.webmanifest"];
const REFRESH_CACHE_NAME = "vlookup-fresh-content";
const NOTIFICATION_ICON = "/pwa-icon-192.png";
const OFFLINE_FALLBACK = "/offline.html";
const LEGACY_OFFLINE_CACHE = "offline-fallback";
const ANALYTICS_SCRIPT_PATH = "/~flock.js";
const ANALYTICS_ENDPOINT_PATH = "/~api/analytics";

// ── Core setup ──────────────────────────────────────────────────────
self.skipWaiting();
clientsClaim();

// Precache all build assets (injected by vite-plugin-pwa).
// This includes index.html, all JS/CSS chunks, icons, etc.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete(LEGACY_OFFLINE_CACHE));
});

// ── Navigation ──────────────────────────────────────────────────────
// Serve the precached index.html for all navigation requests.
// createHandlerBoundToURL reads directly from the precache — no network
// needed — so the app shell loads instantly even when fully offline.
const navigationRoute = new NavigationRoute(
  createHandlerBoundToURL("index.html"),
  { denylist: [/^\/~oauth/] },
);
registerRoute(navigationRoute);

// ── Host-injected analytics assets ───────────────────────────────────
// The published host injects a tracking script into HTML responses.
// PWABuilder's offline audit can trip over that request when offline,
// so provide safe offline fallbacks for those endpoints.
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname === ANALYTICS_SCRIPT_PATH,
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch {
      return new Response("/* offline analytics noop */", {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/javascript; charset=utf-8",
        },
      });
    }
  },
  "GET",
);

registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname === ANALYTICS_ENDPOINT_PATH,
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch {
      return new Response(null, {
        status: 204,
        statusText: "No Content",
      });
    }
  },
  "POST",
);

// ── Static assets (same-origin) ─────────────────────────────────────
registerRoute(
  ({ request, sameOrigin }) =>
    sameOrigin && ["style", "script", "image", "font", "worker"].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: "app-static-assets",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

// ── Google Fonts ────────────────────────────────────────────────────
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  "GET",
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: "gstatic-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  "GET",
);

// ── Global catch handler ────────────────────────────────────────────
// If every strategy fails (e.g. uncached cross-origin asset while
// offline), serve the offline fallback for navigation requests.
setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    const fallback = await matchPrecache(OFFLINE_FALLBACK);
    if (fallback) return fallback;

    return new Response(
      "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Offline</title><body><main><h1>You're offline</h1><p>Please reconnect and try again.</p></main></body></html>",
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }

  const url = new URL(request.url);

  if (url.origin === self.location.origin && url.pathname === ANALYTICS_SCRIPT_PATH) {
    return new Response("/* offline analytics noop */", {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/javascript; charset=utf-8",
      },
    });
  }

  if (url.origin === self.location.origin && url.pathname === ANALYTICS_ENDPOINT_PATH) {
    return new Response(null, {
      status: 204,
      statusText: "No Content",
    });
  }

  return Response.error();
});

// ── Background capabilities ─────────────────────────────────────────

const refreshCoreContent = async () => {
  const cache = await caches.open(REFRESH_CACHE_NAME);
  await Promise.all(
    APP_SHELL_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        return;
      }
    }),
  );
};

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("sync", (event: Event) => {
  const syncEvent = event as SyncLikeEvent;
  if (syncEvent.tag === "refresh-app-content") {
    syncEvent.waitUntil(refreshCoreContent());
  }
});

self.addEventListener("periodicsync", (event: Event) => {
  const periodicSyncEvent = event as SyncLikeEvent;
  if (!periodicSyncEvent.tag || periodicSyncEvent.tag === "refresh-app-content") {
    periodicSyncEvent.waitUntil(refreshCoreContent());
  }
});

self.addEventListener("push", (event: Event) => {
  const pushEvent = event as PushLikeEvent;
  const fallbackPayload: Required<PushPayload> = {
    title: "VLOOKUP is ready",
    body: "Open the app to continue your lookups and exports.",
    url: "/",
  };

  let payload: Required<PushPayload> = fallbackPayload;

  if (pushEvent.data) {
    try {
      payload = { ...fallbackPayload, ...pushEvent.data.json() };
    } catch {
      payload = { ...fallbackPayload, body: pushEvent.data.text() || fallbackPayload.body };
    }
  }

  pushEvent.waitUntil(
    self.registration.showNotification(payload.title, {
      badge: NOTIFICATION_ICON,
      body: payload.body,
      data: { url: payload.url },
      icon: NOTIFICATION_ICON,
      renotify: true,
      tag: "vlookup-update",
    }),
  );
});

self.addEventListener("notificationclick", (event: Event) => {
  const notificationEvent = event as NotificationClickLikeEvent;
  const targetUrl = String(notificationEvent.notification.data?.url || "/");

  notificationEvent.notification.close();

  notificationEvent.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client && client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
