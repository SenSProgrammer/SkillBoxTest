import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const book = await prisma.book.upsert({
    where: { slug: "consciology" },
    create: { slug: "consciology", title: "Сознание как информационная система" },
    update: {}
  });
  const ctx = await prisma.context.create({ data: { bookId: book.id, title: "Core", version: 1 } });
  const thesis = await prisma.thesis.create({
    data: {
      bookId: book.id,
      contextId: ctx.id,
      slug: "ths-2025-001",
      language: "ru",
      confession: "scientific",
      textHtml: "<h2>Определение</h2><p>Сознание как информационная система...</p>",
      status: "PUBLISHED"
    }
  });
  // demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    create: { email: "demo@example.com", name: "Demo", role: "READER" },
    update: {}
  });
  await prisma.comment.create({
    data: {
      thesisId: thesis.id,
      authorId: user.id,
      textMd: "Отличный базовый тезис.",
      moderationStatus: "APPROVED"
    }
  });
}

main().finally(() => prisma.$disconnect());
