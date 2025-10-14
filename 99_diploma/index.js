
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const nunjucks = require("nunjucks");
require("dotenv").config();
const hash = require("hash");
const  {nanoid} = require("nanoid");
/*
import  cookieParser from "cookie-parser"
import  bodyParser from "body-parser";
import  express  from "express";
import  nunjucks  from "nunjucks";
//require("dotenv").config();
import hash from  "hash";
import  { nanoid } from  "nanoid";
*/
const app = express();
nunjucks.configure(__dirname+"/views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

/*

     host : process.env.DB_HOST,
     user : process.env.DB_USER,
     password : process.env.DB_PASSWORD,
     database : process.env.DB_NAME

    */

// ceкция работы с базой данных - переработка в заметки
  var knex=require('knex')({
  client: 'mysql',
  // version: '7.2',
   connection: {

    // port: 3306
    host : 'mysql.a4eee639eebe.hosting.myjino.ru',
    user : 'j88917221_diplom',
    password : 'bAqnCDGZt]9h',
    database : 'j88917221_diplom'

   },

});

 const  addNewNoteUserId = async (userId,noteContent, noteDescription) => {
    let note = {
      start: Date.now(),
      is_active: true,
      user_id: userId,
      description:noteDescription,
      content:noteContent,

    };

    return knex("notes")
    .insert(note);

  }

  const getActiveNotesByUserId = async (userId) =>
     knex("notes")
    .select()
    .where({"user_id":userId,"is_active":true});

  const getNotActiveNotesByUserId = async (userId) =>
     knex("notes")
    .select()
    .where({"user_id":userId,"is_active":false});

  const inActiveNoteById= async (id)  =>
    knex("notes")
    .where({"id":id})
    .update({
      "is_active":false


    })
    .limit(1);


  const updateNoteById= async (id, noteContent, noteDescription)  =>
    knex("notes")
    .where({"id":id})
    .update({
      "content":noteContent,
       "description":noteDescription


    })
    .limit(1);



const addSignUp = async (username, password) => {
  await knex('users')
  .insert({"username":username,"password":password});

  await knex.select("username","password").from("users").then((rows)=>{console.log("таблица активных пользователей ",rows)});
};

const findUserByUsername = async (username) =>
      knex("users")
      .select()
      .where({"username":username}).then((r)=> r[0]);


const findUserBySessionId = async (sessionId) => {

  const session = await knex("sessions")
  .select("user_id")
  .where({"session_id":sessionId})
  .limit(1)
  .then((results)=>results[0]);


  if (!session) {return;}
  return knex("users")
  .select()
  .where({"id":session.user_id})
  .limit(1)
  .then((r)=> r[0]);


}

const createSession = async (userId) => {
  const sessionId = nanoid();
  //DB.sessions[sessionId] = userId;
  console.log("открыта сессия ", sessionId, " для пользователя id ", userId);

  await knex('sessions').insert({"session_id":sessionId, "user_id":userId});
  await knex.select("session_id").from("sessions").then((rows)=>{console.log("сессия добавлена в базу активных сессий ",rows)});
  return sessionId;

};

const deleteSession = async (sessionId) => {
  await knex('sessions').where("session_id",sessionId).del();
  await knex.select("session_id").from("sessions").then((rows)=>{console.log("таблица активных сессий после удаления сессии", sessionId,rows)});
};


app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const user = await findUserBySessionId(req.cookies["sessionId"]);

  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

// const hash = (d) => null;

app.get("/", auth(), async (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

app.get("/dashboard", auth(), async (req, res) => {
  res.render("dashboard", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
  console.log("Сессия пользователя ", req.user, " удалена");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  addSignUp(username, password);
  res.redirect("/");
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  // запрос к базе данных - поиск записи пользователя по идентификатору

  const user =await findUserByUsername(username);
  console.log("В запросе логин найден пользователь ", user)
  if (!user || user.password !== password) {
    return res.redirect("/?authError=true");
    }
    const sessionId = await createSession(user.id);
    res.user=user;
    res.cookie("sessionId", sessionId, { httpOnly: true, expires: 0 }).redirect("/dashboard");


    });



app.get("/api/notes", auth(), async (req, res) => {
  const isActive = req.query.isActive; // Получаем значение параметра isActive
  console.log(req.user, " : ", req.sessionId);
  if (isActive === "true") {
    //Логика для активных заметок
    if (req.user) {
      res.json(await getActiveNotesByUserId(req.user.id));
      console.log("запрос отработан Активные заметки");
    }
  } else if (isActive === "false") {
    // Логика для неактивных заметок
    if (req.user) {
      res.json(await getNotActiveNotesByUserId(req.user.id));
      console.log("запрос отработан Неактивные заметки");
    }
  } else {
    if (req.user) {
      res.json(await getActiveNotesByUserId(req.user.id));
      console.log("не указано  ??состояние заметок", req.originalUrl);
    }
  }
});

app.post("/api/notes/", auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  console.log(req.body.content);
  console.log(req.body.description);
  console.log(req.body.SessionId);
  if (req.user) {
    console.log("new note added for username", req.user.username);
    const tm = await addNewNoteForUserId(req.user.id,req.body.description);
    res.json(tm);
  }

});
app.post("/api/note/:id/stop", auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  if (req.user) {
    console.log("остановка таймера:", req.params.id);
    inActiveNoteById(req.params.id);
    res.json(await getActiveNotesByUserId(req.user.id));
  }
});




const port = process.env.PORT || 3000;




app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
