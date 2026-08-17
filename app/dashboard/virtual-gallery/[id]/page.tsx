import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GalleryManager from "@/components/GalleryManager";
import type { WallPreset } from "@/lib/virtual-gallery";

export default async function VirtualGalleryDetailPage({
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

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    redirect("/dashboard/profile");
  }

  const { data: project } = await supabase
    .from("project")
    .select("id, title, owner_id, type")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.owner_id !== user.id || project.type !== "virtual_gallery") {
    notFound();
  }

  const { data: scene } = await supabase
    .from("gallery_scene")
    .select("wall_preset, status, slug")
    .eq("project_id", id)
    .maybeSingle();

  const { data: itemRows } = await supabase
    .from("project_item")
    .select("id, artwork_id, artwork(id, title, artwork_image(public_url, role))")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  type ArtworkImageRow = { public_url: string | null; role: string };
  type ArtworkRel = { id: string; title: string; artwork_image: ArtworkImageRow[] | null };

  const items = (itemRows ?? []).map((row) => {
    const artwork = row.artwork as unknown as ArtworkRel;
    return {
      id: row.id,
      artworkId: row.artwork_id,
      title: artwork?.title ?? "Untitled",
      thumbUrl: artwork?.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
    };
  });

  const inGalleryIds = new Set(items.map((i) => i.artworkId));

  const { data: allArtworks } = await supabase
    .from("artwork")
    .select("id, title, artwork_image(public_url, role)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const available = (allArtworks ?? [])
    .filter((a) => !inGalleryIds.has(a.id))
    .map((a) => ({
      id: a.id,
      title: a.title,
      thumbUrl: a.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
    }));

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/virtual-gallery" className="text-sm font-semibold text-artego-red-deep underline">
          ← Virtual Galleries
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">{project.title}</h1>
      </div>

      <GalleryManager
        projectId={id}
        items={items}
        available={available}
        wallPreset={(scene?.wall_preset as WallPreset) ?? "white"}
        status={scene?.status ?? "draft"}
        slug={scene?.slug ?? null}
      />
    </div>
  );
}
