import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import {
  reactivateUserAction,
  resetVerificationAction,
  suspendUserAction,
  unpublishGallerySceneAction,
  unpublishPublicationAction,
  unpublishRoomVisualAction,
  verifyArtistAction,
} from "@/app/admin/actions";

const VERIFICATION_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  verified: "Verified",
  suspended: "Suspended",
};

const PUBLICATION_TYPE_LABEL: Record<string, string> = {
  catalogue: "Catalogue",
  portfolio: "Portfolio",
  exhibition: "Exhibition",
};

const buttonClass =
  "min-h-11 rounded border border-artego-black px-4 text-[15px] font-semibold text-artego-black";
const primaryButtonClass = "min-h-11 rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white";
const dangerButtonClass = "min-h-11 rounded bg-danger px-4 text-[15px] font-semibold text-artego-white";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { data: targetUser } = await supabase
    .from("users")
    .select("id, email, roles, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!targetUser) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id, display_name, verification_status, country, primary_discipline")
    .eq("user_id", id)
    .maybeSingle();

  const { data: projects } = await supabase
    .from("project")
    .select("id, title, type")
    .eq("owner_id", id);
  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));
  const projectIds = (projects ?? []).map((p) => p.id);

  const { data: publications } =
    projectIds.length > 0
      ? await supabase
          .from("publication")
          .select("id, type, status, visibility, project_id")
          .in("project_id", projectIds)
      : { data: [] as never[] };

  const { data: scenes } =
    projectIds.length > 0
      ? await supabase
          .from("gallery_scene")
          .select("id, title, status, visibility, project_id")
          .in("project_id", projectIds)
      : { data: [] as never[] };

  const { data: roomVisuals } = await supabase
    .from("room_visual")
    .select("id, visibility, artwork_id, artwork(title)")
    .eq("user_id", id);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-4 py-9">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-artego-red-deep underline">
          ← Admin: Users
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">{targetUser.email}</h1>
      </div>

      <section className="flex flex-col gap-2 rounded border border-grey-200 p-4">
        <h2 className="text-base font-semibold text-artego-black">Account</h2>
        <p className="text-sm text-grey-600">
          Status:{" "}
          <span className="font-semibold text-artego-black">
            {targetUser.status === "suspended" ? "Suspended" : "Active"}
          </span>
        </p>
        <p className="text-sm text-grey-600">Roles: {targetUser.roles.join(", ")}</p>
        <div className="mt-1 flex gap-2">
          {targetUser.status === "suspended" ? (
            <form action={reactivateUserAction.bind(null, id)}>
              <button type="submit" className={primaryButtonClass}>
                Reactivate
              </button>
            </form>
          ) : (
            <form action={suspendUserAction.bind(null, id)}>
              <button type="submit" className={dangerButtonClass}>
                Suspend User
              </button>
            </form>
          )}
        </div>
      </section>

      {profile && (
        <section className="flex flex-col gap-2 rounded border border-grey-200 p-4">
          <h2 className="text-base font-semibold text-artego-black">Artist Profile</h2>
          <p className="text-sm text-grey-600">
            {profile.display_name} — {[profile.primary_discipline, profile.country].filter(Boolean).join(" · ")}
          </p>
          <p className="text-sm text-grey-600">
            Verification:{" "}
            <span className="font-semibold text-artego-black">
              {VERIFICATION_LABEL[profile.verification_status] ?? profile.verification_status}
            </span>
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.verification_status !== "verified" && (
              <form action={verifyArtistAction.bind(null, profile.id, id)}>
                <button type="submit" className={primaryButtonClass}>
                  Verify Artist
                </button>
              </form>
            )}
            {profile.verification_status !== "pending" && (
              <form action={resetVerificationAction.bind(null, profile.id, id)}>
                <button type="submit" className={buttonClass}>
                  Reset to Pending
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {((publications && publications.length > 0) ||
        (scenes && scenes.length > 0) ||
        (roomVisuals && roomVisuals.length > 0)) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-artego-black">Published Content</h2>

          {(publications ?? []).map((pub) => {
            const project = projectMap.get(pub.project_id);
            return (
              <div key={pub.id} className="flex items-center justify-between gap-3 rounded border border-grey-200 p-3">
                <div>
                  <p className="text-[15px] font-semibold text-artego-black">
                    {project?.title ?? "Untitled"}
                  </p>
                  <p className="text-sm text-grey-600">
                    {PUBLICATION_TYPE_LABEL[pub.type] ?? pub.type} · {pub.status}
                  </p>
                </div>
                {pub.status === "published" && (
                  <form action={unpublishPublicationAction.bind(null, pub.id, id)}>
                    <button type="submit" className={dangerButtonClass}>
                      Unpublish
                    </button>
                  </form>
                )}
              </div>
            );
          })}

          {(scenes ?? []).map((scene) => (
            <div key={scene.id} className="flex items-center justify-between gap-3 rounded border border-grey-200 p-3">
              <div>
                <p className="text-[15px] font-semibold text-artego-black">{scene.title}</p>
                <p className="text-sm text-grey-600">Virtual Gallery · {scene.status}</p>
              </div>
              {scene.status === "published" && (
                <form action={unpublishGallerySceneAction.bind(null, scene.id, id)}>
                  <button type="submit" className={dangerButtonClass}>
                    Unpublish
                  </button>
                </form>
              )}
            </div>
          ))}

          {(roomVisuals ?? []).map((rv) => {
            const artwork = (rv.artwork as unknown as { title: string } | null) ?? null;
            return (
              <div key={rv.id} className="flex items-center justify-between gap-3 rounded border border-grey-200 p-3">
                <div>
                  <p className="text-[15px] font-semibold text-artego-black">
                    {artwork?.title ?? "Untitled"} on a wall
                  </p>
                  <p className="text-sm text-grey-600">Room Visualisation · {rv.visibility}</p>
                </div>
                {["public", "unlisted"].includes(rv.visibility) && (
                  <form action={unpublishRoomVisualAction.bind(null, rv.id, id)}>
                    <button type="submit" className={dangerButtonClass}>
                      Unpublish
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
