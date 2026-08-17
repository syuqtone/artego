"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FRAMES, type Frame } from "@/lib/room-visual";

export type SaveRoomVisualState = {
  error?: string;
};

const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// room-visual.md Output table: "Save to project | room_visual record
// linked to the artwork". Wall photo goes to the private Storage bucket
// first (same "upload before insert" ordering as artwork masters) —
// nothing is persisted to the database until the file is safely stored.
export async function saveRoomVisualAction(formData: FormData): Promise<SaveRoomVisualState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const artworkId = String(formData.get("artworkId") ?? "");
  const photo = formData.get("photo");
  const referenceSpanPx = Number(formData.get("referenceSpanPx"));
  const referenceWidthCm = Number(formData.get("referenceWidthCm"));
  const placementX = Number(formData.get("placementX"));
  const placementY = Number(formData.get("placementY"));
  const rotationDeg = Number(formData.get("rotationDeg"));
  const frame = String(formData.get("frame") ?? "none") as Frame;

  if (!artworkId) {
    return { error: "Missing artwork." };
  }
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Missing wall photo." };
  }
  const extension = ACCEPTED_IMAGE_TYPES[photo.type];
  if (!extension) {
    return { error: "Photo must be JPG, PNG or WebP." };
  }
  if (!Number.isFinite(referenceSpanPx) || referenceSpanPx <= 0) {
    return { error: "Missing reference scale — go back and mark the wall span." };
  }
  if (!Number.isFinite(referenceWidthCm) || referenceWidthCm <= 0) {
    return { error: "Missing reference width." };
  }
  if (!Number.isFinite(placementX) || !Number.isFinite(placementY)) {
    return { error: "Missing artwork placement." };
  }
  if (!Number.isFinite(rotationDeg) || rotationDeg < -3 || rotationDeg > 3) {
    return { error: "Invalid rotation." };
  }
  if (!FRAMES.includes(frame)) {
    return { error: "Invalid frame." };
  }

  const { data: artwork } = await supabase
    .from("artwork")
    .select(
      "id, title, height_cm, width_cm, artist_profile_id, artist_profile!inner(user_id), artwork_image(public_url, role)",
    )
    .eq("id", artworkId)
    .maybeSingle();
  const ownerId = (artwork?.artist_profile as unknown as { user_id: string } | undefined)?.user_id;
  if (!artwork || ownerId !== user.id) {
    return { error: "Not found." };
  }

  type ArtworkImageRow = { public_url: string | null; role: string };
  const images = artwork.artwork_image as unknown as ArtworkImageRow[] | null;
  const artworkImageUrl =
    images?.find((img) => img.role === "display_1200")?.public_url ??
    images?.find((img) => img.role === "card_600")?.public_url ??
    null;

  const storageId = crypto.randomUUID();
  const storagePath = `${user.id}/${storageId}/wall.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("room-visual-photos")
    .upload(storagePath, photo, { contentType: photo.type, upsert: false });
  if (uploadError) {
    return { error: "Couldn't upload the photo. Please try again." };
  }

  const { data: roomVisual, error: insertError } = await supabase
    .from("room_visual")
    .insert({
      artwork_id: artworkId,
      user_id: user.id,
      wall_photo_url: storagePath,
      reference_span_px: referenceSpanPx,
      reference_width_cm: referenceWidthCm,
      placement_x: placementX,
      placement_y: placementY,
      rotation_deg: rotationDeg,
      frame,
      artwork_title: artwork.title,
      artwork_height_cm: artwork.height_cm,
      artwork_width_cm: artwork.width_cm,
      artwork_image_url: artworkImageUrl,
    })
    .select("id")
    .single();

  if (insertError || !roomVisual) {
    await supabase.storage.from("room-visual-photos").remove([storagePath]);
    return { error: "Couldn't save the preview. Please try again." };
  }

  redirect(`/dashboard/room-visual/${roomVisual.id}`);
}

export type ShareRoomVisualState = {
  shareUrl?: string;
  error?: string;
};

// room-visual.md Output table: "Share link | Unlisted URL". Marking the
// row unlisted is also what the storage "select shared" policy checks
// before it will hand out a signed URL to a non-owner.
export async function shareRoomVisualAction(id: string): Promise<ShareRoomVisualState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const { data: existing } = await supabase
    .from("room_visual")
    .select("id, user_id, share_slug")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    return { error: "Not found." };
  }

  const slug = existing.share_slug ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const { error } = await supabase
    .from("room_visual")
    .update({ visibility: "unlisted", share_slug: slug })
    .eq("id", id);
  if (error) {
    return { error: "Couldn't create the share link. Please try again." };
  }

  revalidatePath(`/dashboard/room-visual/${id}`);
  return { shareUrl: `/room-visual/${slug}` };
}
