import { FastifyPluginAsync } from "fastify"; import { prisma } from "../prisma";
const plugin:FastifyPluginAsync=async(app)=>{
  app.get("/:thesisId", async (req)=>{ const {thesisId}=req.params as any; return prisma.comment.findMany({where:{thesisId,moderationStatus:"APPROVED"},orderBy:{createdAt:"desc"}}); });
  app.post("/:thesisId", async (req,reply)=>{ const {thesisId}=req.params as any; const {textMd,authorId}=req.body as any; if(!textMd) return reply.code(400).send({error:"textMd required"}); const author=authorId||(await prisma.user.findFirst({where:{email:"demo@example.com"}}))?.id; return prisma.comment.create({data:{thesisId,textMd,authorId:author!}}); });
};
export default plugin;
