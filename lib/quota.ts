import type { SupabaseClient } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// docs/spec/quota.md — academic-phase limits as directed by the product
// owner (lower than the spec's original defaults, chosen for the FYP
// demo). Kept in one place so every enforcement point and the Settings
// usage display read the same numbers.
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ARTWORK_LIMIT = 20;
export const WALL_PHOTO_LIMIT = 10;
export const PUBLICATION_LIMIT = 10;
export const PDF_GENERATION_MONTHLY_LIMIT = 10;

type QuotaResult = { ok: true } | { ok: false; message: string };

export async function checkArtworkQuota(
  supabase: SupabaseServerClient,
  artistProfileId: string,
): Promise<QuotaResult> {
  const { count } = await supabase
    .from("artwork")
    .select("id", { count: "exact", head: true })
    .eq("artist_profile_id", artistProfileId);

  if ((count ?? 0) >= ARTWORK_LIMIT) {
    return {
      ok: false,
      message: `You've reached your limit of ${ARTWORK_LIMIT} artworks.`,
    };
  }
  return { ok: true };
}

// "Publications per artist" (quota.md) scopes to the publication table —
// catalogues, portfolios and exhibitions — not virtual galleries, which
// have their own separate gallery_scene table and their own per-gallery
// artwork cap.
export async function checkPublicationQuota(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<QuotaResult> {
  const { data: projects } = await supabase
    .from("project")
    .select("id")
    .eq("owner_id", userId)
    .in("type", ["catalogue", "portfolio", "exhibition"]);

  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return { ok: true };

  const { count } = await supabase
    .from("publication")
    .select("id", { count: "exact", head: true })
    .in("project_id", projectIds);

  if ((count ?? 0) >= PUBLICATION_LIMIT) {
    return {
      ok: false,
      message: `You've reached your limit of ${PUBLICATION_LIMIT} publications (catalogues, portfolios and exhibitions combined).`,
    };
  }
  return { ok: true };
}

export async function checkWallPhotoQuota(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<QuotaResult> {
  const { count } = await supabase
    .from("room_visual")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= WALL_PHOTO_LIMIT) {
    return {
      ok: false,
      message: `You've reached your limit of ${WALL_PHOTO_LIMIT} wall photos. Delete an old one from your Room Visualisations list to make room.`,
    };
  }
  return { ok: true };
}

// Counted against the publication's OWNER, not whoever requests the
// download — the pdf route itself is public (anyone with a published
// catalogue's link can download it), so this protects the owner's usage
// allowance from an unexpectedly popular link, the same rationale as the
// AI generation quota.
//
// Needs the service-role client, not the caller's session-bound one: an
// anonymous downloader's session can't SELECT another user's
// pdf_generation rows under RLS, so a session-bound count would always
// read back 0 and never actually block anything.
export async function checkPdfGenerationQuota(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<QuotaResult> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("pdf_generation")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerId)
    .gte("created_at", monthStart);

  if ((count ?? 0) >= PDF_GENERATION_MONTHLY_LIMIT) {
    return {
      ok: false,
      message: `This catalogue's owner has reached their limit of ${PDF_GENERATION_MONTHLY_LIMIT} PDF downloads this month. Please try again next month.`,
    };
  }
  return { ok: true };
}
