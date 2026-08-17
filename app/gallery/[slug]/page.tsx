import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import GalleryPreview from "@/components/GalleryPreview";
import type { GalleryArtwork } from "@/components/GalleryWall";
import type { WallPreset } from "@/lib/virtual-gallery";

type SnapshotArtwork = {
  id: string;
  title: string;
  yearCreated: string | null;
  medium: string;
  heightCm: number | null;
  widthCm: number | null;
  dimensionUnit: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
};

type SnapshotData = {
  galleryTitle: string;
  artistName: string;
  wallPreset: WallPreset;
  artworks: SnapshotArtwork[];
};

// Public gallery viewer (virtual-gallery.md: "A published gallery has a
// stable public or unlisted URL"; acceptance: "opens from its public
// URL on a phone, without login" and "A private artwork can never
// appear in a published gallery" — enforced at publish time, and
// unaffected afterwards since this page reads only the frozen snapshot,
// never live artwork rows (publishing-snapshot.md).
async function loadSnapshot(slug: string) {
  const supabase = await createClient();

  const { data: scene } = await supabase
    .from("gallery_scene")
    .select("status, current_snapshot_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!scene || scene.status !== "published" || !scene.current_snapshot_id) {
    return null;
  }

  const { data: snapshot } = await supabase
    .from("gallery_scene_snapshot")
    .select("data")
    .eq("id", scene.current_snapshot_id)
    .maybeSingle();

  if (!snapshot) {
    return null;
  }

  return snapshot.data as unknown as SnapshotData;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadSnapshot(slug);
  if (!data) {
    return { title: "Not available" };
  }
  const shareImage = data.artworks.find((a) => a.imageUrl)?.imageUrl;
  return {
    title: `${data.galleryTitle} — ${data.artistName}`,
    openGraph: {
      title: data.galleryTitle,
      description: `A virtual gallery by ${data.artistName}`,
      images: shareImage ? [shareImage] : undefined,
    },
  };
}

export default async function PublishedGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadSnapshot(slug);

  if (!data) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold text-artego-black">Not available</h1>
        <p className="text-base text-grey-600">
          This gallery isn&rsquo;t published, or the link is no longer valid.
        </p>
      </div>
    );
  }

  const artworks: GalleryArtwork[] = [...data.artworks]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((a) => ({
      id: a.id,
      title: a.title,
      artistName: data.artistName,
      yearCreated: a.yearCreated,
      medium: a.medium,
      heightCm: a.heightCm,
      widthCm: a.widthCm,
      dimensionUnit: a.dimensionUnit,
      imageUrl: a.imageUrl,
      description: a.description,
    }));

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="mx-auto w-full max-w-sm px-4">
        <h1 className="text-xl font-semibold text-artego-black">{data.galleryTitle}</h1>
        <p className="mt-1 text-sm text-grey-600">{data.artistName}</p>
      </div>

      <GalleryPreview wallPreset={data.wallPreset} artworks={artworks} />
    </div>
  );
}
