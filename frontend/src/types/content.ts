/**
 * Structured page copy (policies, about, help, travel guides). Plain data on purpose: the same files can later
 * be indexed by a chatbot as its source, and every statement can be checked against the code in one place.
 */
export interface ContentSection {
  /** Anchor for the table of contents, e.g. "du-lieu-thu-thap". */
  id: string;
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface ContentDocument {
  title: string;
  /** dd/mm/yyyy, shown at the top of the page. */
  updated: string;
  intro?: string;
  sections: ContentSection[];
}
