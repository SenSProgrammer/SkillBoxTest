import os from "os";
import path from "path";

//import  express from 'express';
//const app = express();
import request from "request";
import Table from "cli-table";
// instantiate
var table = new Table({
  head: ["TimerID", "Описание", "Cтатус", "Длительность, ms"],
  colWidths: [12, 12, 12, 18],
});

//import bodyParser from "body-parser";
import fs from "fs";
console.log("!!!");
console.log("!!!");
console.log("!!!");
//const user = require("./psw");
import inquirer from "inquirer";
//const inquirer=require("inquirer");
//import { off } from  "process";
//const { default: inquirer } = require("inquirer");

//const fs = require('fs').promises;

import "dotenv"; //.config();
//Создайте файл .env В нём - адрес сервера

const URL = "http://localhost:3000"; //process.env.SERVER;

const homeDir = os.homedir();
const isWindows = os.type().match(/windows/i);
const sessionFileName = path.join(homeDir, `${isWindows ? "_" : "."}sb-timers-session`);

console.log("File to keep the session ID:", sessionFileName);

const task = process.argv[2];
const option = process.argv[3];

/*
const requireLetterAndNumber = (value) => {
  if (/\w/.test(value) && /\d/.test(value)) {
    return true;
  }

  return 'Password need to have at least a letter and a number';
};
*/

