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

const formLogin = document.getElementById('loginForm');

  formLogin.addEventListener('submit', (event) => {

        alert( "add " + formLogin.elements.password.value) ;
        const username=formLogin.elements.username.value;
        const password=formLogin.elements.password.value;
       // updateProcessStatus("Авторизован пользователь >"+username + ' '+ password);
       alert("login "+ JSON.stringify({ username, password }));

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


  });
