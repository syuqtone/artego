"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkPublicationQuota } from "@/lib/quota";

// Shared by both the catalogue and portfolio builders (BUILD-ORDER.md
// 3.5: "Portfolio output — same engine"). Every function here operates
// on project_item / publication / publication_snapshot generically —
// nothing here is catalogue- or portfolio-specific.

function managePath(kind: "catalogues" | "portfolios", projectId: string) {
  return `/dashboard/${kind}/${projectId}`;
}

const PROJECT_TYPE: Record<"catalogues" | "portfolios", "catalogue" | "portfolio"> = {
  catalogues: "catalogue",
  portfolios: "portfolio",
};

const TEMPLATES = ["minimal", "editorial"] as const;

export type NewPublicationState = {
  error?: string;
};

// One screen — title, template and artwork selection together, no
// separate "add artworks after creating" step. Product owner's request:
// the artwork checklist that used to be Exhibition-only is now how both
// Catalogue and Portfolio get built from the start.
export async function createPublicationAction(
  kind: "catalogues" | "portfolios",
  _prevState: NewPublicationState,
  formData: FormData,
): Promise<NewPublicationState> {
  const title = String(formData.get("title") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const artworkIds = formData.getAll("artworkId").map(String);

  if (!title) {
    return { error: "Please enter a title." };
  }
  if (!TEMPLATES.includes(templateId as (typeof TEMPLATES)[number])) {
    return { error: "Please choose a template." };
  }
  if (artworkIds.length === 0) {
    return { error: "Select at least one artwork." };
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

  const type = PROJECT_TYPE[kind];

  const { data: project, error: projectError } = await supabase
    .from("project")
    .insert({ owner_id: user.id, type, title })
    .select("id")
    .single();
  if (projectError || !project) {
    return { error: "Couldn't create this. Please try again." };
  }

  const { error: publicationError } = await supabase
    .from("publication")
    .insert({ project_id: project.id, type, template_id: templateId });
  if (publicationError) {
    return { error: "Couldn't set up the publication. Please try again." };
  }

  const { error: itemsError } = await supabase.from("project_item").insert(
    artworkIds.map((artworkId, index) => ({
      project_id: project.id,
      artwork_id: artworkId,
      sort_order: index,
    })),
  );
  if (itemsError) {
    return { error: "Couldn't add the selected artworks. Please try again." };
  }

  redirect(managePath(kind, project.id));
}

export async function addArtworksAction(
  kind: "catalogues" | "portfolios",
  projectId: string,
  formData: FormData,
) {
  const artworkIds = formData.getAll("artworkId").map(String);
  if (artworkIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("project_item")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = artworkIds.map((artworkId) => ({
    project_id: projectId,
    artwork_id: artworkId,
    sort_order: nextOrder++,
  }));

  await supabase.from("project_item").insert(rows);
  revalidatePath(managePath(kind, projectId));
}

export async function removeArtworkAction(
  kind: "catalogues" | "portfolios",
  projectId: string,
  itemId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("project_item").delete().eq("id", itemId);
  revalidatePath(managePath(kind, projectId));
}

export async function moveItemAction(
  kind: "catalogues" | "portfolios",
  projectId: string,
  itemId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: items } = await supabase
    .from("project_item")
    .select("id, sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (!items) return;

  const index = items.findIndex((i) => i.id === itemId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  const current = items[index];
  const swap = items[swapIndex];

  await supabase.from("project_item").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("project_item").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath(managePath(kind, projectId));
}

export async function updateTemplateAction(
  kind: "catalogues" | "portfolios",
  projectId: string,
  templateId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("publication").update({ template_id: templateId }).eq("project_id", projectId);
  revalidatePath(managePath(kind, projectId));
}

// project.description is the "editable draft target for AI" for the
// catalogue introduction (see the column comment in the schema). AI never
// writes here directly (ai-engine.md rule 2: "AI never publishes") — this
// action is only ever called from the field the user edits themselves.
export async function updateIntroductionAction(projectId: string, text: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("project")
    .update({ description: text })
    .eq("id", projectId)
    .eq("owner_id", user.id);
}

function priceDisplay(item: {
  price: number | null;
  price_currency: string | null;
  price_visibility: string;
}) {
  if (item.price_visibility === "hidden") return null;
  if (item.price_visibility === "on_request") return "Price on request";
  return `${item.price_currency ?? ""} ${item.price ?? ""}`.trim();
}

export type PublishState = {
  error?: string;
};

// publishing-snapshot.md: a snapshot is a full, immutable copy of every
// rendered field, written once and never updated — republishing writes
// a NEW row (version + 1), it never edits the previous one. The public
// viewer reads only from this table, never from project/artwork
// directly, which is what makes "the published output must not change"
// true — for both catalogues and portfolios.
export async function publishPublicationAction(
  kind: "catalogues" | "portfolios",
  projectId: string,
): Promise<PublishState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const { data: project } = await supabase
    .from("project")
    .select("id, title, owner_id, description")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.owner_id !== user.id) {
    return { error: "Not found." };
  }

  // Portfolio PDFs are biodata-led (lib/pdf/PortfolioPdfDocument.tsx),
  // so the snapshot needs the artist's full public profile, not just
  // name/photo — same publishing-snapshot.md rule as everything else
  // here: frozen at publish time, never read live afterward. Catalogue
  // PDFs simply don't use these extra fields.
  const { data: profile } = await supabase
    .from("artist_profile")
    .select(
      "display_name, profile_photo_url, short_bio, full_biography, artist_statement, country, city_state, primary_discipline, other_disciplines, website_urls, cv_exhibition_history",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: publication } = await supabase
    .from("publication")
    .select("id, template_id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!publication) {
    return { error: "Publication is missing. Please contact support." };
  }

  const { data: itemRows } = await supabase
    .from("project_item")
    .select(
      "sort_order, artwork(id, title, title_identifier, year_created, medium, height_cm, width_cm, depth_cm, dimension_unit, description, availability, price, price_currency, price_visibility, copyright_owner, alt_text, visibility, artwork_image(public_url, role))",
    )
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!itemRows || itemRows.length === 0) {
    return { error: "Add at least one artwork before publishing." };
  }

  // uat.md scenario H: "A private artwork never appears in public
  // Discover, on a public profile, in a sitemap, or via URL guessing" —
  // the same rule applies to a publication's own snapshot, which is
  // otherwise a full, permanent copy of every field on the artwork
  // (mirrors the identical guard on virtual gallery and exhibition
  // publish).
  const privateOnes = itemRows
    .map((row) => row.artwork as unknown as { title: string; visibility: string } | null)
    .filter((a): a is { title: string; visibility: string } => Boolean(a))
    .filter((a) => !["public", "unlisted"].includes(a.visibility));
  if (privateOnes.length > 0) {
    return {
      error: `These artworks are private and can't appear in a published ${kind === "catalogues" ? "catalogue" : "portfolio"}: ${privateOnes
        .map((a) => a.title)
        .join(", ")}. Make them public or unlisted first, or remove them.`,
    };
  }

  type ArtworkImageRow = { public_url: string | null; role: string };
  type ArtworkRel = {
    id: string;
    title: string;
    title_identifier: string | null;
    year_created: string | null;
    medium: string;
    height_cm: number | null;
    width_cm: number | null;
    depth_cm: number | null;
    dimension_unit: string;
    description: string | null;
    availability: string;
    price: number | null;
    price_currency: string | null;
    price_visibility: string;
    copyright_owner: string | null;
    alt_text: string | null;
    artwork_image: ArtworkImageRow[] | null;
  };

  const snapshotArtworks = itemRows.map((row, index) => {
    const a = row.artwork as unknown as ArtworkRel;
    return {
      title: a.title,
      titleIdentifier: a.title_identifier,
      yearCreated: a.year_created,
      medium: a.medium,
      dimensions: [a.height_cm, a.width_cm, a.depth_cm].filter((v) => v !== null).join(" × "),
      dimensionUnit: a.dimension_unit,
      description: a.description,
      availability: a.availability,
      priceLine: priceDisplay(a),
      copyrightOwner: a.copyright_owner,
      // Content-addressed Cloudinary derivative — immutable even if the
      // master is later replaced (publishing-snapshot.md point 2).
      imageUrl:
        a.artwork_image?.find((img) => img.role === "display_1200")?.public_url ??
        a.artwork_image?.find((img) => img.role === "card_600")?.public_url ??
        null,
      altText: a.alt_text ?? a.title,
      displayOrder: index,
    };
  });

  // cv_exhibition_history is stored as [{ text: "one entry per line" }] —
  // same shape and parsing as app/artist/[id]/page.tsx's public profile.
  const cvEntries: string[] = Array.isArray(profile?.cv_exhibition_history)
    ? (profile.cv_exhibition_history as { text?: string }[])
        .map((entry) => entry?.text)
        .filter((text): text is string => Boolean(text && text.trim()))
        .flatMap((text) => text.split("\n"))
        .filter((line) => line.trim().length > 0)
    : [];

  const snapshotData = {
    projectTitle: project.title,
    artistName: profile?.display_name ?? "",
    artistPhotoUrl: profile?.profile_photo_url ?? null,
    templateId: publication.template_id,
    introduction: project.description ?? null,
    artworks: snapshotArtworks,
    artistBio: {
      shortBio: profile?.short_bio ?? null,
      fullBiography: profile?.full_biography ?? null,
      artistStatement: profile?.artist_statement ?? null,
      country: profile?.country ?? null,
      cityState: profile?.city_state ?? null,
      primaryDiscipline: profile?.primary_discipline ?? null,
      otherDisciplines: profile?.other_disciplines ?? [],
      websiteUrls: profile?.website_urls ?? [],
      cvEntries,
    },
  };

  const { data: existingSnapshots } = await supabase
    .from("publication_snapshot")
    .select("version")
    .eq("publication_id", publication.id)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = (existingSnapshots?.[0]?.version ?? 0) + 1;

  const { data: snapshot, error: snapshotError } = await supabase
    .from("publication_snapshot")
    .insert({
      publication_id: publication.id,
      version: nextVersion,
      data: snapshotData,
      template_id: publication.template_id,
      template_version: "1",
      schema_version: 1,
      published_by: user.id,
    })
    .select("id")
    .single();

  if (snapshotError || !snapshot) {
    return { error: "Couldn't publish. Please try again." };
  }

  await supabase
    .from("publication")
    .update({
      current_snapshot_id: snapshot.id,
      status: "published",
      visibility: "public",
      published_at: new Date().toISOString(),
    })
    .eq("id", publication.id);

  await supabase.from("project").update({ status: "published" }).eq("id", projectId);

  revalidatePath(managePath(kind, projectId));
  revalidatePath(`/publication/${publication.id}`);
  return {};
}
