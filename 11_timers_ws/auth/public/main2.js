/*global UIkit, Vue */

let client=null;
let token=null;

const updateProcessStatus = (text2) =>
{
  let elem = document.getElementById('process-status');
  elem.innerHTML=text2;

}

// обработка логина и пароля, отправка на сервер



const test1 = ()=> {alert("Вызов из index.njk работает");
  const username=this.username;
  const password=this.password;
  // updateProcessStatus("Авторизован пользователь >"+username + ' '+ password);
       alert("login "+username + " " +password );
};




(() => {
  const notification = (config) =>
    UIkit.notification({
      pos: "top-right",
      timeout: 5000,
      ...config,
    });

  const alert = (message) =>
    notification({
      message,
      status: "danger",
    });


  const info = (message) =>
    notification({
      message,
      status: "success",
    });

  const fetchJson = (...args) =>
    fetch(...args)
      .then((res) =>
        res.ok
          ? res.status !== 204
            ? res.json()
            : null
          : res.text().then((text) => {
              throw new Error(text);
            })
      )
      .catch((err) => {
        alert(err.message);
      });





  new Vue({
    el: "#app",
    data: {
      desc: "",
      activeTimers: [],
      oldTimers: [],
    },

    methods: {
    fetchActiveTimers() {
     // при каждом вызове клиент высылает свой токен, а в ответ от сервера получает список таймеров
    // if (client) {client.send("test");} else alert("socket not open");

      /*
        fetchJson("/api/timers?isActive=true").then((activeTimers) => {
          this.activeTimers = activeTimers;



        });
      */
      },
      fetchOldTimers() {
        /*
        fetchJson("/api/timers?isActive=false").then((oldTimers) => {
          this.oldTimers = oldTimers;

        }

         );
      */},



      /*
      login() {
        const username=this.username;
        const password=this.password;
       // updateProcessStatus("Авторизован пользователь >"+username + ' '+ password);
       alert("login "+username );
        fetchJson("/login", {
          method: "post",
          body: JSON.stringify({ username, password }),
          headers: {
            "Content-Type": "application/json",
          },

        }
      ).then( (responce )=>{


          alert(responce.sessionId);
          const wsProto =location.protocol ==="https:"?"wss:":"ws";
          const client = new WebSocket(`${wsProto}//${location.host}`);
          window.location.href = '/';
          client.addEventListener("open", ()=>{
             //здесь что то надо сделать с сокетом...
              updateProcessStatus("Session Id");

        })
        })


        },
        */


      createTimer() {
        const description = this.desc;
        this.desc = "";
        fetchJson("/api/timers", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description }),
        }).then(({ id }) => {
          info(`Created new timer "${description}" [${id}]`);
          this.fetchActiveTimers();
        });
      },
      stopTimer(id) {
        fetchJson(`/api/timers/${id}/stop`, {
          method: "post",
        }).then(() => {
          info(`Stopped the timer [${id}]`);
          this.fetchActiveTimers();
          this.fetchOldTimers();
        });
      },
      formatTime(ts) {
        return new Date(ts).toTimeString().split(" ")[0];
      },
      formatDuration(d) {
        d = Math.floor(d / 1000);
        const s = d % 60;
        d = Math.floor(d / 60);
        const m = d % 60;
        const h = Math.floor(d / 60);
        return [h > 0 ? h : null, m, s]
          .filter((x) => x !== null)
          .map((x) => (x < 10 ? "0" : "") + x)
          .join(":");
      },
    },
    created() {
/*
       const wsProto =location.protocol ==="https:"?"wss:":"ws";
       client = new WebSocket(`${wsProto}//${location.host}`);
       /*client.addEventListener("open", (req)=>{
             //здесь что то надо сделать с сокетом...
              updateProcessStatus("Session Id");
       }

       client.onopen = function(e) {
          alert("[open] Соединение установлено");
          alert("Отправляем данные на сервер");
          client.send("Test");
        };

client.onmessage = function(event) {

  alert(`[message] Данные получены с сервера: ${event.data}`);

  //updateProcessStatus(JSON.parse(event.data));


};

client.onclose = function(event) {
  if (event.wasClean) {
    alert(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
  } else {
    // например, сервер убил процесс или сеть недоступна
    // обычно в этом случае event.code 1006
    alert('[close] Соединение прервано');
  }
};

client.onerror = function(error) {
  alert(`[error]`);
  alert("непонятная ошибка");
};

*/
      this.fetchActiveTimers();
      setInterval(() => {
        this.fetchActiveTimers();
      }, 1000);
      this.fetchOldTimers();
    },
  });
})();

