import { randomUUID } from 'node:crypto';
import type { ArticleManifest, Thesis, MergeRole } from './types';

export const mem = {
  rc: new Map<string, { id: string; article_slug: string; manifest: ArticleManifest }>(),
  thesisIndex: new Map<string, { rc_id: string; thesis_uid: string; order: number }>(),
  crossGrants: new Map<string, any>(),
  alignments: new Map<string, any>(),
  arbitrations: new Map<string, any>(),
  articles: new Map<string, { slug: string; title: string; lang: string; versions: any[] }>(),
};

export function assignThesisUids(theses: Thesis[]) {
  return theses.map((t) => ({ ...t, thesis_uid: 'th_' + randomUUID() }));
}

export function createRCFromManifest(m: ArticleManifest) {
  const rc_id = 'rc_' + randomUUID();
  const withUids = assignThesisUids(m.theses || []);
  const manifest: ArticleManifest = { ...m, theses: withUids };
  mem.rc.set(rc_id, { id: rc_id, article_slug: m.article.slug, manifest });
  withUids.forEach((t) => mem.thesisIndex.set(t.thesis_uid!, { rc_id, thesis_uid: t.thesis_uid!, order: t.order }));
  return { rc_id, manifest };
}

export function lookupRcIdByThesis(thesis_uid: string): string | null {
  const rec = mem.thesisIndex.get(thesis_uid);
  return rec ? rec.rc_id : null;
}

/** Результат слияния для карты соответствий */
export type MergeMapItem = {
  merged_thesis_uid: string;
  role: MergeRole;
  from: Array<{ rc_id: string; thesis_uid: string }>;
};

/** Реальный merge по alignments: возвращает merged_rc_id и mapping[] */
export function mergeRC(rc_a_id: string, rc_b_id: string): { merged_rc_id: string; mapping: MergeMapItem[] } {
  const rcA = mem.rc.get(rc_a_id);
  const rcB = mem.rc.get(rc_b_id);
  if (!rcA || !rcB) throw new Error('RC not found');
  const A = rcA.manifest;
  const B = rcB.manifest;

  const mapA = new Map((A.theses || []).map((t) => [t.thesis_uid!, t]));
  const mapB = new Map((B.theses || []).map((t) => [t.thesis_uid!, t]));

  // Собираем пары соответствий (из всех отправленных alignments)
  const pairs: Array<{ a: string; b: string; labelA?: string; labelB?: string }> = [];
  for (const al of mem.alignments.values()) {
    const entries = (al.pairs || []) as any[];
    for (const p of entries) {
      const a = p.thesis_uid_a;
      const b = p.thesis_uid_b;
      if (!a || !b) continue;
      const ra = lookupRcIdByThesis(a);
      const rb = lookupRcIdByThesis(b);
      if (ra === rc_a_id && rb === rc_b_id) {
        pairs.push({ a, b, labelA: p.label_by_a, labelB: p.label_by_b });
      } else if (rb === rc_a_id && ra === rc_b_id) {
        // swap: нормализуем в сторону A ↔ B
        pairs.push({ a: b, b: a, labelA: p.label_by_b, labelB: p.label_by_a });
      }
    }
  }

  const usedA = new Set<string>();
  const usedB = new Set<string>();
  const mergedTheses: Thesis[] = [];
  const mapping: MergeMapItem[] = [];
  let order = 1;

  function pushThesis(text: string, role: MergeRole, from: Array<{ rc_id: string; thesis_uid: string }>) {
    const thesis_uid = 'th_' + randomUUID();
    const t: Thesis = {
      order: order++,
      text_md: text,
      kind: 'core',
      thesis_uid,
      merge_role: role,
      provenance: { from: from.length === 2 ? 'A+B' : (from[0].rc_id === rc_a_id ? 'A' : 'B'), sources: from },
    };
    mergedTheses.push(t);
    mapping.push({ merged_thesis_uid: thesis_uid, role, from });
  }

  // Правила:
  // agree100/agree100 -> берём A как dominant
  // agree50 (у любой стороны) -> A dominant + B recessive
  // иначе -> A dominant + B alt (альтернативный)
  for (const p of pairs) {
    const ta = mapA.get(p.a);
    const tb = mapB.get(p.b);
    if (!ta || !tb) continue;
    usedA.add(p.a);
    usedB.add(p.b);
    const la = (p.labelA || '').toLowerCase();
    const lb = (p.labelB || '').toLowerCase();

    if (la.includes('100') && lb.includes('100')) {
      // один тезис — доминант A
      pushThesis(ta.text_md, 'dominant', [
        { rc_id: rc_a_id, thesis_uid: p.a },
      ]);
    } else if (la.includes('50') || lb.includes('50')) {
      // два тезиса: A — dominant, B — recessive
      pushThesis(ta.text_md, 'dominant', [{ rc_id: rc_a_id, thesis_uid: p.a }]);
      pushThesis(tb.text_md, 'recessive', [{ rc_id: rc_b_id, thesis_uid: p.b }]);
    } else {
      // A — dominant, B — alt
      pushThesis(ta.text_md, 'dominant', [{ rc_id: rc_a_id, thesis_uid: p.a }]);
      pushThesis(tb.text_md, 'alt', [{ rc_id: rc_b_id, thesis_uid: p.b }]);
    }
  }

  // Непарные — как unpairedA/unpairedB
  for (const t of A.theses || []) {
    if (!usedA.has(t.thesis_uid!)) {
      pushThesis(t.text_md, 'unpairedA', [{ rc_id: rc_a_id, thesis_uid: t.thesis_uid! }]);
    }
  }
  for (const t of B.theses || []) {
    if (!usedB.has(t.thesis_uid!)) {
      pushThesis(t.text_md, 'unpairedB', [{ rc_id: rc_b_id, thesis_uid: t.thesis_uid! }]);
    }
  }

  const mergedManifest: ArticleManifest = {
    article: {
      slug: `${A.article.slug}-merged-${B.article.slug}`,
      title: `Merged: ${A.article.title} + ${B.article.title}`,
      lang: A.article.lang || 'ru',
      meta: { tags: ['merged'], summary: 'Автосборка на основе выравниваний' },
    },
    version: { note: 'merged', source: 'arbitration' },
    theses: mergedTheses,
    tables_html: [],
    formulas_text: [],
    images: [],
  };

  const created = createRCFromManifest(mergedManifest);
  return { merged_rc_id: created.rc_id, mapping };
}
