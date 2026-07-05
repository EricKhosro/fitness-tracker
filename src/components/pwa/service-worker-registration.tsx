"use client";

import { useEffect } from "react";

// Registers the service worker that makes RepLog installable. Production
// only — a service worker in dev caches stale build assets.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration failed — the app still works, just isn't installable */
    });
  }, []);

  return null;
}
