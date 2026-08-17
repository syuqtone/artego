import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import CataloguePdfDocument, { type PdfArtwork } from "@/lib/pdf/CataloguePdfDocument";

type SnapshotData = {
  projectTitle: string;
  artistName: string;
  templateId: string;
  artworks: PdfArtwork[];
};

// Reads the exact same publication_snapshot as the online viewer at
// /catalogue/[id] — never live tables — so the PDF always matches the
// online version exactly (BUILD-ORDER.md 3.4).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: publication } = await supabase
    .from("publication")
    .select("id, status, current_snapshot_id")
    .eq("id", id)
    .maybeSingle();

  if (!publication || publication.status !== "published" || !publication.current_snapshot_id) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
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

  const buffer = await renderToBuffer(
    <CataloguePdfDocument
      title={data.projectTitle}
      artistName={data.artistName}
      templateId={data.templateId}
      artworks={data.artworks}
    />,
  );

  const filename = `${data.projectTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
