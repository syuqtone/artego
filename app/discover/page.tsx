import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const RESULT_LIMIT = 24;

// PostgREST's .or() filter syntax uses "," and "(" ")" as separators —
// strip them from user input so a search term can't be crafted into an
// extra filter clause (permissions.md: enforce server-side, not just hide).
function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()]/g, " ").trim();
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const supabase = await createClient();

  // permissions.md visibility model: "Public — searchable and
  // discoverable" vs "Unlisted — accessible by direct link, not in
  // public search" — Discover must only ever surface Public rows, even
  // though RLS itself also allows anon to read Unlisted rows directly.
  let artistQuery = supabase
    .from("artist_profile")
    .select("id, display_name, short_bio, city_state, country, primary_discipline, verification_status")
    .eq("profile_visibility", "public")
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);

  let artworkQuery = supabase
    .from("artwork")
    .select("id, title, alt_text, artwork_image(public_url, role), artist_profile!inner(display_name)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);

  if (q) {
    const term = sanitizeSearchTerm(q);
    artistQuery = artistQuery.ilike("display_name", `%${term}%`);
    artworkQuery = artworkQuery.or(`title.ilike.%${term}%,medium.ilike.%${term}%`);
  }

  const [{ data: artists }, { data: artworks }] = await Promise.all([artistQuery, artworkQuery]);

  const artworkCards = (artworks ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    altText: a.alt_text,
    artistName: (a.artist_profile as unknown as { display_name: string } | null)?.display_name ?? "",
    thumbUrl: a.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
  }));

  const hasResults = (artists?.length ?? 0) > 0 || artworkCards.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-4 py-9">
      <div>
        <Link href="/" className="text-sm font-semibold text-artego-red-deep underline">
          ← ArteGO
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Discover</h1>
      </div>

      <form action="/discover" method="get" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search artists and artworks
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search artists and artworks"
          className="min-h-11 flex-1 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        />
        <button
          type="submit"
          className="min-h-11 rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white"
        >
          Search
        </button>
      </form>

      {q && !hasResults && (
        <p className="text-base text-grey-600">
          No results for &ldquo;{q}&rdquo;. Try a different name, title or medium.
        </p>
      )}

      {artworkCards.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Artworks</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {artworkCards.map((a) => (
              <Link key={a.id} href={`/artwork/${a.id}`}>
                {a.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.thumbUrl}
                    alt={a.altText ?? a.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full rounded object-cover"
                  />
                ) : (
                  <span className="flex aspect-square w-full items-center justify-center rounded bg-grey-100 text-xs text-grey-600">
                    {a.title}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {artists && artists.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Artists</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {artists.map((artist) => {
              const location = [artist.city_state, artist.country].filter(Boolean).join(", ");
              return (
                <li key={artist.id}>
                  <Link
                    href={`/artist/${artist.id}`}
                    className="flex flex-col rounded border border-grey-200 p-3"
                  >
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
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
