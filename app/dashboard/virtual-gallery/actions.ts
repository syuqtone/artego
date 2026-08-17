"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_GALLERY_ARTWORKS, WALL_PRESETS, type WallPreset } from "@/lib/virtual-gallery";

export type NewGalleryState = {
  error?: string;
};

// virtual-gallery.md creation flow: SELECT ARTWORKS -> CHOOSE WALL PRESET
// -> ARRANGE ORDER -> PREVIEW -> PUBLISH. This slice (6.1) covers the
// first two steps plus a renderer to prove the layout math; arranging
// (reorder) is below and publish is Slice 6.4.
export async function createGalleryAction(
  _prevState: NewGalleryState,
  formData: FormData,
): Promise<NewGalleryState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const wallPreset = String(formData.get("wallPreset") ?? "") as WallPreset;
  const artworkIds = formData.getAll("artworkId").map(String);

  if (!title) {
    return { error: "Please enter a title." };
  }
  if (!WALL_PRESETS.includes(wallPreset)) {
    return { error: "Please choose a wall." };
  }
  if (artworkIds.length === 0) {
    return { error: "Select at least one artwork." };
  }
  if (artworkIds.length > MAX_GALLERY_ARTWORKS) {
    return { error: `A gallery can hold up to ${MAX_GALLERY_ARTWORKS} artworks.` };
  }

  const { data: project, error: projectError } = await supabase
    .from("project")
    .insert({ owner_id: user.id, type: "virtual_gallery", title })
    .select("id")
    .single();
  if (projectError || !project) {
    return { error: "Couldn't create the gallery. Please try again." };
  }

  const { error: sceneError } = await supabase.from("gallery_scene").insert({
    project_id: project.id,
    title,
    wall_preset: wallPreset,
    source_type: "selection",
  });
  if (sceneError) {
    return { error: "Couldn't create the gallery. Please try again." };
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

  redirect(`/dashboard/virtual-gallery/${project.id}`);
}

function managePath(projectId: string) {
  return `/dashboard/virtual-gallery/${projectId}`;
}

export async function updateWallPresetAction(projectId: string, wallPreset: WallPreset) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("gallery_scene").update({ wall_preset: wallPreset }).eq("project_id", projectId);
  revalidatePath(managePath(projectId));
}

export async function addGalleryArtworksAction(projectId: string, formData: FormData) {
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

export async function removeGalleryArtworkAction(projectId: string, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("project_item").delete().eq("id", itemId);
  revalidatePath(managePath(projectId));
}

export async function moveGalleryItemAction(
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
