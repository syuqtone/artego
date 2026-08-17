import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArtworkLibrary from "./ArtworkLibrary";

type ArtworkImageRow = { public_url: string | null; role: string };
type ArtworkRow = {
  id: string;
  title: string;
  year_created: string | null;
  category: string;
  visibility: string;
  artwork_image: ArtworkImageRow[] | null;
};

export default async function ArtworkLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  const { q = "", year = "" } = await searchParams;

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
    .select("id, title, year_created, category, visibility, artwork_image(public_url, role)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const artworks = (artworksData ?? []) as ArtworkRow[];

  const years = Array.from(
    new Set(artworks.map((a) => a.year_created).filter((y): y is string => Boolean(y))),
  ).sort((a, b) => b.localeCompare(a));

  const filtered = artworks.filter((a) => {
    const matchesQuery = q ? a.title.toLowerCase().includes(q.toLowerCase()) : true;
    const matchesYear = year ? a.year_created === year : true;
    return matchesQuery && matchesYear;
  });

  const cards = filtered.map((a) => ({
    id: a.id,
    title: a.title,
    year: a.year_created,
    category: a.category,
    visibility: a.visibility,
    thumbUrl: a.artwork_image?.find((img) => img.role === "card_600")?.public_url ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-9">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-artego-black">Your Artworks</h1>
        </div>
        <Link
          href="/dashboard/artworks/new"
          className="flex min-h-11 items-center rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white"
        >
          + Add Artwork
        </Link>
      </div>

      <ArtworkLibrary artworks={cards} years={years} initialQuery={q} initialYear={year} />
    </div>
  );
}
