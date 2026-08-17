"use client";

import { useRef, useState } from "react";
import GalleryWall, { type GalleryArtwork } from "@/components/GalleryWall";
import GalleryListView from "@/components/GalleryListView";
import ArtworkDetailSheet from "@/components/ArtworkDetailSheet";
import type { WallPreset } from "@/lib/virtual-gallery";

type View = "wall" | "list";

// Owns the Wall/List toggle and the one shared artwork-detail sheet, so
// both views open the exact same "zoom" interaction from Slice 6.2 —
// virtual-gallery.md: "List View toggle — same works and labels as a
// linear, screen-reader-friendly list."
export default function GalleryPreview({
  wallPreset,
  artworks,
}: {
  wallPreset: WallPreset;
  artworks: GalleryArtwork[];
}) {
  const [view, setView] = useState<View>("wall");
  const [openArtwork, setOpenArtwork] = useState<GalleryArtwork | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  function handleSelect(artwork: GalleryArtwork, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setOpenArtwork(artwork);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto flex w-full max-w-sm justify-end px-4">
        <button
          type="button"
          onClick={() => setView((v) => (v === "wall" ? "list" : "wall"))}
          aria-pressed={view === "list"}
          className="min-h-11 rounded border border-artego-black px-4 text-sm font-semibold text-artego-black"
        >
          {view === "wall" ? "List View" : "Wall View"}
        </button>
      </div>

      {view === "wall" ? (
        <div className="mx-auto w-full max-w-sm">
          <GalleryWall wallPreset={wallPreset} artworks={artworks} onSelect={handleSelect} />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-sm px-4">
          <GalleryListView artworks={artworks} onSelect={handleSelect} />
        </div>
      )}

      {openArtwork && (
        <ArtworkDetailSheet
          artwork={openArtwork}
          onClose={() => setOpenArtwork(null)}
          triggerRef={triggerRef}
        />
      )}
    </div>
  );
}
