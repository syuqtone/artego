import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  nfs: "Not for Sale",
  collection: "In a Collection",
};

export type PdfArtwork = {
  title: string;
  yearCreated: string | null;
  medium: string;
  dimensions: string;
  dimensionUnit: string;
  description: string | null;
  availability: string;
  priceLine: string | null;
  imageUrl: string | null;
  // Only meaningful on a group exhibition catalogue — see isGroup below.
  artistName?: string;
};

export type PdfExhibitionInfo = {
  venue: string | null;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
};

// Same source data as the online viewer (PublicationTemplate) and the
// same rule: rendered from the snapshot only, so the PDF and the online
// version are guaranteed to match — publishing-snapshot.md. Shared by
// catalogues and portfolios (BUILD-ORDER.md 3.5: "same engine").
const styles = StyleSheet.create({
  page: { padding: 36, paddingBottom: 56, fontSize: 11, fontFamily: "Helvetica" },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CCCCCC",
    paddingBottom: 6,
    marginBottom: 18,
    fontSize: 9,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#CCCCCC",
    paddingTop: 6,
    fontSize: 9,
    color: "#6B6B6B",
  },
  // Cover: an editorial photo-grid, not a floating title on a
  // decorative backdrop — artwork images sit IN the grid as cells
  // (grayscale, 30% opacity, per the product owner's reference), and the
  // title/artist name are their own grid cells with a plain white
  // ground, not text layered over imagery. Row heights are fixed points
  // (not fractions) because react-pdf's Yoga layout has no CSS Grid —
  // only flexbox — so an irregular-looking grid has to be hand-built as
  // a stack of flex rows with different cell widths per row.
  coverGrid: { flex: 1, flexDirection: "column", gap: 2 },
  coverRow: { flexDirection: "row", gap: 2 },
  coverPhotoCell: { height: "100%", objectFit: "cover", opacity: 0.3 },
  coverEmptyCell: { height: "100%", backgroundColor: "#F2F2F2" },
  coverTextCell: { height: "100%", justifyContent: "center", padding: 14 },
  coverArtistPhotoCell: { height: "100%", objectFit: "cover" },
  coverTitleMinimal: { fontSize: 22, textAlign: "left" },
  coverArtistMinimal: { fontSize: 12, textAlign: "left", color: "#6B6B6B" },
  coverTitleEditorial: {
    fontSize: 26,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
  },
  coverArtistEditorial: { fontSize: 12, color: "#6B6B6B" },
  introTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  introduction: { fontSize: 11, lineHeight: 1.6 },
  exhibitionMeta: { fontSize: 10, color: "#6B6B6B", marginBottom: 16 },
  artistsTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  artistRow: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
    paddingBottom: 8,
    marginBottom: 8,
  },
  artistRowName: { fontSize: 12, color: "#111111" },
  tocTitle: { fontSize: 18, fontWeight: 700, marginBottom: 24 },
  tocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tocEntryTitle: { fontSize: 12, color: "#111111" },
  tocEntryArtist: { fontSize: 10, color: "#6B6B6B", marginTop: 2 },
  tocEntryPage: { fontSize: 12, color: "#6B6B6B" },
  workByLine: { fontSize: 11, color: "#6B6B6B", marginBottom: 6 },
  image: { width: "100%", marginBottom: 10, objectFit: "contain" },
  workTitle: { fontSize: 14, fontWeight: 700, marginBottom: 3 },
  meta: { fontSize: 10, color: "#6B6B6B", marginBottom: 6 },
  description: { fontSize: 11, marginBottom: 6 },
  status: { fontSize: 10, fontWeight: 700 },
  divider: { borderTopWidth: 2, borderTopColor: "#111111", marginBottom: 12 },
});

