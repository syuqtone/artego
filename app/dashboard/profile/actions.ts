"use server";

import { createClient } from "@/lib/supabase/server";
import { COUNTRIES, DISCIPLINES, PROFILE_VISIBILITY_OPTIONS } from "@/lib/profile-options";
import { cloudinarySquareUrl, uploadToCloudinary } from "@/lib/cloudinary";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/quota";

const ACCEPTED_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ProfileState = {
  error?: string;
  success?: boolean;
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveProfileAction(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const shortBio = String(formData.get("shortBio") ?? "").trim();
  const fullBiography = String(formData.get("fullBiography") ?? "").trim();
  const artistStatement = String(formData.get("artistStatement") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const cityState = String(formData.get("cityState") ?? "").trim();
  const primaryDiscipline = String(formData.get("primaryDiscipline") ?? "").trim();
  const otherDisciplines = formData.getAll("otherDisciplines").map(String);
  const cvExhibitionHistory = String(formData.get("cvExhibitionHistory") ?? "").trim();
  const profileVisibility = String(formData.get("profileVisibility") ?? "").trim();
  const showEmailPublicly = formData.get("showEmailPublicly") === "on";
  const websiteUrls = ["websiteUrl1", "websiteUrl2", "websiteUrl3"]
    .map((name) => String(formData.get(name) ?? "").trim())
    .filter((value) => value.length > 0);

  const photo = formData.get("profilePhoto");
  const hasPhoto = photo instanceof File && photo.size > 0;
  if (hasPhoto) {
    const extension = ACCEPTED_PHOTO_TYPES[(photo as File).type];
    if (!extension) {
      return { error: "Profile photo must be a JPG, PNG or WebP file." };
    }
    if ((photo as File).size > MAX_IMAGE_UPLOAD_BYTES) {
      return { error: "Profile photo must be 10 MB or smaller." };
    }
  }

  if (displayName.length < 2 || displayName.length > 80) {
    return { error: "Artist name must be between 2 and 80 characters." };
  }
  if (!shortBio) {
    return { error: "Please enter a short bio." };
  }
  if (fullBiography.length > 3000) {
    return { error: "Full biography can't be longer than 3000 characters." };
  }
  if (!country || !(COUNTRIES as readonly string[]).includes(country)) {
    return { error: "Please choose a valid country." };
  }
  if (!primaryDiscipline || !(DISCIPLINES as readonly string[]).includes(primaryDiscipline)) {
    return { error: "Please choose a valid primary discipline." };
  }
  if (otherDisciplines.some((d) => !(DISCIPLINES as readonly string[]).includes(d))) {
    return { error: "One of the other disciplines is invalid." };
  }
  if (!PROFILE_VISIBILITY_OPTIONS.some((v) => v.value === profileVisibility)) {
    return { error: "Please choose a valid profile visibility." };
  }
  if (websiteUrls.some((url) => !isValidUrl(url))) {
    return { error: "One or more website links are invalid. Use the format https://..." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  // Uploaded before the upsert, not after: if this fails we want to tell
  // the artist and leave their existing photo (if any) alone, rather than
  // save the rest of the form with a silently missing photo.
  let profilePhotoUrl: string | undefined;
  if (hasPhoto) {
    const file = photo as File;
    const extension = ACCEPTED_PHOTO_TYPES[file.type];
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const publicId = await uploadToCloudinary(
        bytes,
        `artego/profile-photos/${user.id}`,
        `photo.${extension}`,
        file.type,
      );
      profilePhotoUrl = cloudinarySquareUrl(publicId, 600);
    } catch {
      return { error: "Couldn't upload your profile photo. Please try again." };
    }
  }

  const { error } = await supabase.from("artist_profile").upsert(
    {
      user_id: user.id,
      display_name: displayName,
      short_bio: shortBio,
      full_biography: fullBiography || null,
      artist_statement: artistStatement || null,
      country,
      city_state: cityState || null,
      primary_discipline: primaryDiscipline,
      other_disciplines: otherDisciplines,
      website_urls: websiteUrls,
      cv_exhibition_history: cvExhibitionHistory ? [{ text: cvExhibitionHistory }] : [],
      profile_visibility: profileVisibility,
      show_email_publicly: showEmailPublicly,
      ...(profilePhotoUrl && { profile_photo_url: profilePhotoUrl }),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: "Couldn't save your profile. Please try again." };
  }

  return { success: true };
}
