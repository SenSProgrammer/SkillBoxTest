console.log("OK +sen");
//открыть файл
const fs= require("fs");
fs.writeFileSync("test.txt","works",'utf8'); //синхронная
console.log(fs.readFileSync("test.txt",'utf8'));// синхронная


//ассинхронный вызов
fs.writeFile("test2.txt","works2","utf8" , (err) =>{
  if (err) {
    console.error(err);
    process.exit(1);
  }
  fs.readFile("test2.txt","utf8" , (err, data) =>{
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(data);
   });
  });

