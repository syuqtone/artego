import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAiQuota } from "@/lib/ai/quota";
import { getAiEnabled } from "@/lib/ai/settings";
import { callClaude } from "@/lib/ai/claude";
import { runAiJob } from "@/lib/ai/run-job";
import {
  buildAltTextPrompt,
  buildArtworkDescriptionPrompt,
  buildCatalogueIntroPrompt,
  buildCuratorialStatementPrompt,
  ALT_TEXT_PROMPT_VERSION,
  ARTWORK_DESCRIPTION_PROMPT_VERSION,
  CATALOGUE_INTRO_PROMPT_VERSION,
  CURATORIAL_STATEMENT_PROMPT_VERSION,
  TONES,
  type Tone,
} from "@/lib/ai/prompts";

// ai-engine.md technical contract: all AI calls happen server-side (this
// route), every call is logged as an ai_job row (user, project, function,
// prompt version, input, result, token usage, latency, status), and quota
// is enforced before the provider is ever called.

type ArtworkImageRow = { public_url: string | null; role: string };
type ProjectArtworkRel = {
  title: string;
  year_created: string | null;
  medium: string;
  height_cm: number | null;
  width_cm: number | null;
  depth_cm: number | null;
  dimension_unit: string;
};

function dimensionsLine(a: {
  height_cm: number | null;
  width_cm: number | null;
  depth_cm: number | null;
  dimension_unit: string;
}): string {
  const parts = [a.height_cm, a.width_cm, a.depth_cm].filter((v) => v !== null);
  return parts.length ? `${parts.join(" × ")} ${a.dimension_unit}` : "";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ai-engine.md rule 6: AI can be switched off entirely — this is the
  // defense-in-depth check behind the UI hiding the buttons.
  if (!(await getAiEnabled(supabase, user.id))) {
    return NextResponse.json({ error: "AI drafting is turned off in Settings." }, { status: 403 });
  }

  let body: { function?: string; projectId?: string; artworkId?: string; tone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { function: fn } = body;
  const tone: Tone = TONES.includes(body.tone as Tone) ? (body.tone as Tone) : "neutral";

  const quota = await checkAiQuota(supabase, user.id);
  if (!quota.ok) {
    return NextResponse.json({ error: quota.message }, { status: 429 });
  }

  if (fn === "catalogue_intro") {
    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { data: project } = await supabase
      .from("project")
      .select("id, title, owner_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("artist_profile")
      .select("display_name, short_bio, artist_statement")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: itemRows } = await supabase
      .from("project_item")
      .select("artwork(title, year_created, medium, height_cm, width_cm, depth_cm, dimension_unit)")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    // Only the fields the prompt needs ever leave this route — no price,
    // email, or legal name is fetched at all (ai-engine.md "Never sent").
    const artworks = (itemRows ?? [])
      .map((row) => row.artwork as unknown as ProjectArtworkRel)
      .filter(Boolean)
      .map((a) => ({
        title: a.title,
        year: a.year_created,
        medium: a.medium,
        dimensions: dimensionsLine(a),
      }));

    // ai-engine.md "Empty input": if source data is too thin, don't call
    // the provider at all.
    if (artworks.length === 0) {
      return NextResponse.json(
        { error: "Add at least one artwork before drafting with AI." },
        { status: 422 },
      );
    }

    const input = {
      artistName: profile?.display_name ?? "",
      shortBio: profile?.short_bio ?? "",
      statement: profile?.artist_statement ?? "",
      projectTitle: project.title,
      artworks,
      tone,
    };

    return runAiJob({
      supabase,
      userId: user.id,
      projectId,
      fn: "catalogue_intro",
      promptVersion: CATALOGUE_INTRO_PROMPT_VERSION,
      input,
      execute: () => callClaude(buildCatalogueIntroPrompt(input, tone)),
    });
  }

  if (fn === "curatorial_statement") {
    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { data: project } = await supabase
      .from("project")
      .select("id, title, subtitle, owner_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("artist_profile")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: itemRows } = await supabase
      .from("project_item")
      .select("artwork(title, year_created, medium)")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    const artworks = (itemRows ?? [])
      .map((row) => row.artwork as unknown as { title: string; year_created: string | null; medium: string })
      .filter(Boolean)
      .map((a) => ({ title: a.title, year: a.year_created, medium: a.medium }));

    if (artworks.length === 0) {
      return NextResponse.json(
        { error: "Add at least one artwork before drafting with AI." },
        { status: 422 },
      );
    }

    const input = {
      exhibitionTitle: project.title,
      theme: project.subtitle ?? "",
      participatingArtists: [profile?.display_name ?? ""].filter(Boolean),
      artworks,
      tone,
    };

    return runAiJob({
      supabase,
      userId: user.id,
      projectId,
      fn: "curatorial_statement",
      promptVersion: CURATORIAL_STATEMENT_PROMPT_VERSION,
      input,
      execute: () => callClaude(buildCuratorialStatementPrompt(input, tone)),
    });
  }

  if (fn === "artwork_description" || fn === "alt_text") {
    const { artworkId } = body;
    if (!artworkId) {
      return NextResponse.json({ error: "Missing artworkId" }, { status: 400 });
    }

    const { data: artwork } = await supabase
      .from("artwork")
      .select(
        "id, title, year_created, medium, category, height_cm, width_cm, depth_cm, dimension_unit, artist_profile_id, artist_profile!inner(user_id)",
      )
      .eq("id", artworkId)
      .maybeSingle();
    const ownerId = (artwork?.artist_profile as unknown as { user_id: string } | undefined)?.user_id;
    if (!artwork || ownerId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (fn === "artwork_description") {
      const { data: seriesRow } = await supabase
        .from("collection_item")
        .select("collection(title)")
        .eq("artwork_id", artworkId)
        .limit(1)
        .maybeSingle();
      const series =
        (seriesRow?.collection as unknown as { title: string } | null)?.title ?? null;

      const input = {
        title: artwork.title,
        year: artwork.year_created,
        medium: artwork.medium,
        dimensions: dimensionsLine(artwork),
        series,
        tone,
      };

      return runAiJob({
        supabase,
        userId: user.id,
        projectId: null,
        fn: "artwork_description",
        promptVersion: ARTWORK_DESCRIPTION_PROMPT_VERSION,
        input,
        execute: () => callClaude(buildArtworkDescriptionPrompt(input, tone)),
      });
    }

    // alt_text — the only function that also sends the artwork's image
    // (ai-engine.md "Sent: ... for alt text only, the artwork image
    // derivative").
    const { data: imageRows } = await supabase
      .from("artwork_image")
      .select("public_url, role")
      .eq("artwork_id", artworkId);
    const imageUrl =
      (imageRows as ArtworkImageRow[] | null)?.find((img) => img.role === "display_1200")
        ?.public_url ??
      (imageRows as ArtworkImageRow[] | null)?.find((img) => img.role === "card_600")?.public_url ??
      null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Add an image before drafting alt text." },
        { status: 422 },
      );
    }

    const input = {
      title: artwork.title,
      medium: artwork.medium,
      category: artwork.category,
    };

    return runAiJob({
      supabase,
      userId: user.id,
      projectId: null,
      fn: "alt_text",
      promptVersion: ALT_TEXT_PROMPT_VERSION,
      input,
      execute: async () => {
        const result = await callClaude(buildAltTextPrompt(input), { imageUrl });
        // Defensive cap — the prompt asks for under 125 characters, but
        // never let a stray long response through as accessibility text.
        return { ...result, text: result.text.slice(0, 125) };
      },
    });
  }

  return NextResponse.json({ error: "Unsupported or missing function" }, { status: 400 });
}
