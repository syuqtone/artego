import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsageBar from "@/components/UsageBar";
import { ARTWORK_LIMIT, PDF_GENERATION_MONTHLY_LIMIT, PUBLICATION_LIMIT } from "@/lib/quota";
import AiToggle from "./AiToggle";

const AI_MONTHLY_LIMIT = 50; // lib/ai/quota.ts

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: row } = await supabase
    .from("users")
    .select("ai_enabled")
    .eq("id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let artworkCount = 0;
  if (profile) {
    const { count } = await supabase
      .from("artwork")
      .select("id", { count: "exact", head: true })
      .eq("artist_profile_id", profile.id);
    artworkCount = count ?? 0;
  }

  const { data: projects } = await supabase
    .from("project")
    .select("id")
    .eq("owner_id", user.id)
    .in("type", ["catalogue", "portfolio"]);
  const projectIds = (projects ?? []).map((p) => p.id);

  let publicationCount = 0;
  if (projectIds.length > 0) {
    const { count } = await supabase
      .from("publication")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds);
    publicationCount = count ?? 0;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: aiCountRaw } = await supabase
    .from("ai_job")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart);

  const { count: pdfCountRaw } = await supabase
    .from("pdf_generation")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Settings</h1>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-artego-black">Usage</h2>
        <UsageBar label="Artworks" used={artworkCount} limit={ARTWORK_LIMIT} />
        <UsageBar label="Publications" used={publicationCount} limit={PUBLICATION_LIMIT} />
        <UsageBar label="AI drafts this month" used={aiCountRaw ?? 0} limit={AI_MONTHLY_LIMIT} />
        <UsageBar label="PDF downloads this month" used={pdfCountRaw ?? 0} limit={PDF_GENERATION_MONTHLY_LIMIT} />
      </section>

      <section>
        <h2 className="text-base font-semibold text-artego-black">AI drafting</h2>
        <p className="mt-1 text-sm text-grey-600">
          Controls the &ldquo;Draft with AI&rdquo; buttons for catalogue introductions, artwork
          descriptions and alt text. Everything still works with this off — you just write those
          fields yourself.
        </p>
        <AiToggle initialEnabled={row?.ai_enabled ?? true} />
      </section>
    </div>
  );
}
