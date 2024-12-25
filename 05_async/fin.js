



function checkPeapleHeight(peapleName,aMap) //in cm if exist, NULL if no peaple with this name
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
     else
     { return null;}
    return 1;
  })
  .catch((error) => {
    console.error(error); // this line can also throw, e.g. when console = {}
  })
  .finally(() => {
    isLoading = false;
    console.log(aMap);

     return 1;
  });
}


async function fillPeapleMap(aMap)
{
     {

        let j=2;

           while (process.argv[j]) {
             await checkPeapleHeight(encodeURIComponent(process.argv[j]),aMap);
             j++;

           }

        return aMap;

     }


}




async function printMap()
{
  const promise = new Promise((resolve, reject) => {

    const myMap = new Map();
    const aMap=  fillPeapleMap(myMap);
     if (aMap) {resolve(aMap);}
     else
      // завершим промис с ошибкой
    {
      reject(aMap);
    }
  });

  // выполнение действий после завершения промиса выполняется с помощью методов: then (в случае успеха) и catch (при ошибке)
  promise
    .then(result => console.log(`Ура! Я сдал экзамен на ${result}! Папа, как и обещал дал мне 100$.`))
    .catch(result => console.log(`Увы, я получил оценку ${result}! Папа мне не дал 100$`)
    .finally( ()=>{console.log(aMap);}));


  return 1;
}

// создадим новый промис

function printResult(someResult)
{console.log(someResult)}

printMap(printResult);