export default function PublicationPdfDocument({
  title,
  artistName,
  artistPhotoUrl,
  templateId,
  introduction,
  artworks,
  isGroup = false,
  participatingArtists = [],
  exhibitionInfo = null,
}: {
  title: string;
  artistName: string;
  artistPhotoUrl?: string | null;
  templateId: string;
  introduction?: string | null;
  artworks: PdfArtwork[];
  // A group exhibition catalogue (product owner's request): artwork
  // drawn from multiple registered artists instead of just the
  // organizer's own. Adds a Participating Artists page and attributes
  // each artwork to its own artist instead of the organizer throughout.
  isGroup?: boolean;
  participatingArtists?: string[];
  exhibitionInfo?: PdfExhibitionInfo | null;
}) {
  const editorial = templateId === "editorial";

  const hasIntroPage = Boolean(introduction);
  const hasArtistsPage = isGroup && participatingArtists.length > 0;

  // Page 1 is always the cover. The Introduction and Participating
  // Artists pages are each skipped entirely (not left blank) when there
  // is nothing to put on them, so Contents — and the first artwork page
  // right after it — shift up to fill the gap. Same "one physical page
  // per section" assumption the footer's own page count makes
  // implicitly (see the Contents section below).
  const contentsPage = 1 + (hasIntroPage ? 1 : 0) + (hasArtistsPage ? 1 : 0) + 1;
  const firstArtworkPage = contentsPage + 1;

  const exhibitionMetaLine = exhibitionInfo
    ? [
        exhibitionInfo.venue,
        exhibitionInfo.city,
        [exhibitionInfo.startDate, exhibitionInfo.endDate].filter(Boolean).join(" – "),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  // Cover images cycle through whatever artwork photos exist, same
  // rationale as the old mosaic: a real preview of what's inside rather
  // than a stock backdrop. Cloudinary's e_grayscale transform matches
  // the reference — a monochrome collage reads as considerably more
  // "graphic design" than the same tiles in full colour.
  const coverTiles = artworks.filter((a) => a.imageUrl);
  function coverTileUrl(slot: number): string | null {
    if (coverTiles.length === 0) return null;
    const url = coverTiles[slot % coverTiles.length].imageUrl!;
    return url.replace("/upload/", "/upload/e_grayscale,");
  }
  function CoverCell({ slot, width }: { slot: number; width: string }) {
    const url = coverTileUrl(slot);
    return url ? (
      <Image src={url} style={[styles.coverPhotoCell, { width }]} />
    ) : (
      <View style={[styles.coverEmptyCell, { width }]} />
    );
  }

  return (
    <Document title={title} author={artistName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.coverGrid}>
          <View style={[styles.coverRow, { height: 130 }]}>
            <CoverCell slot={0} width="38%" />
            <CoverCell slot={1} width="32%" />
            <CoverCell slot={2} width="30%" />
          </View>
          <View style={[styles.coverRow, { height: 170 }]}>
            <View style={[styles.coverTextCell, { width: "62%" }]}>
              <Text style={editorial ? styles.coverTitleEditorial : styles.coverTitleMinimal}>
                {title}
              </Text>
            </View>
            <CoverCell slot={3} width="38%" />
          </View>
          <View style={[styles.coverRow, { height: 130 }]}>
            <CoverCell slot={4} width="25%" />
            <CoverCell slot={5} width="25%" />
            <CoverCell slot={6} width="25%" />
            <CoverCell slot={7} width="25%" />
          </View>
          <View style={[styles.coverRow, { height: 170 }]}>
            {!isGroup && artistPhotoUrl ? (
              <Image src={artistPhotoUrl} style={[styles.coverArtistPhotoCell, { width: "30%" }]} />
            ) : (
              <CoverCell slot={8} width="30%" />
            )}
            <View style={[styles.coverTextCell, { width: "70%" }]}>
              <Text style={editorial ? styles.coverArtistEditorial : styles.coverArtistMinimal}>
                {isGroup ? `A Group Exhibition Catalogue · Curated by ${artistName}` : artistName}
              </Text>
            </View>
          </View>
          <View style={[styles.coverRow, { height: 130 }]}>
            <CoverCell slot={9} width="30%" />
            <CoverCell slot={10} width="35%" />
            <CoverCell slot={11} width="35%" />
          </View>
        </View>
      </Page>
      {hasIntroPage && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageHeader}>
            <Text>{title}</Text>
            <Text>{artistName}</Text>
          </View>
          <Text style={styles.introTitle}>Introduction</Text>
          {exhibitionMetaLine && <Text style={styles.exhibitionMeta}>{exhibitionMetaLine}</Text>}
          <Text style={styles.introduction}>{introduction}</Text>
          <View style={styles.pageFooter}>
            <Text>{artistName}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      )}
      {hasArtistsPage && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageHeader}>
            <Text>{title}</Text>
            <Text>{artistName}</Text>
          </View>
          <Text style={styles.artistsTitle}>Participating Artists</Text>
          {!hasIntroPage && exhibitionMetaLine && (
            <Text style={styles.exhibitionMeta}>{exhibitionMetaLine}</Text>
          )}
          {participatingArtists.map((name, i) => (
            <View key={i} style={styles.artistRow}>
              <Text style={styles.artistRowName}>{name}</Text>
            </View>
          ))}
          <View style={styles.pageFooter}>
            <Text>{artistName}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      )}
      {artworks.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageHeader}>
            <Text>{title}</Text>
            <Text>{artistName}</Text>
          </View>
          <Text style={styles.tocTitle}>Contents</Text>
          {artworks.map((a, i) => (
            // Cover is page 1, an Introduction page (only when there's
            // introduction text) is page 2, so this Contents page is
            // page 2 or 3 and the first artwork page follows right
            // after it — computed, not read back from the renderer,
            // since react-pdf lays out each Page independently and has
            // no "which page will X end up on" lookahead. Holds as long
            // as every page before it, and every artwork, fits on
            // exactly one physical page — true for the text lengths
            // this app allows; an unusually long one could push itself
            // onto a second physical page and throw the numbers below
            // it off by one, the same assumption the footer's own page
            // count makes implicitly.
            <View key={i} style={styles.tocRow}>
              <View>
                <Text style={styles.tocEntryTitle}>{a.title}</Text>
                {isGroup && a.artistName && (
                  <Text style={styles.tocEntryArtist}>{a.artistName}</Text>
                )}
              </View>
              <Text style={styles.tocEntryPage}>{i + firstArtworkPage}</Text>
            </View>
          ))}
          <View style={styles.pageFooter}>
            <Text>{artistName}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      )}
      {artworks.map((a, i) => (
        <Page key={i} size="A4" style={styles.page}>
          <View style={styles.pageHeader} fixed>
            <Text>{title}</Text>
            <Text>{isGroup && a.artistName ? a.artistName : artistName}</Text>
          </View>
          {editorial && <View style={styles.divider} />}
          {a.imageUrl && <Image src={a.imageUrl} style={styles.image} />}
          <Text style={styles.workTitle}>{a.title}</Text>
          {isGroup && a.artistName && <Text style={styles.workByLine}>{a.artistName}</Text>}
          <Text style={styles.meta}>
            {a.yearCreated ?? "Undated"} · {a.medium}
            {a.dimensions ? ` · ${a.dimensions} ${a.dimensionUnit}` : ""}
          </Text>
          {a.description && <Text style={styles.description}>{a.description}</Text>}
          <Text style={styles.status}>
            {AVAILABILITY_LABEL[a.availability] ?? a.availability}
            {a.priceLine ? ` · ${a.priceLine}` : ""}
          </Text>
          <View style={styles.pageFooter} fixed>
            <Text>{artistName}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  );
}
