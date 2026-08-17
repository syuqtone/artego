"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ai-engine.md rule 6: "The user may turn AI off entirely in Settings.
// Every workflow must remain complete with it off."
export async function setAiEnabledAction(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("users").update({ ai_enabled: enabled }).eq("id", user.id);
  revalidatePath("/dashboard/settings");
}
