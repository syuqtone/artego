"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadToCloudinary, cloudinaryDerivativeUrl } from "@/lib/cloudinary";

export type NewExhibitionState = {
  error?: string;
};

// data-fields.md 9.3: this slice (BUILD-ORDER.md 7.1) is the solo
// exhibition workspace only — group exhibitions (invitations,
// submissions, participant/submission limits) are a later slice, so
// exhibition_type is fixed here and those group-only fields are left
// untouched (null).
export async function createExhibitionAction(
  _prevState: NewExhibitionState,
  formData: FormData,
): Promise<NewExhibitionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const artworkIds = formData.getAll("artworkId").map(String);

  if (!title) {
    return { error: "Please enter a title." };
  }
  if (artworkIds.length === 0) {
    return { error: "Select at least one artwork." };
  }

  const { data: project, error: projectError } = await supabase
    .from("project")
    .insert({ owner_id: user.id, type: "exhibition", exhibition_type: "solo", title })
    .select("id")
    .single();
  if (projectError || !project) {
    return { error: "Couldn't create the exhibition. Please try again." };
  }

  // Same publication/publication_snapshot mechanism as catalogues and
  // portfolios (BUILD-ORDER.md 3.5 "same engine" — the publication.type
  // check constraint already allows 'exhibition'). No template_id: the
  // public exhibition page has one fixed layout, not a template choice.
  const { error: publicationError } = await supabase.from("publication").insert({
    project_id: project.id,
    type: "exhibition",
  });
  if (publicationError) {
    return { error: "Couldn't set up the exhibition's publication. Please try again." };
  }

  const { error: itemsError } = await supabase.from("project_item").insert(
    artworkIds.map((artworkId, index) => ({
      project_id: project.id,
      artwork_id: artworkId,
      sort_order: index,
    })),
  );
  if (itemsError) {
    return { error: "Couldn't add the selected artworks. Please try again." };
  }

  redirect(`/dashboard/exhibitions/${project.id}`);
}

function managePath(projectId: string) {
  return `/dashboard/exhibitions/${projectId}`;
}

export type ExhibitionDetailsState = {
  error?: string;
  success?: boolean;
};

const EXHIBITION_VISIBILITY_VALUES = ["public", "unlisted", "private"] as const;

export async function updateExhibitionDetailsAction(
  projectId: string,
  _prevState: ExhibitionDetailsState,
  formData: FormData,
): Promise<ExhibitionDetailsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const curators = String(formData.get("curators") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const visibility = String(formData.get("visibility") ?? "private").trim();

  if (!EXHIBITION_VISIBILITY_VALUES.includes(visibility as (typeof EXHIBITION_VISIBILITY_VALUES)[number])) {
    return { error: "Please choose a valid visibility." };
  }

  const { error } = await supabase
    .from("project")
    .update({
      subtitle: subtitle || null,
      description: description || null,
      start_date: startDate || null,
      end_date: endDate || null,
      venue: venue || null,
      city: city || null,
      country: country || null,
      curators,
      visibility,
    })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: "Couldn't save your changes. Please try again." };
  }

  revalidatePath(managePath(projectId));
  return { success: true };
}

const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_COVER_IMAGE_BYTES = 10 * 1024 * 1024;

export async function uploadCoverImageAction(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const image = formData.get("coverImage");
  if (!(image instanceof File) || image.size === 0) return;
  const extension = ACCEPTED_IMAGE_TYPES[image.type];
  if (!extension || image.size > MAX_COVER_IMAGE_BYTES) return;

  const bytes = Buffer.from(await image.arrayBuffer());
  const publicId = await uploadToCloudinary(
    bytes,
    `artego/exhibitions/${projectId}`,
    `cover.${extension}`,
    image.type,
  );
  const url = cloudinaryDerivativeUrl(publicId, 1200);

  await supabase
    .from("project")
    .update({ cover_image_url: url })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  revalidatePath(managePath(projectId));
}

