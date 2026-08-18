"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import AiDraftField from "@/components/AiDraftField";
import {
  addExhibitionArtworksAction,
  moveExhibitionItemAction,
  publishExhibitionAction,
  removeExhibitionArtworkAction,
  updateExhibitionDetailsAction,
  uploadCoverImageAction,
  type ExhibitionDetailsState,
} from "@/app/dashboard/exhibitions/actions";
import { COUNTRIES, PROFILE_VISIBILITY_OPTIONS } from "@/lib/profile-options";

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

export type ExhibitionDetails = {
  subtitle: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  country: string;
  curators: string;
  visibility: string;
  coverImageUrl: string | null;
};

const inputClass =
  "min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue";
const labelClass = "text-[15px] font-semibold text-artego-black";

const initialDetailsState: ExhibitionDetailsState = {};

function SaveDetailsButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save Details"}
    </button>
  );
}

export default function ExhibitionManager({
  projectId,
  details,
  items,
  available,
  aiEnabled,
  publicationId,
  status,
}: {
  projectId: string;
  details: ExhibitionDetails;
  items: Item[];
  available: AvailableArtwork[];
  aiEnabled: boolean;
  publicationId: string | null;
  status: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [description, setDescription] = useState(details.description);
  const boundDetailsAction = updateExhibitionDetailsAction.bind(null, projectId);
  const [detailsState, detailsFormAction] = useActionState(boundDetailsAction, initialDetailsState);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState(details.coverImageUrl);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedStatus, setPublishedStatus] = useState(status);

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    const result = await publishExhibitionAction(projectId);
    if (result.error) {
      setPublishError(result.error);
    } else {
      setPublishedStatus("published");
    }
    setPublishing(false);
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const formData = new FormData();
    formData.set("coverImage", file);
    await uploadCoverImageAction(projectId, formData);
    setCoverImageUrl(URL.createObjectURL(file));
    setCoverUploading(false);
  }

  async function handleMove(itemId: string, direction: "up" | "down") {
    setPendingId(itemId);
    await moveExhibitionItemAction(projectId, itemId, direction);
    setPendingId(null);
  }

  async function handleRemove(itemId: string) {
    setPendingId(itemId);
    await removeExhibitionArtworkAction(projectId, itemId);
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <label htmlFor="coverImage" className={labelClass}>
          Cover Image
        </label>
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="" className="mb-2 aspect-video w-full rounded object-cover" />
        )}
        <input
          id="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleCoverChange}
          disabled={coverUploading}
          className="text-sm text-artego-black"
        />
        {coverUploading && <p className="text-sm text-grey-600">Uploading...</p>}
      </section>

      <form action={detailsFormAction} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="subtitle" className={labelClass}>
            Theme / Subtitle
          </label>
          <input
            id="subtitle"
            name="subtitle"
            type="text"
            defaultValue={details.subtitle}
            className={inputClass}
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className={labelClass}>Dates</legend>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="startDate" className="text-sm text-grey-600">
                Start
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={details.startDate}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endDate" className="text-sm text-grey-600">
                End
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={details.endDate}
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-sm text-grey-600">Leave blank for an online-only exhibition.</p>
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="venue" className={labelClass}>
            Venue
          </label>
          <input id="venue" name="venue" type="text" defaultValue={details.venue} className={inputClass} />
        </div>

        <div className="flex min-w-0 gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="city" className="text-sm text-grey-600">
              City
            </label>
            <input id="city" name="city" type="text" defaultValue={details.city} className={inputClass} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="country" className="text-sm text-grey-600">
              Country
            </label>
            <select id="country" name="country" defaultValue={details.country} className={inputClass}>
              <option value="">Choose a country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="curators" className={labelClass}>
            Curator(s)
          </label>
          <input
            id="curators"
            name="curators"
            type="text"
            defaultValue={details.curators}
            placeholder="Comma-separated names"
            className={inputClass}
          />
        </div>

        <AiDraftField
          fieldId="description"
          label="Curatorial Statement"
          value={description}
          onChange={setDescription}
          requestBody={{ function: "curatorial_statement", projectId }}
          disabledReason={items.length === 0 ? "Add at least one artwork before drafting with AI." : null}
          placeholder="Write a curatorial statement for this exhibition, or draft one with AI."
          aiEnabled={aiEnabled}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className={labelClass}>Visibility</legend>
          {PROFILE_VISIBILITY_OPTIONS.map((v) => (
            <label key={v.value} className="flex items-center gap-3 rounded border border-grey-200 p-3">
              <input
                type="radio"
                name="visibility"
                value={v.value}
                defaultChecked={details.visibility === v.value}
                className="h-5 w-5 shrink-0"
              />
              <span className="text-[15px] text-artego-black">{v.label}</span>
            </label>
          ))}
        </fieldset>

        {detailsState.error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {detailsState.error}
          </p>
        )}
        {detailsState.success && (
          <p role="status" className="text-sm font-semibold text-success">
            Saved.
          </p>
        )}

        <SaveDetailsButton />
      </form>

      <section>
        <h2 className="text-base font-semibold text-artego-black">Artworks in this exhibition ({items.length})</h2>
        {items.length === 0 ? (
          <p className="mt-1 text-sm text-grey-600">No artworks yet — add some below.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3 rounded border border-grey-200 p-2">
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
                    className="ml-1 text-sm font-semibold text-danger underline disabled:opacity-30"
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
            href={`/dashboard/exhibitions/${projectId}/preview`}
            className="flex min-h-11 items-center justify-center rounded border border-artego-black text-[15px] font-semibold text-artego-black"
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
            className="flex min-h-11 items-center justify-center rounded bg-artego-red text-[15px] font-semibold text-artego-white disabled:opacity-60"
          >
            {publishing ? "Publishing..." : publishedStatus === "published" ? "Republish" : "Publish"}
          </button>

          {publishedStatus === "published" && publicationId && (
            <p className="text-center text-sm text-grey-600">
              Live at{" "}
              <Link
                href={`/exhibition/${publicationId}`}
                target="_blank"
                className="font-semibold text-artego-red-deep underline"
              >
                /exhibition/{publicationId}
              </Link>
            </p>
          )}
        </div>
      )}

      {available.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-artego-black">Add artworks</h2>
          <form
            action={addExhibitionArtworksAction.bind(null, projectId)}
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
