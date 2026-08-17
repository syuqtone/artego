import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CvEntry = { text?: string };

export default async function PublicArtistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS already restricts this to public/unlisted profiles (or the owner
  // themselves) — anything else comes back empty, which we treat as
  // "not found" so a private profile is indistinguishable from one that
  // doesn't exist (permissions.md: no private data leak via URL guessing).
  const { data: profile } = await supabase
    .from("artist_profile")
    .select(
      "display_name, short_bio, full_biography, artist_statement, country, city_state, primary_discipline, other_disciplines, website_urls, cv_exhibition_history, show_email_publicly, verification_status, user_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { data: artworks } = await supabase
    .from("artwork")
    .select("id, title, alt_text, artwork_image(public_url, role)")
    .eq("artist_profile_id", id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  const artworkThumbs = (artworks ?? [])
    .map((a) => ({
      id: a.id,
      title: a.title,
      altText: a.alt_text,
      thumbUrl: a.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
    }))
    .filter((a): a is typeof a & { thumbUrl: string } => Boolean(a.thumbUrl));

  let email: string | null = null;
  if (profile.show_email_publicly) {
    const { data: emailResult } = await supabase.rpc("get_profile_email", {
      profile_id: id,
    });
    email = emailResult ?? null;
  }

  const cvEntries: string[] = Array.isArray(profile.cv_exhibition_history)
    ? (profile.cv_exhibition_history as CvEntry[])
        .map((entry) => entry?.text)
        .filter((text): text is string => Boolean(text && text.trim()))
        .flatMap((text) => text.split("\n"))
        .filter((line) => line.trim().length > 0)
    : [];

  const location = [profile.city_state, profile.country].filter(Boolean).join(", ");
  const disciplines = [profile.primary_discipline, ...(profile.other_disciplines ?? [])].filter(
    Boolean,
  );

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-artego-black">{profile.display_name}</h1>
          {profile.verification_status === "verified" && (
            <span className="rounded-full bg-artego-blue px-2 py-0.5 text-xs font-semibold text-artego-white">
              Verified
            </span>
          )}
        </div>
        {location && <p className="mt-1 text-base text-grey-600">{location}</p>}
        {disciplines.length > 0 && (
          <p className="mt-1 text-sm text-grey-600">{disciplines.join(" · ")}</p>
        )}
      </div>

      {artworkThumbs.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Artworks</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {artworkThumbs.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={a.id}
                src={a.thumbUrl}
                alt={a.altText ?? a.title}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full rounded object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {profile.short_bio && (
        <p className="text-base text-artego-black">{profile.short_bio}</p>
      )}

      {profile.full_biography && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Biography</h2>
          <p className="mt-1 whitespace-pre-line text-base text-grey-900">
            {profile.full_biography}
          </p>
        </section>
      )}

      {profile.artist_statement && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Artist Statement</h2>
          <p className="mt-1 whitespace-pre-line text-base text-grey-900">
            {profile.artist_statement}
          </p>
        </section>
      )}

      {cvEntries.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">CV / Exhibition History</h2>
          <ul className="mt-1 flex flex-col gap-1">
            {cvEntries.map((entry, i) => (
              <li key={i} className="text-base text-grey-900">
                {entry}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(profile.website_urls?.length > 0 || email) && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Contact</h2>
          <ul className="mt-1 flex flex-col gap-1">
            {email && (
              <li>
                <a href={`mailto:${email}`} className="text-base text-artego-red-deep underline">
                  {email}
                </a>
              </li>
            )}
            {profile.website_urls?.map((url: string) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-base text-artego-red-deep underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
