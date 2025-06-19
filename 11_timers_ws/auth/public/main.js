/*global UIkit, Vue */

let client=null;
let globalActiveTimers=[];
let globalOldTimers=[];


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
      test:"test22",
    },
    methods: {
      setTest(tst) {this.test=tst;},
      showTest() {alert(this.test);},

       fetchActiveTimers() {

          this.activeTimers = globalActiveTimers;
          this.oldTimers = globalOldTimers;


      },
      fetchOldTimers() {

        this.oldTimers = globalOldTimers;

        },


      showActiveTimers(timers) {
      this.activeTimers = timers;
      },
      showOldTimers(timers) {
               this.oldTimers = timers;
             },

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

      const wsProto =location.protocol ==="https:"?"wss:":"ws";
      const urlPort = "a4eee639eebe.hosting.myjino.ru:3000"; //location.host
      client = new WebSocket(`${wsProto}//${urlPort}`);
      alert(this.test);



       client.onopen = function(e) {
          alert("[open] Соединение установлено");
          alert("Отправляем данные на сервер");
          client.send("Test");
        };

client.onmessage = function(event) {

  //alert(`[message] Данные получены с сервера: ${event.data}`);

  let data= JSON.parse(event.data);
  alert(data.type);
  globalActiveTimers=data.activeTimers;
  globalOldTimers=data.stoppedTimers;

};

client.onclose = function(event) {
  if (event.wasClean) {
    alert(`[close] Соединение закрыто , код=${event.code} причина=${event.reason}`);
  } else {

    alert('[close] Соединение прервано');
  }
};

client.onerror = function(error) {
  alert(`[error]`, error);
  alert("непонятная ошибка");
};

     this.fetchActiveTimers();
      setInterval(() => {
        this.fetchActiveTimers();
      }, 100);
      this.fetchOldTimers();


    },
  });
})();
