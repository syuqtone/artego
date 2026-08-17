"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addArtworksAction(collectionId: string, formData: FormData) {
  const artworkIds = formData.getAll("artworkId").map(String);
  if (artworkIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("collection_item")
    .select("sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = artworkIds.map((artworkId) => ({
    collection_id: collectionId,
    artwork_id: artworkId,
    sort_order: nextOrder++,
  }));

  await supabase.from("collection_item").insert(rows);
  revalidatePath(`/dashboard/collections/${collectionId}`);
}

export async function removeArtworkAction(collectionId: string, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("collection_item").delete().eq("id", itemId);
  revalidatePath(`/dashboard/collections/${collectionId}`);
}

export async function moveItemAction(
  collectionId: string,
  itemId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: items } = await supabase
    .from("collection_item")
    .select("id, sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });
  if (!items) return;

  const index = items.findIndex((i) => i.id === itemId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  const current = items[index];
  const swap = items[swapIndex];

  await supabase.from("collection_item").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("collection_item").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath(`/dashboard/collections/${collectionId}`);
}
