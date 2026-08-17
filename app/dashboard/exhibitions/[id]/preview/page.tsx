import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

export default async function ExhibitionPreviewPage({
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
    .select(
      "id, title, subtitle, description, start_date, end_date, venue, city, country, curators, cover_image_url, owner_id, type",
    )
    .eq("id", id)
    .maybeSingle();

  if (!project || project.owner_id !== user.id || project.type !== "exhibition") {
    notFound();
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name")
    .eq("user_id", user.id)
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

  const artworks = (itemRows ?? [])
    .map((row) => row.artwork as unknown as ArtworkRel)
    .filter(Boolean)
    .map((a) => ({
      id: a.id,
      title: a.title,
      yearCreated: a.year_created,
      medium: a.medium,
      dimensions: [a.height_cm, a.width_cm].filter((v) => v !== null).join(" × "),
      dimensionUnit: a.dimension_unit,
      imageUrl:
        a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
        a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
        null,
    }));

  const dateRange = formatDateRange(project.start_date, project.end_date);
  const location = [project.venue, project.city, project.country].filter(Boolean).join(", ");
  const curators = project.curators ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-sm px-4 pt-4">
        <Link
          href={`/dashboard/exhibitions/${id}`}
          className="text-sm font-semibold text-artego-red-deep underline"
        >
          ← Edit exhibition
        </Link>
        <p className="mt-1 text-sm text-grey-600">Preview — draft, not published.</p>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-8">
        {project.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_image_url}
            alt=""
            className="aspect-video w-full rounded object-cover"
          />
        )}

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-artego-black">{project.title}</h1>
          {project.subtitle && <p className="text-lg text-grey-600">{project.subtitle}</p>}
          <p className="text-sm text-grey-600">{profile?.display_name ?? ""}</p>
          {dateRange && <p className="text-sm text-grey-600">{dateRange}</p>}
          {location && <p className="text-sm text-grey-600">{location}</p>}
          {curators.length > 0 && (
            <p className="text-sm text-grey-600">Curated by {curators.join(", ")}</p>
          )}
        </div>

        {project.description && (
          <p className="whitespace-pre-wrap text-base text-artego-black">{project.description}</p>
        )}

        {artworks.length === 0 ? (
          <p className="text-base text-grey-600">Add artworks to this exhibition before previewing.</p>
        ) : (
          <div className="flex flex-col gap-10">
            {artworks.map((a) => (
              <article key={a.id} className="flex flex-col gap-3 border-t-2 border-artego-black pt-6">
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
        )}
      </div>
    </div>
  );
}
