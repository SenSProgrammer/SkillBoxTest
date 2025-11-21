import { FastifyInstance } from 'fastify';
export async function expertRoutes(app: FastifyInstance) {
  app.get('/me/profile', async () => ({ full_name: '', bio_md: '', links: [] }));
  app.post('/me/profile', async () => ({ ok: true }));
  app.get('/me/assignments', async () => ({ items: [] }));
  app.get('/me/questions', async () => ({ items: [] }));
  app.post('/me/questions/:id/claim', async () => ({ ok: true }));
  app.post('/me/questions/:id/answer', async () => ({ ok: true }));
  app.get('/me/stats', async () => ({ total: 0, answered: 0 }));
}
