import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAiEnabled } from "@/lib/ai/settings";
import ExhibitionManager, { type ExhibitionDetails } from "@/components/ExhibitionManager";

export default async function ExhibitionDetailPage({
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
    .select(
      "id, title, subtitle, description, start_date, end_date, venue, city, country, curators, visibility, cover_image_url, owner_id, type",
    )
    .eq("id", id)
    .maybeSingle();

  if (!project || project.owner_id !== user.id || project.type !== "exhibition") {
    notFound();
  }

  const { data: publication } = await supabase
    .from("publication")
    .select("id, status")
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

  const inExhibitionIds = new Set(items.map((i) => i.artworkId));

  const { data: allArtworks } = await supabase
    .from("artwork")
    .select("id, title, artwork_image(public_url, role)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const available = (allArtworks ?? [])
    .filter((a) => !inExhibitionIds.has(a.id))
    .map((a) => ({
      id: a.id,
      title: a.title,
      thumbUrl: a.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
    }));

  const aiEnabled = await getAiEnabled(supabase, user.id);

  const details: ExhibitionDetails = {
    subtitle: project.subtitle ?? "",
    description: project.description ?? "",
    startDate: project.start_date ?? "",
    endDate: project.end_date ?? "",
    venue: project.venue ?? "",
    city: project.city ?? "",
    country: project.country ?? "",
    curators: (project.curators ?? []).join(", "),
    visibility: project.visibility ?? "private",
    coverImageUrl: project.cover_image_url ?? null,
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/exhibitions" className="text-sm font-semibold text-artego-red-deep underline">
          ← Exhibitions
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">{project.title}</h1>
      </div>

      <ExhibitionManager
        projectId={id}
        details={details}
        items={items}
        available={available}
        aiEnabled={aiEnabled}
        publicationId={publication?.id ?? null}
        status={publication?.status ?? "draft"}
      />
    </div>
  );
}
