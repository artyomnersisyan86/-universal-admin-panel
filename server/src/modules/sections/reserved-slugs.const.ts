/**
 * Slugs that collide with existing static `/api/*` routes or framework paths.
 * Creating a section with one of these would shadow real endpoints because
 * the SectionEntriesController is registered with a `:sectionSlug` param.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'auth',
  'users',
  'sections',
  'entries',
  'layout-templates',
  'uploads',
  'health',
  'dashboard',
  'form-schemas',
  'tables',
  'dynamic-endpoints',
  'seed',
]);

export const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
