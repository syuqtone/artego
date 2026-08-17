import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  nfs: "Not for Sale",
  collection: "In a Collection",
};

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
    .select("id, title, owner_id, type")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.owner_id !== user.id || project.type !== "catalogue") {
    notFound();
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name")
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

  const artworks = (itemRows ?? [])
    .map((row) => row.artwork as unknown as ArtworkRel)
    .filter(Boolean)
    .map((a) => ({
      ...a,
      dimensions: [a.height_cm, a.width_cm, a.depth_cm].filter((v) => v !== null).join(" × "),
      imageUrl:
        a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
        a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
        null,
      price: priceLine(a),
    }));

  const artistName = profile?.display_name ?? "";

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

      {templateId === "editorial" ? (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-10 px-4 py-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-artego-black">
            {project.title}
          </h1>
          <p className="text-base text-grey-600">{artistName}</p>
          {artworks.map((a) => (
            <article key={a.id} className="flex flex-col gap-3 border-t-2 border-artego-black pt-6">
              {a.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt={a.title} className="w-full" />
              )}
              <h2 className="text-2xl font-bold text-artego-black">{a.title}</h2>
              <p className="text-sm text-grey-600">
                {a.year_created ?? "Undated"} · {a.medium}
                {a.dimensions && ` · ${a.dimensions} ${a.dimension_unit}`}
              </p>
              {a.description && <p className="text-base text-grey-900">{a.description}</p>}
              <p className="text-sm font-semibold text-artego-black">
                {AVAILABILITY_LABEL[a.availability] ?? a.availability}
                {a.price && ` · ${a.price}`}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-12 px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-artego-black">{project.title}</h1>
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
                {a.year_created ?? "Undated"}, {a.medium}
                {a.dimensions && `, ${a.dimensions} ${a.dimension_unit}`}
              </p>
              {a.price && <p className="text-sm text-grey-600">{a.price}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
