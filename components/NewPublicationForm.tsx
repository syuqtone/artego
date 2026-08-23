"use client";

import { useActionState, useEffect, useState } from "react";
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
    titleLabel: "Artist Directory Title",
    submitLabel: "Create Artist Directory",
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
export default function NewPublicationForm({
  kind,
  artworks,
}: {
  kind: "catalogues" | "portfolios";
  artworks: { id: string; title: string; thumbUrl: string | null }[];
}) {
  const boundAction = createPublicationAction.bind(null, kind);
  const [state, formAction] = useActionState(boundAction, initialState);

  // uat.md scenario K: preserve entered data across a rejected submission
  // — React resets uncontrolled fields after every action call.
  const [attempt, setAttempt] = useState(0);
  const [lastTitle, setLastTitle] = useState("");
  const [lastTemplateId, setLastTemplateId] = useState("");
  const [lastArtworkIds, setLastArtworkIds] = useState<string[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    setLastTitle(String(fd.get("title") ?? ""));
    setLastTemplateId(String(fd.get("templateId") ?? ""));
    setLastArtworkIds(fd.getAll("artworkId").map(String));
  }

  useEffect(() => {
    if (state.error) {
      setAttempt((n) => n + 1);
    }
  }, [state]);

  const copy = COPY[kind];

  return (
    <form key={attempt} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-[15px] font-semibold text-artego-black">
          {copy.titleLabel} <span aria-hidden>*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={lastTitle}
          className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[15px] font-semibold text-artego-black">
          Template <span aria-hidden>*</span>
        </legend>
        {TEMPLATES.map((t, i) => (
          <label key={t.value} className="flex items-start gap-3 rounded border border-grey-200 p-3">
            <input
              type="radio"
              name="templateId"
              value={t.value}
              required
              defaultChecked={lastTemplateId ? lastTemplateId === t.value : i === 0}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold text-artego-black">{t.label}</span>
              <span className="text-sm text-grey-600">{t.description}</span>
            </span>
          </label>
        ))}
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
                  defaultChecked={lastArtworkIds.includes(a.id)}
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
