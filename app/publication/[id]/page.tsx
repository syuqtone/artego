import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PublicationTemplate, { type PublicationArtwork } from "@/components/PublicationTemplate";

type SnapshotArtwork = {
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

type SnapshotData = {
  projectTitle: string;
  artistName: string;
  templateId: string;
  introduction?: string | null;
  artworks: SnapshotArtwork[];
};

// Public viewer for both catalogues and portfolios (BUILD-ORDER.md 3.5:
// "same engine"). Publishing-snapshot.md: "The published viewer ...
// reads from the snapshot, never from live tables." This page never
// queries project, artwork or artist_profile — only publication (for
// the pointer) and publication_snapshot (the frozen data) — so edits to
// the master artwork after publishing cannot change what's shown here.
export default async function PublishedPublicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: publication } = await supabase
    .from("publication")
    .select("id, status, current_snapshot_id")
    .eq("id", id)
    .maybeSingle();

  if (!publication) {
    return <UnavailableState />;
  }

  if (publication.status !== "published" || !publication.current_snapshot_id) {
    return <UnavailableState />;
  }

  const { data: snapshot } = await supabase
    .from("publication_snapshot")
    .select("data, published_at, version")
    .eq("id", publication.current_snapshot_id)
    .maybeSingle();

  if (!snapshot) {
    return <UnavailableState />;
  }

  const data = snapshot.data as unknown as SnapshotData;

  const artworks: PublicationArtwork[] = data.artworks.map((a, i) => ({
    id: String(i),
    title: a.title,
    yearCreated: a.yearCreated,
    medium: a.medium,
    dimensions: a.dimensions,
    dimensionUnit: a.dimensionUnit,
    description: a.description,
    availability: a.availability,
    priceLine: a.priceLine,
    imageUrl: a.imageUrl,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-sm px-4 pt-4">
        <Link
          href={`/publication/${id}/pdf`}
          className="flex min-h-11 items-center justify-center rounded border border-artego-black text-[15px] font-semibold text-artego-black"
        >
          Download PDF
        </Link>
      </div>
      <PublicationTemplate
        templateId={data.templateId}
        title={data.projectTitle}
        artistName={data.artistName}
        introduction={data.introduction}
        artworks={artworks}
      />
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold text-artego-black">Not available</h1>
      <p className="text-base text-grey-600">
        This isn&rsquo;t published, or the link is no longer valid.
      </p>
    </div>
  );
}
