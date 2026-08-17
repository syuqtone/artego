import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AiToggle from "./AiToggle";

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

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Settings</h1>
      </div>

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
