const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const nunjucks = require("nunjucks");
require("dotenv").config();
//const hash = require("hash");
const { nanoid } = require("nanoid");

const app = express();

nunjucks.configure("views", {
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
    host : 'mysql.a4eee639eebe.hosting.myjino.ru',
    user : 'j88917221_skil',
    password : 'j88917221_ASD#$%',
    database : 'j88917221_skillboxtests'
    */

var knex = require('knex')({
  client: 'mysql',
  // version: '7.2',
   connection: {

    // port: 3306
     host : process.env.DB_HOST,
     user : process.env.DB_USER,
     password : process.env.DB_PASSWORD,
     database : process.env.DB_NAME

   },

});


 const  addNewTimerForUserId = async (userId,name) => {
    let TM = {
      start: Date.now(),
      end: Date.now() + 1000,
      description: name,
      duration: 2000,
      is_active: true,
      user_id: userId,

    };

    return knex("timers")
    .insert(TM);

  }

  const getActiveTimersByUserId = async (userId) =>
     knex("timers")
    .select()
    .where({"user_id":userId,"is_active":true});

  const getStoppedTimersByUserId = async (userId) =>
     knex("timers")
    .select()
    .where({"user_id":userId,"is_active":false});

  const stopTimerById= async (id)  =>
    knex("timers")
    .where({"id":id})
    .update({
      "is_active":false,
      "end":Date.now(),
      "duration":knex.raw("end-start")

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



app.get("/api/timers", auth(), async (req, res) => {
  const isActive = req.query.isActive; // Получаем значение параметра isActive
  console.log(req.user, " : ", req.sessionId);
  if (isActive === "true") {
    //Логика для активных таймеров
    if (req.user) {
      res.json(await getActiveTimersByUserId(req.user.id));
      console.log("запрос отработан Активные таймеры");
    }
  } else if (isActive === "false") {
    // Логика для неактивных таймеров
    if (req.user) {
      res.json(await getStoppedTimersByUserId(req.user.id));
      console.log("запрос отработан Остановленные таймеры");
    }
  } else {
    if (req.user) {
      res.json(await getActiveTimersByUserId(req.user.id));
      console.log("не указано состояние таймеров", req.originalUrl);
    }
  }
});

app.post("/api/timers/", auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  console.log(req.body.description);
  console.log(req.body.SessionId);
  if (req.user) {
    console.log("new timer added for username", req.user.username);
    const tm = await addNewTimerForUserId(req.user.id,req.body.description);
    res.json(tm);
  }

});
app.post("/api/timers/:id/stop", auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  if (req.user) {
    console.log("остановка таймера:", req.params.id);
    stopTimerById(req.params.id);
    res.json(await getActiveTimersByUserId(req.user.id));
  }
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
    res.cookie("sessionId", sessionId, { httpOnly: true, expires: 0 }).redirect("/");


    });


const port = process.env.PORT || 3000;




app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
