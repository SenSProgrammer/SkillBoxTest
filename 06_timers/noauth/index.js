const express = require("express");
const nunjucks = require("nunjucks");
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

app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

const TIMERS = new MyTimers();


app.get('/api/timers', (req, res) => {

  const isActive = req.query.isActive; // Получаем значение параметра isActive

  if (isActive === 'true') {

      // Логика для активных таймеров

      res.json(TIMERS.activeTimersArr);
      console.log("запрос отработан Активные таймеры");

  } else if (isActive === 'false') {

      // Логика для неактивных таймеров
      res.json(TIMERS.stoppedTimersArr);
      console.log("запрос отработан Остановленные таймеры");


  } else {

    res.json(TIMERS.activeTimersArr);
    console.log("не указано состояние таймеров",req.originalUrl);

  }

});




//const urlencodedParser = express.urlencoded({extended: false});

app.post("/api/timers/", (req, res) => {
  // if(!req.body) return res.sendStatus(400);
  //console.log(req.body.description);
  let tm = TIMERS.addNewTimer(req.body.description);
  console.log("new timer added", tm);
  res.json(TIMERS.activeTimersArr);

});
app.post("/api/timers/:id/stop", (req, res) => {
  console.log("остановка таймера:", req.params.id);
  //получить body
  TIMERS.stopTimerById(req.params.id);

  res.json(TIMERS.activeTimersArr);

  console.log("active timers");
  console.log(TIMERS.activeTimersArr);
  console.log("stopped timers");
  console.log(TIMERS.stoppedTimersArr);
});

/* You can use these initial data


const TIMERS2 = [
  {
    start: Date.now(),
    end: Date.now() - 3000,
    description: "Timer 1",
    duration: 2000,
    isActive: true,
    id: nanoid(),
  },
  {
    start: Date.now() - 5000,
    end: Date.now() - 3000,
    duration: 2000,
    description: "Timer 0",
    isActive: false,
    id: nanoid(),
  },
];
*/

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
