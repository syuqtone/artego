import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoomVisualTool from "@/components/RoomVisualTool";

export default async function RoomVisualToolPage({
  params,
}: {
  params: Promise<{ artworkId: string }>;
}) {
  const { artworkId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: artwork } = await supabase
    .from("artwork")
    .select(
      "id, title, height_cm, width_cm, dimension_unit, artist_profile_id, artist_profile!inner(user_id), artwork_image(public_url, role)",
    )
    .eq("id", artworkId)
    .maybeSingle();

  const ownerId = (artwork?.artist_profile as unknown as { user_id: string } | undefined)?.user_id;
  if (!artwork || ownerId !== user.id) {
    notFound();
  }

  // Rule: "The artwork must have Height and Width recorded ... link
  // directly to the field. Do not show a blocking error" — the picker
  // page already filters these out, but a direct link here still needs
  // the same guidance rather than a dead end.
  if (artwork.height_cm === null || artwork.width_cm === null) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-4 py-9">
        <Link
          href="/dashboard/room-visual/new"
          className="text-sm font-semibold text-artego-red-deep underline"
        >
          ← Room Visualisation
        </Link>
        <h1 className="text-xl font-semibold text-artego-black">{artwork.title}</h1>
        <p className="text-base text-grey-600">
          This artwork needs its height and width recorded before it can be previewed on a wall.
        </p>
        <Link
          href={`/dashboard/artworks/${artworkId}/edit`}
          className="flex min-h-11 items-center justify-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
        >
          Add dimensions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link
          href="/dashboard/room-visual/new"
          className="text-sm font-semibold text-artego-red-deep underline"
        >
          ← Room Visualisation
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">{artwork.title}</h1>
        <p className="mt-1 text-sm text-grey-600">
          {artwork.height_cm} × {artwork.width_cm} {artwork.dimension_unit}
        </p>
      </div>

      <RoomVisualTool
        artworkId={artworkId}
        artworkTitle={artwork.title}
        artworkHeightCm={Number(artwork.height_cm)}
        artworkWidthCm={Number(artwork.width_cm)}
        artworkImageUrl={
          (artwork.artwork_image as unknown as { public_url: string | null; role: string }[] | null)?.find(
            (img) => img.role === "display_1200",
          )?.public_url ??
          (artwork.artwork_image as unknown as { public_url: string | null; role: string }[] | null)?.find(
            (img) => img.role === "card_600",
          )?.public_url ??
          null
        }
      />
    </div>
  );
}
