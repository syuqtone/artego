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
