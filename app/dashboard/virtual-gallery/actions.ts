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

export type AddGalleryArtworksState = {
  error?: string;
};

export async function addGalleryArtworksAction(
  projectId: string,
  formData: FormData,
): Promise<AddGalleryArtworksState> {
  const artworkIds = formData.getAll("artworkId").map(String);
  if (artworkIds.length === 0) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please log in again." };

  const { count: currentCount } = await supabase
    .from("project_item")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((currentCount ?? 0) + artworkIds.length > MAX_GALLERY_ARTWORKS) {
    return { error: `A gallery can hold up to ${MAX_GALLERY_ARTWORKS} artworks.` };
  }

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
  return {};
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

export type PublishGalleryState = {
  error?: string;
  slug?: string;
};

type ArtworkImageRow = { public_url: string | null; role: string };
type PublishArtworkRel = {
  id: string;
  title: string;
  year_created: string | null;
  medium: string;
  height_cm: number | null;
  width_cm: number | null;
  dimension_unit: string;
  description: string | null;
  visibility: string;
  artwork_image: ArtworkImageRow[] | null;
};

// virtual-gallery.md: "Saved as a gallery_scene record; follows the same
// snapshot rules as any other publication" (publishing-snapshot.md: a
// published document never changes silently — the public viewer reads
// only the frozen gallery_scene_snapshot, never live tables) and "A
// private artwork can never appear in a published gallery" — checked
// here, before anything is written, not just filtered out silently.
export async function publishGalleryAction(projectId: string): Promise<PublishGalleryState> {
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
    return { error: "Not found." };
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: scene } = await supabase
    .from("gallery_scene")
    .select("id, wall_preset, slug")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!scene) {
    return { error: "Gallery is missing. Please contact support." };
  }

  const { data: itemRows } = await supabase
    .from("project_item")
    .select(
      "sort_order, artwork(id, title, year_created, medium, height_cm, width_cm, dimension_unit, description, visibility, artwork_image(public_url, role))",
    )
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!itemRows || itemRows.length === 0) {
    return { error: "Add at least one artwork before publishing." };
  }

  const artworkRels = itemRows.map((row) => row.artwork as unknown as PublishArtworkRel);

  const privateOnes = artworkRels.filter((a) => !["public", "unlisted"].includes(a.visibility));
  if (privateOnes.length > 0) {
    return {
      error: `These artworks are private and can't appear in a published gallery: ${privateOnes
        .map((a) => a.title)
        .join(", ")}. Make them public or unlisted first, or remove them from the gallery.`,
    };
  }

  const snapshotArtworks = artworkRels.map((a, index) => ({
    id: a.id,
    title: a.title,
    yearCreated: a.year_created,
    medium: a.medium,
    heightCm: a.height_cm,
    widthCm: a.width_cm,
    dimensionUnit: a.dimension_unit,
    description: a.description,
    imageUrl:
      a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
      a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
      null,
    displayOrder: index,
  }));

  const snapshotData = {
    galleryTitle: project.title,
    artistName: profile?.display_name ?? "",
    wallPreset: scene.wall_preset,
    artworks: snapshotArtworks,
  };

  const { data: existingSnapshots } = await supabase
    .from("gallery_scene_snapshot")
    .select("version")
    .eq("gallery_scene_id", scene.id)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = (existingSnapshots?.[0]?.version ?? 0) + 1;

  const { data: snapshot, error: snapshotError } = await supabase
    .from("gallery_scene_snapshot")
    .insert({
      gallery_scene_id: scene.id,
      version: nextVersion,
      data: snapshotData,
      published_by: user.id,
    })
    .select("id")
    .single();
  if (snapshotError || !snapshot) {
    return { error: "Couldn't publish. Please try again." };
  }

  const slug = scene.slug ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  await supabase
    .from("gallery_scene")
    .update({
      current_snapshot_id: snapshot.id,
      status: "published",
      visibility: "public",
      slug,
    })
    .eq("id", scene.id);

  await supabase.from("project").update({ status: "published" }).eq("id", projectId);

  revalidatePath(managePath(projectId));
  revalidatePath(`/gallery/${slug}`);
  return { slug };
}
