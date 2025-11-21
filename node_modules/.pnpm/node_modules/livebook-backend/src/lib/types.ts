export type MergeRole = 'dominant' | 'recessive' | 'alt' | 'unpairedA' | 'unpairedB';

export type ThesisProvenance = {
  from: 'A' | 'B' | 'A+B';
  sources: Array<{ rc_id: string; thesis_uid: string }>;
};

export type Thesis = {
  order: number;
  text_md: string;
  kind?: 'core' | 'evidence' | 'other';
  thesis_uid?: string;
  /** Новое: роль тезиса в merge (если это merged RC) */
  merge_role?: MergeRole;
  /** Новое: происхождение (источники A/B) */
  provenance?: ThesisProvenance;
};

export type ArticleManifest = {
  article: { slug: string; title: string; lang: string; meta?: { tags?: string[]; summary?: string } };
  version?: { note?: string; source?: string };
  theses: Thesis[];
  tables_html?: string[];
  formulas_text?: string[];
  images?: string[];
};
