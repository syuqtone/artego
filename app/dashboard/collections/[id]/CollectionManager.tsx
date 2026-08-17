"use client";

import { useState } from "react";
import { addArtworksAction, moveItemAction, removeArtworkAction } from "./actions";

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

export default function CollectionManager({
  collectionId,
  items,
  available,
}: {
  collectionId: string;
  items: Item[];
  available: AvailableArtwork[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleMove(itemId: string, direction: "up" | "down") {
    setPendingId(itemId);
    await moveItemAction(collectionId, itemId, direction);
    setPendingId(null);
  }

  async function handleRemove(itemId: string) {
    setPendingId(itemId);
    await removeArtworkAction(collectionId, itemId);
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-base font-semibold text-artego-black">
          Artworks in this collection ({items.length})
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
                    className="flex h-11 w-11 items-center justify-center rounded border border-artego-black text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, "down")}
                    disabled={i === items.length - 1 || pendingId === item.id}
                    aria-label={`Move ${item.title} down`}
                    className="flex h-11 w-11 items-center justify-center rounded border border-artego-black text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-30"
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

      {available.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Add artworks</h2>
          <form action={addArtworksAction.bind(null, collectionId)} className="mt-2 flex flex-col gap-3">
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
