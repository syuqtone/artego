"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NewCollectionState = {
  error?: string;
};

const VISIBILITY_VALUES = ["public", "unlisted", "private"] as const;

export async function createCollectionAction(
  _prevState: NewCollectionState,
  formData: FormData,
): Promise<NewCollectionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "private").trim();

  if (!title) {
    return { error: "Please enter a title." };
  }
  if (!VISIBILITY_VALUES.includes(visibility as (typeof VISIBILITY_VALUES)[number])) {
    return { error: "Please choose a valid visibility." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return { error: "Please complete your artist profile first." };
  }

  const { data: collection, error } = await supabase
    .from("collection")
    .insert({
      artist_profile_id: profile.id,
      title,
      description: description || null,
      visibility,
    })
    .select("id")
    .single();

  if (error || !collection) {
    return { error: "Couldn't create the collection. Please try again." };
  }

  redirect(`/dashboard/collections/${collection.id}`);
}
