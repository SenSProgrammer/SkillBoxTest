import { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma";

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const thesis = await prisma.thesis.findUnique({ where: { slug }, include: { translations: true } });
    if (!thesis) return reply.code(404).send({ error: "Not found" });
    return thesis;
  });
};

export default plugin;
