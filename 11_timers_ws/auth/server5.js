const WebSocket = require('ws');
const http = require("http");
const wss = new WebSocket.Server({ port: 8080 });
const express = require("express");
const app=express();
app.use(express.static("public5"));

const server =http.createServer(app);

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('Получено сообщение: %s', message);
  });

  ws.send('Привет от сервера');
});


const port =  3000;


server.listen(port, () => {
  console.log(` hi -  Listening on http://localhost:${port}`);
});
