console.log("OK +sen");
//открыть файл
const fs= require("fs"); //дескриптор для доступа к файлу
//const path=require("path");
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

  //проверка существует ли файл и доступен ли он для чтения -способ первый
const readFileSave =( file, defaultData, callback) => {
  fs.readFile(file,"utf8" , (err, data) =>{
    if (err.code==="ENOENT") {
      callback(null,defaultData);
    } else {
      callback(err);
    }

   });
}
  readFileSave('test.txt',"it is fine", (err,data) => {
    if (data) {
      console.log(data);
    }
  })
  console.log(process.argv[2]);
