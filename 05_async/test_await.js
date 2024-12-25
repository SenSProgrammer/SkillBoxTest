// функция, вызывающая задержку
// и получаем случайное значение

const aMap= new Map();

async function joinMap2toMap1(map1,map2)
{ const i=0;
  while (map2[i])
  {
    map1.set(map2[i]);
    i++
  }
  return map1;

}

const map1 = new Map();
const map2 = new Map();
map1.set("key1",'val1');
map1.set("key111",'val111');
map2.set("key2",'val2');

//console.log(map2);

const i=0;
map2.forEach((value, key) => {
  map1.set(key,value);
   }
  );

 // console.log(map1);

const delayAndGetRandom = (ms) => {
  return new Promise(resolve => setTimeout(
    () => {
      const val = Math.trunc(Math.random() * 100);
      resolve(val);
    }, ms
  ));
};



async function checkPeapleHeight(peapleName) //in cm if exist, NULL if no peaple with this name
{


const { json } = require("express/lib/response");
let isLoading = true;
let myJSON;


fetch("https://www.swapi.tech/api/people/?name="+peapleName)
  .then((response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    throw new TypeError("Oops, we haven't got JSON in SWAPI!");
  })
  .then((json) => {
    /* process SWAPI JSON  */

     myJSON=json.result;
     //console.log(json);
     //console.log(myJSON);
     let i=0;
     while (myJSON[i])
     if (myJSON[i])
     {
    // console.log(myJSON[i].properties.name+' height:'+ myJSON[i].properties.height);
     aMap.set(myJSON[i].properties.name, myJSON[i].properties.height);


     i++;

     }
    })
  .catch((error) => {
    console.error(error); // this line can also throw, e.g. when console = {}
  })
  .finally(() => {
    isLoading = false;
   //console.log(aMap);

  });
}



function printResult(someResult)
{
  console.log(someResult);
  console.log("OK");
  console.log(aMap);
}

async function fn() {

 const theMap= new Map();

   await checkPeapleHeight("sky");
   await checkPeapleHeight("am");
   await checkPeapleHeight("yod");

 // theMap.set("key4", await delayAndGetRandom(5000));

  return  aMap;
}
// Выполнить fn
fn().then(printResult);







