import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// room-visual.md flow: "SELECT ARTWORK -> UPLOAD WALL PHOTO -> ...". Rule:
// "The artwork must have Height and Width recorded. If missing, prompt
// the user and link directly to the field. Do not show a blocking error"
// — so artworks without dimensions are still listed, just guided to the
// field that fixes it, instead of being hidden.
export default async function NewRoomVisualPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    redirect("/dashboard/profile");
  }

  const { data: artworksData } = await supabase
    .from("artwork")
    .select("id, title, height_cm, width_cm, artwork_image(public_url, role)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  type ArtworkImageRow = { public_url: string | null; role: string };
  const artworks = (artworksData ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    hasDimensions: a.height_cm !== null && a.width_cm !== null,
    thumbUrl:
      (a.artwork_image as ArtworkImageRow[] | null)?.find((img) => img.role === "thumbnail_300")
        ?.public_url ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/create" className="text-sm font-semibold text-artego-red-deep underline">
          ← Create
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Room Visualisation</h1>
        <p className="mt-1 text-sm text-grey-600">Choose the artwork to preview on a wall.</p>
      </div>

      {artworks.length === 0 ? (
        <p className="text-base text-grey-600">
          You don&rsquo;t have any artworks yet.{" "}
          <Link href="/dashboard/artworks/new" className="font-semibold text-artego-red-deep underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {artworks.map((a) => (
            <li key={a.id}>
              {a.hasDimensions ? (
                <Link
                  href={`/dashboard/room-visual/new/${a.id}`}
                  className="flex items-center gap-3 rounded border border-grey-200 p-3"
                >
                  {a.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbUrl} alt={a.title} className="h-12 w-12 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="h-12 w-12 shrink-0 rounded bg-grey-100" />
                  )}
                  <span className="text-[15px] font-semibold text-artego-black">{a.title}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded border border-grey-200 p-3 opacity-60">
                  {a.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbUrl} alt={a.title} className="h-12 w-12 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="h-12 w-12 shrink-0 rounded bg-grey-100" />
                  )}
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold text-artego-black">{a.title}</span>
                    <span className="text-sm text-grey-600">
                      Needs height and width first.{" "}
                      <Link
                        href={`/dashboard/artworks/${a.id}/edit`}
                        className="font-semibold text-artego-red-deep underline"
                      >
                        Add dimensions
                      </Link>
                    </span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
