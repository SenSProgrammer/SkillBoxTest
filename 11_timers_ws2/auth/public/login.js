



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
        //alert(err.message);
      });

const formLogin = document.getElementById('loginForm');

  formLogin.addEventListener('submit', (event) => {

      // alert( "add " + formLogin.elements.password.value) ;
        let username=formLogin.elements.username.value;
        let password=formLogin.elements.password.value;
       // updateProcessStatus("Авторизован пользователь >"+username + ' '+ password);

       alert("login "+ JSON.stringify({ username, password }));

        // username="22";
       //password="22";

       fetchJson("/login", {
          method: "post",
          body: JSON.stringify({username, password}),
          headers: {
            "Content-Type": "application/json",
          },

        }).then((responce)=>{
         // data=responce.json();
          alert("ответ сервера получен");
        });
      /*
        .then(()=>
          {
             alert("обработчик результата запроса логин");
         //  window.AUTH_TOKEN=token;
         //  alert(window.AUTH_TOKEN);
          }
        );
        */

      });
