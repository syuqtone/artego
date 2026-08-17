"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NewPortfolioState = {
  error?: string;
};

const TEMPLATES = ["minimal", "editorial"] as const;

// BUILD-ORDER.md 3.5: "Portfolio output — same engine [as the
// catalogue], generate a portfolio from a collection." The only real
// difference from creating a catalogue: the artwork selection step is
// replaced by picking one existing collection, whose artworks (in their
// existing order) become this portfolio's project_item rows.
export async function createPortfolioAction(
  _prevState: NewPortfolioState,
  formData: FormData,
): Promise<NewPortfolioState> {
  const title = String(formData.get("title") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!title) {
    return { error: "Please enter a title." };
  }
  if (!collectionId) {
    return { error: "Please choose a collection." };
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

  const { data: collectionItems } = await supabase
    .from("collection_item")
    .select("artwork_id, sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });

  if (!collectionItems || collectionItems.length === 0) {
    return { error: "That collection has no artworks yet." };
  }

  const { data: project, error: projectError } = await supabase
    .from("project")
    .insert({ owner_id: user.id, type: "portfolio", title })
    .select("id")
    .single();

  if (projectError || !project) {
    return { error: "Couldn't create the portfolio. Please try again." };
  }

  const { error: publicationError } = await supabase.from("publication").insert({
    project_id: project.id,
    type: "portfolio",
    template_id: templateId,
  });

  if (publicationError) {
    return { error: "Couldn't set up the portfolio's publication. Please try again." };
  }

  await supabase.from("project_item").insert(
    collectionItems.map((item, index) => ({
      project_id: project.id,
      artwork_id: item.artwork_id,
      sort_order: index,
    })),
  );

  redirect(`/dashboard/portfolios/${project.id}`);
}
