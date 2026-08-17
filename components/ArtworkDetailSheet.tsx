"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { GalleryArtwork } from "@/components/GalleryWall";
import { PLACEHOLDER_SIZE_CM } from "@/lib/virtual-gallery";

// virtual-gallery.md Interaction table: "Artwork detail | Label card
// with full metadata and a link to the artwork page | Bottom sheet, same
// content". One bottom-sheet layout serves both rows here — this app is
// built mobile-first throughout (CLAUDE.md rule 7) and doesn't otherwise
// branch on viewport width, so a single sheet is the natural fit rather
// than a second, desktop-only "label card" layout.
export default function ArtworkDetailSheet({
  artwork,
  onClose,
  triggerRef,
}: {
  artwork: GalleryArtwork;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDimensions = artwork.heightCm !== null && artwork.widthCm !== null;

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap: without this, Tab/Shift+Tab from the first/last
      // focusable element in the sheet escapes into the page behind the
      // backdrop (e.g. the fixed bottom nav), which is visually hidden
      // but still reachable — a keyboard user would lose track of where
      // they are.
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-artego-blue"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="artwork-sheet-title"
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-t-lg bg-artego-white p-4 pb-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="artwork-sheet-title" className="text-lg font-semibold text-artego-black">
            {artwork.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close artwork details"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-artego-black text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
          >
            ✕
          </button>
        </div>

        {artwork.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="max-h-64 w-full rounded object-contain"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded bg-grey-100 text-sm text-grey-600">
            No image available
          </div>
        )}

        <dl className="flex flex-col gap-1 text-base">
          <div className="flex justify-between gap-3">
            <dt className="text-grey-600">Artist</dt>
            <dd className="text-artego-black">{artwork.artistName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-grey-600">Year</dt>
            <dd className="text-artego-black">{artwork.yearCreated ?? "Undated"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-grey-600">Medium</dt>
            <dd className="text-artego-black">{artwork.medium}</dd>
          </div>
          {hasDimensions ? (
            <div className="flex justify-between gap-3">
              <dt className="text-grey-600">Dimensions</dt>
              <dd className="text-artego-black">
                {artwork.heightCm} × {artwork.widthCm} {artwork.dimensionUnit}
              </dd>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <dt className="text-grey-600">Dimensions</dt>
              <dd className="font-semibold text-danger">
                Missing — shown at an approximate {PLACEHOLDER_SIZE_CM}×{PLACEHOLDER_SIZE_CM}cm scale
              </dd>
            </div>
          )}
        </dl>

        {artwork.description && (
          <p className="whitespace-pre-line text-sm text-grey-900">{artwork.description}</p>
        )}

        <Link
          href={`/artwork/${artwork.id}`}
          className="flex min-h-11 items-center justify-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
        >
          View artwork page
        </Link>
      </div>
    </div>
  );
}
