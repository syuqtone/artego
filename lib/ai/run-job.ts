import { NextResponse } from "next/server";
import type { createClient } from "@/lib/supabase/server";

// Shared by every branch in app/api/ai/generate/route.ts — one place that
// implements the ai-engine.md technical contract: log the request as an
// ai_job row before calling the provider, then record the outcome
// (result, token usage, latency, status) whichever way it goes.

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function runAiJob(params: {
  supabase: SupabaseServerClient;
  userId: string;
  projectId: string | null;
  fn: string;
  promptVersion: string;
  input: object;
  execute: () => Promise<{ text: string; inputTokens: number; outputTokens: number }>;
}): Promise<NextResponse> {
  const { supabase, userId, projectId, fn, promptVersion, input, execute } = params;

  const { data: job } = await supabase
    .from("ai_job")
    .insert({
      user_id: userId,
      project_id: projectId,
      function: fn,
      prompt_version: promptVersion,
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
    const result = await execute();
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