export async function addExhibitionArtworksAction(projectId: string, formData: FormData) {
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

  await supabase.from("project_item").insert(
    artworkIds.map((artworkId) => ({
      project_id: projectId,
      artwork_id: artworkId,
      sort_order: nextOrder++,
    })),
  );
  revalidatePath(managePath(projectId));
}

export async function removeExhibitionArtworkAction(projectId: string, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("project_item").delete().eq("id", itemId);
  revalidatePath(managePath(projectId));
}

export async function moveExhibitionItemAction(
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

  revalidatePath(managePath(projectId));
}

export type PublishExhibitionState = {
  error?: string;
};

// publishing-snapshot.md: a full, immutable copy written once and never
// updated — republishing writes a NEW row (version + 1). The public page
// (app/exhibition/[id]/page.tsx) reads only this table, never project or
// artwork directly, so edits after publishing don't change what's live
// until the owner explicitly republishes.
export async function publishExhibitionAction(projectId: string): Promise<PublishExhibitionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const { data: project } = await supabase
    .from("project")
    .select(
      "id, title, subtitle, description, start_date, end_date, venue, city, country, curators, cover_image_url, visibility, owner_id",
    )
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.owner_id !== user.id) {
    return { error: "Not found." };
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: publication } = await supabase
    .from("publication")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!publication) {
    return { error: "Publication is missing. Please contact support." };
  }

  const { data: itemRows } = await supabase
    .from("project_item")
    .select(
      "sort_order, artwork(id, title, year_created, medium, height_cm, width_cm, dimension_unit, visibility, artwork_image(public_url, role))",
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
    year_created: string | null;
    medium: string;
    height_cm: number | null;
    width_cm: number | null;
    dimension_unit: string;
    visibility: string;
    artwork_image: ArtworkImageRow[] | null;
  };

  const artworkRels = itemRows.map((row) => row.artwork as unknown as ArtworkRel).filter(Boolean);
  const privateOnes = artworkRels.filter((a) => !["public", "unlisted"].includes(a.visibility));
  if (privateOnes.length > 0) {
    return {
      error: `These artworks are private and can't appear in a published exhibition: ${privateOnes
        .map((a) => a.title)
        .join(", ")}. Make them public or unlisted first, or remove them from the exhibition.`,
    };
  }

  const snapshotArtworks = artworkRels.map((a, index) => ({
    title: a.title,
    yearCreated: a.year_created,
    medium: a.medium,
    dimensions: [a.height_cm, a.width_cm].filter((v) => v !== null).join(" × "),
    dimensionUnit: a.dimension_unit,
    imageUrl:
      a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
      a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
      null,
    displayOrder: index,
  }));

  const snapshotData = {
    projectTitle: project.title,
    subtitle: project.subtitle,
    description: project.description,
    startDate: project.start_date,
    endDate: project.end_date,
    venue: project.venue,
    city: project.city,
    country: project.country,
    curators: project.curators ?? [],
    coverImageUrl: project.cover_image_url,
    artistName: profile?.display_name ?? "",
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
      template_id: "exhibition",
      template_version: "1",
      schema_version: 1,
      published_by: user.id,
    })
    .select("id")
    .single();

  if (snapshotError || !snapshot) {
    return { error: "Couldn't publish. Please try again." };
  }

  // The exhibition's own Visibility choice (data-fields.md 9.3: "Public
  // Visibility") governs public reach here, unlike catalogues/portfolios
  // which always publish fully public — so a "Private" exhibition stays
  // reachable only to its owner even after publishing.
  await supabase
    .from("publication")
    .update({
      current_snapshot_id: snapshot.id,
      status: "published",
      visibility: project.visibility,
      published_at: new Date().toISOString(),
    })
    .eq("id", publication.id);

  await supabase.from("project").update({ status: "published" }).eq("id", projectId);

  revalidatePath(managePath(projectId));
  revalidatePath(`/exhibition/${publication.id}`);
  return {};
}
