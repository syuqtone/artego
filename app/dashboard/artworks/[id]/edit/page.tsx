import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAiEnabled } from "@/lib/ai/settings";
import EditArtworkForm, { type EditArtworkFormData } from "./EditArtworkForm";

export default async function EditArtworkPage({
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

  const { data: artwork } = await supabase
    .from("artwork")
    .select(
      "title, title_identifier, year_created, medium, medium_other, category, description, height_cm, width_cm, depth_cm, dimension_unit, price, price_currency, price_visibility, availability, edition_number, edition_total, copyright_owner, visibility, alt_text, artist_profile_id, artist_profile!inner(user_id), artwork_image(role)",
    )
    .eq("id", id)
    .maybeSingle();

  // RLS already scopes reads to public/unlisted/own artworks; this extra
  // check confirms the artwork also belongs to the signed-in user before
  // showing an edit form for it.
  if (!artwork || (artwork.artist_profile as unknown as { user_id: string }).user_id !== user.id) {
    notFound();
  }

  const initial: EditArtworkFormData = {
    title: artwork.title,
    titleIdentifier: artwork.title_identifier ?? "",
    year: artwork.year_created ?? "",
    medium: artwork.medium ?? "",
    mediumOther: artwork.medium_other ?? "",
    category: artwork.category,
    description: artwork.description ?? "",
    height: artwork.height_cm?.toString() ?? "",
    width: artwork.width_cm?.toString() ?? "",
    depth: artwork.depth_cm?.toString() ?? "",
    dimensionUnit: artwork.dimension_unit,
    price: artwork.price?.toString() ?? "",
    priceCurrency: artwork.price_currency ?? "",
    priceVisibility: artwork.price_visibility,
    availability: artwork.availability,
    editionNumber: artwork.edition_number ?? "",
    editionTotal: artwork.edition_total ?? "",
    copyrightOwner: artwork.copyright_owner ?? "",
    visibility: artwork.visibility,
    altText: artwork.alt_text ?? "",
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/artworks" className="text-sm font-semibold text-artego-red-deep underline">
          ← Your Artworks
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Edit Artwork</h1>
      </div>

      <EditArtworkForm
        artworkId={id}
        initial={initial}
        hasImage={(artwork.artwork_image as unknown as { role: string }[] | null)?.some(
          (img) => img.role === "display_1200" || img.role === "card_600",
        ) ?? false}
        aiEnabled={await getAiEnabled(supabase, user.id)}
      />
    </div>
  );
}
