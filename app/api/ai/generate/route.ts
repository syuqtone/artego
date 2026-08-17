import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAiQuota } from "@/lib/ai/quota";
import { callClaude } from "@/lib/ai/claude";
import { buildCatalogueIntroPrompt, CATALOGUE_INTRO_PROMPT_VERSION, TONES, type Tone } from "@/lib/ai/prompts";

// ai-engine.md technical contract: all AI calls happen server-side (this
// route), every call is logged as an ai_job row (user, project, function,
// prompt version, input, result, token usage, latency, status), and quota
// is enforced before the provider is ever called.

type ArtworkImageRow = { public_url: string | null; role: string };
type ArtworkRel = {
  title: string;
  year_created: string | null;
  medium: string;
  height_cm: number | null;
  width_cm: number | null;
  depth_cm: number | null;
  dimension_unit: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { function?: string; projectId?: string; tone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { function: fn, projectId } = body;
  if (fn !== "catalogue_intro" || !projectId) {
    return NextResponse.json({ error: "Unsupported or missing function" }, { status: 400 });
  }
  const tone: Tone = TONES.includes(body.tone as Tone) ? (body.tone as Tone) : "neutral";

  const { data: project } = await supabase
    .from("project")
    .select("id, title, owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const quota = await checkAiQuota(supabase, user.id);
  if (!quota.ok) {
    return NextResponse.json({ error: quota.message }, { status: 429 });
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
    .map((row) => row.artwork as unknown as ArtworkRel)
    .filter(Boolean)
    .map((a) => ({
      title: a.title,
      year: a.year_created,
      medium: a.medium,
      dimensions: [a.height_cm, a.width_cm, a.depth_cm].filter((v) => v !== null).join(" × ") + ` ${a.dimension_unit}`,
    }));

  // ai-engine.md "Empty input": if source data is too thin, don't call the
  // provider at all.
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

  const { data: job } = await supabase
    .from("ai_job")
    .insert({
      user_id: user.id,
      project_id: projectId,
      function: "catalogue_intro",
      prompt_version: CATALOGUE_INTRO_PROMPT_VERSION,
      input,
      status: "processing",
    })
    .select("id")
    .single();

  if (!job) {
    return NextResponse.json({ error: "Could not start generation" }, { status: 500 });
  }

  const startedAt = Date.now();
  try {
    const prompt = buildCatalogueIntroPrompt(input, tone);
    const result = await callClaude(prompt);
    const latencyMs = Date.now() - startedAt;

    await supabase
      .from("ai_job")
      .update({
        result: { draft: result.text },
        token_usage: result.inputTokens + result.outputTokens,
        latency_ms: latencyMs,
        status: "completed",
      })
      .eq("id", job.id);

    return NextResponse.json({ draft: result.text });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    await supabase
      .from("ai_job")
      .update({
        status: "failed",
        latency_ms: latencyMs,
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", job.id);

    return NextResponse.json(
      {
        error:
          "Drafting is unavailable right now. You can write this section yourself and try again later.",
      },
      { status: 502 },
    );
  }
}
