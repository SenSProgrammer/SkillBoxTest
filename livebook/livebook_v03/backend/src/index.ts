import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./env";
import booksRoutes from "./routes/books";
import thesesRoutes from "./routes/theses";
import commentsRoutes from "./routes/comments";
import editorRoutes from "./routes/editor";

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.CORS_ORIGIN ?? true, credentials: true });
await app.register(swagger, { openapi: { info: { title: "LiveBook API", version: "0.1" } } });
await app.register(swaggerUi, { routePrefix: "/docs" });

app.get("/health", () => ({ ok: true }));

await app.register(booksRoutes, { prefix: "/api/books" });
await app.register(thesesRoutes, { prefix: "/api/theses" });
await app.register(commentsRoutes, { prefix: "/api/comments" });
await app.register(editorRoutes, { prefix: "/api/editor" });

app.listen({ port: env.PORT, host: "0.0.0.0" });
