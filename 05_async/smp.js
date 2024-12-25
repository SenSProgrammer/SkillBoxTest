let i=0;

function sayHi(phrase, who) {
 console.log( phrase + ', ' + who , ' ', i);
 i++;
}


//setTimeout(sayHi, 3000, "Привет", "Джон"); // Привет, Джон
//setInterval(sayHi, 2000, "Привет", "Джон "); // Привет, Джон - рабочая но контекст передается один раз - первый

//promise - тесты

async function sayHiOne(phrase, who, delay)
{ await setTimeout(sayHi, delay, phrase, who );
  return delay;
}

function printI(val)
{ val=0;
  console.log(val)}

  const delayAndGetRandom = (ms) => {
    return new Promise(resolve => setTimeout(
      () => {
        const val = Math.trunc(Math.random() * 100);
        resolve(val);
      }, ms
    ));
  };

const callFunc = (ms) => {

   function calcAny() {return  Math.trunc(Math.random() * 100)}
   return new Promise(resolve =>
    setTimeout(() => {
      const val = calcAny();
      resolve(val);
    resolve(calcAny);}, ms));
};

async function sayHiTwice(phrase, who, delay1, delay2)
{
  let sum1 =0;
  let sum2 =0;
  sum1 = await delayAndGetRandom(2000);
  sum2 = await delayAndGetRandom(1000);
  return sum1+sum2;
}



sayHiTwice("Привет",  "Сергей", 3000, 2000).then(printI);


