"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addGalleryArtworksAction,
  moveGalleryItemAction,
  publishGalleryAction,
  removeGalleryArtworkAction,
  updateWallPresetAction,
} from "@/app/dashboard/virtual-gallery/actions";
import { WALL_PRESETS, WALL_PRESET_LABEL, MAX_GALLERY_ARTWORKS, type WallPreset } from "@/lib/virtual-gallery";

type Item = {
  id: string;
  artworkId: string;
  title: string;
  thumbUrl: string | null;
};

type AvailableArtwork = {
  id: string;
  title: string;
  thumbUrl: string | null;
};

export default function GalleryManager({
  projectId,
  items,
  available,
  wallPreset,
  status,
  slug,
}: {
  projectId: string;
  items: Item[];
  available: AvailableArtwork[];
  wallPreset: WallPreset;
  status: string;
  slug: string | null;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [currentWall, setCurrentWall] = useState(wallPreset);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedStatus, setPublishedStatus] = useState(status);
  const [publishedSlug, setPublishedSlug] = useState(slug);

  async function handleWallChange(value: WallPreset) {
    setCurrentWall(value);
    await updateWallPresetAction(projectId, value);
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    const result = await publishGalleryAction(projectId);
    if (result.error) {
      setPublishError(result.error);
    } else {
      setPublishedStatus("published");
      if (result.slug) setPublishedSlug(result.slug);
    }
    setPublishing(false);
  }

  async function handleMove(itemId: string, direction: "up" | "down") {
    setPendingId(itemId);
    await moveGalleryItemAction(projectId, itemId, direction);
    setPendingId(null);
  }

  async function handleRemove(itemId: string) {
    setPendingId(itemId);
    await removeGalleryArtworkAction(projectId, itemId);
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-base font-semibold text-artego-black">Wall</h2>
        <div className="mt-2 flex gap-2">
          {WALL_PRESETS.map((preset) => (
            <label
              key={preset}
              className={`flex-1 rounded border p-3 text-center text-[15px] font-semibold ${
                currentWall === preset
                  ? "border-artego-black bg-grey-100 text-artego-black"
                  : "border-grey-200 text-grey-600"
              }`}
            >
              <input
                type="radio"
                name="wallPreset"
                value={preset}
                checked={currentWall === preset}
                onChange={() => handleWallChange(preset)}
                className="sr-only"
              />
              {WALL_PRESET_LABEL[preset]}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-artego-black">
          Artworks in this gallery ({items.length}/{MAX_GALLERY_ARTWORKS})
        </h2>
        {items.length === 0 ? (
          <p className="mt-1 text-sm text-grey-600">No artworks yet — add some below.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded border border-grey-200 p-2"
              >
                {item.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbUrl}
                    alt={item.title}
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="h-12 w-12 shrink-0 rounded bg-grey-100" />
                )}
                <span className="flex-1 text-sm font-semibold text-artego-black">{item.title}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, "up")}
                    disabled={i === 0 || pendingId === item.id}
                    aria-label={`Move ${item.title} up`}
                    className="flex h-11 w-11 items-center justify-center rounded border border-artego-black text-artego-black disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, "down")}
                    disabled={i === items.length - 1 || pendingId === item.id}
                    aria-label={`Move ${item.title} down`}
                    className="flex h-11 w-11 items-center justify-center rounded border border-artego-black text-artego-black disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={pendingId === item.id}
                    className="ml-1 text-sm font-semibold text-danger underline disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/virtual-gallery/${projectId}/preview`}
            className="flex min-h-11 items-center justify-center rounded border border-artego-black text-[15px] font-semibold text-artego-black"
          >
            Preview
          </Link>

          {publishError && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {publishError}
            </p>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex min-h-11 items-center justify-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white disabled:opacity-60"
          >
            {publishing ? "Publishing..." : publishedStatus === "published" ? "Republish" : "Publish"}
          </button>

          {publishedStatus === "published" && publishedSlug && (
            <p className="text-center text-sm text-grey-600">
              Live at{" "}
              <Link
                href={`/gallery/${publishedSlug}`}
                target="_blank"
                className="font-semibold text-artego-red-deep underline"
              >
                /gallery/{publishedSlug}
              </Link>
            </p>
          )}
        </div>
      )}

      {available.length > 0 && items.length < MAX_GALLERY_ARTWORKS && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Add artworks</h2>
          <form
            action={addGalleryArtworksAction.bind(null, projectId)}
            className="mt-2 flex flex-col gap-3"
          >
            <ul className="flex flex-col gap-2">
              {available.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 rounded border border-grey-200 p-2">
                    <input type="checkbox" name="artworkId" value={a.id} className="h-5 w-5 shrink-0" />
                    {a.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.thumbUrl}
                        alt={a.title}
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded bg-grey-100" />
                    )}
                    <span className="text-sm text-artego-black">{a.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="submit"
              className="min-h-11 self-start rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
            >
              Add Selected
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
