import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  // Книга (upsert — безопасно для повторных запусков)
  const book = await p.book.upsert({
    where: { slug: "consciology" },
    update: {},
    create: {
      slug: "consciology",
      title: "Сознание как информационная система",
    },
  });

  // Базовые тезисы (минимальный набор для проверки экспорта)
  const theses = [
    {
      slug: "intro",
      language: "ru",
      confession: null as string | null,
      textMd: "Введение. **Сознание как информационная система**.",
      textHtml: "<p>Введение. <b>Сознание как информационная система</b>.</p>",
      status: "PUBLISHED" as const,
      parentSlug: null as string | null,
    },
    {
      slug: "axioms",
      language: "ru",
      confession: null as string | null,
      textMd: "Аксиломы и определения. Базовые понятия.",
      textHtml: "<p>Аксиломы и определения. Базовые понятия.</p>",
      status: "PUBLISHED" as const,
      parentSlug: "intro",
    },
  ];

  // upsert по slug + связка parentId, если указан parentSlug
  for (const t of theses) {
    // сначала найдём parentId, если нужен
    let parentId: string | null = null;
    if (t.parentSlug) {
      const parent = await p.thesis.findUnique({ where: { slug: t.parentSlug } });
      parentId = parent?.id ?? null;
    }

    await p.thesis.upsert({
      where: { slug: t.slug },
      update: {
        bookId: book.id,
        language: t.language,
        confession: t.confession,
        textMd: t.textMd ?? null,
        textHtml: t.textHtml ?? null,
        status: t.status,
        parentId,
      },
      create: {
        bookId: book.id,
        slug: t.slug,
        language: t.language,
        confession: t.confession,
        textMd: t.textMd ?? null,
        textHtml: t.textHtml ?? null,
        status: t.status,
        parentId,
      },
    });
  }

  // Пример перевода
const intro = await p.thesis.findUnique({ where: { slug: "intro" } });
if (intro) {
  const NO_CONF = ""; // вместо null — пустая строка

  await p.translation.upsert({
    where: {
      thesisId_language_confession: {
        thesisId: intro.id,
        language: "en",
        confession: NO_CONF,
      },
    },
    update: {
      textMd: "Introduction. **Consciousness as an information system**.",
      textHtml:
        "<p>Introduction. <b>Consciousness as an information system</b>.</p>",
      origin: "AI",
    },
    create: {
      thesisId: intro.id,
      language: "en",
      confession: NO_CONF,
      textMd: "Introduction. **Consciousness as an information system**.",
      textHtml:
        "<p>Introduction. <b>Consciousness as an information system</b>.</p>",
      origin: "AI",
    },
  });
}
}

main()
  .then(async () => {
    await p.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });

