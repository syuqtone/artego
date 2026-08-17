"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a progressive enhancement — if registration
      // fails (unsupported browser, blocked, etc.) the app still works
      // fully online, per CLAUDE.md rule 6: no dead ends.
    });
  }, []);

  return null;
}
