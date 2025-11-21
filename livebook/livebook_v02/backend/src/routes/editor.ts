import { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma";



const plugin: FastifyPluginAsync = async (app) => {
  app.post("/comments/:id/moderate", async (req) => {
    const { id } = req.params as { id: string };
    const { action } = req.body as { action: "APPROVE" | "REJECT" };
    return prisma.comment.update({
      where: { id },
      data: { moderationStatus: action === "APPROVE" ? "APPROVED" : "REJECTED" }
    });
  });

  app.post("/theses/publish", async (req, reply) => {
    const { slug } = req.body as { slug: string };
    if (!slug) return reply.code(400).send({ error: "slug required" });
    return prisma.thesis.update({ where: { slug }, data: { status: "PUBLISHED" } });
  });
};

export default plugin;
