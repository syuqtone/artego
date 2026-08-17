"use client";

import { useActionState } from "react";
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
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan Profil"}
    </button>
  );
}

export default function ProfileForm({ initial }: { initial: ProfileFormData }) {
  const [state, formAction] = useActionState(saveProfileAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.success && (
        <p className="rounded border border-success px-3 py-2 text-sm font-semibold text-success">
          Profil disimpan.
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded border border-danger px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className={labelClass}>
          Nama Artis <span aria-hidden>*</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initial.displayName}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="shortBio" className={labelClass}>
          Bio Ringkas <span aria-hidden>*</span>
        </label>
        <textarea
          id="shortBio"
          name="shortBio"
          required
          rows={3}
          defaultValue={initial.shortBio}
          aria-describedby="shortBio-hint"
          className={`${inputClass} min-h-0 py-2`}
        />
        <p id="shortBio-hint" className="text-sm text-grey-600">
          Disyorkan 80–300 aksara.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="fullBiography" className={labelClass}>
          Biografi Penuh
        </label>
        <textarea
          id="fullBiography"
          name="fullBiography"
          rows={5}
          maxLength={3000}
          defaultValue={initial.fullBiography}
          className={`${inputClass} min-h-0 py-2`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="artistStatement" className={labelClass}>
          Kenyataan Artis
        </label>
        <textarea
          id="artistStatement"
          name="artistStatement"
          rows={4}
          defaultValue={initial.artistStatement}
          className={`${inputClass} min-h-0 py-2`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="country" className={labelClass}>
          Negara <span aria-hidden>*</span>
        </label>
        <select
          id="country"
          name="country"
          required
          defaultValue={initial.country}
          className={inputClass}
        >
          <option value="" disabled>
            Pilih negara
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
          Bandar / Negeri
        </label>
        <input
          id="cityState"
          name="cityState"
          type="text"
          defaultValue={initial.cityState}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="primaryDiscipline" className={labelClass}>
          Disiplin Utama <span aria-hidden>*</span>
        </label>
        <select
          id="primaryDiscipline"
          name="primaryDiscipline"
          required
          defaultValue={initial.primaryDiscipline}
          className={inputClass}
        >
          <option value="" disabled>
            Pilih disiplin
          </option>
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={labelClass}>Disiplin Lain</legend>
        <div className="flex flex-col gap-2">
          {DISCIPLINES.map((d) => (
            <label key={d} className="flex items-center gap-2 text-base text-artego-black">
              <input
                type="checkbox"
                name="otherDisciplines"
                value={d}
                defaultChecked={initial.otherDisciplines.includes(d)}
                className="h-5 w-5"
              />
              {d}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>Laman Web / Media Sosial</legend>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <label htmlFor={`websiteUrl${i + 1}`} className="text-sm text-grey-600">
              Pautan {i + 1}
            </label>
            <input
              id={`websiteUrl${i + 1}`}
              name={`websiteUrl${i + 1}`}
              type="url"
              placeholder="https://..."
              defaultValue={initial.websiteUrls[i] ?? ""}
              className={inputClass}
            />
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="cvExhibitionHistory" className={labelClass}>
          CV / Sejarah Pameran
        </label>
        <textarea
          id="cvExhibitionHistory"
          name="cvExhibitionHistory"
          rows={4}
          defaultValue={initial.cvExhibitionHistory}
          aria-describedby="cv-hint"
          className={`${inputClass} min-h-0 py-2`}
        />
        <p id="cv-hint" className="text-sm text-grey-600">
          Satu entri setiap baris.
        </p>
      </div>

      <label className="flex items-center gap-2 text-base text-artego-black">
        <input
          type="checkbox"
          name="showEmailPublicly"
          defaultChecked={initial.showEmailPublicly}
          className="h-5 w-5"
        />
        Papar emel saya secara terbuka pada profil
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="profileVisibility" className={labelClass}>
          Keterlihatan Profil <span aria-hidden>*</span>
        </label>
        <select
          id="profileVisibility"
          name="profileVisibility"
          required
          defaultValue={initial.profileVisibility}
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
