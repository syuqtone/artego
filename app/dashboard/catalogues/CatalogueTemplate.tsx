export const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  nfs: "Not for Sale",
  collection: "In a Collection",
};

export type CatalogueArtwork = {
  id: string;
  title: string;
  yearCreated: string | null;
  medium: string;
  dimensions: string;
  dimensionUnit: string;
  description: string | null;
  availability: string;
  priceLine: string | null;
  imageUrl: string | null;
};

// The deterministic template engine — ai-engine.md: "Visual quality
// never depends on the AI." Used by both the live preview and the
// published (snapshot-fed) viewer, so they render identically from
// whatever data shape each page normalizes into CatalogueArtwork.
export default function CatalogueTemplate({
  templateId,
  title,
  artistName,
  artworks,
}: {
  templateId: string;
  title: string;
  artistName: string;
  artworks: CatalogueArtwork[];
}) {
  if (templateId === "editorial") {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-10 px-4 py-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-artego-black">{title}</h1>
        <p className="text-base text-grey-600">{artistName}</p>
        {artworks.map((a) => (
          <article key={a.id} className="flex flex-col gap-3 border-t-2 border-artego-black pt-6">
            {a.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt={a.title} className="w-full" />
            )}
            <h2 className="text-2xl font-bold text-artego-black">{a.title}</h2>
            <p className="text-sm text-grey-600">
              {a.yearCreated ?? "Undated"} · {a.medium}
              {a.dimensions && ` · ${a.dimensions} ${a.dimensionUnit}`}
            </p>
            {a.description && <p className="text-base text-grey-900">{a.description}</p>}
            <p className="text-sm font-semibold text-artego-black">
              {AVAILABILITY_LABEL[a.availability] ?? a.availability}
              {a.priceLine && ` · ${a.priceLine}`}
            </p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-12 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-artego-black">{title}</h1>
        <p className="mt-1 text-sm text-grey-600">{artistName}</p>
      </div>
      {artworks.map((a) => (
        <div key={a.id} className="flex flex-col items-center gap-2 text-center">
          {a.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.imageUrl} alt={a.title} className="w-full" />
          )}
          <h2 className="text-base font-semibold text-artego-black">{a.title}</h2>
          <p className="text-sm text-grey-600">
            {a.yearCreated ?? "Undated"}, {a.medium}
            {a.dimensions && `, ${a.dimensions} ${a.dimensionUnit}`}
          </p>
          {a.priceLine && <p className="text-sm text-grey-600">{a.priceLine}</p>}
        </div>
      ))}
    </div>
  );
}