switch (task) {
  case "signup":
    {
      console.log(" task: ", task, " option: ", option);

      inquirer
        .prompt([
          {
            type: "username",
            message: "Enter a username",
            name: "username",
            //validate: requireLetterAndNumber,
          },
          {
            type: "password",
            message: "Enter a masked password",
            name: "password",
            mask: "*",
            //validate: requireLetterAndNumber,
          },
        ])
        .then((answers) => {
          // Use user feedback for... whatever!!
          console.log("inquire send ", answers);
          request.post(
            {
              url: URL + "/signup",
              form: {
                username: answers.username,
                password: answers.password,
              },
            },
            (err, res, body) => {
              if (err) return res.status(500).send({ message: err });

              //return res.send(body).json();
              console.log("User: ", answers.username, " Signed up successfully!");
              console.log(body);
            }
          );
        })
        .catch((error) => {
          if (error.isTtyError) {
            // Prompt couldn't be rendered in the current environment
          } else {
            // Something else went wrong
          }
        });

      //    user.login();
    }
    break;
  case "login":
    {
      console.log(" task: ", task, " option: ", option);
      inquirer
        .prompt([
          {
            type: "username",
            message: "Enter a username",
            name: "username",
            //validate: requireLetterAndNumber,
          },
          {
            type: "password",
            message: "Enter a masked password",
            name: "password",
            mask: "*",
            //validate: requireLetterAndNumber,
          },
        ])
        .then((answers) => {
          // Use user feedback for... whatever!!
          console.log("inquire send ", answers.username);
          request.post(
            {
              url: URL + "/login",
              form: {
                username: answers.username,
                password: answers.password,
              },
            } /*bodyParser.urlencoded({ extended: false }),*/,
            (err, res, body) => {
              if (err) return res.status(500).send({ message: err });

              //return res.send(body).json();
              // console.log("User: ",answers.username, "ответ сервера: ",res);
              //const test = res.json();
              const test = JSON.parse(body); //!!!!!! body - обязательно надо парсить !!!
              console.log(test.sessionId);
              console.log(sessionFileName);

              let data = test.sessionId;

              fs.writeFile(sessionFileName, data, function (error) {
                if (error) {
                  // если ошибка
                  return console.log(error);
                }
                console.log("Файл сессии  успешно записан", data);
              });
              //fs.writeFile(sessionFileName, test.sessionId);
            }
          );
        })
        .catch((error) => {
          if (error.isTtyError) {
            // Prompt couldn't be rendered in the current environment
          } else {
            // Something else went wrong
          }
        });

      //    user.login();
    }
    break;
  case "logout":
    {
      console.log(" task: ", task, " option: ", option);

      request.get(
        {
          url: URL + "/logout",
          //   form: {
          //     username: 'admin',
          //   password: 'pwd007',
          //  },
        },
        (err, res) => {
          if (err) return res.status(500).send({ message: err });

          //return res.send(body).json();
          console.log(res.body, " Logged out successfully!");
          fs.unlink(sessionFileName, (error) => {
            if (error) return console.log(error); // если возникла ошибка
            console.log("File deleted :", sessionFileName);
          });
        }
      );

      //>node index.js logout
      //Logged out successfully!
    }
    break;
  case "status":
    {
      console.log(" task: ", task, " option: ", option);
      if (option) {
        if (option == "old") {
          //❯ node index.js status old

          fs.readFile(sessionFileName, (error, data) => {
            if (error) {
              // если возникла ошибка
              return console.log(error);
            }
            const sessionId = data.toString();
            console.log("прочитан идентификатор сессии", sessionId); // выводим считанные данные);   // выводим считанные данные
            console.log("запрос get с параметром URL: ", "/api/timers?isActive=false");
            request.get(
              {
                url: URL + "/api/timers?isActive=false",
                headers: { session: sessionId },
                form: {
                  descripton: option,
                },
              } /*bodyParser.urlencoded({ extended: false }), - */,
              (err, res) => {
                if (err) return res.status(500).send({ message: err });

                const test = JSON.parse(res.body); //!!!!!! body - обязательно надо парсить !!!
                //const currentTime= Date.now();

                let status = "";
                let duration = 0;
                test.forEach((element) => {
                  if (element.description == null) {
                    element.description = "";
                  }
                  if (element.is_active) {
                    status = "active";
                  } else {
                    status = "stopped";
                  }
                  duration = parseInt(element.end);
                  -parseInt(element.start);
                  table.push([element.id, element.description, status, duration]);
                });

                console.log(table.toString()); // и выведем это в табличку:
              }
            );
          });

          //ID	Task	Time
          //1	Some task	00:01
        } else {
          //проверяем существование таймера с таким номером (и номер ли это) если да- выводим название и статус
          /*
                    ❯ node index.js status 1
                    ID	Task	Time
                    1	Some task	00:01


                    ❯ node index.js status
                    ID	Task	Time
                    1	Some task	00:01
                    2	Some other task	00:02


                    ❯ node index.js status 100

                    Unknown timer ID 100.
                    */

          fs.readFile(sessionFileName, (error, data) => {
            if (error) {
              // если возникла ошибка
              return console.log(error);
            }
            const sessionId = data.toString();
            console.log("прочитан идентификатор сессии", sessionId); // выводим считанные данные);   // выводим считанные данные
            console.log("запрос get с параметром URL: ", "/api/timers");
            request.get(
              {
                url: URL + "/api/timers/" + option + "/get",
                headers: { session: sessionId },
                form: {
                  timer_id: option,
                },
              } /*bodyParser.urlencoded({ extended: false }), - */,

              (err, res) => {
                if (err) return res.status(500).send({ message: err });

                const test = JSON.parse(res.body); //!!!!!! body - обязательно надо парсить !!!
                const currentTime = Date.now();
                console.log("запрос статуса таймера с идентификатором: ", option);
                let status = "";
                let duration = 0;
                let count = 0;
                test.forEach((element) => {
                  count++;
                  if (element.description == null) {
                    element.description = "";
                  }
                  if (element.is_active) {
                    status = "active";
                    duration = currentTime - parseInt(element.start);
                  } else {
                    status = "stopped";
                    duration = parseInt(element.end) - parseInt(element.start);
                  }
                  duration = currentTime - parseInt(element.start);
                  table.push([element.id, element.description, status, duration]);
                });
                if (count != 0) {
                  console.log(table.toString());
                } else {
                  console.log("Таймер с идентификатором ", option, " не найден");
                } // и выведем это в табличку:
              }
            );
          });
        }
      } else {
        //печатает список (а лучше таблицу) всех активных таймеров.
        //Список/таблица должны содержать ID таймера, описание и текущую длительность.
        //выводим все запущенные для данного пользователя таймеры с указанием активный или установленный

        fs.readFile(sessionFileName, (error, data) => {
          if (error) {
            // если возникла ошибка
            return console.log(error);
          }
          const sessionId = data.toString();
          console.log("прочитан идентификатор сессии", sessionId); // выводим считанные данные);   // выводим считанные данные
          console.log("запрос get с параметром URL: ", "/api/timers");
          request.get(
            {
              url: URL + "/api/timers",
              headers: { session: sessionId },
              form: {
                descripton: option,
              },
            } /*bodyParser.urlencoded({ extended: false }), - */,
            (err, res) => {
              if (err) return res.status(500).send({ message: err });

              const test = JSON.parse(res.body); //!!!!!! body - обязательно надо парсить !!!
              const currentTime = Date.now();
              console.log(currentTime);
              let status = "";
              let duration = 0;
              test.forEach((element) => {
                if (element.description == null) {
                  element.description = "";
                }
                if (element.is_active) {
                  status = "active";
                } else {
                  status = "stopped";
                }
                duration = currentTime - parseInt(element.start);
                table.push([element.id, element.description, status, duration]);
              });

              console.log(table.toString()); // и выведем это в табличку:
            }
          );
        });

        //Или: You have no active timers.
      }
    }

    break; //проверки статусов

  case "start":
    {
      console.log(" task: ", task, " option: ", option);

      fs.readFile(sessionFileName, (error, data) => {
        if (error) {
          // если возникла ошибка
          return console.log(error);
        }
        const sessionId = data.toString();
        console.log("прочитан идентификатор сессии", sessionId); // выводим считанные данные);   // выводим считанные данные

        request.post(
          {
            url: URL + "/api/timers/",
            headers: { session: sessionId, description: option },

            form: {
              descripton: option,
            },
          } /*bodyParser.urlencoded({ extended: false }), - */,
          (err, res) => {
            if (err) return res.status(500).send({ message: err });

            //return res.send(body).json();
            //console.log("ответ сервера: ",res.body.timerId);
            //const test = res.json();
            const test = JSON.parse(res.body); //!!!!!! body - обязательно надо парсить !!!
            console.log("Запущен таймер : ", option, " Идентификатор таймера в базе: ", test.timerId);
          }
        );
      });
      //❯ node index.js start "Some task"
      //Started timer "Some task", ID: 1.

      //❯ node index.js start "Some other task"
      //Started timer "Some other task", ID: 2.
    }
    break;
  case "stop":
    {
      console.log(" task: ", task, " option: ", option);

      //"/api/timers/:id/stop"
      fs.readFile(sessionFileName, (error, data) => {
        if (error) {
          // если возникла ошибка
          return console.log(error);
        }
        const sessionId = data.toString();
        console.log("прочитан идентификатор сессии", sessionId); // выводим считанные данные);   // выводим считанные данные
        console.log("запрос post с параметром URL: ", "/api/timers/:" + option + "/stop");
        request.post(
          {
            url: URL + "/api/timers/" + option + "/stop",
            headers: { session: sessionId },

            form: {
              descripton: option,
            },
          } /*bodyParser.urlencoded({ extended: false }), - */,
          (err, res) => {
            if (err) return res.status(500).send({ message: err });

            //return res.send(body).json();
            console.log("ответ сервера: ", res.body);

            const test = JSON.parse(res.body); //!!!!!! body - обязательно надо парсить !!!
            console.log("Попытка остановка таймера с идентификатором : ", option);
            console.log(" Ответ сервера: ", test);
          }
        );
      });

      //❯ node index.js stop 1
      //Timer 1 stopped. или нет такого таймера:
    }
    break;
  default: {
    console.log(" no task: ", task, " no option: ", option);
    console.log("check syntax: npm index.js <task> <option1>");
  }
}
