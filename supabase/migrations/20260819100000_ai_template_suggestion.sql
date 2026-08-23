-- Adds a new ai_job function value for the catalogue/portfolio template
-- recommendation feature (ai-engine.md: AI only drafts/suggests, never
-- decides -- the artist still picks the template themselves; this just
-- pre-selects a recommendation with a short reason on the New Catalogue /
-- New Artist Directory screen).

alter table public.ai_job drop constraint if exists ai_job_function_check;

alter table public.ai_job add constraint ai_job_function_check check (
  function in (
    'catalogue_intro', 'curatorial_statement', 'artwork_description',
    'alt_text', 'suggested_sequence', 'title_suggestions', 'template_suggestion'
  )
);
