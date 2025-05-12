require("dotenv").config();
const WebSocket = require("ws");
const wss = new WebSocket.Server({port: process.env.PORT});
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    wss.clients.forEach((ws) =>{
      ws.send(message);
     // console.log(message.toString());
    });
  });
});

console.log("Server running");
