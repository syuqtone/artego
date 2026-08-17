import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoomVisualComposite from "@/components/RoomVisualComposite";
import ShareRoomVisualButton from "@/components/ShareRoomVisualButton";
import type { Frame } from "@/lib/room-visual";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — long enough for one dashboard visit

// "Reopens" a saved preview (room-visual.md acceptance criterion: "A
// saved preview reopens with the same placement, scale and frame") —
// everything rendered here comes straight from the saved row, not from
// any in-memory tool state. Uses the artwork_* snapshot columns (not a
// live join) so this page and the public share page behave identically
// regardless of the artwork's own visibility — see the migration
// comment in 20260817210000_room_visual_artwork_snapshot.sql.
export default async function SavedRoomVisualPage({
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

  const { data: roomVisual } = await supabase
    .from("room_visual")
    .select(
      "id, user_id, artwork_id, wall_photo_url, reference_span_px, reference_width_cm, placement_x, placement_y, rotation_deg, frame, visibility, share_slug, artwork_title, artwork_height_cm, artwork_width_cm, artwork_image_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (!roomVisual || roomVisual.user_id !== user.id) {
    notFound();
  }

  const { data: signed } = await supabase.storage
    .from("room-visual-photos")
    .createSignedUrl(roomVisual.wall_photo_url, SIGNED_URL_TTL_SECONDS);

  if (!signed?.signedUrl) {
    notFound();
  }

  const pxPerCm = Number(roomVisual.reference_span_px) / Number(roomVisual.reference_width_cm);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link
          href={`/dashboard/room-visual/new/${roomVisual.artwork_id}`}
          className="text-sm font-semibold text-artego-red-deep underline"
        >
          ← New preview for this artwork
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">{roomVisual.artwork_title}</h1>
        <p className="mt-1 text-sm text-grey-600">Saved room preview</p>
      </div>

      <RoomVisualComposite
        photoUrl={signed.signedUrl}
        artworkTitle={roomVisual.artwork_title ?? ""}
        artworkImageUrl={roomVisual.artwork_image_url}
        artworkWidthCm={Number(roomVisual.artwork_width_cm)}
        artworkHeightCm={Number(roomVisual.artwork_height_cm)}
        pxPerCm={pxPerCm}
        referenceWidthCm={Number(roomVisual.reference_width_cm)}
        placementXPct={Number(roomVisual.placement_x)}
        placementYPct={Number(roomVisual.placement_y)}
        rotationDeg={Number(roomVisual.rotation_deg)}
        frame={roomVisual.frame as Frame}
        showDownload
        downloadFileName={`${(roomVisual.artwork_title ?? "artwork").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-on-wall.jpg`}
      />

      <ShareRoomVisualButton
        roomVisualId={roomVisual.id}
        initialShareUrl={
          roomVisual.visibility !== "private" && roomVisual.share_slug
            ? `/room-visual/${roomVisual.share_slug}`
            : null
        }
      />
    </div>
  );
}
