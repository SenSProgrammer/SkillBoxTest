import chalk from "chalk";
import faker from "faker";
import WebSocket from "ws";
import dotenv from "dotenv";
dotenv.config();

const client = new WebSocket(`ws://localhost:${process.env.PORT}`);

//console.log(client);
client.onopen = function () {
  console.log('подключился');
};
console.log("test");
//const faker=require("faker");
const name = faker.internet.userName('');

client.on("message", (data)=> {
  try {

    data=JSON.parse(data)
   // console.log(data);
     } catch (err) { return }
     if (data.type === "chat_message") {
      console.log(`${chalk.bold.green(data.name)}:${chalk.blue(data.message)}`);
     }
     else {console.log("unknown type message ", data.type)}
});

const postMessage = () => {
  const message = faker.lorem.sentence();
  console.log(message);
  client.send(
    JSON.stringify({
      type:"chat_message",
      name,
      message,
    })

  );
 //console.log(name," ", message);
  setTimeout(postMessage,2000+(Math.random()-0.5)*200);

};

client.on("open",postMessage);


