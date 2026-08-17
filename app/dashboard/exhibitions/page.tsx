import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ExhibitionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("project")
    .select("id, title, project_item(count)")
    .eq("owner_id", user.id)
    .eq("type", "exhibition")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-artego-black">Exhibitions</h1>
        </div>
        <Link
          href="/dashboard/exhibitions/new"
          className="flex min-h-11 items-center rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white"
        >
          + New
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-base text-grey-600">No exhibitions yet. Start one with &ldquo;+ New&rdquo;.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/exhibitions/${p.id}`}
                className="flex items-center justify-between rounded border border-grey-200 p-3"
              >
                <span className="text-[15px] font-semibold text-artego-black">{p.title}</span>
                <span className="text-sm text-grey-600">
                  {p.project_item?.[0]?.count ?? 0} artworks
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
