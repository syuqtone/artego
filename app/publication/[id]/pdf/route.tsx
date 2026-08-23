import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPdfGenerationQuota } from "@/lib/quota";
import PublicationPdfDocument, {
  type PdfArtwork,
  type PdfExhibitionInfo,
} from "@/lib/pdf/PublicationPdfDocument";
import PortfolioPdfDocument, { type PortfolioArtistBio } from "@/lib/pdf/PortfolioPdfDocument";

type SnapshotData = {
  projectTitle: string;
  artistName: string;
  artistPhotoUrl?: string | null;
  templateId: string;
  introduction?: string | null;
  artworks: PdfArtwork[];
  // Only present on portfolios (lib/publication-actions.ts) — catalogues
  // don't fetch or store this at publish time.
  artistBio?: PortfolioArtistBio;
  // Only meaningful on a group exhibition catalogue.
  isGroup?: boolean;
  participatingArtists?: string[];
  exhibitionInfo?: PdfExhibitionInfo | null;
};

// Reads the exact same publication_snapshot as the online viewer at
// /publication/[id] — never live tables — so the PDF always matches the
// online version exactly (BUILD-ORDER.md 3.4, shared by 3.5 portfolios).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: publication } = await supabase
    .from("publication")
    .select("id, status, current_snapshot_id, project_id, type")
    .eq("id", id)
    .maybeSingle();

  if (!publication || publication.status !== "published" || !publication.current_snapshot_id) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const admin = createAdminClient();

  // Admin client, not the session-bound one: this route is intentionally
  // public (anyone with a published catalogue's link can download the
  // PDF), and an anonymous caller can't SELECT a project row they don't
  // own under RLS — a session-bound lookup here would silently return
  // null and skip the quota check and logging below entirely.
  const { data: project } = await admin
    .from("project")
    .select("owner_id")
    .eq("id", publication.project_id)
    .maybeSingle();

  if (project) {
    const quota = await checkPdfGenerationQuota(admin, project.owner_id);
    if (!quota.ok) {
      return NextResponse.json({ error: quota.message }, { status: 429 });
    }
  }

  const { data: snapshot } = await supabase
    .from("publication_snapshot")
    .select("data")
    .eq("id", publication.current_snapshot_id)
    .maybeSingle();

  if (!snapshot) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const data = snapshot.data as unknown as SnapshotData;

  // Portfolio and catalogue deliberately diverge here (product owner's
  // request): a portfolio PDF leads with the artist's biodata and uses
  // artwork photos only on the cover, never as their own pages — see
  // lib/pdf/PortfolioPdfDocument.tsx.
  const buffer = await renderToBuffer(
    publication.type === "portfolio" ? (
      <PortfolioPdfDocument
        title={data.projectTitle}
        artistName={data.artistName}
        artistPhotoUrl={data.artistPhotoUrl}
        templateId={data.templateId}
        artworks={data.artworks}
        bio={
          data.artistBio ?? {
            shortBio: null,
            fullBiography: null,
            artistStatement: null,
            country: null,
            cityState: null,
            primaryDiscipline: null,
            otherDisciplines: [],
            websiteUrls: [],
            cvEntries: [],
          }
        }
      />
    ) : (
      <PublicationPdfDocument
        title={data.projectTitle}
        artistName={data.artistName}
        artistPhotoUrl={data.artistPhotoUrl}
        templateId={data.templateId}
        introduction={data.introduction}
        artworks={data.artworks}
        isGroup={data.isGroup}
        participatingArtists={data.participatingArtists}
        exhibitionInfo={data.exhibitionInfo}
      />
    ),
  );

  const filename = `${data.projectTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

  if (project) {
    const { error: logError } = await admin
      .from("pdf_generation")
      .insert({ user_id: project.owner_id, publication_id: publication.id });
    if (logError) {
      console.error("pdf_generation insert failed:", logError);
    }
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
