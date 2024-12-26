
// Как обычно, ваша программа — это npm-модуль в папке проекта (05_async в вашем репозитории), все её зависимости должны быть указаны в файле package.json (см. прошлые модули, если нужно освежить установку зависимостей).

console.log("Начало поиска");
const { json } = require("express/lib/response");
const urlSWAPI="https://www.swapi.tech/api/people/?name="; //путь поиска персонажей
let qtySearchedKeys =0; //количество поисковых идентификаторов (ключей) в коммандной строке
const foundedPeapleMap=  new Map(); //карта с найденными именами людей в которых входят идентификаторы и их рост
let keysArr=[];   // массив ключей для поиска
let resultArr= [];  //массив флагов выполнения запросов (-1:запрос не выполнен, или к-во найденных имен включающих ключ)

  function isAllKeysSearchFinised() { //проверка флагов выполнены ли все запросы по ключам (0 есть не выполненые запросы)
    let i=0;
    while (i< qtySearchedKeys) {
      if (resultArr[i]== -1) {return 0} i++; }
      return qtySearchedKeys;
    }


function checkPeapleHeight() //
{

const { json } = require("express/lib/response");
async function searchKey(peapleName,keyNumber)
{
let qtyFoundedPeaple=0;
fetch(urlSWAPI+peapleName)
  .then((response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    throw new TypeError(" В SWAPI к сожалению нет структуры JSON !");
  })
  .then((json) => {
    /* process SWAPI JSON  */
     myJSON=json.result;
     let i=0;
     qtyFoundedPeaple=i;
     while (myJSON[i])
     if (myJSON[i])
     {
          foundedPeapleMap.set(myJSON[i].properties.name, myJSON[i].properties.height);


     i++;
     qtyFoundedPeaple=i;
     }
     else
     { }
    })
  .catch((error) => {
    console.error(error); // Если какой-то запрос выполнился с ошибкой, программа должна: вывести ошибку в консоль,
    console.log(); //считать, что запрос вернул ноль записей, и продолжить работу.


  })
  .finally(() => {
    isLoading = false;
        resultArr[keyNumber]=qtyFoundedPeaple;
    if (qtyFoundedPeaple==0) {console.log("No results found for " +peapleName)}
    if (isAllKeysSearchFinised()) {
        printPeapleMap();
      // console.log(foundedPeapleMap); console.log(resultArr);
    } //else console.log(resultArr);

  });

}

let isLoading = true;
let myJSON;
let j=0;

while (j<qtySearchedKeys)
{ //перебираем массив поисковых ключей, если запросы по всем ключам завершились выдаем результа
 searchKey(keysArr[j],j);
j++
}
}

  function printPeapleMap() {
   if (foundedPeapleMap)
    {
   //В конце программы нужно собрать всех найденных персонажей и вывести о них следующую информацию:
   let i=0;
   let list = [];
   let minHeight=1000000;
   let maxHeight=0;
   let Highest='';
   let Lowest ='';

   foundedPeapleMap.forEach((value, key) =>
    {
     list[i]=key;
     i++;
      if (Number(value)>maxHeight) {maxHeight=Number(value); Highest=key}
    });
     list.sort();    //Имена во второй строчке должны идти в алфавитном порядке.


     i=0;
     foundedPeapleMap.forEach((value, key) =>
      {
        i++;
        if (Number(value)<minHeight) {minHeight=Number(value); Lowest=key}
      });





     console.log("Total results: ", i);  //Total results:
     console.log("All: ",list); //Пример: All:  Anakin Skywalker, Luke Skywalker, Padmé Amidala, R2-D2, Shmi Skywalker.
     console.log("Min height: ",Lowest," ",minHeight," cm."); //Min height: R2-D2, 92 cm.
     console.log("Max height: ",Highest," ",maxHeight," cm."); //Max height: Anakin Skywalker, 188 cm.






    }

  }



/*  Ваша программа принимает в командной строке один или более поисковых запросов:

  node index.js r2 skywalker xyz "Padmé Amidala"

  Обратите внимание, тут передано четыре аргумента, последний — "Padmé Amidala" — заключён в кавычки, потому что содержит пробел.

  Если программа не получила ни одного аргумента, она должна напечатать предупреждение и завершить работу.

  Для каждого аргумента нужно выполнить соответствующий HTTP-запрос для поиска по ресурсу people. Этот запрос может вернуть ноль или более персонажей, возможно, больше одного.

  Все запросы должны выполняться параллельно.

  */

let index=0;
  if (process.argv[index+2])
  {
  while (process.argv[index+2]) {
    keysArr[index]=encodeURIComponent(process.argv[index+2]); // инициализация массива поисковых ключей
    resultArr[index]= -1;  //инициализация массива со статусом выполнения запроса по ключу (-1 - еще не выполнен)
    index++
  }
   }
  else
  {
    console.log(" Программа не получила поисковый запрос в командной строке");
    console.log('образец корректного запроса -  node index.js r2 skywalker xyz "Padmé Amidala"');
  }

  qtySearchedKeys=index;
  checkPeapleHeight();









