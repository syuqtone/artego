"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkPublicationQuota } from "@/lib/quota";

export type NewCatalogueState = {
  error?: string;
};

const TEMPLATES = ["minimal", "editorial"] as const;

export async function createCatalogueAction(
  _prevState: NewCatalogueState,
  formData: FormData,
): Promise<NewCatalogueState> {
  const title = String(formData.get("title") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!title) {
    return { error: "Please enter a title." };
  }
  if (!TEMPLATES.includes(templateId as (typeof TEMPLATES)[number])) {
    return { error: "Please choose a template." };
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

  const quota = await checkPublicationQuota(supabase, user.id);
  if (!quota.ok) {
    return { error: quota.message };
  }

  const { data: project, error: projectError } = await supabase
    .from("project")
    .insert({ owner_id: user.id, type: "catalogue", title })
    .select("id")
    .single();

  if (projectError || !project) {
    return { error: "Couldn't create the catalogue. Please try again." };
  }

  const { error: publicationError } = await supabase.from("publication").insert({
    project_id: project.id,
    type: "catalogue",
    template_id: templateId,
  });

  if (publicationError) {
    return { error: "Couldn't set up the catalogue's publication. Please try again." };
  }

  redirect(`/dashboard/catalogues/${project.id}`);
}
