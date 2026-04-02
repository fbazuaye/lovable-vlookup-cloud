/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
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

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/~oauth/],
  }),
);

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