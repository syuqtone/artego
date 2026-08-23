import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/logout/actions";

type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id, profile_visibility")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: me } = await supabase.from("users").select("roles").eq("id", user.id).maybeSingle();
  const isAdminUser = me?.roles?.includes("artego_admin") ?? false;

  let artworkCount = 0;
  if (profile) {
    const { count } = await supabase
      .from("artwork")
      .select("id", { count: "exact", head: true })
      .eq("artist_profile_id", profile.id);
    artworkCount = count ?? 0;
  }

  const { count: catalogueCount } = await supabase
    .from("project")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("type", "catalogue");

  const { count: portfolioCount } = await supabase
    .from("project")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("type", "portfolio");

  const checklist: ChecklistItem[] = [
    { label: "Complete your artist profile", done: Boolean(profile), href: "/dashboard/profile" },
    { label: "Add your first artwork", done: artworkCount > 0, href: "/dashboard/artworks/new" },
    { label: "Publish your public profile", done: profile?.profile_visibility === "public" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="ArteGO" className="mx-auto h-[116px] w-auto" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-artego-black">Dashboard</h1>
          <p className="text-base text-grey-600">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="min-h-11 rounded border border-artego-black px-4 text-[15px] font-semibold text-artego-black"
          >
            Log Out
          </button>
        </form>
      </div>

      <Link
        href="/dashboard/create"
        className="flex min-h-11 items-center justify-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
      >
        + Create
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/catalogues"
          className="flex flex-col gap-1 rounded border border-grey-200 p-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
        >
          <span className="text-[15px] font-semibold text-artego-black">My Catalogues</span>
          <span className="text-sm text-grey-600">{catalogueCount ?? 0} saved</span>
        </Link>
        <Link
          href="/dashboard/portfolios"
          className="flex flex-col gap-1 rounded border border-grey-200 p-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
        >
          <span className="text-[15px] font-semibold text-artego-black">My Portfolios</span>
          <span className="text-sm text-grey-600">{portfolioCount ?? 0} saved</span>
        </Link>
      </div>

      <div className="rounded border border-grey-200 bg-grey-100 p-4">
        <h2 className="text-base font-semibold text-artego-black">Start here</h2>
        <p className="mt-1 text-sm text-grey-600">
          Follow these steps to set up your account.
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  item.done
                    ? "border-success bg-success text-artego-white"
                    : "border-grey-400 text-transparent"
                }`}
              >
                ✓
              </span>
              {item.href ? (
                <Link href={item.href} className="text-[15px] font-semibold text-artego-red-deep underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-[15px] text-artego-black">
                  {item.label}
                  {!item.done && (
                    <span className="ml-2 text-sm text-grey-600">(coming soon)</span>
                  )}
                </span>
              )}
              <span className="sr-only">{item.done ? "Done" : "Not done yet"}</span>
            </li>
          ))}
        </ul>
      </div>

      {isAdminUser && (
        <div className="flex flex-col gap-2">
          <Link href="/admin" className="text-[15px] font-semibold text-artego-red-deep underline">
            Admin
          </Link>
        </div>
      )}
    </div>
  );
}
