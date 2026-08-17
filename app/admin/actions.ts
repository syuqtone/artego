"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, logAuditEvent } from "@/lib/admin";

function userPath(userId: string) {
  return `/admin/users/${userId}`;
}

// data-fields.md 9.1: Verification Status is Pending / Approved / Verified
// / Suspended, "Verified badge only" shown on Verified. permissions.md:
// only ArteGO Admin may verify an artist.
export async function verifyArtistAction(profileId: string, userId: string) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase
    .from("artist_profile")
    .update({ verification_status: "verified" })
    .eq("id", profileId);
  if (error) return;

  await logAuditEvent({
    actorId: admin.id,
    action: "verify_artist",
    targetTable: "artist_profile",
    targetId: profileId,
    details: { newStatus: "verified" },
  });
  revalidatePath(userPath(userId));
}

export async function resetVerificationAction(profileId: string, userId: string) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase
    .from("artist_profile")
    .update({ verification_status: "pending" })
    .eq("id", profileId);
  if (error) return;

  await logAuditEvent({
    actorId: admin.id,
    action: "reset_artist_verification",
    targetTable: "artist_profile",
    targetId: profileId,
    details: { newStatus: "pending" },
  });
  revalidatePath(userPath(userId));
}

// permissions.md: only ArteGO Admin may suspend a user. users.status is
// the suspend flag ('active' | 'suspended') — a separate, deliberate
// action from unpublishing that user's content (see below).
export async function suspendUserAction(userId: string) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase.from("users").update({ status: "suspended" }).eq("id", userId);
  if (error) return;

  await logAuditEvent({
    actorId: admin.id,
    action: "suspend_user",
    targetTable: "users",
    targetId: userId,
    details: { newStatus: "suspended" },
  });
  revalidatePath(userPath(userId));
  revalidatePath("/admin");
}

export async function reactivateUserAction(userId: string) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase.from("users").update({ status: "active" }).eq("id", userId);
  if (error) return;

  await logAuditEvent({
    actorId: admin.id,
    action: "reactivate_user",
    targetTable: "users",
    targetId: userId,
    details: { newStatus: "active" },
  });
  revalidatePath(userPath(userId));
  revalidatePath("/admin");
}

// publishing-snapshot.md: "Unpublish | Public URL returns a controlled
// unavailable state; data retained." Setting status/visibility to
// 'archived' (not deleting) makes every public viewer's own
// status !== 'published' check show its "Not available" state, while the
// snapshot rows and the source project/artwork stay intact.
export async function unpublishPublicationAction(publicationId: string, userId: string) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase
    .from("publication")
    .update({ status: "archived", visibility: "archived" })
    .eq("id", publicationId);
  if (error) return;

  await logAuditEvent({
    actorId: admin.id,
    action: "unpublish_content",
    targetTable: "publication",
    targetId: publicationId,
  });
  revalidatePath(userPath(userId));
}

export async function unpublishGallerySceneAction(sceneId: string, userId: string) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase
    .from("gallery_scene")
    .update({ status: "archived", visibility: "archived" })
    .eq("id", sceneId);
  if (error) return;

  await logAuditEvent({
    actorId: admin.id,
    action: "unpublish_content",
    targetTable: "gallery_scene",
    targetId: sceneId,
  });
  revalidatePath(userPath(userId));
}

export async function unpublishRoomVisualAction(roomVisualId: string, userId: string) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase
    .from("room_visual")
    .update({ visibility: "archived" })
    .eq("id", roomVisualId);
  if (error) return;

  await logAuditEvent({
    actorId: admin.id,
    action: "unpublish_content",
    targetTable: "room_visual",
    targetId: roomVisualId,
  });
  revalidatePath(userPath(userId));
}
