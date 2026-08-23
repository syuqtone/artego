import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProjectRow = {
  id: string;
  title: string;
  project_item: { count: number }[] | null;
  publication: { id: string; status: string } | { id: string; status: string }[] | null;
};

export default async function PortfoliosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("project")
    .select("id, title, project_item(count), publication(id, status)")
    .eq("owner_id", user.id)
    .eq("type", "portfolio")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-artego-black">Portfolios</h1>
        </div>
        <Link
          href="/dashboard/portfolios/new"
          className="flex min-h-11 items-center rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white"
        >
          + New
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-base text-grey-600">
          No portfolios yet. Start one with &ldquo;+ New&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(projects as unknown as ProjectRow[]).map((p) => {
            const publication = Array.isArray(p.publication) ? p.publication[0] : p.publication;
            const isPublished = publication?.status === "published";

            return (
              <li key={p.id} className="flex items-center gap-2 rounded border border-grey-200 p-3">
                <Link href={`/dashboard/portfolios/${p.id}`} className="flex flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-artego-black">{p.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isPublished ? "bg-success text-artego-white" : "bg-grey-100 text-grey-600"
                      }`}
                    >
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </span>
                  <span className="text-sm text-grey-600">
                    {p.project_item?.[0]?.count ?? 0} artworks
                  </span>
                </Link>
                {isPublished && publication && (
                  <Link
                    href={`/publication/${publication.id}/pdf`}
                    aria-label={`Download ${p.title} as PDF`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-artego-black text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M12 4v11" strokeLinecap="round" />
                      <path d="M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 19h16" strokeLinecap="round" />
                    </svg>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
