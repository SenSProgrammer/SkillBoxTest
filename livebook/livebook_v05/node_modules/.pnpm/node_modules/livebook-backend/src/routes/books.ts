import { FastifyPluginAsync } from "fastify"; import { prisma } from "../prisma";
const plugin:FastifyPluginAsync=async(app)=>{ app.get("/:slug/tree", async (req,reply)=>{ const {slug}=req.params as any; const book=await prisma.book.findUnique({where:{slug}}); if(!book) return reply.code(404).send({error:"Book not found"}); const theses=await prisma.thesis.findMany({where:{bookId:book.id,status:"PUBLISHED"},select:{id:true,parentId:true,slug:true,language:true,confession:true,textHtml:true}}); return {book,tree:theses}; }); };
export default plugin;
