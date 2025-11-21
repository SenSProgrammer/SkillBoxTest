// auth-server.ts — минимальный рабочий вариант с подписками и админ-правами

import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import knexFactory from "knex";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ulid } from "ulid";

// --- DB (SQLite для локалки) ---

const knex = knexFactory({
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "sens",
  },
});
// --- ENV / Константы ---
const JWT_PRIVATE = process.env.JWT_PRIVATE || "dev-secret"; // HS для локалки; на проде — RS256
const ACCESS_TTL_SEC = 15 * 60; // 15 минут

// --- Миграции/схема ---
async function ensureMigrations() {
  if (!(await knex.schema.hasTable("users"))) {
    await knex.schema.createTable("users", (t) => {
      t.increments("id").primary();
      t.string("sensid").notNullable().unique();
      t.string("username").unique();
      t.string("email").unique();
      t.string("password_hash").notNullable();
      t.boolean("is_admin").notNullable().defaultTo(false);
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  } else {
    // на случай, если таблица была создана раньше
    // @ts-ignore
    const hasAdmin: boolean = await (knex.schema as any).hasColumn?.("users", "is_admin");
    if (!hasAdmin) {
      await knex.schema.alterTable("users", (t) => t.boolean("is_admin").notNullable().defaultTo(false));
    }
  }

  if (!(await knex.schema.hasTable("sessions"))) {
    await knex.schema.createTable("sessions", (t) => {
      t.increments("id").primary();
      t.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      t.string("session_id").notNullable().unique();
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable("subscriptions"))) {
    await knex.schema.createTable("subscriptions", (t) => {
      t.increments("id").primary();
      t.string("sensid").notNullable().index(); // связь по глобальному идентификатору
      t.integer("level").notNullable(); // 0,1,2
      t.string("start_date").notNullable(); // ISO-строка YYYY-MM-DD или ISO
      t.string("end_date").notNullable();
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
}

// --- Хелперы ---
async function findUserByUsername(username: string) {
  return knex("users").where({ username }).first();
}

async function findUserBySessionId(sessionId: string) {
  const s = await knex("sessions").where({ session_id: sessionId }).first();
  if (!s) return null;
  return knex("users").where({ id: s.user_id }).first();
}

async function createSession(userId: number) {
  const sessionId = ulid();
  await knex("sessions").insert({ user_id: userId, session_id: sessionId });
  return sessionId;
}

function issueAccessToken(sensid: string, sessionId: string) {
  return jwt.sign(
    { sub: sensid, sid: sessionId },
    JWT_PRIVATE,
    { algorithm: "HS256", expiresIn: ACCESS_TTL_SEC }
  );
}

// Подписка активна, если now ∈ [start, end]
function isActiveSub(now: Date, startISO: string, endISO: string) {
  const t = now.getTime();
  const a = Date.parse(startISO);
  const b = Date.parse(endISO);
  return !isNaN(a) && !isNaN(b) && a <= t && t <= b;
}

async function getCurrentSubscription(sensid: string, at: Date = new Date()) {
  const subs = await knex("subscriptions").where({ sensid }).orderBy("level", "desc");
  for (const s of subs as any[]) {
    if (isActiveSub(at, s.start_date, s.end_date)) return s;
  }
  return null;
}

// Проверка перекрытий любых подписок sensid
async function hasOverlap(sensid: string, startISO: string, endISO: string) {
  // перекрытие, если НЕ (existing.end < new.start OR existing.start > new.end)
  const rows = await knex("subscriptions")
    .where({ sensid })
    .andWhere(function () {
      this.where("end_date", ">=", startISO).andWhere("start_date", "<=", endISO);
    });
  return rows.length > 0;
}

// --- Сервер ---
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const auth = () => async (req: any, _res: any, next: any) => {
  const sid = req.cookies?.sid;
  if (!sid) return next();
  const user = await findUserBySessionId(sid);
  if (user) { req.user = user; req.sessionId = sid; }
  next();
};

const requireAuth = () => (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ error: "not_logged" });
  next();
};

const requireAdmin = () => (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ error: "not_logged" });
  if (!req.user.is_admin) return res.status(403).json({ error: "forbidden" });
  next();
};

// Регистрация
app.post("/signup", async (req, res) => {
  const { username, password, email, is_admin } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password required" });

  const exists = await findUserByUsername(username);
  if (exists) return res.status(409).json({ error: "username exists" });

  const sensid = ulid();
  const password_hash = await argon2.hash(password, { type: argon2.argon2id });

  await knex("users").insert({ sensid, username, email, password_hash, is_admin: !!is_admin });
  res.status(201).json({ sensid });
});

// Логин
app.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = await findUserByUsername(username);
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await argon2.verify((user as any).password_hash, password);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const sessionId = await createSession((user as any).id);
  const access = issueAccessToken((user as any).sensid, sessionId);

  res.cookie("sid", sessionId, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  res.json({ access, sensid: (user as any).sensid, is_admin: !!(user as any).is_admin });
});

// Выход
app.post("/logout", auth(), async (req, res) => {
  if (!req.user || !req.sessionId) return res.status(401).json({ error: "not_logged" });
  await knex("sessions").where({ session_id: req.sessionId }).del();
  res.clearCookie("sid", { path: "/" });
  res.json({ ok: true });
});

// Профиль + текущая подписка
app.get("/me", auth(), async (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: "not_logged" });
  const sub = await getCurrentSubscription(req.user.sensid);
  const { sensid, username, email, is_admin } = req.user;
  res.json({
    sensid, username, email,
    is_admin: !!is_admin,
    subscription: sub ? { level: sub.level, start_date: sub.start_date, end_date: sub.end_date } : null
  });
});

// Добавить подписку — только админ + запрет перекрытий
app.post("/subscriptions", auth(), requireAdmin(), async (req, res) => {
  const { sensid, level, start_date, end_date } = req.body || {};
  if (!sensid || level === undefined || !start_date || !end_date)
    return res.status(400).json({ error: "sensid, level, start_date, end_date required" });

  const lvl = Number(level);
  if (![0, 1, 2].includes(lvl)) return res.status(400).json({ error: "level must be 0|1|2" });
  if (isNaN(Date.parse(start_date)) || isNaN(Date.parse(end_date)))
    return res.status(400).json({ error: "invalid dates" });
  if (Date.parse(start_date) > Date.parse(end_date))
    return res.status(400).json({ error: "start_date must be <= end_date" });

  if (await hasOverlap(sensid, start_date, end_date)) {
    return res.status(409).json({ error: "overlap_detected" });
  }

  await knex("subscriptions").insert({ sensid, level: lvl, start_date, end_date });
  res.status(201).json({ ok: true });
});

// Проверить текущий уровень по sensid
app.get("/subscription/check/:sensid", async (req, res) => {
  const sub = await getCurrentSubscription(req.params.sensid);
  if (!sub) return res.json({ active: false, level: 0 });
  res.json({ active: true, level: sub.level, start_date: sub.start_date, end_date: sub.end_date });
});

// Текущая подписка авторизованного пользователя
app.get("/subscription/current", auth(), requireAuth(), async (req: any, res) => {
  const sub = await getCurrentSubscription(req.user.sensid);
  if (!sub) return res.json({ active: false, level: 0 });
  res.json({ active: true, level: sub.level, start_date: sub.start_date, end_date: sub.end_date });
});

// --- Старт ---
ensureMigrations().then(() => {
  app.listen(4000, () => console.log("✅ SENS Auth+Subs running at http://localhost:4000"));
});