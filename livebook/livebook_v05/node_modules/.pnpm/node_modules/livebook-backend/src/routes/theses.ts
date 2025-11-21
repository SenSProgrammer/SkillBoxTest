import { FastifyPluginAsync } from "fastify"; import { prisma } from "../prisma";
const plugin:FastifyPluginAsync=async(app)=>{ app.get("/:slug", async (req,reply)=>{ const {slug}=req.params as any; const t=await prisma.thesis.findUnique({where:{slug},include:{translations:true}}); if(!t) return reply.code(404).send({error:"Not found"}); return t; }); };
export default plugin;
