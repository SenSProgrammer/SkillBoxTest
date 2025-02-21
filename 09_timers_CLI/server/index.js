const bodyParser = require("body-parser");
const express = require("express");
require("dotenv").config();
//const hash = require("hash");
const { nanoid } = require("nanoid");

const app = express();

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



app.use(express.json());
app.use(express.static("public"));


const auth = () => async (req, res, next) => {
  if (!req.sessionId) {
    return next();
  }

  const user = await findUserBySessionId(req.sessionId);

  req.user = user;

  next();
};

// const hash = (d) => null;


app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.json({});
  }
  await deleteSession(req.sessionId);

 // res.clearCookie("sessionId").redirect("/");
  res.json({});
  console.log("Сессия пользователя ", req.user, " удалена");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  addSignUp(username, password);
  res.json({});
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
    return res.json({error: "Пользователь не найден или неправлильно указан пароль"});
    }
    const sessionId = await createSession(user.id);
    res.user=user;
    res.sessionId= sessionId;
    res.json({});
    });


const port = process.env.PORT || 3000;




app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
