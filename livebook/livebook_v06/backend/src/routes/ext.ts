import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createRCFromManifest, mem, mergeRC } from '../lib/db';
import type { ArticleManifest } from '../lib/types';

export async function extRoutes(app: FastifyInstance) {
  const ManifestZ = z.object({
    article: z.object({ slug: z.string(), title: z.string(), lang: z.string(), meta: z.any().optional() }),
    version: z.object({ note: z.string().optional(), source: z.string().optional() }).optional(),
    theses: z.array(z.object({ order: z.number(), text_md: z.string(), kind: z.string().optional() })).min(1),
    tables_html: z.array(z.string()).optional(),
    formulas_text: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
  });

  app.post('/rc/import-json', async (req, reply) => {
    const parsed = ManifestZ.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid manifest', issues: parsed.error.issues });
    const { rc_id, manifest } = createRCFromManifest(parsed.data as ArticleManifest);
    return reply.send({ rc_id, version_id: null, manifest });
  });

  app.get('/rc/export-json', async (req, reply) => {
    const rc_id = (req.query as any).rc_id;
    const rc = mem.rc.get(rc_id);
    if (!rc) return reply.code(404).send({ error: 'RC not found' });
    return reply.send(rc.manifest);
  });

  app.post('/cross/grant', async (req, reply) => {
    const id = 'grant_' + Date.now();
    mem.crossGrants.set(id, { id, ...(req.body as any) });
    return reply.send({ id });
  });

  app.post('/cross/alignments', async (req, reply) => {
    const id = 'al_' + Date.now();
    mem.alignments.set(id, { id, ...(req.body as any) });
    return reply.send({ id });
  });

  // <-- НОВЫЙ ОБРАБОТЧИК
  app.post('/cross/arbitrate', async (req, reply) => {
    const body = req.body as any;
    const rc_a_id = body?.rc_a_id;
    const rc_b_id = body?.rc_b_id;
    if (!rc_a_id || !rc_b_id) return reply.code(400).send({ error: 'rc_a_id and rc_b_id required' });
    try {
      const { merged_rc_id, mapping } = mergeRC(rc_a_id, rc_b_id);
      const id = 'arb_' + Date.now();
      mem.arbitrations.set(id, { id, status: 'ready', merged_rc_id, mapping });
      return reply.send({ id, status: 'ready', merged_rc_id });
    } catch (e: any) {
      return reply.code(400).send({ error: e.message || 'merge failed' });
    }
  });

  app.get('/cross/arbitrations/:id/result', async (req, reply) => {
    const { id } = req.params as any;
    const arb = mem.arbitrations.get(id);
    if (!arb) return reply.code(404).send({ error: 'Not found' });
    // теперь вернём mapping тоже
    return reply.send({ id, status: 'ready', merged_rc_id: arb.merged_rc_id, mapping: arb.mapping || [] });
  });
}
