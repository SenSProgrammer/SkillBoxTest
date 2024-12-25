function getDobleIt(it)
   {
    console.log("It:"+it);
    return 2*it;
  }


   console.log(getDobleIt(2));
   //setTimeout(getDobleIt(100),3000);
//   console.log(doIt());

function joinMap2toMap1(map1,map2)
{ const i=0;
  while (map2[i])
  {
    map1.set(map2[i]);
    i++
  }
  return map1;
  console.log(map1);
}

const map1 = new Map();
const map2 = new Map();
map1.set("key1",'val1');
map1.set("key111",'val111');
map2.set("key2",'val2');

console.log(map2);

const i=0;
map2.forEach((value, key) => {
  map1.set(key,value);
}
);

  console.log(map1);


