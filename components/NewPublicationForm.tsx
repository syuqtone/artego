"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPublicationAction, type NewPublicationState } from "@/lib/publication-actions";

const initialState: NewPublicationState = {};

const TEMPLATES = [
  { value: "minimal", label: "Minimal", description: "Clean, image-forward, generous whitespace." },
  { value: "editorial", label: "Editorial", description: "Magazine-style, stronger typography." },
] as const;

const COPY = {
  catalogues: { titleLabel: "Catalogue Title", submitLabel: "Create Catalogues", submittingLabel: "Creating…" },
  portfolios: {
    titleLabel: "Portfolio Title",
    submitLabel: "Create Portfolio",
    submittingLabel: "Creating…",
  },
} as const;

function SubmitButton({ kind }: { kind: "catalogues" | "portfolios" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-60"
    >
      {pending ? COPY[kind].submittingLabel : COPY[kind].submitLabel}
    </button>
  );
}

// One screen — title, template and artwork selection together
// (product owner's request, modelled on the old Exhibition form).
// Shared by both routes (BUILD-ORDER.md 3.5: "same engine"); only the
// button/label copy in COPY above differs between them.
//
// All three fields are controlled React state, not the usual
// uncontrolled-plus-capture-on-submit pattern used elsewhere in this
// app — the AI template suggestion below needs to read the live title
// and artwork selection, and needs to be able to set the template
// choice back, so plain DOM state isn't enough here. A side benefit:
// state naturally survives a rejected submission with no remount hack.
export default function NewPublicationForm({
  kind,
  artworks,
  aiEnabled = true,
}: {
  kind: "catalogues" | "portfolios";
  artworks: { id: string; title: string; thumbUrl: string | null }[];
  aiEnabled?: boolean;
}) {
  const boundAction = createPublicationAction.bind(null, kind);
  const [state, formAction] = useActionState(boundAction, initialState);

  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<string>("minimal");
  const [artworkIds, setArtworkIds] = useState<string[]>([]);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  function toggleArtwork(id: string, checked: boolean) {
    setArtworkIds((ids) => (checked ? [...ids, id] : ids.filter((x) => x !== id)));
  }

  // ai-engine.md rule 5: AI only suggests, it never decides for the
  // artist — this pre-selects a template radio the artist can see and
  // change immediately, exactly like every other "Draft with AI" field.
  async function requestTemplateSuggestion() {
    setSuggesting(true);
    setSuggestionError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ function: "template_suggestion", title, artworkIds }),
      });
      const data = (await res.json()) as { draft?: string; error?: string };
      if (!res.ok || !data.draft) {
        setSuggestionError(
          data.error ?? "Suggestion unavailable right now. Please choose a template yourself.",
        );
        return;
      }
      const [rawTemplate, ...rest] = data.draft.trim().split("\n");
      const suggested = rawTemplate.trim().toLowerCase();
      if (suggested === "minimal" || suggested === "editorial") {
        setTemplateId(suggested);
        setSuggestionReason(rest.join(" ").trim() || null);
      } else {
        setSuggestionError("Couldn't understand the suggestion. Please choose a template yourself.");
      }
    } catch {
      setSuggestionError("Suggestion unavailable right now. Please choose a template yourself.");
    } finally {
      setSuggesting(false);
    }
  }

  const copy = COPY[kind];
  const suggestDisabledReason =
    title.trim().length === 0
      ? "Enter a title first."
      : artworkIds.length === 0
        ? "Select at least one artwork first."
        : null;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-[15px] font-semibold text-artego-black">
          {copy.titleLabel} <span aria-hidden>*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[15px] font-semibold text-artego-black">
          Template <span aria-hidden>*</span>
        </legend>
        {TEMPLATES.map((t) => (
          <label key={t.value} className="flex items-start gap-3 rounded border border-grey-200 p-3">
            <input
              type="radio"
              name="templateId"
              value={t.value}
              required
              checked={templateId === t.value}
              onChange={() => setTemplateId(t.value)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold text-artego-black">{t.label}</span>
              <span className="text-sm text-grey-600">{t.description}</span>
            </span>
          </label>
        ))}

        {aiEnabled && (
          <div className="mt-1 flex flex-col gap-1">
            <button
              type="button"
              onClick={requestTemplateSuggestion}
              disabled={suggesting || Boolean(suggestDisabledReason)}
              className="min-h-11 self-start rounded border border-artego-black px-4 text-sm font-semibold text-artego-black disabled:opacity-30"
            >
              {suggesting ? "Thinking…" : "Suggest a template with AI"}
            </button>
            {suggestDisabledReason && (
              <p className="text-sm text-grey-600">{suggestDisabledReason}</p>
            )}
            {suggestionError && (
              <p role="alert" className="text-sm font-semibold text-danger">
                {suggestionError}
              </p>
            )}
            {suggestionReason && !suggestionError && (
              <p className="text-sm text-grey-600">
                <span className="font-semibold text-artego-black">AI suggestion:</span>{" "}
                {suggestionReason}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[15px] font-semibold text-artego-black">
          Artworks <span aria-hidden>*</span>
        </legend>
        <ul className="flex flex-col gap-2">
          {artworks.map((a) => (
            <li key={a.id}>
              <label className="flex items-center gap-3 rounded border border-grey-200 p-2">
                <input
                  type="checkbox"
                  name="artworkId"
                  value={a.id}
                  checked={artworkIds.includes(a.id)}
                  onChange={(e) => toggleArtwork(a.id, e.target.checked)}
                  className="h-5 w-5 shrink-0"
                />
                {a.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.thumbUrl} alt={a.title} className="h-10 w-10 shrink-0 rounded object-cover" />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded bg-grey-100" />
                )}
                <span className="text-sm text-artego-black">{a.title}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton kind={kind} />
    </form>
  );
}
