const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const nunjucks = require("nunjucks");
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

class MyTimers {
  activeTimersArr = [];
  stoppedTimersArr = [];
  constructor() {}
  addNewTimer(name) {
    let TM = {
      start: Date.now(),
      end: Date.now() + 1000,
      description: name,
      duration: 2000,
      isActive: true,
      id: nanoid(),
    };

    this.activeTimersArr.push(TM);
    return TM;
  }
  stopTimerById(id) {
    let count = 0;
    this.activeTimersArr.forEach((element) => {
      if (id == element.id) {
        element.isActive = false;
        element.end = Date.now();
        element.duration = element.end - element.start;
        console.log("timer " + id + "stopped");
        console.log(element);
        this.stoppedTimersArr.push(element);
        console.log("stopped timers", this.stoppedTimersArr);
        this.activeTimersArr.splice(count, 1);
      }
      count++;
    });
  }
}

class dbUser {
  _id = "";
  username = "";
  password = "";
  timers = new MyTimers();
  constructor(u, p) {
    this.username = u;
    this.password = p;
    this._id = nanoid();
  }
}

const DB = {
  users: [
    {
      _id: nanoid(),
      username: "admin",
      password: "pwd007",
      //password: hash("pwd007"),
      timers: new MyTimers(),
    },
  ],
  sessions: {}, //key sessionId, value -users._id
};

const addSignUp = async (username, password) => {
  const newUser = new dbUser(username, password);
  DB.users.push(newUser);
  console.log("добавлен пользователь", DB.users);
};

const findUserByUsername = async (username) => DB.users.find((u) => u.username === username);

const findUserBySessionId = async (sessionId) => {
  const userId = await DB.sessions[sessionId];
  if (!userId) {
    return;
  }
  return DB.users.find((u) => u._id === userId);
};

const createSession = async (userId) => {
  const sessionId = nanoid();
  DB.sessions[sessionId] = userId;
  console.log("открыта сессия ", sessionId, " для пользователя ", userId);
  return sessionId;
};

const deleteSession = async (sessionId) => {
  delete DB.sessions[sessionId];
};
/*
  const addTimerBySessionId = async (sessionId, name) => {
     if (sessionId)
      {

        return findUserBySessionId(sessionId).timers.addNewTimer(name);

      }
      else
      {
        console.log('Не найдена сессия ', sessionId)
      }
  }

  const stopTimerBySessionId = async (sessionId,timerId) => {

    if (sessionId)
      {
       return findUserBySessionId(sessionId).timers.stopTimerById(timerId);

      }
      else
      {
        console.log('Не найдена сессия ', sessionId)
      }

      }

*/

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

//const TIMERS = new MyTimers();

app.get("/api/timers", auth(), async (req, res) => {
  const isActive = req.query.isActive; // Получаем значение параметра isActive
  console.log(req.user, " : ", req.sessionId);
  if (isActive === "true") {
    //Логика для активных таймеров
    if (req.user) {
      res.json(req.user.timers.activeTimersArr);
      console.log("запрос отработан Активные таймеры");
    }
  } else if (isActive === "false") {
    // Логика для неактивных таймеров
    if (req.user) {
      res.json(req.user.timers.stoppedTimersArr);
      console.log("запрос отработан Остановленные таймеры");
    }
  } else {
    if (req.user) {
      res.json(req.user.timers.activeTimersArr);
      console.log("не указано состояние таймеров", req.originalUrl);
    }
  }
});

app.post("/api/timers/", auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  console.log(req.body.description);
  console.log(req.body.SessionId);
  if (req.user) {
    let tm = req.user.timers.addNewTimer(req.body.description);
    console.log("new timer added", tm, "for username", req.user.username);
    res.json(tm);
  }
  // console.log(req.user.timers.activeTimersArr);
});
app.post("/api/timers/:id/stop", auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  if (req.user) {
    console.log("остановка таймера:", req.params.id);
    req.user.timers.stopTimerById(req.params.id);
    res.json(req.user.timers.activeTimersArr);
  }
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;

  console.log("asked user ", username, " with password ", password);
  const user = await findUserByUsername(username);

  if (!user || user.password !== password) {
    return res.redirect("/?authError=true");
  }
  const sessionId = await createSession(user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true, expires: 0 }).redirect("/");
  // if(!req.body) return res.sendStatus(400);
  console.log("Пользователь авторизован ", user);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
