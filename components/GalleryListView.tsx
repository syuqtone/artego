import type { GalleryArtwork } from "@/components/GalleryWall";
import { PLACEHOLDER_SIZE_CM } from "@/lib/virtual-gallery";

// virtual-gallery.md Interaction table: "Accessible alternative | List
// View toggle — same works and labels as a linear, screen-reader-
// friendly list." A plain vertical <ul> in normal document flow, so
// Tab order and reading order match — no absolute positioning, no
// spatial layout to get lost in.
export default function GalleryListView({
  artworks,
  onSelect,
}: {
  artworks: GalleryArtwork[];
  onSelect: (artwork: GalleryArtwork, trigger: HTMLElement) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {artworks.map((artwork) => {
        const hasDimensions = artwork.heightCm !== null && artwork.widthCm !== null;
        return (
          <li key={artwork.id}>
            <button
              type="button"
              onClick={(e) => onSelect(artwork, e.currentTarget)}
              className="flex w-full items-center gap-3 rounded border border-grey-200 p-3 text-left focus:outline focus:outline-2 focus:outline-artego-blue"
            >
              {artwork.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artwork.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-grey-100 text-center text-xs text-grey-600">
                  {artwork.title}
                </span>
              )}
              <span className="flex flex-col text-sm">
                <span className="font-semibold text-artego-black">{artwork.artistName}</span>
                <span className="italic text-artego-black">
                  {artwork.title}
                  {artwork.yearCreated && `, ${artwork.yearCreated}`}
                </span>
                <span className="text-grey-600">
                  {artwork.medium}
                  {hasDimensions &&
                    `, ${artwork.heightCm} × ${artwork.widthCm} ${artwork.dimensionUnit}`}
                </span>
                {!hasDimensions && (
                  <span className="font-semibold text-danger">
                    Dimensions missing — shown at an approximate {PLACEHOLDER_SIZE_CM}×
                    {PLACEHOLDER_SIZE_CM}cm scale
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
