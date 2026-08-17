"use client";

import { useEffect, useState } from "react";

// Feedback for connectivity dropping mid-session, distinct from the
// service worker's cached offline page (which only kicks in for a full
// page navigation). WCAG: status conveyed by icon + text, never colour
// alone, and announced via aria-live for screen readers.
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-11 items-center justify-center gap-2 bg-artego-black px-4 text-sm font-semibold text-artego-white"
    >
      <span aria-hidden>⚠</span>
      You&rsquo;re offline — some features may not work.
    </div>
  );
}
