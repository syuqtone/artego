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
