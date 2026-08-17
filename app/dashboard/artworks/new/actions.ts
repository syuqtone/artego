"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ARTWORK_AVAILABILITY_OPTIONS,
  ARTWORK_CATEGORIES,
  ARTWORK_VISIBILITY_OPTIONS,
  DIMENSION_UNITS,
  PRICE_VISIBILITY_OPTIONS,
} from "@/lib/profile-options";
import { DERIVATIVE_SIZES, cloudinaryDerivativeUrl, uploadToCloudinary } from "@/lib/cloudinary";

export type NewArtworkState = {
  error?: string;
};

const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // image-rules.md: 10 MB max

function parseNumeric(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createArtworkAction(
  _prevState: NewArtworkState,
  formData: FormData,
): Promise<NewArtworkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return { error: "Please complete your artist profile before adding artwork." };
  }

  // --- image ---
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { error: "Please choose an image for this artwork." };
  }
  const extension = ACCEPTED_IMAGE_TYPES[image.type];
  if (!extension) {
    return { error: "Image must be JPG, PNG or WebP." };
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be 10 MB or smaller." };
  }

  // --- text fields ---
  let title = String(formData.get("title") ?? "").trim();
  if (!title) title = "Untitled";
  const titleIdentifier = String(formData.get("titleIdentifier") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();
  const medium = String(formData.get("medium") ?? "").trim();
  const mediumOther = String(formData.get("mediumOther") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const heightCm = parseNumeric(String(formData.get("height") ?? ""));
  const widthCm = parseNumeric(String(formData.get("width") ?? ""));
  const depthCm = parseNumeric(String(formData.get("depth") ?? ""));
  const dimensionUnit = String(formData.get("dimensionUnit") ?? "cm").trim();
  const price = parseNumeric(String(formData.get("price") ?? ""));
  const priceCurrency = String(formData.get("priceCurrency") ?? "").trim();
  const priceVisibility = String(formData.get("priceVisibility") ?? "hidden").trim();
  const availability = String(formData.get("availability") ?? "available").trim();
  const editionNumber = String(formData.get("editionNumber") ?? "").trim();
  const editionTotal = String(formData.get("editionTotal") ?? "").trim();
  const copyrightOwner = String(formData.get("copyrightOwner") ?? "").trim() || profile.display_name;
  const visibility = String(formData.get("visibility") ?? "private").trim();
  const altText = String(formData.get("altText") ?? "").trim();

  if (!year || !(/^\d{4}$/.test(year) || year.toLowerCase() === "undated")) {
    return { error: "Year must be a four-digit year, or \"Undated\"." };
  }
  if (!medium) {
    return { error: "Please choose a medium." };
  }
  if (medium === "Other" && !mediumOther) {
    return { error: "Please describe the medium." };
  }
  if (!ARTWORK_CATEGORIES.some((c) => c.value === category)) {
    return { error: "Please choose a valid category." };
  }
  if (!DIMENSION_UNITS.includes(dimensionUnit as (typeof DIMENSION_UNITS)[number])) {
    return { error: "Invalid dimension unit." };
  }
  if (!PRICE_VISIBILITY_OPTIONS.some((v) => v.value === priceVisibility)) {
    return { error: "Please choose a valid price visibility." };
  }
  if (!ARTWORK_AVAILABILITY_OPTIONS.some((v) => v.value === availability)) {
    return { error: "Please choose a valid availability." };
  }
  if (!ARTWORK_VISIBILITY_OPTIONS.some((v) => v.value === visibility)) {
    return { error: "Please choose a valid visibility." };
  }

  // Upload first — if this fails we haven't written anything to the
  // database yet. The path is keyed by a fresh id, not the eventual
  // artwork row, so ownership (auth.uid()) is checkable from the path
  // alone by the storage RLS policy.
  const storageId = crypto.randomUUID();
  const storagePath = `${user.id}/${storageId}/master.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("artwork-masters")
    .upload(storagePath, image, { contentType: image.type, upsert: false });
  if (uploadError) {
    return { error: "Couldn't upload the image. Please try again." };
  }

  const { data: artwork, error: artworkError } = await supabase
    .from("artwork")
    .insert({
      artist_profile_id: profile.id,
      title,
      title_identifier: titleIdentifier || null,
      year_created: year,
      medium: medium === "Other" ? mediumOther : medium,
      medium_other: medium === "Other" ? mediumOther : null,
      height_cm: heightCm,
      width_cm: widthCm,
      depth_cm: depthCm,
      dimension_unit: dimensionUnit,
      category,
      description: description || null,
      price,
      price_currency: price !== null ? priceCurrency || null : null,
      price_visibility: priceVisibility,
      availability,
      edition_number: editionNumber || null,
      edition_total: editionTotal || null,
      copyright_owner: copyrightOwner,
      visibility,
      alt_text: altText || null,
    })
    .select("id")
    .single();

  if (artworkError || !artwork) {
    await supabase.storage.from("artwork-masters").remove([storagePath]);
    return { error: "Couldn't save the artwork. Please try again." };
  }

  const { error: imageRowError } = await supabase.from("artwork_image").insert({
    artwork_id: artwork.id,
    role: "master",
    storage_provider: "supabase",
    storage_path: storagePath,
    format: extension,
    is_primary: true,
  });

  if (imageRowError) {
    return { error: "Artwork was saved, but the image record failed. Please contact support." };
  }

  // Public derivatives — image-rules.md: MASTER (private) -> DERIVATIVES
  // (Cloudinary) -> WEBP DELIVERY. Failure here is non-fatal: the artwork
  // and its private master are already saved safely, so we don't make the
  // artist lose their work over a flaky third-party call. The artwork
  // just won't have public-facing images until this is retried.
  try {
    const bytes = Buffer.from(await image.arrayBuffer());
    const publicId = await uploadToCloudinary(
      bytes,
      `artego/artworks/${artwork.id}`,
      `master.${extension}`,
      image.type,
    );
    await supabase.from("artwork_image").insert(
      DERIVATIVE_SIZES.map(({ role, width }) => ({
        artwork_id: artwork.id,
        role,
        storage_provider: "cloudinary",
        storage_path: publicId,
        public_url: cloudinaryDerivativeUrl(publicId, width),
        format: "webp",
        is_primary: false,
      })),
    );
  } catch {
    // Swallowed on purpose — see comment above.
  }

  redirect("/dashboard");
}
