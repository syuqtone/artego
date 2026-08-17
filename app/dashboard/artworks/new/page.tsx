import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArtworkForm from "./ArtworkForm";

export default async function NewArtworkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/dashboard/profile");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Add Artwork</h1>
      </div>

      <ArtworkForm copyrightDefault={profile.display_name} />
    </div>
  );
}
