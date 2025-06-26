import os from "os";
import path from "path";
import axios from "axios";
import Table from "cli-table";
// instantiate
var table = new Table({
  head: ["TimerID", "Описание", "Cтатус", "Длительность, ms"],
  colWidths: [12, 12, 12, 18],
});

//import bodyParser from "body-parser";
import fs from "fs";

//const user = require("./psw");
import inquirer from "inquirer";
//const inquirer=require("inquirer");
//import { off } from  "process";
//const { default: inquirer } = require("inquirer");

//const fs = require('fs').promises;

import "dotenv"; //.config();
//Создайте файл .env В нём - адрес сервера

const URL = "https://10.25.8.12/redfish/v1/SessionService/Sessions";

const homeDir = os.homedir();
const isWindows = os.type().match(/windows/i);
const sessionFileName = path.join(homeDir, `${isWindows ? "_" : "."}sb-timers-session`);

console.log("Запрос sessions к:", URL);




  axios.post( URL,
            { UserName: "admin",
              Password: "admin@5000",
              })
            .then((res) =>
              {
              //  if (err)
                //  return res.status(500).send({ message: err });

              //return res.send(body).json();
              // console.log("User: ",answers.username, "ответ сервера: ",res);
              //const test = res.json();

              console.log("Ответ сервера ", res);
              })
             .catch((err) => { console.log(err)
                });

