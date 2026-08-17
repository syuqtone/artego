"use client";

import { useRef, useState } from "react";
import ArtworkDetailSheet from "@/components/ArtworkDetailSheet";
import {
  EYE_LINE_CM,
  FLOOR_ANCHOR_THRESHOLD_CM,
  PLACEHOLDER_SIZE_CM,
  WALL_HEIGHT_CM,
  WALL_PRESET_COLOR,
  WALL_PRESET_TEXT_COLOR,
  gapCmFor,
  type WallPreset,
} from "@/lib/virtual-gallery";

// virtual-gallery.md "Implementation note": DOM and CSS transforms, not
// Canvas/WebGL, so keyboard, focus and screen-reader access work without
// a parallel implementation. Layout math lives here rather than being
// stored anywhere — "hanging position is computed at render time from
// project_item order and the recorded artwork dimensions" (schema
// comment on gallery_scene).

// The wall's rendered height in CSS px. Fixed rather than
// viewport-measured — every other screen in this app is a fixed
// mobile-first column (max-w-sm), so a constant here matches that and
// keeps the eye-line math simple: 150cm is exactly half of 300cm, so a
// centred artwork always lands at the wall's vertical midpoint,
// regardless of the chosen render height.
const WALL_RENDER_HEIGHT_PX = 360;
const PX_PER_CM = WALL_RENDER_HEIGHT_PX / WALL_HEIGHT_CM;
const LABEL_AREA_HEIGHT_PX = 76;
const PAN_STEP_PX = 280;

export type GalleryArtwork = {
  id: string;
  title: string;
  artistName: string;
  yearCreated: string | null;
  medium: string;
  heightCm: number | null;
  widthCm: number | null;
  dimensionUnit: string;
  imageUrl: string | null;
  description: string | null;
};

export default function GalleryWall({
  wallPreset,
  artworks,
}: {
  wallPreset: WallPreset;
  artworks: GalleryArtwork[];
}) {
  const wallColor = WALL_PRESET_COLOR[wallPreset];
  const textColor = WALL_PRESET_TEXT_COLOR[wallPreset];
  const [openArtwork, setOpenArtwork] = useState<GalleryArtwork | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  function pan(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -PAN_STEP_PX : PAN_STEP_PX,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  function handleWallKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // virtual-gallery.md Interaction table: "Move along the wall ...
    // Desktop: Horizontal scroll, arrow keys, on-screen arrows."
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      pan("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      pan("right");
    }
  }

  let cursorPx = 16; // left padding before the first work

  const placed = artworks.map((artwork) => {
    const hasDimensions = artwork.heightCm !== null && artwork.widthCm !== null;
    const heightCm = hasDimensions ? artwork.heightCm! : PLACEHOLDER_SIZE_CM;
    const widthCm = hasDimensions ? artwork.widthCm! : PLACEHOLDER_SIZE_CM;

    const heightPx = heightCm * PX_PER_CM;
    const widthPx = widthCm * PX_PER_CM;
    const floorAnchored = heightCm > FLOOR_ANCHOR_THRESHOLD_CM;
    const topPx = floorAnchored
      ? WALL_RENDER_HEIGHT_PX - heightPx
      : WALL_RENDER_HEIGHT_PX - EYE_LINE_CM * PX_PER_CM - heightPx / 2;

    const leftPx = cursorPx;
    cursorPx += widthPx + gapCmFor(widthCm) * PX_PER_CM;

    return { artwork, hasDimensions, heightPx, widthPx, topPx, leftPx };
  });

  const sceneWidthPx = cursorPx + 16;

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        tabIndex={0}
        role="group"
        aria-label="Gallery wall — use the left and right arrow keys to move along it"
        onKeyDown={handleWallKeyDown}
        className="w-full overflow-x-auto focus:outline focus:outline-2 focus:outline-artego-blue"
      >
        <div
          className="relative"
          style={{
            width: sceneWidthPx,
            height: WALL_RENDER_HEIGHT_PX + LABEL_AREA_HEIGHT_PX,
          }}
        >
          <div
            aria-hidden
            className="absolute left-0 top-0"
            style={{ width: sceneWidthPx, height: WALL_RENDER_HEIGHT_PX, backgroundColor: wallColor }}
          />

          {placed.map(({ artwork, hasDimensions, heightPx, widthPx, topPx, leftPx }) => (
            <figure
              key={artwork.id}
              className="absolute"
              style={{ left: leftPx, top: topPx, width: widthPx }}
            >
              <button
                type="button"
                onClick={(e) => {
                  lastTriggerRef.current = e.currentTarget;
                  setOpenArtwork(artwork);
                }}
                aria-label={`${artwork.title} by ${artwork.artistName}. Open details.`}
                style={{ width: widthPx, height: heightPx }}
                className="block focus:outline focus:outline-2 focus:outline-artego-blue"
              >
                {artwork.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artwork.imageUrl}
                    alt=""
                    style={{ width: widthPx, height: heightPx }}
                    className="object-contain shadow-md"
                  />
                ) : (
                  <span
                    style={{ width: widthPx, height: heightPx }}
                    className="flex items-center justify-center bg-grey-100 p-1 text-center text-xs text-grey-600 shadow-md"
                  >
                    {artwork.title}
                  </span>
                )}
              </button>

              <figcaption
                aria-hidden
                className="absolute left-0 text-xs leading-tight"
                style={{ top: heightPx + 6, width: Math.max(widthPx, 90), color: textColor }}
              >
                <span className="block font-semibold">{artwork.artistName}</span>
                <span className="block italic">
                  {artwork.title}
                  {artwork.yearCreated && `, ${artwork.yearCreated}`}
                </span>
                <span className="block">
                  {artwork.medium}
                  {hasDimensions &&
                    `, ${artwork.heightCm} × ${artwork.widthCm} ${artwork.dimensionUnit}`}
                </span>
                {!hasDimensions && (
                  <span className="block font-semibold text-danger">
                    Dimensions missing — shown at an approximate {PLACEHOLDER_SIZE_CM}×
                    {PLACEHOLDER_SIZE_CM}cm scale
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => pan("left")}
        aria-label="Move left along the wall"
        className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-artego-white text-artego-black shadow-md"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => pan("right")}
        aria-label="Move right along the wall"
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-artego-white text-artego-black shadow-md"
      >
        ›
      </button>

      {openArtwork && (
        <ArtworkDetailSheet
          artwork={openArtwork}
          onClose={() => setOpenArtwork(null)}
          triggerRef={lastTriggerRef}
        />
      )}
    </div>
  );
}
