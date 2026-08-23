import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Deliberately a different shape from PublicationPdfDocument (the
// catalogue engine) — product owner's request: a portfolio PDF is
// about the ARTIST, not the work. Artwork photos appear once, as a
// small strip on the cover, never as their own detail pages; the rest
// is the artist's biodata (bio, statement, discipline, CV, contact).
export type PortfolioArtwork = {
  title: string;
  imageUrl: string | null;
};

export type PortfolioArtistBio = {
  shortBio: string | null;
  fullBiography: string | null;
  artistStatement: string | null;
  country: string | null;
  cityState: string | null;
  primaryDiscipline: string | null;
  otherDisciplines: string[];
  websiteUrls: string[];
  cvEntries: string[];
};

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
  // Cover — the artist's own photo carries the page; the work is a
  // supporting strip along the bottom, not the main event.
  coverPhotoWrap: { alignItems: "center", marginTop: 40, marginBottom: 24 },
  coverPhoto: { width: 220, height: 220, borderRadius: 110, objectFit: "cover" },
  coverPhotoPlaceholder: { width: 220, height: 220, borderRadius: 110, backgroundColor: "#F2F2F2" },
  coverNameMinimal: { fontSize: 26, textAlign: "center" },
  coverNameEditorial: {
    fontSize: 28,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
  },
  coverTitle: { fontSize: 13, textAlign: "center", color: "#6B6B6B", marginTop: 4 },
  coverStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: "row",
  },
  coverStripTile: { flex: 1, height: "100%", objectFit: "cover", opacity: 0.5 },
  coverStripEmpty: { flex: 1, height: "100%", backgroundColor: "#F2F2F2" },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginTop: 20, marginBottom: 8 },
  sectionTitleFirst: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  body: { fontSize: 11, lineHeight: 1.6 },
  metaLine: { fontSize: 11, color: "#6B6B6B", marginBottom: 2 },
  cvEntry: { fontSize: 11, marginBottom: 3 },
  link: { fontSize: 11, color: "#0B4EA2", marginBottom: 3 },
});

export default function PortfolioPdfDocument({
  title,
  artistName,
  artistPhotoUrl,
  templateId,
  artworks,
  bio,
}: {
  title: string;
  artistName: string;
  artistPhotoUrl?: string | null;
  templateId: string;
  artworks: PortfolioArtwork[];
  bio: PortfolioArtistBio;
}) {
  const editorial = templateId === "editorial";

  const stripTiles = artworks.filter((a) => a.imageUrl);
  const STRIP_COUNT = 6;

  const disciplineLine = [bio.primaryDiscipline, ...bio.otherDisciplines].filter(Boolean).join(", ");
  const locationLine = [bio.cityState, bio.country].filter(Boolean).join(", ");

  const hasBioContent =
    bio.shortBio ||
    bio.fullBiography ||
    bio.artistStatement ||
    disciplineLine ||
    locationLine ||
    bio.cvEntries.length > 0 ||
    bio.websiteUrls.length > 0;

  return (
    <Document title={title} author={artistName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPhotoWrap}>
          {artistPhotoUrl ? (
            <Image src={artistPhotoUrl} style={styles.coverPhoto} />
          ) : (
            <View style={styles.coverPhotoPlaceholder} />
          )}
        </View>
        <Text style={editorial ? styles.coverNameEditorial : styles.coverNameMinimal}>{artistName}</Text>
        <Text style={styles.coverTitle}>{title}</Text>

        {stripTiles.length > 0 && (
          <View style={styles.coverStrip} fixed>
            {Array.from({ length: STRIP_COUNT }, (_, i) => stripTiles[i % stripTiles.length]).map(
              (a, i) =>
                a.imageUrl ? (
                  <Image key={i} src={a.imageUrl} style={styles.coverStripTile} />
                ) : (
                  <View key={i} style={styles.coverStripEmpty} />
                ),
            )}
          </View>
        )}
      </Page>

      {hasBioContent && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageHeader} fixed>
            <Text>{artistName}</Text>
            <Text>{title}</Text>
          </View>

          {bio.shortBio && <Text style={styles.body}>{bio.shortBio}</Text>}

          {(disciplineLine || locationLine) && (
            <>
              <Text style={styles.sectionTitle}>Discipline &amp; Location</Text>
              {disciplineLine && <Text style={styles.metaLine}>{disciplineLine}</Text>}
              {locationLine && <Text style={styles.metaLine}>{locationLine}</Text>}
            </>
          )}

          {bio.fullBiography && (
            <>
              <Text style={styles.sectionTitle}>Biography</Text>
              <Text style={styles.body}>{bio.fullBiography}</Text>
            </>
          )}

          {bio.artistStatement && (
            <>
              <Text style={styles.sectionTitle}>Artist Statement</Text>
              <Text style={styles.body}>{bio.artistStatement}</Text>
            </>
          )}

          {bio.cvEntries.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>CV / Exhibition History</Text>
              {bio.cvEntries.map((entry, i) => (
                <Text key={i} style={styles.cvEntry}>
                  {entry}
                </Text>
              ))}
            </>
          )}

          {bio.websiteUrls.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Contact</Text>
              {bio.websiteUrls.map((url, i) => (
                <Text key={i} style={styles.link}>
                  {url}
                </Text>
              ))}
            </>
          )}

          <View style={styles.pageFooter} fixed>
            <Text>{artistName}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      )}
    </Document>
  );
}
