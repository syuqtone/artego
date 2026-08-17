"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ResetPasswordState = {
  error?: string;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 6) {
    return { error: "Kata laluan mesti sekurang-kurangnya 6 aksara." };
  }
  if (password !== confirmPassword) {
    return { error: "Kata laluan tidak sepadan." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Pautan reset tidak sah atau dah luput. Sila mohon pautan baru." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  // Force a fresh login with the new password, per the acceptance test —
  // don't leave the one-time recovery session active.
  await supabase.auth.signOut();
  redirect("/login?reset=success");
}
