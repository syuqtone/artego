import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GalleryWall, { type GalleryArtwork } from "@/components/GalleryWall";
import type { WallPreset } from "@/lib/virtual-gallery";

export default async function VirtualGalleryPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from("project")
    .select("id, title, owner_id, type")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.owner_id !== user.id || project.type !== "virtual_gallery") {
    notFound();
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: scene } = await supabase
    .from("gallery_scene")
    .select("wall_preset")
    .eq("project_id", id)
    .maybeSingle();

  const { data: itemRows } = await supabase
    .from("project_item")
    .select(
      "sort_order, artwork(id, title, year_created, medium, height_cm, width_cm, dimension_unit, artwork_image(public_url, role))",
    )
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  type ArtworkImageRow = { public_url: string | null; role: string };
  type ArtworkRel = {
    id: string;
    title: string;
    year_created: string | null;
    medium: string;
    height_cm: number | null;
    width_cm: number | null;
    dimension_unit: string;
    artwork_image: ArtworkImageRow[] | null;
  };

  const artworks: GalleryArtwork[] = (itemRows ?? [])
    .map((row) => row.artwork as unknown as ArtworkRel)
    .filter(Boolean)
    .map((a) => ({
      id: a.id,
      title: a.title,
      artistName: profile?.display_name ?? "",
      yearCreated: a.year_created,
      medium: a.medium,
      heightCm: a.height_cm,
      widthCm: a.width_cm,
      dimensionUnit: a.dimension_unit,
      imageUrl:
        a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
        a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
        null,
    }));

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="mx-auto w-full max-w-sm px-4">
        <Link
          href={`/dashboard/virtual-gallery/${id}`}
          className="text-sm font-semibold text-artego-red-deep underline"
        >
          ← Edit gallery
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">{project.title}</h1>
      </div>

      {artworks.length === 0 ? (
        <p className="mx-auto w-full max-w-sm px-4 text-base text-grey-600">
          Add artworks to this gallery before previewing.
        </p>
      ) : (
        <GalleryWall wallPreset={(scene?.wall_preset as WallPreset) ?? "white"} artworks={artworks} />
      )}
    </div>
  );
}
