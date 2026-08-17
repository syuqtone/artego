import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WALL_PHOTO_LIMIT } from "@/lib/quota";
import DeleteRoomVisualButton from "@/components/DeleteRoomVisualButton";

export default async function RoomVisualsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: roomVisuals } = await supabase
    .from("room_visual")
    .select("id, artwork_title, artwork_image_url, visibility, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const count = roomVisuals?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Room Visualisations</h1>
        <p className="mt-1 text-sm text-grey-600">
          {count} of {WALL_PHOTO_LIMIT} used
        </p>
      </div>

      {count === 0 ? (
        <p className="text-base text-grey-600">
          No room visualisations yet.{" "}
          <Link href="/dashboard/room-visual/new" className="font-semibold text-artego-red-deep underline">
            Start one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(roomVisuals ?? []).map((rv, i) => (
            <li key={rv.id} className="flex items-center gap-3 rounded border border-grey-200 p-2">
              {rv.artwork_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={rv.artwork_image_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="h-14 w-14 shrink-0 rounded bg-grey-100" />
              )}
              <Link href={`/dashboard/room-visual/${rv.id}`} className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-artego-black">
                  {rv.artwork_title ?? "Untitled"} {i === 0 && count >= WALL_PHOTO_LIMIT && "(oldest)"}
                </p>
                <p className="text-sm text-grey-600">
                  {new Date(rv.created_at).toLocaleDateString()} · {rv.visibility}
                </p>
              </Link>
              <DeleteRoomVisualButton id={rv.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
