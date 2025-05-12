require('dotenv').config();
const http = require("http");
const WebSocket = require("ws");

const express = require("express");
const app=express();

app.use(express.static("public2"));

const server =http.createServer(app);

const wss = new WebSocket.Server({server});

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;

    try {
      data=JSON.parse(msg);
      console.log("Сообщение клиента: ", msg);
      console.log("Сообщение после парсинга: ", data);

         }
         catch (err) {
         console.log("ошибка парсинга", msg);
         return;
        }
         if (data.type === "chat_message") {
          let name=data.name;
          let message=data.message;

          wss.clients.forEach((ws) =>{
          let tst=JSON.stringify({
              type:"chat_message",
              name,
              message,
          });

            ws.send(JSON.stringify(tst));
            console.log(tst);
          });

        }




  });
});

const port = process.env.PORT || 3000;




server.listen(port, () => {
  console.log(` hi -  Listening on http://localhost:${port}`);
});



