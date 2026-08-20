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
  coverMosaic: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  coverMosaicTile: { width: "25%", height: 105.25, objectFit: "cover", opacity: 0.5 },
  coverContent: { flex: 1, justifyContent: "center" },
  coverTitleMinimal: { fontSize: 22, textAlign: "center", marginBottom: 6 },
  coverArtistMinimal: { fontSize: 12, textAlign: "center", color: "#6B6B6B" },
  coverPhotoMinimal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: "center",
    marginBottom: 8,
    objectFit: "cover",
  },
  coverPhotoEditorial: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
    objectFit: "cover",
  },
  coverTitleEditorial: {
    fontSize: 28,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
    marginBottom: 6,
  },
  coverArtistEditorial: { fontSize: 12, color: "#6B6B6B" },
  introduction: { fontSize: 11, marginTop: 20, lineHeight: 1.5 },
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
}: {
  title: string;
  artistName: string;
  artistPhotoUrl?: string | null;
  templateId: string;
  introduction?: string | null;
  artworks: PdfArtwork[];
}) {
  const editorial = templateId === "editorial";
  // Cover mosaic: a faint preview of what's inside, made from the same
  // artwork images used on the content pages — 6 tiles, cycling through
  // the available artworks if there are fewer than 6.
  const coverTiles = artworks.filter((a) => a.imageUrl);
  const mosaicTiles = coverTiles.length
    ? Array.from({ length: 32 }, (_, i) => coverTiles[i % coverTiles.length])
    : [];

  return (
    <Document title={title} author={artistName}>
      <Page size="A4" style={styles.page}>
        {mosaicTiles.length > 0 && (
          <View style={styles.coverMosaic}>
            {mosaicTiles.map((a, i) => (
              <Image key={i} src={a.imageUrl!} style={styles.coverMosaicTile} />
            ))}
          </View>
        )}
        <View style={styles.coverContent}>
          <Text style={editorial ? styles.coverTitleEditorial : styles.coverTitleMinimal}>
            {title}
          </Text>
          {artistPhotoUrl && (
            <Image
              src={artistPhotoUrl}
              style={editorial ? styles.coverPhotoEditorial : styles.coverPhotoMinimal}
            />
          )}
          <Text style={editorial ? styles.coverArtistEditorial : styles.coverArtistMinimal}>
            {artistName}
          </Text>
          {introduction && <Text style={styles.introduction}>{introduction}</Text>}
        </View>
      </Page>
      {artworks.map((a, i) => (
        <Page key={i} size="A4" style={styles.page}>
          <View style={styles.pageHeader} fixed>
            <Text>{title}</Text>
            <Text>{artistName}</Text>
          </View>
          {editorial && <View style={styles.divider} />}
          {a.imageUrl && <Image src={a.imageUrl} style={styles.image} />}
          <Text style={styles.workTitle}>{a.title}</Text>
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
