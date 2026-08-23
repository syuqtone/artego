import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const RESULT_LIMIT = 30;

// PostgREST's .ilike() filter takes a raw pattern — strip characters
// that have special meaning to PostgREST's filter syntax before it
// reaches the query (permissions.md: enforce server-side, not just hide).
function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()]/g, " ").trim();
}

// A directory of registered artists, not artworks — pick a favourite
// artist here, then open their public profile to see their portfolio.
// permissions.md visibility model: "Public — searchable and
// discoverable" vs "Unlisted — accessible by direct link, not in public
// search" — only Public profiles ever show up here, even though RLS
// itself also lets an anonymous visitor read Unlisted rows directly.
export default async function ArtistDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const supabase = await createClient();

  let artistQuery = supabase
    .from("artist_profile")
    .select(
      "id, display_name, short_bio, city_state, country, primary_discipline, verification_status, profile_photo_url",
    )
    .eq("profile_visibility", "public")
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);

  if (q) {
    artistQuery = artistQuery.ilike("display_name", `%${sanitizeSearchTerm(q)}%`);
  }

  const { data: artists } = await artistQuery;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/" className="text-sm font-semibold text-artego-red-deep underline">
          ← ArteGO
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Artist Directory</h1>
      </div>

      <form action="/artists" method="get" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search artists
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search artists"
          className="min-h-11 flex-1 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        />
        <button
          type="submit"
          className="min-h-11 rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white"
        >
          Search
        </button>
      </form>

      {q && (!artists || artists.length === 0) && (
        <p className="text-base text-grey-600">No results for &ldquo;{q}&rdquo;. Try a different name.</p>
      )}

      {artists && artists.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {artists.map((artist) => {
            const location = [artist.city_state, artist.country].filter(Boolean).join(", ");
            return (
              <li key={artist.id}>
                <Link
                  href={`/artist/${artist.id}`}
                  className="flex items-center gap-3 rounded border border-grey-200 p-3 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
                >
                  {artist.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.profile_photo_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="h-12 w-12 shrink-0 rounded-full bg-grey-100" />
                  )}
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-artego-black">
                        {artist.display_name}
                      </span>
                      {artist.verification_status === "verified" && (
                        <span className="rounded-full bg-artego-blue px-2 py-0.5 text-xs font-semibold text-artego-white">
                          Verified
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-grey-600">
                      {[artist.primary_discipline, location].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        !q && <p className="text-base text-grey-600">No artists to show yet.</p>
      )}
    </div>
  );
}
