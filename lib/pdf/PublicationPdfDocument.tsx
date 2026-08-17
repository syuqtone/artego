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
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica" },
  coverTitleMinimal: { fontSize: 22, textAlign: "center", marginBottom: 6 },
  coverArtistMinimal: { fontSize: 12, textAlign: "center", color: "#6B6B6B" },
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
  templateId,
  introduction,
  artworks,
}: {
  title: string;
  artistName: string;
  templateId: string;
  introduction?: string | null;
  artworks: PdfArtwork[];
}) {
  const editorial = templateId === "editorial";

  return (
    <Document title={title} author={artistName}>
      <Page size="A4" style={styles.page}>
        <Text style={editorial ? styles.coverTitleEditorial : styles.coverTitleMinimal}>
          {title}
        </Text>
        <Text style={editorial ? styles.coverArtistEditorial : styles.coverArtistMinimal}>
          {artistName}
        </Text>
        {introduction && <Text style={styles.introduction}>{introduction}</Text>}
      </Page>
      {artworks.map((a, i) => (
        <Page key={i} size="A4" style={styles.page}>
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
        </Page>
      ))}
    </Document>
  );
}
