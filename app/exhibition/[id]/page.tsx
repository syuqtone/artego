import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type SnapshotArtwork = {
  title: string;
  yearCreated: string | null;
  medium: string;
  dimensions: string;
  dimensionUnit: string;
  imageUrl: string | null;
  displayOrder: number;
};

type SnapshotData = {
  projectTitle: string;
  subtitle: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  curators: string[];
  coverImageUrl: string | null;
  artistName: string;
  artworks: SnapshotArtwork[];
};

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

// Public exhibition viewer. publishing-snapshot.md: reads only
// publication (for the pointer) and publication_snapshot (the frozen
// data) — never project, artwork or artist_profile directly — so
// editing the exhibition after publishing cannot change what's shown
// here until the owner explicitly republishes.
async function loadSnapshot(id: string) {
  const supabase = await createClient();

  const { data: publication } = await supabase
    .from("publication")
    .select("status, visibility, current_snapshot_id")
    .eq("id", id)
    .eq("type", "exhibition")
    .maybeSingle();

  if (!publication || publication.status !== "published" || !publication.current_snapshot_id) {
    return null;
  }
  if (!["public", "unlisted"].includes(publication.visibility)) {
    return null;
  }

  const { data: snapshot } = await supabase
    .from("publication_snapshot")
    .select("data")
    .eq("id", publication.current_snapshot_id)
    .maybeSingle();

  if (!snapshot) {
    return null;
  }

  return snapshot.data as unknown as SnapshotData;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadSnapshot(id);
  if (!data) {
    return { title: "Not available" };
  }
  const shareImage = data.coverImageUrl ?? data.artworks.find((a) => a.imageUrl)?.imageUrl;
  return {
    title: `${data.projectTitle} — ${data.artistName}`,
    openGraph: {
      title: data.projectTitle,
      description: `An exhibition by ${data.artistName}`,
      images: shareImage ? [shareImage] : undefined,
    },
  };
}

export default async function PublishedExhibitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadSnapshot(id);

  if (!data) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold text-artego-black">Not available</h1>
        <p className="text-base text-grey-600">
          This exhibition isn&rsquo;t published, or the link is no longer valid.
        </p>
      </div>
    );
  }

  const dateRange = formatDateRange(data.startDate, data.endDate);
  const location = [data.venue, data.city, data.country].filter(Boolean).join(", ");
  const artworks = [...data.artworks].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-8">
      {data.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.coverImageUrl} alt="" className="aspect-video w-full rounded object-cover" />
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-artego-black">{data.projectTitle}</h1>
        {data.subtitle && <p className="text-lg text-grey-600">{data.subtitle}</p>}
        <p className="text-sm text-grey-600">{data.artistName}</p>
        {dateRange && <p className="text-sm text-grey-600">{dateRange}</p>}
        {location && <p className="text-sm text-grey-600">{location}</p>}
        {data.curators.length > 0 && (
          <p className="text-sm text-grey-600">Curated by {data.curators.join(", ")}</p>
        )}
      </div>

      {data.description && (
        <p className="whitespace-pre-wrap text-base text-artego-black">{data.description}</p>
      )}

      <div className="flex flex-col gap-10">
        {artworks.map((a, i) => (
          <article key={i} className="flex flex-col gap-3 border-t-2 border-artego-black pt-6">
            {a.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt={a.title} className="w-full" />
            )}
            <h2 className="text-xl font-bold text-artego-black">{a.title}</h2>
            <p className="text-sm text-grey-600">
              {a.yearCreated ?? "Undated"} · {a.medium}
              {a.dimensions && ` · ${a.dimensions} ${a.dimensionUnit}`}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
