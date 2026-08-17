import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  nfs: "Not for Sale",
  collection: "In a Collection",
};

export default async function PublicArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS restricts this to public/unlisted artworks (or the owner/admin) —
  // anything else comes back empty, treated as "not found" so a private
  // artwork is indistinguishable from one that doesn't exist.
  const { data: artwork } = await supabase
    .from("artwork")
    .select(
      "title, title_identifier, year_created, medium, height_cm, width_cm, depth_cm, dimension_unit, category, description, price, price_currency, price_visibility, availability, edition_number, edition_total, copyright_owner, alt_text, artist_profile_id, artwork_image(public_url, role), artist_profile!inner(display_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!artwork) {
    notFound();
  }

  const artistName = (artwork.artist_profile as unknown as { display_name: string }).display_name;
  const mainImage =
    artwork.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
    artwork.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
    null;

  const dimensions = [artwork.height_cm, artwork.width_cm, artwork.depth_cm]
    .filter((v) => v !== null)
    .join(" × ");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      {mainImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mainImage}
          alt={artwork.alt_text ?? artwork.title}
          className="w-full rounded"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded bg-grey-100 text-sm text-grey-600">
          No image available
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-artego-black">
          {artwork.title}
          {artwork.title_identifier && (
            <span className="text-grey-600"> {artwork.title_identifier}</span>
          )}
        </h1>
        <Link
          href={`/artist/${artwork.artist_profile_id}`}
          className="text-base text-artego-red-deep underline"
        >
          {artistName}
        </Link>
      </div>

      <dl className="flex flex-col gap-2 text-base">
        <div className="flex justify-between gap-3">
          <dt className="text-grey-600">Year</dt>
          <dd className="text-artego-black">{artwork.year_created ?? "Undated"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-grey-600">Medium</dt>
          <dd className="text-artego-black">{artwork.medium}</dd>
        </div>
        {dimensions && (
          <div className="flex justify-between gap-3">
            <dt className="text-grey-600">Dimensions</dt>
            <dd className="text-artego-black">
              {dimensions} {artwork.dimension_unit}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-grey-600">Category</dt>
          <dd className="text-artego-black capitalize">{artwork.category.replace("_", " ")}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-grey-600">Availability</dt>
          <dd className="text-artego-black">
            {AVAILABILITY_LABEL[artwork.availability] ?? artwork.availability}
          </dd>
        </div>
        {artwork.price_visibility !== "hidden" && (
          <div className="flex justify-between gap-3">
            <dt className="text-grey-600">Price</dt>
            <dd className="text-artego-black">
              {artwork.price_visibility === "on_request"
                ? "Price on request"
                : `${artwork.price_currency ?? ""} ${artwork.price ?? ""}`.trim()}
            </dd>
          </div>
        )}
        {(artwork.edition_number || artwork.edition_total) && (
          <div className="flex justify-between gap-3">
            <dt className="text-grey-600">Edition</dt>
            <dd className="text-artego-black">
              {artwork.edition_number ?? "?"} / {artwork.edition_total ?? "?"}
            </dd>
          </div>
        )}
        {artwork.copyright_owner && (
          <div className="flex justify-between gap-3">
            <dt className="text-grey-600">Copyright</dt>
            <dd className="text-artego-black">{artwork.copyright_owner}</dd>
          </div>
        )}
      </dl>

      {artwork.description && (
        <p className="whitespace-pre-line text-base text-grey-900">{artwork.description}</p>
      )}
    </div>
  );
}
