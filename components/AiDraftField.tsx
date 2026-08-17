"use client";

import { useState } from "react";
import type { Tone } from "@/lib/ai/prompts";

// ai-engine.md interface pattern: FIELD -> [Draft with AI] -> GENERATING...
// -> DRAFT SHOWN AND LABELLED -> EDIT / REGENERATE / DISCARD -> ACCEPT.
// Rule 3: AI never silently overwrites existing user text — if the field
// already holds text the user wrote, a new draft is offered as a
// Replace / Insert Below / Cancel choice instead of overwriting directly.
// Rule 6: the product works with AI off; this button is secondary and the
// field is a normal editable input with or without it.
//
// Generic over any of the ai_job "function" values that draft into a
// single text field (catalogue_intro, artwork_description, alt_text) —
// the caller supplies the request body and what counts as "too thin to
// draft from".

const TONE_LABEL: Record<Tone, string> = {
  neutral: "Neutral",
  warm: "Warm",
  formal: "Formal",
};

export default function AiDraftField({
  fieldId,
  label,
  value,
  onChange,
  onSave,
  requestBody,
  disabledReason,
  multiline = true,
  rows = 8,
  maxLength,
  placeholder,
  showTone = true,
}: {
  fieldId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  requestBody: Record<string, unknown>;
  disabledReason?: string | null;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  showTone?: boolean;
}) {
  const [tone, setTone] = useState<Tone>("neutral");
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<string | null>(null);

  const save = onSave ?? (() => {});

  async function requestDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...requestBody, tone }),
      });
      const data = (await res.json()) as { draft?: string; error?: string };
      if (!res.ok || !data.draft) {
        setError(
          data.error ??
            "Drafting is unavailable right now. You can write this section yourself and try again later.",
        );
        return;
      }

      const hasUserText = value.trim().length > 0 && !isDraft;
      if (hasUserText) {
        setPendingDraft(data.draft);
      } else {
        setPreviousValue(value);
        onChange(data.draft);
        save(data.draft);
        setIsDraft(true);
      }
    } catch {
      setError(
        "Drafting is unavailable right now. You can write this section yourself and try again later.",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyPendingDraft(mode: "replace" | "insert_below") {
    if (pendingDraft === null) return;
    setPreviousValue(value);
    const next = mode === "replace" ? pendingDraft : `${value}\n\n${pendingDraft}`;
    onChange(next);
    save(next);
    setIsDraft(true);
    setPendingDraft(null);
  }

  function handleUndo() {
    if (previousValue === null) return;
    onChange(previousValue);
    save(previousValue);
    setPreviousValue(null);
    setIsDraft(false);
  }

  function handleDiscard() {
    setPreviousValue(value);
    onChange("");
    save("");
    setIsDraft(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    onChange(e.target.value);
    if (isDraft) setIsDraft(false);
  }

  function handleBlur() {
    save(value);
  }

  const fieldClass =
    "w-full rounded border border-grey-200 p-3 text-[15px] text-artego-black disabled:opacity-60";

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-artego-black">{label}</h2>
        {isDraft && (
          <span className="text-xs font-semibold text-artego-red-deep">AI draft — please review</span>
        )}
      </div>

      <div className={isDraft ? "mt-2 border-l-4 border-artego-red pl-3" : "mt-2"}>
        <label htmlFor={fieldId} className="sr-only">
          {label}
        </label>
        {multiline ? (
          <textarea
            id={fieldId}
            name={fieldId}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`${fieldClass} min-h-40`}
          />
        ) : (
          <input
            id={fieldId}
            name={fieldId}
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`min-h-11 ${fieldClass}`}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {disabledReason && <p className="mt-2 text-sm text-grey-600">{disabledReason}</p>}

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
        {showTone && (
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
        )}

        <button
          type="button"
          onClick={requestDraft}
          disabled={loading || Boolean(disabledReason) || pendingDraft !== null}
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
