"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addArtworksAction,
  moveItemAction,
  publishPublicationAction,
  removeArtworkAction,
  updateIntroductionAction,
  updateTemplateAction,
} from "@/lib/publication-actions";
import AiDraftField from "@/components/AiDraftField";

type Item = {
  id: string;
  artworkId: string;
  title: string;
  thumbUrl: string | null;
};

type AvailableArtwork = {
  id: string;
  title: string;
  thumbUrl: string | null;
};

const TEMPLATES = [
  { value: "minimal", label: "Minimal" },
  { value: "editorial", label: "Editorial" },
] as const;

// Shared management UI for both catalogues and portfolios
// (BUILD-ORDER.md 3.5: "same engine") — add/remove/reorder artworks,
// choose a template, publish, download the PDF.
export default function PublicationManager({
  kind,
  projectId,
  items,
  available,
  templateId,
  publicationId,
  status,
  introduction,
  aiEnabled,
}: {
  kind: "catalogues" | "portfolios";
  projectId: string;
  items: Item[];
  available: AvailableArtwork[];
  templateId: string;
  publicationId: string | null;
  status: string;
  introduction?: string;
  aiEnabled?: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState(templateId);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedStatus, setPublishedStatus] = useState(status);
  const [introText, setIntroText] = useState(introduction ?? "");

  const label = kind === "catalogues" ? "catalogue" : "portfolio";

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    // Save the latest introduction text first — a Publish click blurs the
    // textarea, but that async save could still be in flight, so this
    // guarantees the snapshot reads what's on screen (publishing-snapshot.md).
    if (kind === "catalogues") {
      await updateIntroductionAction(projectId, introText);
    }
    const result = await publishPublicationAction(kind, projectId);
    if (result.error) {
      setPublishError(result.error);
    } else {
      setPublishedStatus("published");
    }
    setPublishing(false);
  }

  async function handleMove(itemId: string, direction: "up" | "down") {
    setPendingId(itemId);
    await moveItemAction(kind, projectId, itemId, direction);
    setPendingId(null);
  }

  async function handleRemove(itemId: string) {
    setPendingId(itemId);
    await removeArtworkAction(kind, projectId, itemId);
    setPendingId(null);
  }

  async function handleTemplateChange(value: string) {
    setCurrentTemplate(value);
    await updateTemplateAction(kind, projectId, value);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-base font-semibold text-artego-black">Template</h2>
        <div className="mt-2 flex gap-2">
          {TEMPLATES.map((t) => (
            <label
              key={t.value}
              className={`flex-1 rounded border p-3 text-center text-[15px] font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-artego-blue ${
                currentTemplate === t.value
                  ? "border-artego-black bg-grey-100 text-artego-black"
                  : "border-grey-200 text-grey-600"
              }`}
            >
              <input
                type="radio"
                name="template"
                value={t.value}
                checked={currentTemplate === t.value}
                onChange={() => handleTemplateChange(t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </section>

      {kind === "catalogues" && (
        <AiDraftField
          fieldId="catalogue-introduction"
          label="Introduction"
          value={introText}
          onChange={setIntroText}
          onSave={(text) => updateIntroductionAction(projectId, text)}
          requestBody={{ function: "catalogue_intro", projectId }}
          disabledReason={items.length === 0 ? "Add at least one artwork before drafting with AI." : null}
          placeholder="Write an introduction for this catalogue, or draft one with AI."
          aiEnabled={aiEnabled}
        />
      )}

      <section>
        <h2 className="text-base font-semibold text-artego-black">
          Artworks in this {label} ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="mt-1 text-sm text-grey-600">No artworks yet — add some below.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded border border-grey-200 p-2"
              >
                {item.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbUrl}
                    alt={item.title}
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="h-12 w-12 shrink-0 rounded bg-grey-100" />
                )}
                <span className="flex-1 text-sm font-semibold text-artego-black">{item.title}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, "up")}
                    disabled={i === 0 || pendingId === item.id}
                    aria-label={`Move ${item.title} up`}
                    className="flex h-11 w-11 items-center justify-center rounded border border-artego-black text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, "down")}
                    disabled={i === items.length - 1 || pendingId === item.id}
                    aria-label={`Move ${item.title} down`}
                    className="flex h-11 w-11 items-center justify-center rounded border border-artego-black text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={pendingId === item.id}
                    className="ml-1 min-h-11 text-sm font-semibold text-danger underline focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/${kind}/${projectId}/preview`}
            className="flex min-h-11 items-center justify-center rounded border border-artego-black text-[15px] font-semibold text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
          >
            Preview
          </Link>

          {publishError && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {publishError}
            </p>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex min-h-11 items-center justify-center rounded bg-artego-red text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-60"
          >
            {publishing
              ? "Publishing..."
              : publishedStatus === "published"
                ? "Republish"
                : "Publish"}
          </button>

          {publishedStatus === "published" && publicationId && (
            <>
              <p className="text-center text-sm text-grey-600">
                Live at{" "}
                <Link
                  href={`/publication/${publicationId}`}
                  target="_blank"
                  className="font-semibold text-artego-red-deep underline focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
                >
                  /publication/{publicationId}
                </Link>
              </p>
              <Link
                href={`/publication/${publicationId}/pdf`}
                className="flex min-h-11 items-center justify-center rounded border border-artego-black text-[15px] font-semibold text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
              >
                Download PDF
              </Link>
            </>
          )}
        </div>
      )}

      {available.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Add artworks</h2>
          <form
            action={addArtworksAction.bind(null, kind, projectId)}
            className="mt-2 flex flex-col gap-3"
          >
            <ul className="flex flex-col gap-2">
              {available.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 rounded border border-grey-200 p-2">
                    <input type="checkbox" name="artworkId" value={a.id} className="h-5 w-5 shrink-0" />
                    {a.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.thumbUrl}
                        alt={a.title}
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded bg-grey-100" />
                    )}
                    <span className="text-sm text-artego-black">{a.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="submit"
              className="min-h-11 self-start rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
            >
              Add Selected
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
