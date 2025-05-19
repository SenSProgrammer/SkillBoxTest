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

       fetch("/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
          headers: {
            "Content-Type": "application/json",
          },

        })
        .then((responce )=>{

          if (responce.ok) {
           // const wsProto =location.protocol ==="https:"?"wss:":"ws";
           // const client = new WebSocket(`${wsProto}//${location.host}`);
            window.location.href = '/';
            return responce.json();
          }
           else {
            return responce.text().then((err)=>{
              throw new Error(err);
            });
           }

           })
           .then(({token}) => {
            const wsProto =location.protocol ==="https:"?"wss:":"ws";
            const client = new WebSocket(`${wsProto}//${location.host}`);
            client.addEventListener("open", ()=>{
             alert("получен токен: " + token);
             //здесь что то надо сделать с сокетом...
            //  updateProcessStatus("Session Id");
           })
          })
        })



