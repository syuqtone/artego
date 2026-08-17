import { createClient } from "@/lib/supabase/server";
import RoomVisualComposite from "@/components/RoomVisualComposite";
import type { Frame } from "@/lib/room-visual";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

// Public "Unlisted URL" share page (room-visual.md Output table). No
// login required — reachable only by guessing or being given the exact
// slug. RLS on room_visual only returns unlisted/public rows to a
// non-owner, and the matching storage policy only signs a URL for a
// photo whose row is unlisted/public — so this route can't leak a
// private preview even if someone tries an arbitrary id.
//
// Reads the artwork_* snapshot columns rather than joining the artwork
// table — a shared preview must render even when the artwork itself is
// (as most are, by default) private, since sharing this preview is an
// explicit, separate decision from publishing the artwork.
//
// Never linked from anywhere in Discover, search, or a sitemap — it
// only exists at this direct URL (room-visual.md: "A wall photo never
// appears in public Discover, search results or a sitemap").
export default async function SharedRoomVisualPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: roomVisual } = await supabase
    .from("room_visual")
    .select(
      "id, wall_photo_url, reference_span_px, reference_width_cm, placement_x, placement_y, rotation_deg, frame, artwork_title, artwork_height_cm, artwork_width_cm, artwork_image_url",
    )
    .eq("share_slug", slug)
    .maybeSingle();

  if (!roomVisual) {
    return <UnavailableState />;
  }

  const { data: signed } = await supabase.storage
    .from("room-visual-photos")
    .createSignedUrl(roomVisual.wall_photo_url, SIGNED_URL_TTL_SECONDS);

  if (!signed?.signedUrl) {
    return <UnavailableState />;
  }

  const pxPerCm = Number(roomVisual.reference_span_px) / Number(roomVisual.reference_width_cm);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <h1 className="text-xl font-semibold text-artego-black">{roomVisual.artwork_title} on a wall</h1>

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
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold text-artego-black">Not available</h1>
      <p className="text-base text-grey-600">
        This preview isn&rsquo;t shared, or the link is no longer valid.
      </p>
    </div>
  );
}
