import { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma";

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/:thesisId", async (req) => {
    const { thesisId } = req.params as { thesisId: string };
    return prisma.comment.findMany({
      where: { thesisId, moderationStatus: "APPROVED" },
      orderBy: { createdAt: "desc" }
    });
  });

  app.post("/:thesisId", async (req, reply) => {
    const { thesisId } = req.params as { thesisId: string };
    const { textMd, authorId } = req.body as any;
    if (!textMd) return reply.code(400).send({ error: "textMd required" });
    const author = authorId ?? (await prisma.user.findFirst({ where: { email: "demo@example.com" } }))?.id;
    const created = await prisma.comment.create({ data: { thesisId, textMd, authorId: author! } });
    return created;
  });

  // Ingest endpoint for Chrome extension MVP
  app.post("/ingest", async (req, reply) => {
    const { text } = req.body as any;
    if (!text) return reply.code(400).send({ error: "text required" });
    const thesis = await prisma.thesis.findFirst({ where: { slug: "ths-2025-001" } });
    if (!thesis) return reply.code(500).send({ error: "seed thesis missing" });
    const user = await prisma.user.upsert({
      where: { email: "inbox@example.com" },
      create: { email: "inbox@example.com", name: "Inbox", role: "CONTRIBUTOR" },
      update: {}
    });
    const created = await prisma.comment.create({
      data: { thesisId: thesis.id, authorId: user.id, textMd: text, moderationStatus: "PENDING" }
    });
    return { ok: true, commentId: created.id, thesisSlug: thesis.slug };
  });
};

export default plugin;
