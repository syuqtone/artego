"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// data-model.md: soft-delete via a status/visibility column, never a hard
// DELETE. Archiving just sets visibility — the row and its images stay.
export async function archiveArtworkAction(artworkId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("artwork").update({ visibility: "archived" }).eq("id", artworkId);
  revalidatePath("/dashboard/artworks");
}
