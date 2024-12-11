//веб-сервер, который cчитает количество запросов к нему
const http = require("http");
const visits = new Map();
const server = http.createServer((req, res) =>{
  const count=(visits.get(req.url)|| 0) +1;
  visits.set(req.url,count);
res.end(`Visit to ${req.url} #${count}`);

})
const PORT=8000;
server.listen(PORT, () =>{
  console.log(` Listening to http://localhost: ${PORT}`);
  });

