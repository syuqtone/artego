"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { COUNTRIES, DISCIPLINES, PROFILE_VISIBILITY_OPTIONS } from "@/lib/profile-options";
import { saveProfileAction, type ProfileState } from "./actions";

const initialState: ProfileState = {};

const inputClass =
  "min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue";
const labelClass = "text-[15px] font-semibold text-artego-black";

export type ProfileFormData = {
  displayName: string;
  shortBio: string;
  fullBiography: string;
  artistStatement: string;
  country: string;
  cityState: string;
  primaryDiscipline: string;
  otherDisciplines: string[];
  websiteUrls: string[];
  cvExhibitionHistory: string;
  profileVisibility: string;
  showEmailPublicly: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save Profile"}
    </button>
  );
}

export default function ProfileForm({ initial }: { initial: ProfileFormData }) {
  const [state, formAction] = useActionState(saveProfileAction, initialState);

  // quota.md / uat.md scenario K: a rejected save must not lose just-typed
  // edits — see the identical pattern and reasoning in EditArtworkForm.tsx.
  const [attempt, setAttempt] = useState(0);
  const [lastValues, setLastValues] = useState<ProfileFormData | null>(null);
  const values = lastValues ?? initial;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    setLastValues({
      displayName: String(fd.get("displayName") ?? ""),
      shortBio: String(fd.get("shortBio") ?? ""),
      fullBiography: String(fd.get("fullBiography") ?? ""),
      artistStatement: String(fd.get("artistStatement") ?? ""),
      country: String(fd.get("country") ?? ""),
      cityState: String(fd.get("cityState") ?? ""),
      primaryDiscipline: String(fd.get("primaryDiscipline") ?? ""),
      otherDisciplines: fd.getAll("otherDisciplines").map(String),
      websiteUrls: [0, 1, 2].map((i) => String(fd.get(`websiteUrl${i + 1}`) ?? "")),
      cvExhibitionHistory: String(fd.get("cvExhibitionHistory") ?? ""),
      profileVisibility: String(fd.get("profileVisibility") ?? ""),
      showEmailPublicly: fd.get("showEmailPublicly") === "on",
    });
  }

  useEffect(() => {
    if (state.error) {
      setAttempt((n) => n + 1);
    }
  }, [state]);

  return (
    <form key={attempt} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {state.success && (
        <p className="rounded border border-success px-3 py-2 text-sm font-semibold text-success">
          Profile saved.
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded border border-danger px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className={labelClass}>
          Artist Name <span aria-hidden>*</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={values.displayName}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="shortBio" className={labelClass}>
          Short Bio <span aria-hidden>*</span>
        </label>
        <textarea
          id="shortBio"
          name="shortBio"
          required
          rows={3}
          defaultValue={values.shortBio}
          aria-describedby="shortBio-hint"
          className={`${inputClass} min-h-0 py-2`}
        />
        <p id="shortBio-hint" className="text-sm text-grey-600">
          80–300 characters recommended.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="fullBiography" className={labelClass}>
          Full Biography
        </label>
        <textarea
          id="fullBiography"
          name="fullBiography"
          rows={5}
          maxLength={3000}
          defaultValue={values.fullBiography}
          className={`${inputClass} min-h-0 py-2`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="artistStatement" className={labelClass}>
          Artist Statement
        </label>
        <textarea
          id="artistStatement"
          name="artistStatement"
          rows={4}
          defaultValue={values.artistStatement}
          className={`${inputClass} min-h-0 py-2`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="country" className={labelClass}>
          Country <span aria-hidden>*</span>
        </label>
        <select
          id="country"
          name="country"
          required
          defaultValue={values.country}
          className={inputClass}
        >
          <option value="" disabled>
            Choose a country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cityState" className={labelClass}>
          City / State
        </label>
        <input
          id="cityState"
          name="cityState"
          type="text"
          defaultValue={values.cityState}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="primaryDiscipline" className={labelClass}>
          Primary Discipline <span aria-hidden>*</span>
        </label>
        <select
          id="primaryDiscipline"
          name="primaryDiscipline"
          required
          defaultValue={values.primaryDiscipline}
          className={inputClass}
        >
          <option value="" disabled>
            Choose a discipline
          </option>
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={labelClass}>Other Disciplines</legend>
        <div className="flex flex-col gap-2">
          {DISCIPLINES.map((d) => (
            <label key={d} className="flex items-center gap-2 text-base text-artego-black">
              <input
                type="checkbox"
                name="otherDisciplines"
                value={d}
                defaultChecked={values.otherDisciplines.includes(d)}
                className="h-5 w-5"
              />
              {d}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>Website / Social Links</legend>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <label htmlFor={`websiteUrl${i + 1}`} className="text-sm text-grey-600">
              Link {i + 1}
            </label>
            <input
              id={`websiteUrl${i + 1}`}
              name={`websiteUrl${i + 1}`}
              type="url"
              placeholder="https://..."
              defaultValue={values.websiteUrls[i] ?? ""}
              className={inputClass}
            />
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="cvExhibitionHistory" className={labelClass}>
          CV / Exhibition History
        </label>
        <textarea
          id="cvExhibitionHistory"
          name="cvExhibitionHistory"
          rows={4}
          defaultValue={values.cvExhibitionHistory}
          aria-describedby="cv-hint"
          className={`${inputClass} min-h-0 py-2`}
        />
        <p id="cv-hint" className="text-sm text-grey-600">
          One entry per line.
        </p>
      </div>

      <label className="flex items-center gap-2 text-base text-artego-black">
        <input
          type="checkbox"
          name="showEmailPublicly"
          defaultChecked={values.showEmailPublicly}
          className="h-5 w-5"
        />
        Show my email publicly on my profile
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="profileVisibility" className={labelClass}>
          Profile Visibility <span aria-hidden>*</span>
        </label>
        <select
          id="profileVisibility"
          name="profileVisibility"
          required
          defaultValue={values.profileVisibility}
          className={inputClass}
        >
          {PROFILE_VISIBILITY_OPTIONS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton />
    </form>
  );
}
