import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm, { type ProfileFormData } from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select(
      "id, display_name, short_bio, full_biography, artist_statement, country, city_state, primary_discipline, other_disciplines, website_urls, cv_exhibition_history, profile_visibility, show_email_publicly, profile_photo_url",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const cvText = Array.isArray(profile?.cv_exhibition_history)
    ? profile.cv_exhibition_history.map((entry) => (typeof entry === "object" && entry && "text" in entry ? String(entry.text) : "")).join("\n")
    : "";

  const initial: ProfileFormData = {
    displayName: profile?.display_name ?? "",
    shortBio: profile?.short_bio ?? "",
    fullBiography: profile?.full_biography ?? "",
    artistStatement: profile?.artist_statement ?? "",
    country: profile?.country ?? "",
    cityState: profile?.city_state ?? "",
    primaryDiscipline: profile?.primary_discipline ?? "",
    otherDisciplines: profile?.other_disciplines ?? [],
    websiteUrls: profile?.website_urls ?? [],
    cvExhibitionHistory: cvText,
    profileVisibility: profile?.profile_visibility ?? "public",
    showEmailPublicly: profile?.show_email_publicly ?? false,
  };
  const currentPhotoUrl = profile?.profile_photo_url ?? null;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Artist Profile</h1>
        {profile && (
          <Link
            href={`/artist/${profile.id}`}
            target="_blank"
            className="mt-1 inline-block text-sm font-semibold text-artego-red-deep underline"
          >
            View public profile ↗
          </Link>
        )}
      </div>

      <ProfileForm initial={initial} currentPhotoUrl={currentPhotoUrl} />
    </div>
  );
}
