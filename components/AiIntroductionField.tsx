"use client";

import { useState } from "react";
import type { Tone } from "@/lib/ai/prompts";

// ai-engine.md interface pattern: FIELD -> [Draft with AI] -> GENERATING...
// -> DRAFT SHOWN AND LABELLED -> EDIT / REGENERATE / DISCARD -> ACCEPT.
// Rule 3: AI never silently overwrites existing user text — if the field
// already holds text the user wrote, a new draft is offered as a
// Replace / Insert Below / Cancel choice instead of overwriting directly.
// Rule 6: the product works with AI off; this button is secondary and the
// textarea is a normal editable field with or without it.

const TONE_LABEL: Record<Tone, string> = {
  neutral: "Neutral",
  warm: "Warm",
  formal: "Formal",
};

export default function AiIntroductionField({
  projectId,
  value,
  onChange,
  onSave,
  hasArtworks,
}: {
  projectId: string;
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  hasArtworks: boolean;
}) {
  const [tone, setTone] = useState<Tone>("neutral");
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<string | null>(null);

  async function requestDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ function: "catalogue_intro", projectId, tone }),
      });
      const data = (await res.json()) as { draft?: string; error?: string };
      if (!res.ok || !data.draft) {
        setError(data.error ?? "Drafting is unavailable right now. You can write this section yourself and try again later.");
        return;
      }

      const hasUserText = value.trim().length > 0 && !isDraft;
      if (hasUserText) {
        setPendingDraft(data.draft);
      } else {
        setPreviousValue(value);
        onChange(data.draft);
        onSave(data.draft);
        setIsDraft(true);
      }
    } catch {
      setError("Drafting is unavailable right now. You can write this section yourself and try again later.");
    } finally {
      setLoading(false);
    }
  }

  function applyPendingDraft(mode: "replace" | "insert_below") {
    if (pendingDraft === null) return;
    setPreviousValue(value);
    const next = mode === "replace" ? pendingDraft : `${value}\n\n${pendingDraft}`;
    onChange(next);
    onSave(next);
    setIsDraft(true);
    setPendingDraft(null);
  }

  function handleUndo() {
    if (previousValue === null) return;
    onChange(previousValue);
    onSave(previousValue);
    setPreviousValue(null);
    setIsDraft(false);
  }

  function handleDiscard() {
    setPreviousValue(value);
    onChange("");
    onSave("");
    setIsDraft(false);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    if (isDraft) setIsDraft(false);
  }

  function handleBlur() {
    onSave(value);
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-artego-black">Introduction</h2>
        {isDraft && (
          <span className="text-xs font-semibold text-artego-red-deep">AI draft — please review</span>
        )}
      </div>

      <div className={isDraft ? "mt-2 border-l-4 border-artego-red pl-3" : "mt-2"}>
        <label htmlFor="catalogue-introduction" className="sr-only">
          Catalogue introduction
        </label>
        <textarea
          id="catalogue-introduction"
          value={value}
          onChange={handleTextChange}
          onBlur={handleBlur}
          disabled={loading}
          rows={8}
          placeholder="Write an introduction for this catalogue, or draft one with AI."
          className="min-h-40 w-full rounded border border-grey-200 p-3 text-[15px] text-artego-black disabled:opacity-60"
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {!hasArtworks && (
        <p className="mt-2 text-sm text-grey-600">
          Add at least one artwork before drafting with AI.
        </p>
      )}

      {pendingDraft && (
        <div className="mt-3 rounded border border-grey-200 bg-grey-100 p-3">
          <p className="text-sm font-semibold text-artego-black">New AI draft</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-grey-900">{pendingDraft}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPendingDraft("replace")}
              className="min-h-11 rounded bg-artego-red px-4 text-sm font-semibold text-artego-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => applyPendingDraft("insert_below")}
              className="min-h-11 rounded border border-artego-black px-4 text-sm font-semibold text-artego-black"
            >
              Insert Below
            </button>
            <button
              type="button"
              onClick={() => setPendingDraft(null)}
              className="min-h-11 rounded px-4 text-sm font-semibold text-grey-600 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-sm text-grey-600">
          Tone{" "}
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="ml-1 rounded border border-grey-200 p-1 text-sm text-artego-black"
          >
            {(Object.keys(TONE_LABEL) as Tone[]).map((t) => (
              <option key={t} value={t}>
                {TONE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={requestDraft}
          disabled={loading || !hasArtworks || pendingDraft !== null}
          className="min-h-11 rounded border border-artego-black px-4 text-sm font-semibold text-artego-black disabled:opacity-30"
        >
          {loading ? "Generating…" : isDraft ? "Regenerate" : "Draft with AI"}
        </button>

        {isDraft && previousValue !== null && (
          <button
            type="button"
            onClick={handleUndo}
            className="min-h-11 rounded px-3 text-sm font-semibold text-grey-600 underline"
          >
            Undo
          </button>
        )}

        {isDraft && (
          <button
            type="button"
            onClick={handleDiscard}
            className="min-h-11 rounded px-3 text-sm font-semibold text-danger underline"
          >
            Discard
          </button>
        )}
      </div>
    </section>
  );
}
