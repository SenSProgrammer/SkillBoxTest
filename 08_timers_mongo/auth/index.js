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

const {MongoClient,ObjectId} = require("mongodb");


const clientPromise = MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
 // poolSize:10,
})

app.use(async (req,res, next) =>{
  try {
    const client =await clientPromise;
    req.db = client.db("users");
    next();
    }
    catch (err) {
      next(err);
    }
  });




 const  addNewTimerForUserId = async (db,userId,name) => {

   let   start= Date.now();
   let   end= Date.now() + 1000;
   let   description= name;
   let   duration= 2000;
   let   is_active= true;
   let   id = nanoid(); //не смог разобраться с применением ObjectId, coздал вторичный ключ
   console.log(id);
    await db.collection('timers')
    .insertOne({userId, id, start, end, description, duration, is_active });

    return {start, end, description, duration, is_active};

  }

  const getActiveTimersByUserId = async (db,userId) =>
  {

   const timers =  await db.collection("timers").find({is_active:true,userId},
             { userId: 0, _id:0, id:1, start:1, end:1, description:1, duration:1, is_active:1 },)
  .toArray();
    return timers;

    }


  const getStoppedTimersByUserId = async (db, userId) =>{

    const timers=await db.collection("timers").find({is_active:false,userId},
      { userId: 0, _id:0, id:1, start:1, end:1, description:1, duration:1, is_active:1 },
  ).toArray();
  return timers;
}

const getStartForTimers = async (db, secondaryId) => {
  const theStart = await db.collection("timers").findOne({
  id:secondaryId},
  { projection:{ start: 1, _id:0, },
  });
  return theStart.start;
}

const stopTimerById= async (db, secondaryId)  =>
{
  let theEnd=Date.now();
  const theDuration = theEnd -  await getStartForTimers(db, secondaryId);
   //const oId= new ObjectId();
   //parseInt('67b75c899a7f94e6dc4545bb',16)
   console.log("вторичный ключ таймера ",secondaryId);
   console.log("длительность таймера ", theDuration);
   return await db.collection("timers").findOneAndUpdate(

    {id: secondaryId ,  },
         //изменяем активность, end, длительность
      {$set: { is_active:false, end:theEnd, duration:theDuration, },


      // не очень понятно как изменить длительность
    },
    //{$get: {start:theStart,}},
    //{$inc: { duration:-1000 },},

   {returnOriginal: false,},
   );


}
//    knex("timers")
  //  .where({"id":id})
    //.update({
      //"is_active":false,
      //"end":Date.now(),
      //"duration":knex.raw("end-start")

   // })
   // .limit(1);





const addSignUp = async (db, username, password) => {

  console.log(" регистрация нового пользователя ", username, " c паролем ", password);

  await db.collection('users').insertOne({username, password});

};

const findUserByUsername = async (db,username) =>
      db.collection("users").findOne({username});


const findUserBySessionId = async (db, sessionId) => {

  const session = await db.collection("sessions").findOne({sessionId},{
    projection:{ userId: 1 },
  })


  if (!session) {return;}

  return db.collection("users")
  .findOne({ _id:session.userId});
}



const createSession = async (db, userId) => {
  const sessionId = nanoid();
  //DB.sessions[sessionId] = userId;
  console.log("открыта сессия ", sessionId, " для пользователя id ", userId);

  await db.collection('sessions').insertOne({sessionId, userId});

  return sessionId;

};

const deleteSession = async (db, sessionId) => {
  await db.collection('sessions').deleteOne({sessionId});


};


app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }


 const user = await findUserBySessionId(req.db, req.cookies["sessionId"]);

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
  await deleteSession(req.db, req.sessionId);
  res.clearCookie("sessionId").redirect("/");
  console.log("Сессия пользователя ", req.user, " удалена");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  addSignUp(req.db, username, password);
  res.redirect("/");
});



app.get("/api/timers", auth(), async (req, res) => {
  const isActive = req.query.isActive; // Получаем значение параметра isActive
  console.log(req.user, " : ", req.sessionId);
  if (isActive === "true") {
    //Логика для активных таймеров
    if (req.user) {
      res.json(await getActiveTimersByUserId(req.db, req.user._id));
      console.log("запрос отработан Активные таймеры");
    }
  } else if (isActive === "false") {
    // Логика для неактивных таймеров
    if (req.user) {
      res.json(await getStoppedTimersByUserId(req.db,req.user._id));
      console.log("запрос отработан Остановленные таймеры");
    }
  } else {
    if (req.user) {
      res.json(await getActiveTimersByUserId(req.db,req.user._id));
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
    const tm = await addNewTimerForUserId(req.db, req.user._id,req.body.description);
    console.log("добавлен таймер ", tm );
    res.json(tm);
  }

});
app.post("/api/timers/:id/stop", auth(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  if (req.user) {
    console.log(req.user, "остановка таймера: ", req.params.id);

   // проверка запроса про стартовое время таймера
   // console.log("стартовое время таймера " ,await getStartForTimers(req.db, req.params.id));

    await stopTimerById(req.db, req.params.id);
    res.json(await getActiveTimersByUserId(req.db, req.user._id));
  }
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  // запрос к базе данных - поиск записи пользователя по идентификатору

  const user =await findUserByUsername(req.db, username);
  console.log("В запросе логин найден пользователь ", user)
  if (!user || user.password !== password) {
    return res.redirect("/?authError=true");
    }
    const sessionId = await createSession(req.db, user._id);

    res.user=user;
    res.cookie("sessionId", sessionId, { httpOnly: true, expires: 0 }).redirect("/");


    });


const port = process.env.PORT || 3000;




app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
