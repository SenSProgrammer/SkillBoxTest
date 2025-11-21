// backend/src/routes/editor.ts
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma";
import { authGuard, roleGuard } from "../auth";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import puppeteer from "puppeteer";
import Epub from "epub-gen";
import { putExport } from "../s3";

const plugin: FastifyPluginAsync = async (app) => {
  // Защита всех /api/editor/*
  app.addHook("preHandler", async (req, reply) => authGuard(req, reply));
  app.addHook("preHandler", async (req, reply) =>
    roleGuard(["EDITOR", "ADMIN"])(req, reply)
  );

  // Очередь модерации
  app.get("/modqueue/comments", async () => {
    return prisma.comment.findMany({
      where: { moderationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { thesis: true, author: true },
    });
  });

  // Принять/отклонить комментарий
  app.post("/comments/:id/moderate", async (req) => {
    const { id } = req.params as { id: string };
    const { action } = req.body as { action: "APPROVE" | "REJECT" };
    return prisma.comment.update({
      where: { id },
      data: { moderationStatus: action === "APPROVE" ? "APPROVED" : "REJECTED" },
    });
  });

  // Публикация тезиса
  app.post("/theses/publish", async (req, reply) => {
    const { slug } = req.body as { slug: string };
    if (!slug) return reply.code(400).send({ error: "slug required" });
    return prisma.thesis.update({
      where: { slug },
      data: { status: "PUBLISHED" },
    });
  });

  // Инициализация переводов из JSON
  app.post("/translations/init", async (req, reply) => {
    const p = path.join(process.cwd(), "prisma", "translations_seed.json");
    try {
      const raw = await fs.readFile(p, "utf-8");
      const data = JSON.parse(raw);
      let created = 0;
      for (const row of data) {
        await prisma.translation.upsert({
          where: {
            thesisId_language_confession: {
              thesisId: row.thesisId,
              language: row.language,
              confession: row.confession,
            },
          },
          update: { textHtml: row.textHtml, textMd: row.textMd, origin: "AI" },
          create: row,
        });
        created++;
      }
      return { ok: true, created };
    } catch (e: any) {
      return reply.code(500).send({ error: e.message });
    }
  });

  /**
   * Экспорт (HTML/PDF/ePub) c титульным листом, оглавлением, нумерацией.
   * Запрос: { scope: { bookSlug?: string; thesisSlugs?: string[] }, fmt: "pdf"|"epub"|"html",
   *           title?, subtitle?, authors?, editors?, coverImageUrl?, numberToc? }
   * Query:  ?store=1  — сохранить в S3 (вернёт { url })
   */
  app.post("/export", async (req, reply) => {
    const {
      scope,
      fmt,
      title,
      subtitle,
      authors,
      editors,
      coverImageUrl,
      numberToc,
    } = req.body as {
      scope: { bookSlug?: string; thesisSlugs?: string[] };
      fmt: "pdf" | "epub" | "html";
      title?: string;
      subtitle?: string;
      authors?: string;
      editors?: string;
      coverImageUrl?: string;
      numberToc?: boolean;
    };

    if (!fmt) return reply.code(400).send({ error: "fmt required" });

    const items =
      scope?.thesisSlugs?.length
        ? await prisma.thesis.findMany({
            where: { slug: { in: scope.thesisSlugs } },
          })
        : await (async () => {
            if (!scope?.bookSlug) return [];
            const book = await prisma.book.findUnique({
              where: { slug: scope.bookSlug },
            });
            if (!book) return [];
            return prisma.thesis.findMany({
              where: { bookId: book.id, status: "PUBLISHED" },
              orderBy: { createdAt: "asc" },
            });
          })();

    if (!items.length) return reply.code(404).send({ error: "No content" });

    const _title = title || "LiveBook Export";
    const coverImg = coverImageUrl || "/assets/cover-placeholder.jpg";
    const toc = items
      .map(
        (t, i) =>
          `<li>${numberToc ? i + 1 + ". " : ""}<a href=#sec-${i}>${t.slug}</a></li>`
      )
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${_title}</title>
<style>
  body{font-family:-apple-system, Segoe UI, Roboto, Arial, sans-serif; margin:24px;}
  .cover{page-break-after:always; text-align:center; margin-top:25vh;}
  .cover img{max-width:70%; height:auto; display:block; margin:0 auto 1rem;}
  .cover .subtitle{color:#666; margin-top:.25rem;}
  .cover .credits{margin-top:1rem; font-size:.9rem; color:#555;}
  header, footer { font-size: 10px; color: #666; }
  h1,h2{ page-break-after: avoid; }
  .toc h1 { font-size: 20px; }
  .toc a { text-decoration: none; color: #333; }
  article { margin: 16px 0; }
</style>
</head><body>
<section class="cover">
  <img src="${coverImg}" alt="cover"/>
  <h1>${_title}</h1>
  ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
  ${
    authors || editors
      ? `<div class="credits">${authors ? `Авторы: ${authors}` : ""}${
          authors && editors ? " · " : ""
        }${editors ? `Редакторы: ${editors}` : ""}</div>`
      : ""
  }
</section>
<section class="toc"><h1>Оглавление</h1><ol>${toc}</ol></section>
${items
  .map(
    (t, i) =>
      `<article id=sec-${i}><h2>${numberToc ? i + 1 + ". " : ""}${
        t.slug
      }</h2>${t.textHtml ?? ""}</article>`
  )
  .join("\n<hr/>\n")}
</body></html>`;

    // HTML
    if (fmt === "html") return reply.type("text/html").send(html);

    // PDF
    if (fmt === "pdf") {
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuf = await page.pdf({
        format: "A4",
        margin: { top: "60px", bottom: "60px", left: "20px", right: "20px" },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size:10px;width:100%;text-align:center;">${_title} — <span class="date"></span></div>`,
        footerTemplate: `<div style="font-size:10px;width:100%;text-align:center;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
      });
      await browser.close();

      if ((req.query as any)?.store === "1") {
        const url = await putExport(`exports/export.pdf`, pdfBuf, "application/pdf");
        return { url };
      }

      reply.header("Content-Disposition", "attachment; filename=livebook_export.pdf");
      return reply.type("application/pdf").send(pdfBuf);
    }

    // ePub (через epub-gen → во временный файл)
    if (fmt === "epub") {
      // optional CSS
      let css = "";
      try {
        css = await fs.readFile(
          path.join(process.cwd(), "..", "assets", "epub.css"),
          "utf-8"
        );
      } catch {}

      const options: any = {
        title: _title,
        author: authors || "LiveBook",
        css,
        content: [
          {
            title: "Cover",
            data: `<div class='cover'><img src='${coverImg}'/><h1>${_title}</h1>${
              subtitle ? `<div class='subtitle'>${subtitle}</div>` : ""
            }${
              authors || editors
                ? `<div class='credits'>${
                    authors ? `Authors: ${authors}` : ""
                  }${authors && editors ? " · " : ""}${
                    editors ? `Editors: ${editors}` : ""
                  }</div>`
                : ""
            }</div>`,
          },
          {
            title: "Table of Contents",
            data: `<section class='toc'><h1>Contents</h1><ol>${toc}</ol></section>`,
          },
          ...items.map((t, i) => ({
            title: `${numberToc ? i + 1 + ". " : ""}${t.slug}`,
            data: t.textHtml || "",
          })),
        ],
      };

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "livebook-"));
      const outFile = path.join(tmpDir, "export.epub");

      // @ts-ignore — у старых типов epub-gen есть свойство .promise
      await new (Epub as any)(options, outFile).promise;

      const buf = await fs.readFile(outFile);
      await fs.rm(tmpDir, { recursive: true, force: true });

      if ((req.query as any)?.store === "1") {
        const url = await putExport(
          `exports/export.epub`,
          buf as Buffer,
          "application/epub+zip"
        );
        return { url };
      }

      reply.header("Content-Disposition", "attachment; filename=livebook_export.epub");
      return reply.type("application/epub+zip").send(buf);
    }
  });
};

export default plugin;