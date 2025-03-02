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

  const  getTimerByTimerId = async (id) =>
    knex("timers")
   .select()
   .where({"id":id});


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
  console.log(req.headers.session);
  if (!req.headers.session) {
    console.log(" пришел запрос на авторизацию, идентификатор сессии не определен: ",req.headers);
    return next();
  }
  console.log(" пришел запрос на авторизацию, идентификатор сессии определен: ",req.headers);
  const user = await findUserBySessionId(req.headers.session);
  req.sessionId=req.headers.session;
  req.user = user;

  next();
};

// const hash = (d) => null;





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

app.post("/api/timers/", bodyParser.urlencoded({ extended: false }), auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  console.log("содержимое req.body ", req.body);
  //console.log(req.user.id);
  if (req.user) {
   // const test = JSON.parse(req.body);
    console.log("new timer added for username", req.user.username, " headers ", req.headers.description );
    //не смог корректно конвертировать body, читаю из header
    const [tm] = await addNewTimerForUserId(req.user.id, req.headers.description);
    console.log("запущен таймер: ", tm);
    res.json({"timerId":tm});
  }

});
app.post("/api/timers/:id/stop", bodyParser.urlencoded({ extended: false }), auth(), async (req, res) => {
  //console.log(req);
  if (!req.body) return res.sendStatus(400);
  if (req.user) {
    console.log("остановка таймера:- содержимое req.params", req.params);
    const param=req.params.id;
    const stoppedId=stopTimerById(param);


    //await getActiveTimersByUserId(req.user.id)
    res.json({"stoppedId":stoppedId});
  }
});

app.get("/api/timers/:id/get", bodyParser.urlencoded({ extended: false }), auth(), async (req, res) => {
  //console.log(req);
  if (!req.body) return res.sendStatus(400);
  if (req.user) {
    console.log("проверка статуса таймера:- содержимое req.params ", req.params);
    const param=req.params.id;//.slice(1);
    const timer= await getTimerByTimerId(param);
    console.log(timer);

    //await getActiveTimersByUserId(req.user.id)
    res.json(timer);
  }
});



app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  console.log("body signup ", req.body);
  const { username, password } = req.body;
  console.log("запись в базу данных логин, пароль" , username, " ",password);
  addSignUp(username, password);
  res.json({});
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  console.log(' боди в запросе Логин ',req.body);
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
    let s = {sessionId:sessionId};
    res.send(JSON.stringify(s));
    });

    app.get("/logout", auth(), async (req, res) => {
      if (!req.user) {
        return res.json({});
      }
      await deleteSession(req.sessionId);

     // res.clearCookie("sessionId").redirect("/");
      res.json({});
      console.log("Сессия пользователя ", req.user, " удалена");
    });

const port = process.env.PORT || 4000;




app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
