// Versioned prompt templates (ai-engine.md: "Prompts stored as versioned
// templates in the codebase, never inline"). One export pair per AI
// function; bump the version string whenever the wording changes.

export const CATALOGUE_INTRO_PROMPT_VERSION = "catalogue_intro_v1";

export type Tone = "neutral" | "warm" | "formal";
export const TONES: Tone[] = ["neutral", "warm", "formal"];

const TONE_INSTRUCTION: Record<Tone, string> = {
  neutral: "in a neutral, professional tone",
  warm: "in a warm, personable tone",
  formal: "in a formal, academic tone",
};

export type CatalogueIntroInput = {
  artistName: string;
  shortBio: string;
  statement: string;
  projectTitle: string;
  artworks: { title: string; year: string | null; medium: string; dimensions: string }[];
};

export function buildCatalogueIntroPrompt(input: CatalogueIntroInput, tone: Tone = "neutral"): string {
  const artworkLines = input.artworks
    .map((a) => `- "${a.title}" (${a.year ?? "n.d."}), ${a.medium}, ${a.dimensions}`)
    .join("\n");

  return `You are drafting a short introduction for an art catalogue. Write a 200-400 word introduction ${TONE_INSTRUCTION[tone]}.

Use only the facts given below. Do not invent biographical details, exhibition history, awards, prices, or any fact not supplied here.

Artist: ${input.artistName}
Artist bio: ${input.shortBio || "(not provided)"}
Artist statement: ${input.statement || "(not provided)"}
Catalogue title: ${input.projectTitle}

Selected artworks:
${artworkLines || "(none listed)"}

Write only the introduction text, with no heading and no preamble.`;
}

// -- Artwork description ----------------------------------------------

export const ARTWORK_DESCRIPTION_PROMPT_VERSION = "artwork_description_v1";

export type ArtworkDescriptionInput = {
  title: string;
  year: string | null;
  medium: string;
  dimensions: string;
  series: string | null;
};

export function buildArtworkDescriptionPrompt(
  input: ArtworkDescriptionInput,
  tone: Tone = "neutral",
): string {
  return `You are drafting a short catalogue description for a single artwork. Write a 40-80 word description ${TONE_INSTRUCTION[tone]}.

Use only the facts given below. Do not invent technique, subject matter, influences, exhibition history, or any fact not supplied here.

Title: ${input.title}
Year: ${input.year ?? "(not provided)"}
Medium: ${input.medium}
Dimensions: ${input.dimensions || "(not provided)"}
Series / Collection: ${input.series ?? "(not provided)"}

Write only the description text, with no heading and no preamble.`;
}

// -- Alt text ------------------------------------------------------------
// ai-engine.md: for alt text only, the artwork image derivative is sent
// alongside this prompt (see lib/ai/claude.ts callClaude's imageUrl option).

export const ALT_TEXT_PROMPT_VERSION = "alt_text_v1";

export type AltTextInput = {
  title: string;
  medium: string;
  category: string;
};

export function buildAltTextPrompt(input: AltTextInput): string {
  return `Look at the attached image of an artwork and write one factual sentence describing what is visible, for use as accessibility alt text. The sentence must be under 125 characters. Describe only what is visible in the image — do not mention the artist's name, price, or any fact not visible or supplied below.

Title: ${input.title}
Medium: ${input.medium}
Category: ${input.category}

Respond with only the sentence — no quotation marks, no heading.`;
}
