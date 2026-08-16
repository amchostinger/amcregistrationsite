/**
 * lib/speakerSections.js
 * The headings the Speakers page is organised under, in the order they appear.
 * Shared by the public page and the admin editor so the two never drift apart.
 * Mirrors SPEAKER_CATEGORIES in server/routes/admin.js.
 */

export const SPEAKER_SECTIONS = [
  {
    key: 'speaker',
    title: 'Speakers',
    blurb: 'Bishops, prelates and distinguished guests presenting at the conference.',
  },
  {
    key: 'keynote',
    title: 'Keynote',
    blurb: 'Keynote addresses from across the global Methodist community.',
  },
  {
    key: 'workshop',
    title: 'Workshops',
    blurb: 'Facilitators leading the conference workshop sessions.',
  },
  {
    key: 'constitutional',
    title: 'Constitutional Review',
    blurb: 'The panel leading the review of the AMC constitution.',
  },
  {
    key: 'strategic',
    title: 'Strategic Plan Review',
    blurb: 'The team presenting the review of the AMC strategic plan.',
  },
  {
    key: 'host',
    title: 'Hosts',
    blurb: 'The host church and local organising leadership.',
  },
  {
    key: 'secretary',
    title: 'Secretariat',
    blurb: 'The conference secretariat.',
  },
  {
    key: 'awards',
    title: 'Awards',
    blurb: 'Presiding over the conference awards.',
  },
];

/** Valid category values, for filter dropdowns and fallback checks. */
export const SECTION_KEYS = SPEAKER_SECTIONS.map((s) => s.key);

/** Human label for a stored category; unknown values read as "Speakers". */
export function sectionLabel(key) {
  return SPEAKER_SECTIONS.find((s) => s.key === key)?.title ?? 'Speakers';
}
