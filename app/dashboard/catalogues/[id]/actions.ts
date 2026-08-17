"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addArtworksAction(projectId: string, formData: FormData) {
  const artworkIds = formData.getAll("artworkId").map(String);
  if (artworkIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("project_item")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = artworkIds.map((artworkId) => ({
    project_id: projectId,
    artwork_id: artworkId,
    sort_order: nextOrder++,
  }));

  await supabase.from("project_item").insert(rows);
  revalidatePath(`/dashboard/catalogues/${projectId}`);
}

export async function removeArtworkAction(projectId: string, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("project_item").delete().eq("id", itemId);
  revalidatePath(`/dashboard/catalogues/${projectId}`);
}

export async function moveItemAction(
  projectId: string,
  itemId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: items } = await supabase
    .from("project_item")
    .select("id, sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (!items) return;

  const index = items.findIndex((i) => i.id === itemId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  const current = items[index];
  const swap = items[swapIndex];

  await supabase.from("project_item").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("project_item").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath(`/dashboard/catalogues/${projectId}`);
}

export async function updateTemplateAction(projectId: string, templateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("publication").update({ template_id: templateId }).eq("project_id", projectId);
  revalidatePath(`/dashboard/catalogues/${projectId}`);
}

function priceDisplay(item: {
  price: number | null;
  price_currency: string | null;
  price_visibility: string;
}) {
  if (item.price_visibility === "hidden") return null;
  if (item.price_visibility === "on_request") return "Price on request";
  return `${item.price_currency ?? ""} ${item.price ?? ""}`.trim();
}

export type PublishState = {
  error?: string;
};

// publishing-snapshot.md: a snapshot is a full, immutable copy of every
// rendered field, written once and never updated — republishing writes
// a NEW row (version + 1), it never edits the previous one. The public
// viewer reads only from this table, never from project/artwork directly,
// which is what makes "the published catalogue must not change" true.
export async function publishCatalogueAction(projectId: string): Promise<PublishState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const { data: project } = await supabase
    .from("project")
    .select("id, title, owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.owner_id !== user.id) {
    return { error: "Catalogue not found." };
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: publication } = await supabase
    .from("publication")
    .select("id, template_id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!publication) {
    return { error: "Catalogue publication is missing. Please contact support." };
  }

  const { data: itemRows } = await supabase
    .from("project_item")
    .select(
      "sort_order, artwork(id, title, title_identifier, year_created, medium, height_cm, width_cm, depth_cm, dimension_unit, description, availability, price, price_currency, price_visibility, copyright_owner, alt_text, artwork_image(public_url, role))",
    )
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!itemRows || itemRows.length === 0) {
    return { error: "Add at least one artwork before publishing." };
  }

  type ArtworkImageRow = { public_url: string | null; role: string };
  type ArtworkRel = {
    id: string;
    title: string;
    title_identifier: string | null;
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
    copyright_owner: string | null;
    alt_text: string | null;
    artwork_image: ArtworkImageRow[] | null;
  };

  const snapshotArtworks = itemRows.map((row, index) => {
    const a = row.artwork as unknown as ArtworkRel;
    return {
      title: a.title,
      titleIdentifier: a.title_identifier,
      yearCreated: a.year_created,
      medium: a.medium,
      dimensions: [a.height_cm, a.width_cm, a.depth_cm].filter((v) => v !== null).join(" × "),
      dimensionUnit: a.dimension_unit,
      description: a.description,
      availability: a.availability,
      priceLine: priceDisplay(a),
      copyrightOwner: a.copyright_owner,
      // Content-addressed Cloudinary derivative — immutable even if the
      // master is later replaced (publishing-snapshot.md point 2).
      imageUrl:
        a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
        a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
        null,
      altText: a.alt_text ?? a.title,
      displayOrder: index,
    };
  });

  const snapshotData = {
    projectTitle: project.title,
    artistName: profile?.display_name ?? "",
    templateId: publication.template_id,
    artworks: snapshotArtworks,
  };

  const { data: existingSnapshots } = await supabase
    .from("publication_snapshot")
    .select("version")
    .eq("publication_id", publication.id)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = (existingSnapshots?.[0]?.version ?? 0) + 1;

  const { data: snapshot, error: snapshotError } = await supabase
    .from("publication_snapshot")
    .insert({
      publication_id: publication.id,
      version: nextVersion,
      data: snapshotData,
      template_id: publication.template_id,
      template_version: "1",
      schema_version: 1,
      published_by: user.id,
    })
    .select("id")
    .single();

  if (snapshotError || !snapshot) {
    return { error: "Couldn't publish. Please try again." };
  }

  await supabase
    .from("publication")
    .update({
      current_snapshot_id: snapshot.id,
      status: "published",
      visibility: "public",
      published_at: new Date().toISOString(),
    })
    .eq("id", publication.id);

  await supabase.from("project").update({ status: "published" }).eq("id", projectId);

  revalidatePath(`/dashboard/catalogues/${projectId}`);
  revalidatePath(`/catalogue/${publication.id}`);
  return {};
}
