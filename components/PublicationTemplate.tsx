export const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  nfs: "Not for Sale",
  collection: "In a Collection",
};

export type PublicationArtwork = {
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
  // Only meaningful on a group exhibition catalogue — see isGroup below.
  artistName?: string;
};

export type PublicationExhibitionInfo = {
  venue: string | null;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
};

// The deterministic template engine — ai-engine.md: "Visual quality
// never depends on the AI." Shared by catalogues and portfolios
// (BUILD-ORDER.md 3.5: "same engine"), and by both the live preview and
// the published (snapshot-fed) viewer.
function exhibitionMetaLine(info?: PublicationExhibitionInfo | null): string {
  if (!info) return "";
  return [info.venue, info.city, [info.startDate, info.endDate].filter(Boolean).join(" – ")]
    .filter(Boolean)
    .join(" · ");
}

// A group exhibition catalogue (product owner's request): artwork drawn
// from multiple registered artists instead of just the organizer's own.
// Lists who's participating right after the introduction, and
// attributes each artwork to its own artist instead of the organizer.
function ParticipatingArtists({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-artego-black">Participating Artists</h2>
      <ul className="flex flex-col gap-1">
        {names.map((name) => (
          <li key={name} className="border-b border-grey-200 pb-1 text-base text-artego-black">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PublicationTemplate({
  templateId,
  title,
  artistName,
  artistPhotoUrl,
  introduction,
  artworks,
  isGroup = false,
  participatingArtists = [],
  exhibitionInfo = null,
}: {
  templateId: string;
  title: string;
  artistName: string;
  artistPhotoUrl?: string | null;
  introduction?: string | null;
  artworks: PublicationArtwork[];
  isGroup?: boolean;
  participatingArtists?: string[];
  exhibitionInfo?: PublicationExhibitionInfo | null;
}) {
  const metaLine = exhibitionMetaLine(exhibitionInfo);

  if (templateId === "editorial") {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-10 px-4 py-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-artego-black">{title}</h1>
        <div className="flex items-center gap-3">
          {!isGroup && artistPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artistPhotoUrl}
              alt={artistName}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <p className="text-base text-grey-600">
            {isGroup ? `A Group Exhibition Catalogue · Curated by ${artistName}` : artistName}
          </p>
        </div>
        {metaLine && <p className="text-sm text-grey-600">{metaLine}</p>}
        {introduction && (
          <p className="whitespace-pre-wrap text-base text-artego-black">{introduction}</p>
        )}
        {isGroup && <ParticipatingArtists names={participatingArtists} />}
        {artworks.map((a) => (
          <article key={a.id} className="flex flex-col gap-3 border-t-2 border-artego-black pt-6">
            {a.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt={a.title} className="w-full" />
            )}
            <h2 className="text-2xl font-bold text-artego-black">{a.title}</h2>
            {isGroup && a.artistName && <p className="text-sm text-grey-600">{a.artistName}</p>}
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
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-semibold text-artego-black">{title}</h1>
        {!isGroup && artistPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artistPhotoUrl}
            alt={artistName}
            className="mt-2 h-16 w-16 rounded-full object-cover"
          />
        )}
        <p className="mt-1 text-sm text-grey-600">
          {isGroup ? `A Group Exhibition Catalogue · Curated by ${artistName}` : artistName}
        </p>
        {metaLine && <p className="mt-1 text-sm text-grey-600">{metaLine}</p>}
      </div>
      {introduction && (
        <p className="whitespace-pre-wrap text-center text-base text-artego-black">{introduction}</p>
      )}
      {isGroup && <ParticipatingArtists names={participatingArtists} />}
      {artworks.map((a) => (
        <div key={a.id} className="flex flex-col items-center gap-2 text-center">
          {a.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.imageUrl} alt={a.title} className="w-full" />
          )}
          <h2 className="text-base font-semibold text-artego-black">{a.title}</h2>
          {isGroup && a.artistName && <p className="text-sm text-grey-600">{a.artistName}</p>}
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
