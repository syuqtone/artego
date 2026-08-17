"use client";

import { useState } from "react";

type Card = {
  id: string;
  title: string;
  year: string | null;
  category: string;
  visibility: string;
  thumbUrl: string | null;
};

const inputClass =
  "min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue";

const VISIBILITY_LABEL: Record<string, string> = {
  public: "Public",
  unlisted: "Unlisted",
  private: "Private",
  archived: "Archived",
};

export default function ArtworkLibrary({
  artworks,
  years,
  initialQuery,
  initialYear,
}: {
  artworks: Card[];
  years: string[];
  initialQuery: string;
  initialYear: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search by title"
          aria-label="Search by title"
          className={`${inputClass} flex-1`}
        />
        <select name="year" defaultValue={initialYear} aria-label="Filter by year" className={inputClass}>
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-11 rounded border border-artego-black px-4 text-[15px] font-semibold text-artego-black"
        >
          Filter
        </button>
      </form>

      <p aria-live="polite" className="text-sm text-grey-600">
        {selected.size} selected · {artworks.length} shown
      </p>

      {artworks.length === 0 ? (
        <p className="text-base text-grey-600">No artworks match your search.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {artworks.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 rounded border border-grey-200 p-2">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0"
                  checked={selected.has(a.id)}
                  onChange={() => toggle(a.id)}
                  aria-label={`Select ${a.title}`}
                />
                <span className="flex flex-col gap-1">
                  {a.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.thumbUrl}
                      alt={a.title}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full rounded object-cover"
                    />
                  ) : (
                    <span className="flex aspect-square w-full items-center justify-center rounded bg-grey-100 text-xs text-grey-600">
                      No preview yet
                    </span>
                  )}
                  <span className="text-sm font-semibold text-artego-black">{a.title}</span>
                  <span className="text-sm text-grey-600">
                    {a.year ?? "Undated"} · {VISIBILITY_LABEL[a.visibility] ?? a.visibility}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
