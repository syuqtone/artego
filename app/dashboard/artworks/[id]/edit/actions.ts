"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ARTWORK_AVAILABILITY_OPTIONS,
  ARTWORK_CATEGORIES,
  DIMENSION_UNITS,
  PRICE_VISIBILITY_OPTIONS,
} from "@/lib/profile-options";

export type EditArtworkState = {
  error?: string;
};

const EDIT_VISIBILITY_VALUES = ["public", "unlisted", "private", "archived"] as const;

function parseNumeric(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function updateArtworkAction(
  artworkId: string,
  _prevState: EditArtworkState,
  formData: FormData,
): Promise<EditArtworkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has expired. Please log in again." };
  }

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
  const copyrightOwner = String(formData.get("copyrightOwner") ?? "").trim();
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
  if (!EDIT_VISIBILITY_VALUES.includes(visibility as (typeof EDIT_VISIBILITY_VALUES)[number])) {
    return { error: "Please choose a valid visibility." };
  }

  const { error } = await supabase
    .from("artwork")
    .update({
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
      copyright_owner: copyrightOwner || null,
      visibility,
      alt_text: altText || null,
    })
    .eq("id", artworkId);

  if (error) {
    return { error: "Couldn't save your changes. Please try again." };
  }

  redirect("/dashboard/artworks");
}
