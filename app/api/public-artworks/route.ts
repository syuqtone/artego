import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RESULT_LIMIT = 30;

// Same guard as app/artists/page.tsx: strip characters PostgREST's
// .ilike() filter syntax treats specially before they reach the query.
function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()]/g, " ").trim();
}

type ArtworkImageRow = { public_url: string | null; role: string };
type ArtworkRow = {
  id: string;
  title: string;
  artwork_image: ArtworkImageRow[] | null;
  artist_profile: { display_name: string } | null;
};
type PublicArtworkResult = { id: string; title: string; thumbUrl: string | null; artistName: string };

function toResults(rows: ArtworkRow[] | null): PublicArtworkResult[] {
  return (rows ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    thumbUrl: a.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
    artistName: a.artist_profile?.display_name ?? "Unknown artist",
  }));
}

// Cross-artist search for the group-exhibition catalogue picker
// (components/GroupArtworkPicker.tsx). Every artist's PUBLIC artwork is
// fair game here — the "artwork select public or own" RLS policy already
// permits any signed-in caller to read these rows — unlike the personal
// catalogue/portfolio picker, which only ever offers the caller's own
// artworks (permissions.md: server-side enforcement, this route just
// narrows what's queried, RLS is what actually guarantees it).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const q = sanitizeSearchTerm(request.nextUrl.searchParams.get("q") ?? "");
  const select = "id, title, artwork_image(public_url, role), artist_profile(display_name)";

  if (!q) {
    const { data } = await supabase
      .from("artwork")
      .select(select)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(RESULT_LIMIT);
    return NextResponse.json({ artworks: toResults(data as unknown as ArtworkRow[]) });
  }

  // Two passes merged — an artwork can match by its own title, or by
  // belonging to an artist whose name matches, and PostgREST can't OR
  // across a joined table in a single filter.
  const { data: byTitle } = await supabase
    .from("artwork")
    .select(select)
    .eq("visibility", "public")
    .ilike("title", `%${q}%`)
    .limit(RESULT_LIMIT);

  const { data: matchingArtists } = await supabase
    .from("artist_profile")
    .select("id")
    .eq("profile_visibility", "public")
    .ilike("display_name", `%${q}%`)
    .limit(20);

  const artistIds = (matchingArtists ?? []).map((a) => a.id as string);
  const { data: byArtist } = artistIds.length
    ? await supabase
        .from("artwork")
        .select(select)
        .eq("visibility", "public")
        .in("artist_profile_id", artistIds)
        .limit(RESULT_LIMIT)
    : { data: [] as ArtworkRow[] };

  const merged = new Map<string, PublicArtworkResult>();
  for (const item of [
    ...toResults(byTitle as unknown as ArtworkRow[]),
    ...toResults(byArtist as unknown as ArtworkRow[]),
  ]) {
    merged.set(item.id, item);
  }

  return NextResponse.json({ artworks: Array.from(merged.values()).slice(0, RESULT_LIMIT) });
}
