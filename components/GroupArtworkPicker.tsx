"use client";

import { useEffect, useState } from "react";

export type PublicArtworkResult = {
  id: string;
  title: string;
  thumbUrl: string | null;
  artistName: string;
};

// Cross-artist search box for a group exhibition catalogue — the
// organizer searches by title or artist name (app/api/public-artworks)
// and builds up a selection here. Controlled by the parent so a
// selection made in a search result survives the results list changing
// underneath it (e.g. a later search that no longer includes it).
export default function GroupArtworkPicker({
  selected,
  onChange,
  excludeIds,
}: {
  selected: PublicArtworkResult[];
  onChange: (items: PublicArtworkResult[]) => void;
  excludeIds?: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicArtworkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public-artworks?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { artworks: PublicArtworkResult[] };
        setResults(data.artworks);
      } catch {
        setError("Couldn't load artworks. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const selectedIds = new Set(selected.map((s) => s.id));
  const visibleResults = results.filter((r) => !excludeIds?.has(r.id));

  function toggle(item: PublicArtworkResult, checked: boolean) {
    onChange(checked ? [...selected, item] : selected.filter((s) => s.id !== item.id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="artwork-search" className="text-[15px] font-semibold text-artego-black">
          Search public artworks
        </label>
        <input
          id="artwork-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by artwork title or artist name"
          className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        />
      </div>

      {loading && <p className="text-sm text-grey-600">Searching…</p>}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {!loading && !error && visibleResults.length === 0 && (
        <p className="text-sm text-grey-600">
          {query ? `No public artworks found for "${query}".` : "No public artworks yet."}
        </p>
      )}

      {visibleResults.length > 0 && (
        <ul className="flex flex-col gap-2">
          {visibleResults.map((r) => (
            <li key={r.id}>
              <label className="flex items-center gap-3 rounded border border-grey-200 p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(r.id)}
                  onChange={(e) => toggle(r, e.target.checked)}
                  className="h-5 w-5 shrink-0"
                />
                {r.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.thumbUrl}
                    alt={r.title}
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded bg-grey-100" />
                )}
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-artego-black">{r.title}</span>
                  <span className="text-xs text-grey-600">{r.artistName}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="flex flex-col gap-1 rounded border border-grey-200 p-3">
          <p className="text-sm font-semibold text-artego-black">Selected ({selected.length})</p>
          <ul className="flex flex-col gap-1">
            {selected.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-sm text-grey-600">
                <span>
                  {s.title} — {s.artistName}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((x) => x.id !== s.id))}
                  className="min-h-11 shrink-0 font-semibold text-danger underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
