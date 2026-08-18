import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicationTemplate, { type PublicationArtwork } from "@/components/PublicationTemplate";

function priceLine(item: {
  price: number | null;
  price_currency: string | null;
  price_visibility: string;
}) {
  if (item.price_visibility === "hidden") return null;
  if (item.price_visibility === "on_request") return "Price on request";
  return `${item.price_currency ?? ""} ${item.price ?? ""}`.trim();
}

export default async function CataloguePreviewPage({
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
    .select("id, title, owner_id, type, description")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.owner_id !== user.id || project.type !== "catalogue") {
    notFound();
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name, profile_photo_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: publication } = await supabase
    .from("publication")
    .select("template_id")
    .eq("project_id", id)
    .maybeSingle();
  const templateId = publication?.template_id ?? "minimal";

  const { data: itemRows } = await supabase
    .from("project_item")
    .select(
      "sort_order, artwork(id, title, year_created, medium, height_cm, width_cm, depth_cm, dimension_unit, description, availability, price, price_currency, price_visibility, artwork_image(public_url, role))",
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
    depth_cm: number | null;
    dimension_unit: string;
    description: string | null;
    availability: string;
    price: number | null;
    price_currency: string | null;
    price_visibility: string;
    artwork_image: ArtworkImageRow[] | null;
  };

  const artworks: PublicationArtwork[] = (itemRows ?? [])
    .map((row) => row.artwork as unknown as ArtworkRel)
    .filter(Boolean)
    .map((a) => ({
      id: a.id,
      title: a.title,
      yearCreated: a.year_created,
      medium: a.medium,
      dimensions: [a.height_cm, a.width_cm, a.depth_cm].filter((v) => v !== null).join(" × "),
      dimensionUnit: a.dimension_unit,
      description: a.description,
      availability: a.availability,
      priceLine: priceLine(a),
      imageUrl:
        a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
        a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
        null,
    }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-sm px-4 pt-4">
        <Link
          href={`/dashboard/catalogues/${id}`}
          className="text-sm font-semibold text-artego-red-deep underline"
        >
          ← Edit catalogue
        </Link>
        <p className="mt-1 text-sm text-grey-600">
          Preview — draft, not published. This is what the template engine renders, with no AI
          involved.
        </p>
      </div>

      <PublicationTemplate
        templateId={templateId}
        title={project.title}
        artistName={profile?.display_name ?? ""}
        artistPhotoUrl={profile?.profile_photo_url}
        introduction={project.description}
        artworks={artworks}
      />
    </div>
  );
}
