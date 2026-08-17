"use client";

// Served by the service worker (public/sw.js) as the navigation fallback
// when a page load fails with no network connection. Deliberately static —
// no data fetching, so it always renders even fully offline.
export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span aria-hidden className="h-3 w-3 rounded-full bg-artego-red" />
      <h1 className="text-xl font-semibold text-artego-black">You&rsquo;re offline</h1>
      <p className="text-base text-grey-600">
        Check your internet connection and try again. Anything you&rsquo;ve already loaded may
        still work.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-11 rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
      >
        Try Again
      </button>
    </div>
  );
}
