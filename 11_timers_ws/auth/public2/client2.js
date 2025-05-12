
const wsProto = location.protocol === "https:" ? "wss:" :"ws:";
const client = new WebSocket(`${wsProto}//${location.host}`);

//const faker=require("faker");
//global faker
//const nm= "someName";//+ Math.random(); //faker.internet.userName('');
//alert(name);
const messagesContainer = document.getElementById("chat");

const addMessage = (nm, message) =>
  {
  const cEl = document.createElement("p");
  const nEl = document.createElement("span");
  nEl.className="name";
  nEl.innerText=nm;
  cEl.appendChild(nEl);
  const mEl = document.createElement("span");
  mEl.className="message";
  mEl.innerText=message;
  cEl.appendChild(mEl);
  messagesContainer.appendChild(cEl);
  messagesContainer.scrollTop=messagesContainer.scrollHeight;

}

client.addEventListener("message",(message)=> {
 let dt;

try {
  dt=JSON.parse(message.data);
  addMessage("сообщение сервера после парсинга " +dt.toString());
    }
     catch (err) {
      addMessage("ошибка ", err);
      addMessage("в данных ", message.data);
     return;
    }
     if (dt.type === "chat_message") {

      addMessage(dt.name, dt.message);

    }
    else
    {
      addMessage("!" +dt.name+" ", dt.message);

    }
});

const postMessage = () => {
  const message = "test" + Math.random().toString();
  const name = "name" + Math.random().toString();
  let tst=JSON.stringify({
    type:"chat_message",
    name,
    message,
  });
  addMessage("посылаем ", tst);
  client.send(tst);
//обратная проверка распарсирся ли JSON
  //let data=JSON.parse(tst);
  //addMessage("name ", data.name);
  //addMessage("message ", data.message);

  setTimeout(postMessage,2000+(Math.random()-0.5)*200);

};

//addMessage({name2:"sen ",message:"hi"});
//addMessage({name2:"sen2 ",message:"hi2"});

client.addEventListener("open",postMessage);

//alert(client.readyState);



